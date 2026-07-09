import * as cdk from 'aws-cdk-lib/core';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cwactions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snssub from 'aws-cdk-lib/aws-sns-subscriptions';
import { HttpApi, CorsHttpMethod, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { Construct } from 'constructs';
import * as path from 'path';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SES domain identity — CDK creates the identity; after first deploy, add the DKIM DNS
    // records from SES console to bedrawn.app, then uncomment UserPoolEmail.withSES below.
    new ses.EmailIdentity(this, 'BedrawnEmailIdentity', {
      identity: ses.Identity.domain('bedrawn.app'),
    });

    // KMS key for Cognito Custom Email Sender — encrypts one-time codes before passing to Lambda
    const cognitoEmailKey = new kms.Key(this, 'CognitoEmailKey', {
      description: 'Encrypts Cognito one-time codes for custom email sender Lambda',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Custom Email Sender Lambda — intercepts all Cognito emails and sends via Resend
    const cognitoEmailSenderFn = new nodejs.NodejsFunction(this, 'CognitoEmailSender', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, 'lambda/cognito-email-sender.ts'),
      timeout: cdk.Duration.seconds(15),
      environment: {
        KMS_KEY_ARN: cognitoEmailKey.keyArn,
        RESEND_API_KEY_PARAM: '/bedrawn/resend/api-key-full',
      },
    });
    cognitoEmailKey.grantDecrypt(cognitoEmailSenderFn);
    cognitoEmailSenderFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/bedrawn/resend/api-key-full`],
    }));

    // Cognito User Pool — Custom Email Sender routes all auth emails through Resend + bedrawn.app
    const userPool = new cognito.UserPool(this, 'BedrawnUserPool', {
      userPoolName: 'bedrawn-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lambdaTriggers: {
        customEmailSender: cognitoEmailSenderFn,
      },
      customSenderKmsKey: cognitoEmailKey,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'BedrawnUserPoolClient', {
      userPool,
      userPoolClientName: 'bedrawn-web',
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      preventUserExistenceErrors: true,
    });

    // S3 bucket for file uploads — public read so image URLs work permanently
    const bucket = new s3.Bucket(this, 'BedrawnBucket', {
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
        maxAge: 3000,
      }],
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,
        ignorePublicAcls: true,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    bucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.StarPrincipal()],
      actions: ['s3:GetObject'],
      resources: [bucket.arnForObjects('uploads/*')],
    }));

    // DynamoDB table
    const table = new dynamodb.Table(this, 'BedrawnTable', {
      tableName: 'bedrawn-items',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI1: query open/resolved draws by status (used by get-draws, get-seller-draws, get-seller-profile)
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'closingDate', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ─── Analytics table — separate from operational data ─────────────────────
    // Stores raw events, DrawSummary per completed/cancelled draw,
    // CatalogueItem per bag model, and BrandAggregate snapshots.
    const analyticsTable = new dynamodb.Table(this, 'BedrawnAnalyticsTable', {
      tableName: 'bedrawn-analytics',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI-brand-draw: query all draw summaries for a brand, sorted by close date
    // PK: brandId_closedAt (e.g. "BRAND#chanel#2026-07")  SK: SK
    analyticsTable.addGlobalSecondaryIndex({
      indexName: 'GSI-brand-draw',
      partitionKey: { name: 'brandId_closedAt', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI-item-draw: query all draw summaries for a specific bag model
    analyticsTable.addGlobalSecondaryIndex({
      indexName: 'GSI-item-draw',
      partitionKey: { name: 'itemSlug_closedAt', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI-brandId-item: query all catalogue items for a brand
    analyticsTable.addGlobalSecondaryIndex({
      indexName: 'GSI-brandId-item',
      partitionKey: { name: 'brandId_itemSlug', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // DEV_SEED: gives new users a free £50 balance and bypasses Stripe KYC for sellers.
    // Remove before go-live — just delete the DEV_SEED key and redeploy.
    const commonEnv = {
      TABLE_NAME: table.tableName,
      BUCKET_NAME: bucket.bucketName,
      BUCKET_REGION: this.region,
      DEV_SEED: 'true',
      ANALYTICS_TABLE_NAME: analyticsTable.tableName,
    };
    const commonProps = { runtime: lambda.Runtime.NODEJS_20_X, environment: commonEnv };
    const stripeEnv = { ...commonEnv, STRIPE_WEBHOOK_SECRET: '' }; // webhook secret added after first deploy
    const stripeProps = { runtime: lambda.Runtime.NODEJS_20_X, environment: stripeEnv };

    // Post-confirmation trigger — writes PROFILE + seeds WALLET the moment a user verifies their email
    const postConfirmationFn = new nodejs.NodejsFunction(this, 'PostConfirmation', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/post-confirmation.ts'),
      timeout: cdk.Duration.seconds(10),
    });
    table.grantReadWriteData(postConfirmationFn);
    userPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, postConfirmationFn);

    const getItemsFn = new nodejs.NodejsFunction(this, 'GetItems', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/get-items.ts'),
    });
    const postItemFn = new nodejs.NodejsFunction(this, 'PostItem', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/post-item.ts'),
    });

    // Draw endpoints
    const getDrawsFn = new nodejs.NodejsFunction(this, 'GetDraws', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/get-draws.ts'),
    });
    const getDrawFn = new nodejs.NodejsFunction(this, 'GetDraw', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/get-draw.ts'),
    });
    const postDrawFn = new nodejs.NodejsFunction(this, 'PostDraw', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/post-draw.ts'),
      timeout: cdk.Duration.seconds(10),
    });
    const putItemFn = new nodejs.NodejsFunction(this, 'PutItem', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/put-item.ts'),
    });
    const deleteItemFn = new nodejs.NodejsFunction(this, 'DeleteItem', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/delete-item.ts'),
    });
    const getUploadUrlFn = new nodejs.NodejsFunction(this, 'GetUploadUrl', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/get-upload-url.ts'),
    });
    const waitlistFn = new nodejs.NodejsFunction(this, 'Waitlist', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/waitlist.ts'),
    });
    const walletBalanceFn = new nodejs.NodejsFunction(this, 'WalletBalance', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/wallet-balance.ts'),
    });
    const enterDrawFn = new nodejs.NodejsFunction(this, 'EnterDraw', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/enter-draw.ts'),
    });
    const resolveDrawsFn = new nodejs.NodejsFunction(this, 'ResolveDraws', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/resolve-draws.ts'),
      timeout: cdk.Duration.seconds(60),
      environment: {
        ...commonEnv,
        RESEND_API_KEY_PARAM: '/bedrawn/resend/api-key-full',
        USER_POOL_ID: userPool.userPoolId,
      },
    });

    // Stripe Lambdas — read Stripe secret key from SSM at runtime
    const createSellerAccountFn = new nodejs.NodejsFunction(this, 'CreateSellerAccount', {
      ...stripeProps,
      entry: path.join(__dirname, 'lambda/create-seller-account.ts'),
      timeout: cdk.Duration.seconds(15),
    });
    const walletTopupFn = new nodejs.NodejsFunction(this, 'WalletTopup', {
      ...stripeProps,
      entry: path.join(__dirname, 'lambda/wallet-topup.ts'),
      timeout: cdk.Duration.seconds(15),
    });
    const confirmPayoutFn = new nodejs.NodejsFunction(this, 'ConfirmPayout', {
      ...stripeProps,
      entry: path.join(__dirname, 'lambda/confirm-payout.ts'),
      timeout: cdk.Duration.seconds(15),
    });
    const stripeWebhookFn = new nodejs.NodejsFunction(this, 'StripeWebhook', {
      ...stripeProps,
      entry: path.join(__dirname, 'lambda/stripe-webhook.ts'),
      timeout: cdk.Duration.seconds(15),
    });

    // Grant SSM read access to Stripe Lambdas
    const stripeSecretPolicy = new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [
        `arn:aws:ssm:eu-west-1:${this.account}:parameter/bedrawn/stripe/*`,
      ],
    });
    [createSellerAccountFn, walletTopupFn, confirmPayoutFn, stripeWebhookFn].forEach(fn => {
      fn.addToRolePolicy(stripeSecretPolicy);
      table.grantReadWriteData(fn);
    });

    table.grantReadData(getItemsFn);
    table.grantWriteData(postItemFn);
    table.grantWriteData(putItemFn);
    table.grantWriteData(deleteItemFn);
    bucket.grantPut(getUploadUrlFn);
    table.grantReadWriteData(waitlistFn);
    table.grantReadWriteData(walletBalanceFn); // write needed for DEV_SEED wallet creation
    table.grantReadWriteData(enterDrawFn);
    table.grantReadWriteData(resolveDrawsFn);
    resolveDrawsFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cognito-idp:AdminGetUser'],
      resources: [userPool.userPoolArn],
    }));
    resolveDrawsFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/bedrawn/resend/api-key-full`],
    }));
    table.grantReadData(getDrawsFn);
    table.grantReadData(getDrawFn);
    table.grantReadWriteData(postDrawFn);

    // Two month-scoped EventBridge rules so exactly one fires per night at 21:00 UK:
    //   GMT (Nov–Mar): 21:00 UTC = 21:00 UK    cron months 1-3,11,12
    //   BST (Apr–Oct): 20:00 UTC = 21:00 UK    cron months 4-10
    // Using events.Schedule.expression() so we can pass comma-separated month lists.
    const ninepmGmtRule = new events.Rule(this, 'ResolveDrawsGMT', {
      schedule: events.Schedule.expression('cron(0 21 * 1-3,11,12 ? *)'),
      description: 'Resolve draws at 21:00 UTC (= 21:00 GMT), Jan–Mar and Nov–Dec',
    });
    ninepmGmtRule.addTarget(new targets.LambdaFunction(resolveDrawsFn));

    const ninepmBstRule = new events.Rule(this, 'ResolveDrawsBST', {
      schedule: events.Schedule.expression('cron(0 20 * 4-10 ? *)'),
      description: 'Resolve draws at 20:00 UTC (= 21:00 BST), Apr–Oct',
    });
    ninepmBstRule.addTarget(new targets.LambdaFunction(resolveDrawsFn));

    // Cognito JWT authorizer for all protected routes
    const authorizer = new HttpUserPoolAuthorizer('CognitoAuthorizer', userPool, {
      userPoolClients: [userPoolClient],
    });

    const api = new HttpApi(this, 'BedrawnApi', {
      apiName: 'bedrawn-api',
      corsPreflight: {
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST, CorsHttpMethod.PUT, CorsHttpMethod.DELETE, CorsHttpMethod.OPTIONS],
        allowOrigins: ['*'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    api.addRoutes({ path: '/items', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('GetItemsInt', getItemsFn), authorizer });
    api.addRoutes({ path: '/items', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('PostItemInt', postItemFn), authorizer });
    api.addRoutes({ path: '/items/{id}', methods: [HttpMethod.PUT], integration: new HttpLambdaIntegration('PutItemInt', putItemFn), authorizer });
    api.addRoutes({ path: '/items/{id}', methods: [HttpMethod.DELETE], integration: new HttpLambdaIntegration('DeleteItemInt', deleteItemFn), authorizer });
    api.addRoutes({ path: '/upload-url', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('GetUploadUrlInt', getUploadUrlFn), authorizer });
    // Public — no authorizer, waitlist signup before launch
    api.addRoutes({ path: '/waitlist', methods: [HttpMethod.POST, HttpMethod.OPTIONS], integration: new HttpLambdaIntegration('WaitlistInt', waitlistFn) });
    // Public — Stripe webhook (verified by signature inside Lambda)
    api.addRoutes({ path: '/webhooks/stripe', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('StripeWebhookInt', stripeWebhookFn) });
    // Authenticated Stripe routes
    api.addRoutes({ path: '/seller/account', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('CreateSellerAccountInt', createSellerAccountFn), authorizer });
    api.addRoutes({ path: '/wallet/topup', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('WalletTopupInt', walletTopupFn), authorizer });
    api.addRoutes({ path: '/draws/{id}/payout', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('ConfirmPayoutInt', confirmPayoutFn), authorizer });
    api.addRoutes({ path: '/wallet/balance', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('WalletBalanceInt', walletBalanceFn), authorizer });
    api.addRoutes({ path: '/draws/{id}/enter', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('EnterDrawInt', enterDrawFn), authorizer });

    // Draw CRUD — GET /draws and GET /draws/{id} are public; POST /draws requires auth
    api.addRoutes({ path: '/draws', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('GetDrawsInt', getDrawsFn) });
    api.addRoutes({ path: '/draws/{id}', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('GetDrawInt', getDrawFn) });
    api.addRoutes({ path: '/draws', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('PostDrawInt', postDrawFn), authorizer });

    // Notifications
    const getNotificationsFn = new nodejs.NodejsFunction(this, 'GetNotifications', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/get-notifications.ts'),
    });
    table.grantReadWriteData(getNotificationsFn);
    api.addRoutes({ path: '/notifications', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('GetNotificationsInt', getNotificationsFn), authorizer });

    // Admin email list — override via: cdk deploy --context adminEmails=a@b.com,c@d.com
    const adminEmails: string = this.node.tryGetContext('adminEmails') ?? 'yoniaibi@gmail.com';

    // Admin — all draws regardless of status
    const getAdminDrawsFn = new nodejs.NodejsFunction(this, 'GetAdminDraws', {
      ...commonProps,
      environment: { ...commonEnv, ADMIN_EMAILS: adminEmails },
      entry: path.join(__dirname, 'lambda/get-admin-draws.ts'),
    });
    table.grantReadData(getAdminDrawsFn);
    api.addRoutes({ path: '/admin/draws', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('GetAdminDrawsInt', getAdminDrawsFn), authorizer });

    // User profile (handle/display name)
    const putProfileFn = new nodejs.NodejsFunction(this, 'PutProfile', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/put-profile.ts'),
    });
    const getProfileFn = new nodejs.NodejsFunction(this, 'GetProfile', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/get-profile.ts'),
    });
    table.grantReadWriteData(putProfileFn);
    table.grantReadData(getProfileFn);
    api.addRoutes({ path: '/profile', methods: [HttpMethod.PUT], integration: new HttpLambdaIntegration('PutProfileInt', putProfileFn), authorizer });
    api.addRoutes({ path: '/profile', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('GetProfileInt', getProfileFn), authorizer });

    // User order history + stats
    const getMyEntriesFn = new nodejs.NodejsFunction(this, 'GetMyEntries', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/get-my-entries.ts'),
    });
    const getMyStatsFn = new nodejs.NodejsFunction(this, 'GetMyStats', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/get-my-stats.ts'),
    });
    table.grantReadData(getMyEntriesFn);
    table.grantReadData(getMyStatsFn);
    api.addRoutes({ path: '/me/entries', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('GetMyEntriesInt', getMyEntriesFn), authorizer });
    api.addRoutes({ path: '/me/stats', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('GetMyStatsInt', getMyStatsFn), authorizer });

    // Saved draws
    const toggleSaveDrawFn = new nodejs.NodejsFunction(this, 'ToggleSaveDraw', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/toggle-save-draw.ts'),
    });
    const getSavedDrawsFn = new nodejs.NodejsFunction(this, 'GetSavedDraws', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/get-saved-draws.ts'),
    });
    table.grantReadWriteData(toggleSaveDrawFn);
    table.grantReadData(getSavedDrawsFn);
    api.addRoutes({ path: '/draws/{id}/save', methods: [HttpMethod.GET, HttpMethod.POST, HttpMethod.DELETE], integration: new HttpLambdaIntegration('ToggleSaveDrawInt', toggleSaveDrawFn), authorizer });
    api.addRoutes({ path: '/me/saved', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('GetSavedDrawsInt', getSavedDrawsFn), authorizer });

    // Grand draw
    const getGrandDrawFn = new nodejs.NodejsFunction(this, 'GetGrandDraw', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/get-grand-draw.ts'),
    });
    const claimGrandDrawFn = new nodejs.NodejsFunction(this, 'ClaimGrandDraw', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/claim-grand-draw.ts'),
    });
    table.grantReadData(getGrandDrawFn);
    table.grantReadWriteData(claimGrandDrawFn);
    api.addRoutes({ path: '/grand-draw', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('GetGrandDrawInt', getGrandDrawFn), authorizer });
    api.addRoutes({ path: '/grand-draw/claim', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('ClaimGrandDrawInt', claimGrandDrawFn), authorizer });

    // Seller stats
    const getSellerStatsFn = new nodejs.NodejsFunction(this, 'GetSellerStats', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/get-seller-stats.ts'),
    });
    table.grantReadData(getSellerStatsFn);
    api.addRoutes({ path: '/seller/stats', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('GetSellerStatsInt', getSellerStatsFn), authorizer });

    // Wallet transactions
    const getWalletTransactionsFn = new nodejs.NodejsFunction(this, 'GetWalletTransactions', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/get-wallet-transactions.ts'),
    });
    table.grantReadData(getWalletTransactionsFn);
    api.addRoutes({ path: '/wallet/transactions', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('GetWalletTransactionsInt', getWalletTransactionsFn), authorizer });

    // Push notification device token storage
    const storePushTokenFn = new nodejs.NodejsFunction(this, 'StorePushToken', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/store-push-token.ts'),
    });
    table.grantReadWriteData(storePushTokenFn);
    api.addRoutes({ path: '/notifications/token', methods: [HttpMethod.POST, HttpMethod.DELETE], integration: new HttpLambdaIntegration('StorePushTokenInt', storePushTokenFn), authorizer });

    // Public seller profile + draws (no auth — anyone can view a seller page)
    const getSellerProfileFn = new nodejs.NodejsFunction(this, 'GetSellerProfile', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/get-seller-profile.ts'),
    });
    const getSellerDrawsFn = new nodejs.NodejsFunction(this, 'GetSellerDraws', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/get-seller-draws.ts'),
    });
    table.grantReadData(getSellerProfileFn);
    table.grantReadData(getSellerDrawsFn);
    api.addRoutes({ path: '/sellers/{id}', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('GetSellerProfileInt', getSellerProfileFn) });
    api.addRoutes({ path: '/sellers/{id}/draws', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('GetSellerDrawsInt', getSellerDrawsFn) });

    // Admin — manual draw resolution
    const adminResolveDrawFn = new nodejs.NodejsFunction(this, 'AdminResolveDraw', {
      ...commonProps,
      timeout: cdk.Duration.seconds(15),
      environment: { ...commonEnv, ADMIN_EMAILS: adminEmails, RESEND_API_KEY_PARAM: '/bedrawn/resend/api-key-full', USER_POOL_ID: userPool.userPoolId },
      entry: path.join(__dirname, 'lambda/admin-resolve-draw.ts'),
    });
    table.grantReadWriteData(adminResolveDrawFn);
    adminResolveDrawFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cognito-idp:AdminGetUser'],
      resources: [userPool.userPoolArn],
    }));
    adminResolveDrawFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/bedrawn/resend/api-key-full`],
    }));
    api.addRoutes({ path: '/admin/draws/{id}/resolve', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('AdminResolveDrawInt', adminResolveDrawFn), authorizer });

    // Admin — force-cancel a draw (refunds all entrants regardless of ticket count)
    const adminCancelDrawFn = new nodejs.NodejsFunction(this, 'AdminCancelDraw', {
      ...commonProps,
      environment: { ...commonEnv, ADMIN_EMAILS: adminEmails },
      entry: path.join(__dirname, 'lambda/admin-cancel-draw.ts'),
    });
    table.grantReadWriteData(adminCancelDrawFn);
    api.addRoutes({ path: '/admin/draws/{id}/cancel', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('AdminCancelDrawInt', adminCancelDrawFn), authorizer });

    // Admin — register a physical postal entry for a draw
    const adminAddPostalEntryFn = new nodejs.NodejsFunction(this, 'AdminAddPostalEntry', {
      ...commonProps,
      environment: { ...commonEnv, ADMIN_EMAILS: adminEmails },
      entry: path.join(__dirname, 'lambda/admin-add-postal-entry.ts'),
    });
    table.grantReadWriteData(adminAddPostalEntryFn);
    api.addRoutes({ path: '/admin/draws/{id}/postal-entry', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('AdminAddPostalEntryInt', adminAddPostalEntryFn), authorizer });

    // Mark all notifications as read (POST /notifications/read)
    const markNotificationsReadFn = new nodejs.NodejsFunction(this, 'MarkNotificationsRead', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/mark-notifications-read.ts'),
    });
    table.grantReadWriteData(markNotificationsReadFn);
    api.addRoutes({ path: '/notifications/read', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('MarkNotificationsReadInt', markNotificationsReadFn), authorizer });

    // GDPR account deletion — DELETE /me
    const deleteAccountFn = new nodejs.NodejsFunction(this, 'DeleteAccount', {
      ...commonProps,
      environment: { ...commonEnv, USER_POOL_ID: userPool.userPoolId },
      entry: path.join(__dirname, 'lambda/delete-account.ts'),
      timeout: cdk.Duration.seconds(15),
    });
    table.grantReadWriteData(deleteAccountFn);
    deleteAccountFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cognito-idp:AdminDeleteUser'],
      resources: [userPool.userPoolArn],
    }));
    api.addRoutes({ path: '/me', methods: [HttpMethod.DELETE], integration: new HttpLambdaIntegration('DeleteAccountInt', deleteAccountFn), authorizer });

    // ── Rate limiting: patch throttle settings onto the auto-created $default stage ──
    // HttpApi creates $default automatically; we override its DefaultRouteSettings.
    const cfnDefaultStage = api.defaultStage?.node.defaultChild as cdk.CfnResource;
    cfnDefaultStage.addPropertyOverride('DefaultRouteSettings', {
      ThrottlingBurstLimit: 100,
      ThrottlingRateLimit: 50,
    });

    // ── CloudWatch alarms — alert on Lambda errors and DynamoDB throttles ──
    const alertTopic = new sns.Topic(this, 'AlertTopic', { displayName: 'Bedrawn Alerts' });
    const alertEmail: string = this.node.tryGetContext('alertEmail') ?? 'yoniaibi@gmail.com';
    alertTopic.addSubscription(new snssub.EmailSubscription(alertEmail));

    const criticalFns: nodejs.NodejsFunction[] = [
      enterDrawFn, resolveDrawsFn, walletTopupFn, stripeWebhookFn, confirmPayoutFn,
    ];
    criticalFns.forEach(fn => {
      const alarm = new cloudwatch.Alarm(this, `${fn.node.id}ErrorAlarm`, {
        metric: fn.metricErrors({ period: cdk.Duration.minutes(5) }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `${fn.node.id} threw errors`,
      });
      alarm.addAlarmAction(new cwactions.SnsAction(alertTopic));
    });

    // ─── Analytics Lambdas ────────────────────────────────────────────────────

    // Grant analytics write to all Lambdas that emit events
    analyticsTable.grantWriteData(postDrawFn);
    analyticsTable.grantWriteData(enterDrawFn);
    analyticsTable.grantWriteData(toggleSaveDrawFn);
    analyticsTable.grantReadWriteData(resolveDrawsFn);

    // Nightly snapshot generator — runs 30 min after 9pm resolve window
    const generateSnapshotsFn = new nodejs.NodejsFunction(this, 'GenerateBrandSnapshots', {
      ...commonProps,
      entry: path.join(__dirname, 'lambda/generate-brand-snapshots.ts'),
      timeout: cdk.Duration.minutes(5),
    });
    analyticsTable.grantReadWriteData(generateSnapshotsFn);

    // 30 min after nightly resolve: 21:30 GMT (Nov–Mar) and 20:30 BST (Apr–Oct)
    new events.Rule(this, 'SnapshotsGMT', {
      schedule: events.Schedule.expression('cron(30 21 * 1-3,11,12 ? *)'),
      description: 'Regenerate brand analytics snapshots after nightly draw resolution (GMT)',
    }).addTarget(new targets.LambdaFunction(generateSnapshotsFn));

    new events.Rule(this, 'SnapshotsBST', {
      schedule: events.Schedule.expression('cron(30 20 * 4-10 ? *)'),
      description: 'Regenerate brand analytics snapshots after nightly draw resolution (BST)',
    }).addTarget(new targets.LambdaFunction(generateSnapshotsFn));

    // Brand report API — admin-only read endpoint for brand partnership data
    const getBrandReportFn = new nodejs.NodejsFunction(this, 'GetBrandReport', {
      ...commonProps,
      environment: { ...commonEnv, ADMIN_EMAILS: adminEmails },
      entry: path.join(__dirname, 'lambda/get-brand-report.ts'),
    });
    analyticsTable.grantReadData(getBrandReportFn);
    api.addRoutes({
      path: '/analytics/brands/{brandId}',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('GetBrandReportInt', getBrandReportFn),
      authorizer,
    });

    // LegitApp authentication webhook — public endpoint, HMAC-verified inside Lambda
    const legitWebhookFn = new nodejs.NodejsFunction(this, 'LegitWebhook', {
      ...commonProps,
      timeout: cdk.Duration.seconds(15),
      environment: {
        ...commonEnv,
        USER_POOL_ID: userPool.userPoolId,
        RESEND_API_KEY_PARAM: '/bedrawn/resend/api-key-full',
        // LEGIT_WEBHOOK_SECRET absent = dev mode (HMAC skipped with a warning).
        // To harden: aws ssm put-parameter --name /bedrawn/legit/webhook-secret --value <secret> --type SecureString
        // then populate here via cdk.SecretValue.ssmSecure() and redeploy.
      },
      entry: path.join(__dirname, 'lambda/legit-webhook.ts'),
    });
    table.grantReadWriteData(legitWebhookFn);
    legitWebhookFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cognito-idp:AdminGetUser'],
      resources: [userPool.userPoolArn],
    }));
    legitWebhookFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/bedrawn/resend/api-key-full`],
    }));
    api.addRoutes({ path: '/webhooks/legit', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('LegitWebhookInt', legitWebhookFn) });

    // ── Admin metrics / cohort Lambda ─────────────────────────────────────────
    // Handles all innovation-accounting routes — cohort CRUD, metrics computation,
    // pivot decisions, buyer hashing, seller roll-up, and safety notes.
    const adminCohortFn = new nodejs.NodejsFunction(this, 'AdminCohort', {
      ...commonProps,
      environment: { ...commonEnv, ADMIN_EMAILS: adminEmails },
      entry: path.join(__dirname, 'lambda/admin-cohort.ts'),
      timeout: cdk.Duration.seconds(30),
    });
    table.grantReadWriteData(adminCohortFn);

    const adminCohortInt = new HttpLambdaIntegration('AdminCohortInt', adminCohortFn);
    api.addRoutes({ path: '/admin/cohorts',                    methods: [HttpMethod.GET, HttpMethod.POST],         integration: adminCohortInt, authorizer });
    api.addRoutes({ path: '/admin/cohorts/{id}',               methods: [HttpMethod.GET],                          integration: adminCohortInt, authorizer });
    api.addRoutes({ path: '/admin/cohorts/{id}/snapshot',      methods: [HttpMethod.POST],                         integration: adminCohortInt, authorizer });
    api.addRoutes({ path: '/admin/cohorts/{id}/resolve',       methods: [HttpMethod.POST],                         integration: adminCohortInt, authorizer });
    api.addRoutes({ path: '/admin/cohorts/{id}/buyers',        methods: [HttpMethod.POST],                         integration: adminCohortInt, authorizer });
    api.addRoutes({ path: '/admin/metrics',                    methods: [HttpMethod.GET],                          integration: adminCohortInt, authorizer });
    api.addRoutes({ path: '/admin/metrics/decision',           methods: [HttpMethod.POST],                         integration: adminCohortInt, authorizer });
    api.addRoutes({ path: '/admin/sellers',                    methods: [HttpMethod.GET],                          integration: adminCohortInt, authorizer });
    api.addRoutes({ path: '/admin/safety',                     methods: [HttpMethod.GET],                          integration: adminCohortInt, authorizer });
    api.addRoutes({ path: '/admin/safety/note',                methods: [HttpMethod.POST],                         integration: adminCohortInt, authorizer });

    // DynamoDB throttle alarm
    const throttleAlarm = new cloudwatch.Alarm(this, 'DdbThrottleAlarm', {
      metric: table.metricThrottledRequestsForOperations({
        operations: [dynamodb.Operation.PUT_ITEM, dynamodb.Operation.UPDATE_ITEM, dynamodb.Operation.TRANSACT_WRITE_ITEMS],
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'DynamoDB throttling detected',
    });
    throttleAlarm.addAlarmAction(new cwactions.SnsAction(alertTopic));

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url ?? '', description: 'HTTP API base URL' });
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId, description: 'Cognito User Pool ID' });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId, description: 'Cognito User Pool Client ID' });
    new cdk.CfnOutput(this, 'S3BucketName', { value: bucket.bucketName, description: 'S3 bucket for file uploads' });
  }
}

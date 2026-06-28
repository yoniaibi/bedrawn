import * as cdk from 'aws-cdk-lib/core';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
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

    // Cognito User Pool — using Cognito's built-in email until bedrawn.app is SES-verified.
    // Once DNS records are added and domain is verified, swap to UserPoolEmail.withSES.
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

    const commonEnv = { TABLE_NAME: table.tableName, BUCKET_NAME: bucket.bucketName, BUCKET_REGION: this.region };
    const commonProps = { runtime: lambda.Runtime.NODEJS_20_X, environment: commonEnv };
    const stripeEnv = { ...commonEnv, STRIPE_WEBHOOK_SECRET: '' }; // webhook secret added after first deploy
    const stripeProps = { runtime: lambda.Runtime.NODEJS_20_X, environment: stripeEnv };

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
    table.grantReadData(walletBalanceFn);
    table.grantReadWriteData(enterDrawFn);
    table.grantReadWriteData(resolveDrawsFn);
    table.grantReadData(getDrawsFn);
    table.grantReadData(getDrawFn);
    table.grantReadWriteData(postDrawFn);

    // EventBridge rule — resolve draws at 9pm UK time (21:00 UTC = 9pm GMT; 10pm BST in summer)
    const ninepmRule = new events.Rule(this, 'ResolveDrawsSchedule', {
      schedule: events.Schedule.cron({ hour: '21', minute: '0' }),
      description: 'Trigger draw resolution at 9pm UTC nightly',
    });
    ninepmRule.addTarget(new targets.LambdaFunction(resolveDrawsFn));

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

    // Admin — all draws regardless of status
    const getAdminDrawsFn = new nodejs.NodejsFunction(this, 'GetAdminDraws', {
      ...commonProps,
      environment: { ...commonEnv, ADMIN_EMAILS: 'yoniaibi@gmail.com' },
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

    // Admin — manual draw resolution for testing
    const adminResolveDrawFn = new nodejs.NodejsFunction(this, 'AdminResolveDraw', {
      ...commonProps,
      environment: { ...commonEnv, ADMIN_EMAILS: 'yoniaibi@gmail.com' },
      entry: path.join(__dirname, 'lambda/admin-resolve-draw.ts'),
    });
    table.grantReadWriteData(adminResolveDrawFn);
    api.addRoutes({ path: '/admin/draws/{id}/resolve', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('AdminResolveDrawInt', adminResolveDrawFn), authorizer });

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url ?? '', description: 'HTTP API base URL' });
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId, description: 'Cognito User Pool ID' });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId, description: 'Cognito User Pool Client ID' });
    new cdk.CfnOutput(this, 'S3BucketName', { value: bucket.bucketName, description: 'S3 bucket for file uploads' });
  }
}

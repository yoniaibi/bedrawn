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

    // S3 bucket for file uploads
    const bucket = new s3.Bucket(this, 'BedrawnBucket', {
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
        maxAge: 3000,
      }],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // DynamoDB table
    const table = new dynamodb.Table(this, 'BedrawnTable', {
      tableName: 'bedrawn-items',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const commonEnv = { TABLE_NAME: table.tableName, BUCKET_NAME: bucket.bucketName };
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

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url ?? '', description: 'HTTP API base URL' });
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId, description: 'Cognito User Pool ID' });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId, description: 'Cognito User Pool Client ID' });
    new cdk.CfnOutput(this, 'S3BucketName', { value: bucket.bucketName, description: 'S3 bucket for file uploads' });
  }
}

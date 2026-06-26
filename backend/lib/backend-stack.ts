import * as cdk from 'aws-cdk-lib/core';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as iam from 'aws-cdk-lib/aws-iam';
import { HttpApi, CorsHttpMethod, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { Construct } from 'constructs';
import * as path from 'path';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SES domain identity — after deploy, add the DKIM DNS records output to bedrawn.app
    const emailIdentity = new ses.EmailIdentity(this, 'BedrawnEmailIdentity', {
      identity: ses.Identity.domain('bedrawn.app'),
    });

    // Cognito User Pool using SES for emails
    const userPool = new cognito.UserPool(this, 'BedrawnUserPool', {
      userPoolName: 'bedrawn-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      email: cognito.UserPoolEmail.withSES({
        fromEmail: 'noreply@bedrawn.app',
        fromName: 'BeDrawn',
        sesRegion: this.region,
        sesVerifiedDomain: 'bedrawn.app',
      }),
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

    table.grantReadData(getItemsFn);
    table.grantWriteData(postItemFn);
    table.grantWriteData(putItemFn);
    table.grantWriteData(deleteItemFn);
    bucket.grantPut(getUploadUrlFn);

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

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url ?? '', description: 'HTTP API base URL' });
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId, description: 'Cognito User Pool ID' });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId, description: 'Cognito User Pool Client ID' });
    new cdk.CfnOutput(this, 'S3BucketName', { value: bucket.bucketName, description: 'S3 bucket for file uploads' });
  }
}

import * as cdk from 'aws-cdk-lib/core';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { HttpApi, CorsHttpMethod, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Construct } from 'constructs';
import * as path from 'path';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'BedrawnTable', {
      tableName: 'bedrawn-items',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const commonEnv = { TABLE_NAME: table.tableName };
    const commonProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: commonEnv,
    };

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

    table.grantReadData(getItemsFn);
    table.grantWriteData(postItemFn);
    table.grantWriteData(putItemFn);
    table.grantWriteData(deleteItemFn);

    const api = new HttpApi(this, 'BedrawnApi', {
      apiName: 'bedrawn-api',
      corsPreflight: {
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST, CorsHttpMethod.PUT, CorsHttpMethod.DELETE, CorsHttpMethod.OPTIONS],
        allowOrigins: ['*'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    api.addRoutes({ path: '/items', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('GetItemsIntegration', getItemsFn) });
    api.addRoutes({ path: '/items', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('PostItemIntegration', postItemFn) });
    api.addRoutes({ path: '/items/{id}', methods: [HttpMethod.PUT], integration: new HttpLambdaIntegration('PutItemIntegration', putItemFn) });
    api.addRoutes({ path: '/items/{id}', methods: [HttpMethod.DELETE], integration: new HttpLambdaIntegration('DeleteItemIntegration', deleteItemFn) });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url ?? '',
      description: 'HTTP API base URL — set this as NEXT_PUBLIC_API_URL in Amplify',
    });
  }
}

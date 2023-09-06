import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as db from "aws-cdk-lib/aws-dynamodb";

export class StdDataGenerationLambdasStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    //* Rest API
    const api = new apigateway.RestApi(this, "API", {
      restApiName: "Twitter Rest API",
    });

    //* DynamoDB Table
    const table = new db.Table(this, "Table", {
      tableName: "Twitter",
      billingMode: db.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: "PK",
        type: db.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: db.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: {
        name: "GSI1PK",
        type: db.AttributeType.STRING,
      },
      sortKey: {
        name: "GSI1SK",
        type: db.AttributeType.STRING,
      },
      projectionType: db.ProjectionType.ALL,
    });

    //* Permissions
    const lambdaRole = new iam.Role(this, "Role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      description: "Lamda Permissions",
    });

    lambdaRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [
          table.tableArn,
          `arn:aws:dynamodb:${this.region}:${this.account}:table/${table.tableName}/index/GSI1`,
        ],
        actions: [
          "dynamodb:BatchGetItem",
          "dynamodb:ConditionCheckItem",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem",
        ],
      })
    );

    //* USER Section
    // Create User
    const createUserLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "CreateUserLambda",
      {
        bundling: {
          minify: true,
          sourceMap: false,
          sourcesContent: false,
          target: "ES2020",
        },
        runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, "../src/handlers/createUser.ts"),
        timeout: cdk.Duration.seconds(30),
        environment: {
          TABLE_NAME: table.tableName,
        },
        role: lambdaRole,
      }
    );

    // Get User
    const getUserLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "GetUserLambda",
      {
        bundling: {
          minify: true,
          sourceMap: false,
          sourcesContent: false,
          target: "ES2020",
        },
        runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, "../src/handlers/getUser.ts"),
        timeout: cdk.Duration.seconds(30),
        environment: {
          TABLE_NAME: table.tableName,
        },
        role: lambdaRole,
      }
    );

    const userResource = api.root.addResource("users");
    userResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createUserLambda)
    );

    const getUserResource = userResource.addResource("{username}");
    getUserResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getUserLambda)
    );

    //* Tweet Section
    // Create Tweet
    const createTweetLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "CreateTweetLambda",
      {
        bundling: {
          minify: true,
          sourceMap: false,
          sourcesContent: false,
          target: "ES2020",
        },
        runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, "../src/handlers/createTweet.ts"),
        timeout: cdk.Duration.seconds(30),
        environment: {
          TABLE_NAME: table.tableName,
        },
        role: lambdaRole,
      }
    );

    // Get Tweet
    const getTweetLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "GetTweetLambda",
      {
        bundling: {
          minify: true,
          sourceMap: false,
          sourcesContent: false,
          target: "ES2020",
        },
        runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, "../src/handlers/getTweet.ts"),
        timeout: cdk.Duration.seconds(30),
        environment: {
          TABLE_NAME: table.tableName,
        },
        role: lambdaRole,
      }
    );

    // Get Tweets
    const getTweetsLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "GetTweetsLambda",
      {
        bundling: {
          minify: true,
          sourceMap: false,
          sourcesContent: false,
          target: "ES2020",
        },
        runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, "../src/handlers/getTweets.ts"),
        timeout: cdk.Duration.seconds(30),
        environment: {
          TABLE_NAME: table.tableName,
        },
        role: lambdaRole,
      }
    );

    const tweetResource = getUserResource.addResource("tweets");
    const getTweetResource = tweetResource.addResource("{tweetId}");

    tweetResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createTweetLambda)
    );
    tweetResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getTweetsLambda)
    );
    getTweetResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getTweetLambda)
    );

    //* Like Section
    // Like a Tweet
    const likeTweetLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "LikeTweetLambda",
      {
        bundling: {
          minify: true,
          sourceMap: false,
          sourcesContent: false,
          target: "ES2020",
        },
        runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, "../src/handlers/likeTweet.ts"),
        timeout: cdk.Duration.seconds(30),
        environment: {
          TABLE_NAME: table.tableName,
        },
        role: lambdaRole,
      }
    );

    // List Likes of a Tweet
    const listLikesTweetLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "ListLikesTweetLambda",
      {
        bundling: {
          minify: true,
          sourceMap: false,
          sourcesContent: false,
          target: "ES2020",
        },
        runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, "../src/handlers/listLikes.ts"),
        timeout: cdk.Duration.seconds(30),
        environment: {
          TABLE_NAME: table.tableName,
        },
        role: lambdaRole,
      }
    );

    const likeTweetResource = getTweetResource.addResource("likes");
    likeTweetResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(likeTweetLambda)
    );
    likeTweetResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(listLikesTweetLambda)
    );

    //* Comment Section
    // Comment a Tweet
    const commentTweetLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "CommentTweetLambda",
      {
        bundling: {
          minify: true,
          sourceMap: false,
          sourcesContent: false,
          target: "ES2020",
        },
        runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, "../src/handlers/commentTweet.ts"),
        timeout: cdk.Duration.seconds(30),
        environment: {
          TABLE_NAME: table.tableName,
        },
        role: lambdaRole,
      }
    );

    // List Comment of a Tweet
    const listCommentsTweetLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "ListCommentsTweetLambda",
      {
        bundling: {
          minify: true,
          sourceMap: false,
          sourcesContent: false,
          target: "ES2020",
        },
        runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, "../src/handlers/listComments.ts"),
        timeout: cdk.Duration.seconds(30),
        environment: {
          TABLE_NAME: table.tableName,
        },
        role: lambdaRole,
      }
    );

    const commentTweetResource = getTweetResource.addResource("comments");
    commentTweetResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(commentTweetLambda)
    );
    commentTweetResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(listCommentsTweetLambda)
    );

    //* Followers Section
    // Follow a User
    const followUserLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "FollowUserLambda",
      {
        bundling: {
          minify: true,
          sourceMap: false,
          sourcesContent: false,
          target: "ES2020",
        },
        runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, "../src/handlers/followUser.ts"),
        timeout: cdk.Duration.seconds(30),
        environment: {
          TABLE_NAME: table.tableName,
        },
        role: lambdaRole,
      }
    );

    // List Followers
    const listFollowersLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "ListFollowersLambda",
      {
        bundling: {
          minify: true,
          sourceMap: false,
          sourcesContent: false,
          target: "ES2020",
        },
        runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, "../src/handlers/listFollowers.ts"),
        timeout: cdk.Duration.seconds(30),
        environment: {
          TABLE_NAME: table.tableName,
        },
        role: lambdaRole,
      }
    );

    // List Followings
    const listFollowingsLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "ListFollowingsLambda",
      {
        bundling: {
          minify: true,
          sourceMap: false,
          sourcesContent: false,
          target: "ES2020",
        },
        runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, "../src/handlers/listFollowing.ts"),
        timeout: cdk.Duration.seconds(30),
        environment: {
          TABLE_NAME: table.tableName,
        },
        role: lambdaRole,
      }
    );

    const followersResource = getUserResource.addResource("followers");
    followersResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(followUserLambda)
    );
    followersResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(listFollowersLambda)
    );
    const followingResource = getUserResource.addResource("following");
    followingResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(listFollowingsLambda)
    );
  }
}

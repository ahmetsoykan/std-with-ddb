import { DynamoDB } from "aws-sdk";
import { ulid } from "ulid";

import { Item } from "./base";
import { getClient } from "./client";
import { Tweet } from "./tweet";
import { executeTransactWrite } from "./utils";

export class Like extends Item {
  likingUsername: string;
  tweetId: string;
  likeId: string;

  constructor(
    likingUsername: string,
    tweetId: string,
    likeId: string = ulid()
  ) {
    super();
    this.likingUsername = likingUsername;
    this.tweetId = tweetId;
    this.likeId = likeId;
  }

  static fromItem(item?: DynamoDB.AttributeMap): Like {
    if (!item) throw new Error("No item!");
    return new Like(item.likingUsername.S, item.tweetId.S, item.likeId.S);
  }

  get pk(): string {
    return `UL#${this.tweetId}`;
  }

  get sk(): string {
    return `LIKE#${this.likingUsername}`;
  }

  get gsi1pk(): string {
    return this.pk;
  }

  get gsi1sk(): string {
    return `LIKE#${this.likeId}`;
  }

  toItem(): Record<string, unknown> {
    return {
      ...this.keys(),
      GSI1PK: { S: this.gsi1pk },
      GSI1SK: { S: this.gsi1sk },
      likingUsername: { S: this.likingUsername },
      tweetId: { S: this.tweetId },
      likeId: { S: this.likeId },
    };
  }
}

export const likeTweet = async (
  tweet: Tweet,
  likingUsername: string
): Promise<Like> => {
  const client = getClient();
  const like = new Like(likingUsername, tweet.tweetId);

  try {
    await executeTransactWrite({
      client,
      params: {
        TransactItems: [
          {
            Put: {
              TableName: process.env.TABLE_NAME,
              Item: like.toItem(),
              ConditionExpression: "attribute_not_exists(PK)",
            },
          },
          {
            Update: {
              TableName: process.env.TABLE_NAME,
              Key: tweet.keys(),
              ConditionExpression: "attribute_exists(PK)",
              UpdateExpression: "SET #likesCount = #likesCount + :inc",
              ExpressionAttributeNames: {
                "#likesCount": "likesCount",
              },
              ExpressionAttributeValues: {
                ":inc": { N: "1" },
              },
            },
          },
        ],
      },
    });
    return like;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const listLikesForTweet = async (tweetId: string): Promise<Like[]> => {
  const client = getClient();
  const like = new Like("", tweetId);

  try {
    const resp = await client
      .query({
        TableName: process.env.TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :gsi1pk",
        ExpressionAttributeValues: {
          ":gsi1pk": { S: like.gsi1pk },
        },
        ScanIndexForward: false,
      })
      .promise();
    return resp.Items.map((item) => Like.fromItem(item));
  } catch (error) {
    console.log(error);
    throw error;
  }
};

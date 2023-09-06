import { DynamoDB } from "aws-sdk";
import { ulid } from "ulid";
import { Item } from "./base";
import { getClient } from "./client";

export class Tweet extends Item {
  username: string;
  tweetId: string;
  text: string;
  likesCount: number;
  commentCount: number;

  constructor(
    username: string,
    text: string,
    tweetId: string = ulid(),
    likesCount?: number,
    commentCount?: number
  ) {
    super();
    this.username = username;
    this.tweetId = tweetId;
    this.text = text;
    this.likesCount = likesCount || 0;
    this.commentCount = commentCount || 0;
  }

  static fromItem(item?: DynamoDB.AttributeMap): Tweet {
    if (!item) throw new Error("No item!");
    return new Tweet(
      item.username.S,
      item.tweetId.S,
      item.text.S,
      Number(item.likesCount.N),
      Number(item.commentCount.N)
    );
  }

  get pk(): string {
    return `UT#${this.username}`;
  }

  get sk(): string {
    return `UT#${this.tweetId}`;
  }

  toItem(): Record<string, unknown> {
    return {
      ...this.keys(),
      username: { S: this.username },
      text: { S: this.text },
      tweetId: { S: this.tweetId },
      likesCount: { N: this.likesCount.toString() },
      commentCount: { N: this.commentCount.toString() },
    };
  }
}

export const createTweet = async (tweet: Tweet): Promise<Tweet> => {
  const client = getClient();
  try {
    await client
      .putItem({
        TableName: process.env.TABLE_NAME,
        Item: tweet.toItem(),
        ConditionExpression: "attribute_not_exists(PK)",
      })
      .promise();
    return tweet;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getTweet = async (
  username: string,
  tweetId: string
): Promise<Tweet> => {
  const client = getClient();
  const tweet = new Tweet(username, "", tweetId);

  try {
    const resp = await client
      .getItem({
        TableName: process.env.TABLE_NAME,
        Key: tweet.keys(),
      })
      .promise();
    return Tweet.fromItem(resp.Item);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getTweets = async (username: string): Promise<Tweet[]> => {
  const client = getClient();
  const tweet = new Tweet(`UT#${username}`, "", "UT");

  try {
    const resp = await client
      .query({
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: "#PK = :PK",
        ExpressionAttributeNames: { "#PK": "PK" },
        ExpressionAttributeValues: {
          ":PK": { S: tweet.username },
        },
        ScanIndexForward: false,
      })
      .promise();
    return resp.Items.map((item) => Tweet.fromItem(item));
  } catch (error) {
    console.log(error);
    throw error;
  }
};

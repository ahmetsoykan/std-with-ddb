import { DynamoDB } from "aws-sdk";
import { ulid } from "ulid";

import { Item } from "./base";
import { getClient } from "./client";
import { Tweet } from "./tweet";
import { executeTransactWrite } from "./utils";

export class Comment extends Item {
  commentingUsername: string;
  tweetId: string;
  commentId: string;
  content: string;

  constructor(
    commentingUsername: string,
    tweetId: string,
    content: string,
    commentId: string = ulid()
  ) {
    super();
    this.commentingUsername = commentingUsername;
    this.tweetId = tweetId;
    this.content = content;
    this.commentId = commentId;
  }

  static fromItem(item?: DynamoDB.AttributeMap): Comment {
    if (!item) throw new Error("No item!");
    return new Comment(
      item.commentingUsername.S,
      item.tweetId.S,
      item.content.S,
      item.commentId.S
    );
  }

  get pk(): string {
    return `UTC#${this.tweetId}`;
  }

  get sk(): string {
    return `COMMENT#${this.commentId}`;
  }

  toItem(): Record<string, unknown> {
    return {
      ...this.keys(),
      commentingUsername: { S: this.commentingUsername },
      tweetId: { S: this.tweetId },
      content: { S: this.content },
      commentId: { S: this.commentId },
    };
  }
}

export const commentTweet = async (
  tweet: Tweet,
  commentingUsername: string,
  content: string
): Promise<Comment> => {
  const client = getClient();
  const comment = new Comment(commentingUsername, tweet.tweetId, content);

  try {
    await executeTransactWrite({
      client,
      params: {
        TransactItems: [
          {
            Put: {
              TableName: process.env.TABLE_NAME,
              Item: comment.toItem(),
              ConditionExpression: "attribute_not_exists(PK)",
            },
          },
          {
            Update: {
              TableName: process.env.TABLE_NAME,
              Key: tweet.keys(),
              ConditionExpression: "attribute_exists(PK)",
              UpdateExpression: "SET #commentCount = #commentCount + :inc",
              ExpressionAttributeNames: {
                "#commentCount": "commentCount",
              },
              ExpressionAttributeValues: {
                ":inc": { N: "1" },
              },
            },
          },
        ],
      },
    });
    return comment;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const listCommentsForTweet = async (
  tweetId: string
): Promise<Comment[]> => {
  const client = getClient();
  const comment = new Comment("", tweetId, "");

  try {
    const resp = await client
      .query({
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": { S: comment.pk },
        },
        ScanIndexForward: false,
      })
      .promise();
    return resp.Items.map((item) => Comment.fromItem(item));
  } catch (error) {
    console.log(error);
    throw error;
  }
};

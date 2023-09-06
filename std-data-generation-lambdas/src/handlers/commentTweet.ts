import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { commentTweet } from "../data/comment";
import { Tweet } from "../data/tweet";

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  const { username, tweetId } = event.pathParameters;
  const tweet = new Tweet(username, "", tweetId);
  const { commentingUsername, content } = JSON.parse(event.body);
  const comment = await commentTweet(tweet, commentingUsername, content);
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      comment,
    }),
  };

  return response;
};

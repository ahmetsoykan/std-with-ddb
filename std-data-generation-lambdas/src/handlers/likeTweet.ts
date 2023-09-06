import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { likeTweet } from "../data/like";
import { Tweet } from "../data/tweet";

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  const { username, tweetId } = event.pathParameters;
  const tweet = new Tweet(username, "", tweetId);
  const { likingUsername } = JSON.parse(event.body);
  const like = await likeTweet(tweet, likingUsername);
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      like,
    }),
  };

  return response;
};

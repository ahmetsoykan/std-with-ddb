import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { getTweet } from "../data/tweet";

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  const { username, tweetId } = event.pathParameters;
  const tweet = await getTweet(username, tweetId);
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      tweet,
    }),
  };

  return response;
};

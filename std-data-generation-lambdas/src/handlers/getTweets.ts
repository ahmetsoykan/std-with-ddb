import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { getTweet, getTweets } from "../data/tweet";

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  const { username } = event.pathParameters;
  const tweets = await getTweets(username);
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      tweets,
    }),
  };

  return response;
};

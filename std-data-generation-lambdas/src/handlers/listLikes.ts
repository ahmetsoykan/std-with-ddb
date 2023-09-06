import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { listLikesForTweet } from "../data/like";

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  const { tweetId } = event.pathParameters;
  const likes = await listLikesForTweet(tweetId);
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      likes,
    }),
  };

  return response;
};

import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { listCommentsForTweet } from "../data/comment";

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  const { tweetId } = event.pathParameters;
  const comments = await listCommentsForTweet(tweetId);
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      comments,
    }),
  };

  return response;
};

import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { Tweet, createTweet } from "../data/tweet";

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  const { username } = event.pathParameters;
  console.log(username)
  const { text } = JSON.parse(event.body);
  const tweet = new Tweet(username, text);
  await createTweet(tweet);
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      tweet,
    }),
  };

  return response;
};

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { User, createUser } from "../data/user";

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    const { username } = JSON.parse(event.body);
    const user = new User(username);
    await createUser(user);
    return {
      statusCode: 200,
      body: JSON.stringify({
        user,
      }),
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: err,
      }),
    };
  }
}

import ClientError from "../error/ClientError";
import { ErrorCode } from "../error/ErrorCode";

export function parseError(error: ClientError | any): ClientError {
  if (error instanceof ClientError) {
    return error;
  } else {
    return new ClientError(ErrorCode.UNKNOWN_ERROR, error);
  }
}

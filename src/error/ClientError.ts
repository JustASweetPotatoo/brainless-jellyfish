import { ErrorCode, ErrorMessage } from "./ClientErrorCode";

class ClientError extends Error {
  public readonly code: string;
  public readonly baseMessage: string;
  public readonly cause?: Error;

  constructor(message: string | undefined, code: ErrorCode, cause?: Error) {
    super(message ?? "At");
    this.code = code;
    this.cause = cause;
    this.baseMessage = ErrorMessage[code];

    if (this.cause) {
      this.stack += `\nCause by > ${this.cause.stack}`;
    }

    Object.setPrototypeOf(this, ClientError.prototype);
  }

  createMessage(getStack: boolean = true): string {
    return `${this.code}: ${this.baseMessage}: ${getStack ? `\n${this.stack}` : ""}\n`;
  }
}

export default ClientError;

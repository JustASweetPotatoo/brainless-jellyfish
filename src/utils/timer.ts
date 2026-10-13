import { Logger } from "../logger/Logger";

export function showExecutionTime(startTime: number, logger?: Logger) {
  const showTime = Date.now();
  const executionTimes = Math.floor(showTime - startTime);
  const message = `Executed with ${executionTimes} miliseconds`;

  logger ? logger.info(message) : console.info(message);
}

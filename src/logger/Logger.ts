import * as path from "path";
import * as fs from "fs";

import MassClient from "../Client";

export function getStringTimestamp(date?: Date): string {
  const newDate = date ?? new Date();

  const hours = newDate.getHours();
  const seconds = newDate.getSeconds();
  const minutes = newDate.getMinutes();

  const args = [
    `${hours < 10 ? `0${hours}` : hours}`,
    `${minutes < 10 ? `0${minutes}` : minutes}`,
    `${seconds < 10 ? `0${seconds}` : seconds}`,
  ];

  return args.join(":");
}

export class LogPrinter {
  private readonly client: MassClient;
  private readonly logFolderPath: string;
  private readonly logCurrentFilePath: string;
  private readonly fileName: string;

  // debug
  private readonly useFilePath = path.join(path.join(__dirname, "../logs"), "debug.txt");

  constructor(client: MassClient) {
    this.client = client;
    this.logFolderPath = path.join(__dirname, "../logs");
    this.fileName =
      this.client.startAt
        .toISOString()
        .replace(/T/g, " ")
        .replace(/[:]/g, "-")
        .slice(0, -4) + "txt";
    this.logCurrentFilePath = path.join(this.logFolderPath, this.fileName);
  }

  public createFolder() {
    if (!fs.existsSync(this.logFolderPath)) fs.mkdirSync(this.logFolderPath);
    if (!fs.existsSync(this.logCurrentFilePath)) {
      fs.writeFileSync(
        this.logCurrentFilePath,
        `Start with node version: ${
          process.version
        }\nStart Timestamp: ${getStringTimestamp(this.client.startAt)}\n`
      );
    }
  }

  writeToDebugFile(content: string) {
    if (!fs.existsSync(this.logFolderPath)) fs.mkdirSync(this.logFolderPath);
    if (!fs.existsSync(this.useFilePath)) {
      fs.writeFileSync(this.useFilePath, "");
    }
    fs.appendFileSync(this.useFilePath, content + "\n");
  }

  /**
   * Write content to exist file
   * @param content
   */
  public writeContent(content: string): boolean {
    if (this.client.mode == "debug") {
      this.writeToDebugFile(content);
      return true;
    } else {
      // Ensure folder and file exist
      if (!fs.existsSync(this.logFolderPath)) fs.mkdirSync(this.logFolderPath);
      if (!fs.existsSync(this.logCurrentFilePath)) {
        fs.writeFileSync(this.logCurrentFilePath, "");
      }
      fs.appendFileSync(this.logCurrentFilePath, content + "\n");
    }
    return false;
  }
}

export interface LoggerOptions {
  label: string;
  printer: LogPrinter;
}

export enum LogMessageType {
  LOG = "log ",
  INFO = "info",
  OK = "ok  ",
  WARN = "warn",
  ERROR = "err ",
  DEBUG = "dev "
}

let labelStringLength = 50;

export class Logger {
  public label: string;
  public readonly printer: LogPrinter;

  constructor(options: LoggerOptions) {
    this.label = options.label;
    this.printer = options.printer;
  }

  print(
    content: string,
    type: LogMessageType | LogMessageType.LOG,
    printToFile?: boolean
  ) {
    let infoLabel = `[${getStringTimestamp()} ${type.toUpperCase()}]: [${this.label.toUpperCase()}]`;
    if (infoLabel.length >= labelStringLength) labelStringLength = infoLabel.length;
    if (infoLabel.length < labelStringLength)
      infoLabel += " ".repeat(labelStringLength - infoLabel.length);

    const message = `${infoLabel} ${content}`;

    if (printToFile ?? true) this.printer.writeContent(message);

    switch (type) {
      case LogMessageType.LOG:
        console.log(message);
        break;
      case LogMessageType.WARN:
        console.warn(message);
        break;
      case LogMessageType.INFO:
        console.info(message);
        break;
      case LogMessageType.OK:
        console.info(message); // temp
        break;
      case LogMessageType.ERROR:
        console.error(message);
        break;
      default:
        console.log(message);
        break;
    }
  }

  printMultiLines(messages: Array<{ content: string; type: LogMessageType }>) {
    messages.forEach((data) => this.print(data.content, data.type));
  }

  /**
   *
   * @param {string} message
   * @param {boolean} printToFile
   */
  log(message: string, printToFile?: boolean) {
    this.print(message, LogMessageType.LOG, printToFile);
  }
  /**
   *
   * @param {string} message
   * @param {boolean} printToFile
   */
  info(message: string, printToFile?: boolean) {
    this.print(message, LogMessageType.INFO, printToFile);
  }
  /**
   *
   * @param {string} message
   * @param {boolean} printToFile
   */
  success(message: string, printToFile?: boolean) {
    this.print(message, LogMessageType.OK, printToFile);
  }
  /**
   *
   * @param {string} message
   * @param {boolean} printToFile
   */
  warn(message: string, printToFile?: boolean) {
    this.print(message, LogMessageType.WARN, printToFile);
  }
  /**
   *
   * @param {string} message
   * @param {boolean} printToFile
   */
  error(message: string, error?: Error | any, printToFile?: boolean) {
    const content = `${message}${error ? `\n${error?.message}\n${error?.stack}` : ""}`;
    this.print(content, LogMessageType.ERROR, printToFile ?? true);
  }

  debug(message: string) {
    const content = `${message}`;
    this.print(content, LogMessageType.DEBUG, false);
  }
}

import * as path from "path";
import * as fs from "fs";

import MassClient from "../Client";

export function getStringTimestamp(date?: Date): string {
  const newDate = date ?? new Date();

  const days = newDate.getDay();
  const months = newDate.getMonth();

  const hours = newDate.getHours();
  const seconds = newDate.getSeconds();
  const minutes = newDate.getMinutes();

  const inYearTime = [`${days < 10 ? `0${days}` : days}`, `${months < 10 ? `0${months}` : months}`];

  const inDayTime = [
    `${hours < 10 ? `0${hours}` : hours}`,
    `${minutes < 10 ? `0${minutes}` : minutes}`,
    `${seconds < 10 ? `0${seconds}` : seconds}`,
  ];

  return `${inYearTime.join("/")} ${inDayTime.join(":")}`;
}

export interface PrintOptions {
  readonly content: string;
  readonly type: LogMessageType | LogMessageType.LOG;
  noLabel?: boolean;
  printToFile?: boolean;
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
    this.fileName = this.client.startAt.toISOString().replace(/T/g, " ").replace(/[:]/g, "-").slice(0, -4) + "txt";
    this.logCurrentFilePath = path.join(this.logFolderPath, this.fileName);
  }

  public createFolder() {
    if (!fs.existsSync(this.logFolderPath)) fs.mkdirSync(this.logFolderPath);
    if (!fs.existsSync(this.logCurrentFilePath)) {
      fs.writeFileSync(
        this.logCurrentFilePath,
        `Start with node version: ${process.version}\nStart Timestamp: ${getStringTimestamp(this.client.startAt)}\n`,
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
    if (this.client.operationMode == "debug") {
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
  DEBUG = "dev ",
}

let labelStringLength = 50;

export class Logger {
  public label: string;
  public readonly printer: LogPrinter;

  constructor(options: LoggerOptions) {
    this.label = options.label;
    this.printer = options.printer;
  }

  print(options: PrintOptions) {
    let infoLabel = `${getStringTimestamp()} [${options.type.toUpperCase()}] [${this.label.toUpperCase()}]`;
    if (infoLabel.length >= labelStringLength) labelStringLength = infoLabel.length;
    if (infoLabel.length < labelStringLength) infoLabel += " ".repeat(labelStringLength - infoLabel.length);

    if (options.noLabel) infoLabel = " ".repeat(infoLabel.length);

    const message = `${infoLabel}: ${options.content.split("\n").join(`\n>${" ".repeat(infoLabel.length)}`)}`;

    if (options.printToFile ?? true) this.printer.writeContent(message);

    switch (options.type) {
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
    messages.forEach((data) => this.print({ content: data.content, type: data.type }));
  }

  log(message: any, noLabel?: boolean, printToFile?: boolean) {
    this.print({
      content: message,
      type: LogMessageType.LOG,
      noLabel: noLabel,
      printToFile: printToFile,
    });
  }
  info(message: any, noLabel?: boolean, printToFile?: boolean) {
    this.print({
      content: message,
      type: LogMessageType.INFO,
      noLabel: noLabel,
      printToFile: printToFile,
    });
  }
  ok(message: any, noLabel?: boolean, printToFile?: boolean) {
    this.print({
      content: message,
      type: LogMessageType.OK,
      noLabel: noLabel,
      printToFile: printToFile,
    });
  }
  /**
   *
   * @param {string} message
   * @param {boolean} printToFile
   */
  warn(message: any, noLabel?: boolean, printToFile?: boolean) {
    this.print({
      content: message,
      type: LogMessageType.WARN,
      noLabel: noLabel,
      printToFile: printToFile,
    });
  }

  error(error: Error | any): void;

  error(
    options:
      | {
          message?: string;
          error?: Error | any;
          noLabel?: boolean;
          printToFile?: boolean;
        }
      | Error
      | any,
  ) {
    const content = `${options.message ?? ""}${
      options.error ? `\n${options.error?.message}\n${options.error?.stack}` : ""
    }`;
    this.print({
      content: content,
      type: LogMessageType.ERROR,
      noLabel: options.noLabel,
      printToFile: options.printToFile ?? true,
    });
  }

  debug(message: any, noLabel?: boolean) {
    const content = `${message}`;
    this.print({
      content: content,
      type: LogMessageType.DEBUG,
      noLabel: noLabel,
      printToFile: false,
    });
  }
}

export interface FormatKey {
  [keyName: string]: {
    value: string;
  };
}

export default abstract class LanguageService {
  abstract readonly keys: FormatKey;

  changeContent(template: string, data: { keyName: string; value: any }[]): string {
    data.forEach((item) => {
      template.replace(/\$[A-Z0-9_]+/g, item.value);
    });

    return "";
  }
}

class ErrorHandlerLanguageService extends LanguageService {
  readonly keys: FormatKey = {
    messageContent: {
      value: "CONTENT",
    },
    messageOldContent: {
      value: "OLD_CONTENT",
    },
    messageNewContent: {
      value: "NEW_CONTENT",
    },
  };

  changeContent(template: string, data: any): string {
    throw new Error("Method not implemented.");
  }
}

import { Locale, Colors } from "discord.js";

export type Lang = {
  [moduleName: string]: {
    lang: ModuleLang;
    format: ModuleLangFormat;
  };
};

export type ModuleLang = {
  [locale in Locale]: {
    [messageKey: string]: MessageTemplate;
  };
};

export type ModuleLangFormat = {
  [formatKey: string]: string;
};

export interface MessageTemplate {
  title: string;
  description: string;
}

export default class LangService {
  private lang: ModuleLang;
  private langFormat: ModuleLangFormat;

  constructor(langData: Lang, moduleName: string) {
    this.lang = langData[moduleName].lang;
    this.langFormat = langData[moduleName].format;
  }

  formatLang(template: MessageTemplate, data: Record<LangFormatKey, string>): MessageTemplate {
    const replaceFunc = (stringData: string) =>
      stringData.replace(/\$[A-Z0-9_]+/g, (token) => {
        const key = token.slice(1);
        return data[key as LangFormatKey] ?? token;
      });

    return {
      title: replaceFunc(template.title),
      description: replaceFunc(template.description),
    };
  }

  getMessageLoggerTemplate(locale: Locale, key: keyof MessageLoggerLang) {
    return (this.lang[locale] ?? this.lang["en-US"])[key] ?? { title: "Undefined", description: "Undefined" };
  }

  exportMessageLoggerLangMessage(
    locale: Locale,
    data: Record<MessageLoggerLangFormat, string>,
    key: keyof MessageLoggerLang
  ) {
    return this.formatLang(this.getMessageLoggerTemplate(locale, key), data);
  }
}

export interface MessageLoggerLang {
  editedMessage: MessageTemplate;
  deletedMessage: MessageTemplate;
  bulkDeletedMessage: MessageTemplate;
  completeNotification: MessageTemplate;
  failedNotification: MessageTemplate;
  errorNotification: MessageTemplate;
}

export type LangFormatKey = MessageLoggerLangFormat;

export enum MessageLoggerLangFormat {
  CHANNEL_ID = "CHANNEL_ID",
  CONTENT = "CONTENT",
  OLD_CONTENT = "OLD_CONTENT",
  NEW_CONTENT = "NEW_CONTENT",
  AMOUNT = "AMOUNT",
}

import lang from "./modules/lang.json";

console.log(
  new LangService(lang.modules as unknown as Lang, "messageLogger").exportMessageLoggerLangMessage(
    Locale.EnglishUS,
    {
      CONTENT: "any",
      [MessageLoggerLangFormat.CHANNEL_ID]: "",
      [MessageLoggerLangFormat.OLD_CONTENT]: "",
      [MessageLoggerLangFormat.NEW_CONTENT]: "",
    },
    "deletedMessage"
  )
);

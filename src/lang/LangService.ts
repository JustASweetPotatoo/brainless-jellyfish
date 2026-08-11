import { Locale } from "discord.js";

export type Lang = {
  [moduleName: string]: LangModule;
};

export type ModuleLang = {
  [locale: string]: {
    [messageKey: string]: MessageTemplate;
  };
};

export type LangModule = {
  lang?: ModuleLang;
  format?: ModuleLangFormat;
  [key: string]: unknown;
};

export type ModuleLangFormat = {
  [formatKey: string]: string;
};

export interface MessageTemplate {
  title: string;
  description: string;
}

export default class LangService {
  private readonly lang: ModuleLang;
  private readonly langFormat: ModuleLangFormat;

  constructor(langData: Lang = {}, moduleName?: string) {
    const moduleData = moduleName ? langData[moduleName] : undefined;
    this.lang = (moduleData?.lang ?? (moduleData as ModuleLang | undefined) ?? {}) as ModuleLang;
    this.langFormat = moduleData?.format ?? {};
  }

  formatLang(template: MessageTemplate, data: Record<string, unknown> = {}): MessageTemplate {
    const replaceFunc = (stringData: string) =>
      stringData.replace(/\$[A-Z0-9_]+/g, (token) => {
        const key = token.slice(1);
        return data[key] === undefined ? token : String(data[key]);
      });

    return {
      title: replaceFunc(template.title),
      description: replaceFunc(template.description),
    };
  }

  formatPayload<T>(payload: T, locale: Locale | string, data: Record<string, unknown> = {}): T {
    const localeData = this.getLocaleData(locale);
    const values = { ...this.langFormat, ...localeData, ...data };
    return this.formatValue(payload, values);
  }

  private formatValue<T>(value: T, data: Record<string, unknown>): T {
    if (typeof value === "string") {
      return value.replace(/\$[A-Z0-9_]+/g, (token) => {
        const key = token.slice(1);
        return data[key] === undefined ? token : String(data[key]);
      }) as T;
    }

    if (value && typeof (value as { toJSON?: unknown }).toJSON === "function") {
      const serialized = (value as unknown as { toJSON: () => unknown }).toJSON();
      return this.formatValue(serialized, data) as T;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.formatValue(item, data)) as T;
    }

    if (!this.isPlainObject(value)) return value;

    const formatted: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      formatted[key] = this.formatValue(item, data);
    }
    return formatted as T;
  }

  private getLocaleData(locale: Locale | string): Record<string, unknown> {
    const normalizedLocale = locale.toLowerCase();
    const shortLocale = normalizedLocale.split("-")[0];
    return (this.lang[locale] ??
      this.lang[normalizedLocale] ??
      this.lang[shortLocale] ??
      this.lang["en-US"] ??
      this.lang.en ??
      {}) as Record<string, unknown>;
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value === null || typeof value !== "object") return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  getMessageLoggerTemplate(locale: Locale, key: keyof MessageLoggerLang) {
    return (
      (this.lang[locale] ?? this.lang["en-US"])[key] ?? {
        title: "Undefined",
        description: "Undefined",
      }
    );
  }

  exportLoggerMessage(locale: Locale, data: Record<MessageLoggerLangFormat, string>, key: keyof MessageLoggerLang) {
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

import { time } from "console";
import { ButtonInteraction, CommandInteraction, InteractionEditReplyOptions, Locale, Message } from "discord.js";

export function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`);
}

export function snakeToCamel(str: string): string {
  return str
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()) // Chuyển các ký tự sau dấu gạch dưới thành chữ hoa
    .replace(/^([A-Z])/, (_, letter) => letter.toLowerCase()); // Đảm bảo chữ cái đầu tiên là chữ thường
}

export function toInsertQuery(tableName: string, data: Object, numberOfIgnoredKey: number): [string, Array<any>] {
  let query = `INSERT INTO ${tableName} `;
  const collumnNameList = Object.keys(data).map((key) => `\`${camelToSnake(key)}\``);
  const values = Object.values(data);
  query += `(${collumnNameList.join(", ")}) `;
  query += `VALUES(${values.map(() => "?").join(", ")}) `;
  query += `ON DUPLICATE KEY UPDATE `;
  collumnNameList.forEach((collumnName, index) => {
    if (index <= numberOfIgnoredKey - 1) return;
    query += `${collumnName} = VALUES(${collumnName}), `;
  });
  query = query.slice(0, query.length - 2) + ";";
  return [query, values];
}

export function splitArrayIntoChunks(array: Array<any>, chunkSize: number): Array<Array<any>> {
  if (chunkSize <= 0) {
    throw new Error("chunkSize phải lớn hơn 0");
  }
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

export function extractKeysFromTemplate(template: string): string[] {
  const regex = /\$([A-Z_]+)/g;
  const keys: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    keys.push(match[1]);
  }

  return keys;
}

export function replaceContent(template: string, variables: { [key: string]: string }): string {
  extractKeysFromTemplate(template).forEach((key) => {
    template = template.replace("$" + key, variables[key] ?? "");
  });

  return template;
}

export async function autoDeleteReply(replyMessage: Message<boolean>, timeout: number) {
  if (replyMessage.deletable) {
    setTimeout(async () => {
      await replyMessage.delete();
    }, timeout);
  }
}

export async function sendTimeoutReply(
  interaction: CommandInteraction | ButtonInteraction,
  replyOptions: InteractionEditReplyOptions,
  timeout: number = 10000
) {
  if (interaction instanceof CommandInteraction) {
    if (!interaction.deferred) {
      await interaction.deferReply({ fetchReply: false, ephemeral: true });
    }

    let replyMessage = await interaction.editReply(replyOptions);
    await autoDeleteReply(replyMessage, timeout);
  }
}

function generateUUID(): string {
  let uuid = "",
    i,
    random;
  for (i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += "-";
    } else if (i === 14) {
      uuid += "4"; // 4 ở vị trí version
    } else if (i === 19) {
      random = (Math.random() * 16) | 0;
      uuid += ((random & 0x3) | 0x8).toString(16); // variant
    } else {
      random = (Math.random() * 16) | 0;
      uuid += random.toString(16);
    }
  }
  return uuid;
}

import { camelToSnake } from "./stringConvert";

export function toInsertQuery(
  tableName: string,
  data: Object,
  numberOfPrimaryKey: number
): [string, Array<any>] {
  let query = `INSERT INTO ${tableName} `;
  const collumnNameList = Object.keys(data).map((key) => `\`${camelToSnake(key)}\``);
  const values = Object.values(data);
  query += `(${collumnNameList.join(", ")}) `;
  query += `VALUES(${values.map(() => "?").join(", ")}) `;
  query += `ON DUPLICATE KEY UPDATE `;
  collumnNameList.forEach((collumnName, index) => {
    if (index <= numberOfPrimaryKey - 1) return;
    query += `${collumnName} = VALUES(${collumnName}), `;
  });
  query = query.slice(0, query.length - 2) + ";";
  return [query, values];
}

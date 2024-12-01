export function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`);
}

export function snakeToCamel(str: string): string {
  return str
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()) // Chuyển các ký tự sau dấu gạch dưới thành chữ hoa
    .replace(/^([A-Z])/, (_, letter) => letter.toLowerCase()); // Đảm bảo chữ cái đầu tiên là chữ thường
}

export function toInsertQuery(
  tableName: string,
  data: Object,
  numberOfIgnoredKey: number
): [string, Array<any>] {
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

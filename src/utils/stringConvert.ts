export function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`);
}

export function snakeToCamel(str: string): string {
  return str
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()) // Chuyển các ký tự sau dấu gạch dưới thành chữ hoa
    .replace(/^([A-Z])/, (_, letter) => letter.toLowerCase()); // Đảm bảo chữ cái đầu tiên là chữ thường
}

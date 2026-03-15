import fs from "fs";
import path from "path";

export async function readConfigFile(file: string): Promise<Object> {
  const current = path.join("./src/config", file);
  return JSON.parse(fs.readFileSync(current, "utf-8"));
}

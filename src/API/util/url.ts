export function getParam(name: string, reqUrl: string, base?: string) {
  const url = new URL(reqUrl, "http://localhost");
  return url.searchParams.get(name);
}

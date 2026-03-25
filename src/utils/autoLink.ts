import { Message } from "discord.js";
import fs from "fs";
import { pipeline } from "stream/promises";

export function extractFbLinkFromContent(content: string): string | undefined {
  const links = content.match(/https?:\/\/[^\s]+/g);
  return links?.find((link, idx) => link.startsWith("https://www.facebook.com"));
}

export function extractRawVideoLink(html: string): string | undefined {
  const match = html.match(/<meta property="og:video:secure_url" content="([^"]+)"/);
  return match ? match[1] : undefined;
}

export function extractVideoReelId(html: string): string | undefined {
  const match = html.match(
    /<meta property="og:url" content="https:\/\/www\.facebook\.com\/reel\/(\d+)"/
  );
  return match ? match[1] : undefined;
}

export async function dowloadVideoFromLink(link: string, path: string = "video.mp4") {
  const res = await fetch(link);

  if (!res.ok) throw new Error("Download fail");

  const fileStream = fs.createWriteStream(path);

  const body = res.body;

  if (body) {
    await pipeline(res.body, fileStream);
  } else {
    return undefined;
  }

  return path;
}

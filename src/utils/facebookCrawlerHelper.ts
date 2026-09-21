import fs from "fs";
import { pipeline } from "stream/promises";
import type { Cheerio, CheerioAPI } from "cheerio";

export type MediaType = "image" | "video" | "audio" | "file" | "unknown";

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
    /<meta property="og:url" content="https:\/\/www\.facebook\.com\/reel\/(\d+)"/,
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

export function extractFacebookReelId(url: string): string | undefined {
  return url.match(/https:\/\/www\.facebook\.com\/reel\/([^/?#]+)/i)?.[1];
}

export interface ExtractedMedia {
  url: string;
  type: MediaType;
  mimeType?: string;
  source: string;
  extension?: string;
}

export interface ExtractedMediaResult {
  images: ExtractedMedia[];
  videos: ExtractedMedia[];
  audios: ExtractedMedia[];
  files: ExtractedMedia[];
}

const MIME_TYPE_MAP: Record<string, MediaType> = {
  // Image
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "image/avif": "image",
  "image/bmp": "image",
  "image/svg+xml": "image",

  // Video
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "video/x-msvideo": "video",
  "video/mpeg": "video",
  "video/ogg": "video",

  // Audio
  "audio/mpeg": "audio",
  "audio/mp3": "audio",
  "audio/wav": "audio",
  "audio/wave": "audio",
  "audio/ogg": "audio",
  "audio/mp4": "audio",
  "audio/aac": "audio",
  "audio/flac": "audio",
};

const EXTENSION_MAP: Record<string, MediaType> = {
  // Image
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  webp: "image",
  avif: "image",
  bmp: "image",
  svg: "image",

  // Video
  mp4: "video",
  webm: "video",
  mov: "video",
  avi: "video",
  mpeg: "video",
  mpg: "video",
  m4v: "video",
  mkv: "video",

  // Audio
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  oga: "audio",
  m4a: "audio",
  aac: "audio",
  flac: "audio",

  // Generic files
  pdf: "file",
  zip: "file",
  rar: "file",
  "7z": "file",
  doc: "file",
  docx: "file",
  xls: "file",
  xlsx: "file",
  ppt: "file",
  pptx: "file",
  txt: "file",
  csv: "file",
};

function detectMediaType(property: string, mimeType: string | undefined, url: string): MediaType {
  // MIME type có độ tin cậy cao nhất
  if (mimeType) {
    const normalizedMime = mimeType.toLowerCase();

    const mapped = MIME_TYPE_MAP[normalizedMime];

    if (mapped) {
      return mapped;
    }

    if (normalizedMime.startsWith("image/")) {
      return "image";
    }

    if (normalizedMime.startsWith("video/")) {
      return "video";
    }

    if (normalizedMime.startsWith("audio/")) {
      return "audio";
    }

    // Có MIME nhưng không phải image/video/audio
    if (normalizedMime.startsWith("application/") || normalizedMime.startsWith("text/")) {
      return "file";
    }
  }

  // Sau đó xét OG property
  if (property.startsWith("og:image")) {
    return "image";
  }

  if (property.startsWith("og:video")) {
    return "video";
  }

  if (property.startsWith("og:audio")) {
    return "audio";
  }

  // Cuối cùng xét extension
  const extension = getExtension(url);

  if (extension) {
    return EXTENSION_MAP[extension] ?? "unknown";
  }

  return "unknown";
}

function getMimeType($: CheerioAPI, property: string): string | undefined {
  const typeProperty = `${property.split(":").slice(0, 2).join(":")}:type`;

  const value = $(`meta[property="${typeProperty}"]`).first().attr("content");

  return value?.trim() || undefined;
}

function getExtension(url: string): string | undefined {
  try {
    const pathname = new URL(url).pathname;

    const match = pathname.match(/\.([a-zA-Z0-9]+)$/);

    return match?.[1]?.toLowerCase();
  } catch {
    return undefined;
  }
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Nếu muốn giữ nguyên query của CDN thì bỏ phần này.
    parsed.search = "";

    return parsed.toString();
  } catch {
    return url;
  }
}

function isUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export interface FacebookPostInf {
  readonly title: string;
  readonly description: string | undefined;
  readonly reelId: string | undefined;
}

export function extractPostInf($: CheerioAPI): FacebookPostInf {
  const metas: Array<{ propety: string; content: string }> = [];

  $("meta[property]").each((_, el) => {
    const property = $(el).attr("property");
    const content = $(el).attr("content");

    if (property && content) {
      metas.push({ propety: property, content: content });
    }
  });

  const get = (name: string): Array<string> => {
    return metas.filter((value) => value.propety == name).map((item) => item.content);
  };

  return {
    title: get("og:title").at(0) ?? "",
    description: get("og:description").at(0),
    reelId: extractFacebookReelId(get("og:url").at(0) ?? ""),
  };
}

export function extractMedia($: CheerioAPI): ExtractedMediaResult {
  const result: ExtractedMediaResult = {
    images: [],
    videos: [],
    audios: [],
    files: [],
  };

  const seen = new Set<string>();

  $("meta[content]").each((_, element) => {
    const property = $(element).attr("property");
    const content = $(element).attr("content");

    if (!property || !content) {
      return;
    }

    const url = content.trim();

    if (!isUrl(url)) {
      return;
    }

    const lowerProperty = property.toLowerCase();

    // Chỉ quan tâm media-related OG tags
    if (
      !lowerProperty.startsWith("og:image") &&
      !lowerProperty.startsWith("og:video") &&
      !lowerProperty.startsWith("og:audio")
    ) {
      return;
    }

    const mimeType = getMimeType($, lowerProperty);
    const type = detectMediaType(lowerProperty, mimeType, url);

    if (type === "unknown") {
      return;
    }

    const normalizedUrl = url;

    if (seen.has(normalizedUrl)) {
      return;
    }

    seen.add(normalizedUrl);

    const media: ExtractedMedia = {
      url: normalizedUrl,
      type,
      ...(mimeType ? { mimeType } : {}),
      source: property,
      ...(getExtension(normalizedUrl) ? { extension: getExtension(normalizedUrl) } : {}),
    };

    switch (type) {
      case "image":
        result.images.push(media);
        break;

      case "video":
        result.videos.push(media);
        break;

      case "audio":
        result.audios.push(media);
        break;

      case "file":
        result.files.push(media);
        break;
    }
  });

  return result;
}

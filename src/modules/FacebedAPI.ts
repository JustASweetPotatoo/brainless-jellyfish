import fs from "fs";
import { pipeline } from "stream/promises";
import { configDotenv } from "dotenv";
import * as cheerio from "cheerio";

configDotenv();
import {
  Collection,
  Colors,
  EmbedBuilder,
  Events,
  Guild,
  Message,
  TextChannel,
  ThreadChannel,
  VoiceChannel,
  WebhookClient,
  WebhookMessageCreateOptions,
} from "discord.js";

import ClientModule from "./core/ClientModule";
import { On, Repository } from "./core/decorators";
import FacebookAttachmentSourceRepo from "../database/repository/FacebookUrlRepo";
import { extractFacebookShareUrl, getAttachmentType } from "../utils/functions";
import {
  DiscordImageSources,
  DiscordVideoSources,
  FacebookAttachmentSource,
} from "../database/model/FacebookAttactmentSource";

interface FacebookUrlCrawledData {
  reelId: string | undefined;
  videoLinks: string[];
  imageLinks: string[];
  title: string | undefined;
  description: string | undefined;
}

export default class FacebedAPI extends ClientModule<"facebed-api"> {
  @Repository()
  private readonly repo: FacebookAttachmentSourceRepo;
  private webhookClients: Collection<string, WebhookClient> = new Collection();

  private readonly ApiUrl = process.env.PYTHON_API || "http://localhost:9812";

  private founderEmbed: EmbedBuilder = new EmbedBuilder()
    .setDescription(`> *Sứa#2120 - Powered by **Potarozz***\n> *Facebed API by **pi.kt***`)
    .setColor(Colors.Blurple);

  private async getAttCachedSource(
    facebookSource: string,
  ): Promise<FacebookAttachmentSource | undefined> {
    let cache = await this.repo.get(facebookSource);

    return cache ? new FacebookAttachmentSource(cache) : undefined;
  }

  private wrapLinks = (text: string): string => {
    return text.replace(/\b((https?:\/\/|www\.)[^\s]+)/g, (url) => `<${url}>`);
  };

  private parseHtml(html: string): FacebookUrlCrawledData {
    const $ = cheerio.load(html);

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
      reelId: get("og:url").at(0),
      videoLinks: get("og:video:secure_url"),
      imageLinks: get("og:image"),
      title: get("og:title").at(0),
      description: get("og:description").at(0),
    };
  }

  private async downloadVideo(url: string, path = "video.mp4"): Promise<string | undefined> {
    const res = await fetch(url);

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

  async getWebhookClient(
    channel: TextChannel | VoiceChannel | ThreadChannel,
  ): Promise<WebhookClient> {
    const cacheId = `${channel.id}|${channel.guild.id}`;

    if (channel instanceof ThreadChannel) {
      return ((await channel.parent?.fetchWebhooks()) ?? new Collection()).find(
        (webhook) => webhook.owner?.id == this.client.user?.id,
      ) as unknown as WebhookClient;
    }

    let webhookClient = this.webhookClients.get(cacheId);

    if (!webhookClient) {
      const fetchedWebhook = (await channel.fetchWebhooks()).find(
        (webhook) => webhook.owner?.id == this.client.user?.id,
      );

      if (!fetchedWebhook) {
        webhookClient = (await channel.createWebhook({
          name: this.client.user?.displayName ?? "Sứa#2120",
        })) as unknown as WebhookClient;
      } else {
        webhookClient = fetchedWebhook as unknown as WebhookClient;
      }
    }

    return webhookClient;
  }

  @On(Events.MessageCreate)
  async onMessageCreate(message: Message<true>) {
    if (message.author.bot) return;

    // Get facebook URL
    const extractedUrl = extractFacebookShareUrl(message.content);
    if (!extractedUrl) return;

    // Get refMessage
    const refMessage = await message.channel.messages
      .fetch(message.reference?.messageId ?? "")
      .catch((error) => this.logger.error(error));

    // Get webhook client
    let webhookClient: WebhookClient | undefined = await this.getWebhookClient(
      message.channel as TextChannel | VoiceChannel | ThreadChannel,
    );

    if (!webhookClient) {
      this.logger.warn(`Can't get webhook client! ${message.channelId}|${message.guildId}`);
      return;
    }

    // Get cached attachments
    const cachedAtts = await this.getAttCachedSource(extractedUrl);
    const cachedVideos = cachedAtts?.discordVideoSources;
    if (cachedVideos && cachedVideos.length != 0) {
      if (webhookClient) {
        await webhookClient.send({
          content: this.wrapLinks(message.content) + `\n${cachedVideos.at(0)?.discordMediaSource}`,
          embeds: [
            this.founderEmbed.setFooter({ text: `UID: ${message.author.id}` }).setTimestamp(),
          ],
          username: message.author.displayName,
          avatarURL: message.author.avatarURL()!,
          threadId: message.channel instanceof ThreadChannel ? message.channelId : undefined,
        });
        await message.delete().catch((error) => undefined);
      }
      return;
    }

    // Crawling Data
    const apiLink = extractedUrl.replace("https://www.facebook.com", this.ApiUrl);
    const response = await fetch(apiLink).catch((error) => this.handleClientError(error));

    if (!response) {
      const warnEmbed = new EmbedBuilder()
        .setTitle("This post is private or unavailable !")
        .setDescription(`[See posts, photos and more on Facebook](<${extractedUrl}>)`)
        .setColor(Colors.Yellow);
      await message.reply({ embeds: [warnEmbed] });
      return;
    }

    const responseText = await response.text();
    const crawledData = this.parseHtml(responseText);

    // If has video source link
    if (crawledData.videoLinks.length != 0) {
      const path = await this.downloadVideo(crawledData.videoLinks[0], `${crawledData.reelId}.mp4`);

      // If can't download the video
      if (!path) {
        const embed = new EmbedBuilder()
          .setTitle("This post is private or unavailable !")
          .setDescription(`[See post or photos and more on Facebook](<${extractedUrl}>)`)
          .setColor(Colors.Yellow);
        await message.reply({ embeds: [embed, this.founderEmbed] });
        this.logger.error("Can't get the video with source: " + crawledData.videoLinks);
        return;
      }

      const videoStats = fs.statSync(path);

      if (videoStats.size >= 10 * 1024 * 1024) {
        const embed = new EmbedBuilder()
          .setTitle("This video in post is too large to direct conversion")
          .setURL(crawledData.videoLinks[0])
          .setColor(Colors.Green);
        await message.reply({ embeds: [embed, this.founderEmbed] });
        this.logger.warn("Too large video: " + crawledData.videoLinks);
        return;
      }

      const messagePayload: WebhookMessageCreateOptions = {
        content:
          `${this.wrapLinks(message.content)}` +
          (refMessage && refMessage.member
            ? `\n> -# ↪ [Reply to ↗ ${refMessage.member.displayName}](<${refMessage.url}>)`
            : ""),
        embeds: [this.founderEmbed.setFooter({ text: `UID: ${message.author.id}` }).setTimestamp()],
        username: message.author.displayName,
        avatarURL: message.author.avatarURL()!,
        threadId: message.channel instanceof ThreadChannel ? message.channelId : undefined,
        files: [path],
      };

      const apiMessage = await webhookClient.send(messagePayload);
      const att = apiMessage.attachments.at(0);

      const attachmentSource: DiscordVideoSources = {
        index: 0,
        discordMediaSource: att?.url ?? "",
        facebookSource: extractedUrl,
      };

      const cacheAtts: FacebookAttachmentSource = new FacebookAttachmentSource({
        facebookSource: extractedUrl,
        discordVideoSources: [attachmentSource],
        discordfileSources: [],
        discordImageSources: [],
      });

      await this.repo.create(cacheAtts);
      await message.delete().catch((error) => undefined);
    } else if (crawledData.imageLinks) {
      const postEmbedDescription = `\n> **[${crawledData.title}](${this.wrapLinks(
        extractedUrl,
      )})**\n> ${crawledData.description}`;

      const replyMessage = await webhookClient.send({
        content:
          this.wrapLinks(message.content) +
          postEmbedDescription +
          (refMessage && refMessage.member
            ? `s\n> -# ↪ [Reply to ↗ ${refMessage.member.displayName}](<${refMessage.url}>)`
            : ""),
        files: crawledData.imageLinks.slice(0, 9),
        embeds: [this.founderEmbed],
        username: message.author.displayName,
        avatarURL: message.author.avatarURL() ?? undefined,
        threadId: message.channel instanceof ThreadChannel ? message.channelId : undefined,
      });

      const attachments = replyMessage.attachments
        .filter((att) => getAttachmentType(att.contentType) == "image")
        .map((item) => item)
        .map((item, index): DiscordImageSources => {
          return { facebookSource: extractedUrl, discordMediaSource: item.url, index: index };
        });

      const cacheAtts: FacebookAttachmentSource = new FacebookAttachmentSource({
        facebookSource: extractedUrl,
        discordVideoSources: [],
        discordfileSources: [],
        discordImageSources: attachments,
      });

      await this.repo.create(cacheAtts);
      await message.delete().catch((error) => undefined);
    } else {
    }
  }
}

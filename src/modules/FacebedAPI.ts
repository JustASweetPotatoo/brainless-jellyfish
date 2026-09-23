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
  Message,
  TextChannel,
  ThreadChannel,
  VoiceChannel,
  WebhookClient,
  WebhookMessageCreateOptions,
} from "discord.js";

import DiscordModule from "./core/module/DiscordModule";
import { On } from "./core/decorators/decorators";
import { extractFacebookShareUrl } from "../utils/functions";

import { EventEmitter } from "stream";
import {
  ExtractedMedia,
  extractMedia,
  extractPostInf,
  extractFacebookReelId,
} from "../utils/facebookCrawlerHelper";
import { PremiumStatus } from "../database/model/GuildStatus";

enum FacebookPostType {
  POST,
  REEL,
}

interface FacebookUrlCrawledData {
  readonly postType: FacebookPostType;
  readonly reelId: string | undefined;
  readonly title: string | undefined;
  readonly description: string | undefined;
  videos: ExtractedMedia[];
  images: ExtractedMedia[];
  audios: ExtractedMedia[];
  files: ExtractedMedia[];
}

export default class FacebedAPI extends DiscordModule<"facebed-api"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  private webhookClients: Collection<string, WebhookClient> = new Collection();
  private guildCachedList: Collection<string, { enable: boolean }> = new Collection();

  private readonly ApiUrl = process.env.PYTHON_API || "http://localhost:9812";

  private founderEmbed: EmbedBuilder = new EmbedBuilder()
    .setDescription(`> *Sứa#2120 - Crawler API by **pi.kt***`)
    .setColor(Colors.Blurple);

  private readonly failedEmbed = (extractedUrl: string) => {
    return new EmbedBuilder()
      .setTitle("This post is private or unavailable !")
      .setDescription(`[See posts, photos and more on Facebook](<${extractedUrl}>)`)
      .setColor(Colors.Yellow);
  };

  private wrapLinks = (text: string): string => {
    return text.replace(/\b((https?:\/\/|www\.)[^\s]+)/g, (url) => `<${url}>`);
  };

  private parseHtml(html: string): FacebookUrlCrawledData {
    const $ = cheerio.load(html);

    const media = extractMedia($);
    const postInf = extractPostInf($);

    return {
      postType: postInf.reelId ? FacebookPostType.REEL : FacebookPostType.POST,
      ...media,
      ...postInf,
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

  private async getWebhookClient(
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

  private async getFacebookAttachmentSources(url: string) {
    const apiLink = url.replace("https://www.facebook.com", this.ApiUrl);
    const response = await fetch(apiLink).catch((error) => this.handleModuleError(error));

    if (!response) return undefined;

    const responseText = await response.text();
    return this.parseHtml(responseText);
  }

  private readonly emitter = new EventEmitter({ captureRejections: true });

  async enable(guildId: string) {
    let isActive = await this.client.moduleManager
      .get("guild-status-manager")
      .isActive(guildId, this.name);

    if (isActive) {
      return false;
    }

    this.emitter.on(guildId, this.processMessageOnGuild);
    await this.client.moduleManager.get("guild-status-manager").enableModule(guildId, this.name);
    return true;
  }

  async disable(guildId: string) {
    let isActive = await this.client.moduleManager
      .get("guild-status-manager")
      .isActive(guildId, this.name);

    if (isActive) {
      this.emitter.removeListener(guildId, this.processMessageOnGuild);
      await this.client.moduleManager.get("guild-status-manager").disableModule(guildId, this.name);
      return true;
    }

    return false;
  }

  private async processMessageOnGuild(message: Message<true>) {
    try {
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

      // Crawling Data
      const crawledData = await this.getFacebookAttachmentSources(extractedUrl);
      if (!crawledData) {
        await message.reply({ embeds: [this.failedEmbed(extractedUrl)] });
        return;
      }

      const description = `## [${crawledData.title}](${this.wrapLinks(extractedUrl)})\n${crawledData.description}\n> *Sứa#2120 Crawler api by **pi.kt***`;

      const embed = new EmbedBuilder()
        .setDescription(description)
        .setFooter({
          text: `UID: ${message.author.id}`,
        })
        .setTimestamp();

      const messagePayload: WebhookMessageCreateOptions = {
        content:
          `${this.wrapLinks(message.content)}` +
          (refMessage && refMessage.member
            ? `\n> -# ↪ Reply to ↗ <@${refMessage.member.id}> \n-# [Content: ${refMessage.content.split(" ").slice(0, 10)}](<${refMessage.url}>)`
            : ""),
        embeds: [embed],
        username: message.author.displayName,
        avatarURL: message.author.avatarURL()!,
        threadId: message.channel instanceof ThreadChannel ? message.channelId : undefined,
        allowedMentions: { users: [] },
      };

      // If has video source link
      if (crawledData.videos.length != 0) {
        const path = await this.downloadVideo(
          crawledData.videos[0].url,
          `${crawledData.reelId}.mp4`,
        );

        // If can't download the video
        if (!path) {
          await message.reply({ embeds: [this.failedEmbed(extractedUrl)] });
          this.logger.error("Can't get the video with source: " + crawledData.videos);
          return;
        }

        const videoStats = fs.statSync(path);

        if (videoStats.size >= 10 * 1024 * 1024) {
          await message.reply({ embeds: [embed.setURL(crawledData.videos[0].url)] });
          this.logger.warn("Too large video link: " + extractedUrl);
          return;
        }

        messagePayload.files = [path];
      } else if (crawledData.images) {
        messagePayload.files = crawledData.images.flatMap((image) => image.url).slice(0, 8);
      } else {
        const guildStatus = await this.client.moduleManager
          .get("guild-status-manager")
          .get(message.guildId);

        if ((guildStatus.premiumStatus = 0)) {
          return;
        }

        // messagePayload.files = crawledData;
      }

      await webhookClient.send(messagePayload);
      await message.delete().catch((error) => undefined);
    } catch (error) {
      this.handleModuleError(error);
    }
  }

  @On(Events.MessageCreate, true)
  async onMessageCreate(message: Message<true>) {
    const isListening = this.emitter.emit(message.guildId, message);
    if (!isListening) {
      const guildCache = this.guildCachedList.get(message.guild.id);
      if (guildCache) {
        return;
      }
      const guildProfile = await this.client.moduleManager
        .get("guild-status-manager")
        .get(message.guild.id);
      const isActive = !!guildProfile?.activeList.find((mname) => mname === this.name);
      if (isActive) {
        this.emitter.on(guildProfile.id, this.processMessageOnGuild.bind(this));
        this.emitter.emit(guildProfile.id, message);
      }
      this.guildCachedList.set(message.guildId, { enable: isActive });
    }
  }
}

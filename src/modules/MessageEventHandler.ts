import {
  Collection,
  Events,
  Message,
  MessageCreateOptions,
  ReadonlyCollection,
  TextChannel,
  VoiceChannel,
} from "discord.js";
import { BaseModule, BaseModuleOptions } from "./struct/ModuleConstructor";
import SuwaBot from "../bot/SuwaBot";

interface MessageEvent_MessageSendTask {
  guildId: string;
  channelId: string;
  messagePayload: MessageCreateOptions;
  scheduledAt: string;
  executed: boolean;
}

export interface MessageEventHandlerModuleOption extends BaseModuleOptions {}

class MessageEventHandler extends BaseModule<MessageEventHandlerModuleOption> {
  static readonly name: string = "message-event-handler";

  eventList: Events[] = [
    Events.MessageCreate,
    Events.MessageDelete,
    Events.MessageUpdate,
    Events.MessageBulkDelete,
    Events.MessageReactionAdd,
    Events.MessageReactionRemove,
  ];

  protected async onMessageCreate(message: Message<boolean>): Promise<unknown> {
    return;
  }

  protected async onMessageUpdate(oldMessage: Message<boolean>, newMessage: Message<boolean>): Promise<unknown> {
    return;
  }

  protected async onMessageDelete(message: Message<boolean>): Promise<unknown> {
    return;
  }
  protected async onMessageBulkDelete(messages: ReadonlyCollection<string, Message<boolean>>): Promise<unknown> {
    return;
  }

  public createTask() {}
}

export default MessageEventHandler;

class MessageEventGuildHandler {
  readonly guildId: string;
  readonly parent: MessageEventHandler;

  constructor(guildId: string, parent: MessageEventHandler) {
    this.guildId = guildId;
    this.parent = parent;
  }

  public createTask() {}
}

class MessageSendingTaskManager {
  private readonly client: SuwaBot;
  private interval?: NodeJS.Timeout;

  private tasks: Collection<string, Array<MessageEvent_MessageSendTask>> = new Collection();

  constructor(client: SuwaBot) {
    this.client = client;
  }

  // Start checking all task per 5 seconds
  init() {
    setInterval(() => {
      let now = Date.now();

      let bucket = this.tasks.filter((value, timestamp) => {
        let numberTimestamp = Number(timestamp);
        return now <= Number(timestamp) && Number(timestamp) <= now + 10000;
      });

      bucket.forEach((data, timestamp) => {
        setInterval(() => {
          data.forEach((task, index) => {
            this.executeTask(task);
          });
        }, Number(timestamp) - now);
        this.tasks.delete(timestamp);
      });
    }, 10000);
  }

  stopInterval() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  async executeTask(task: MessageEvent_MessageSendTask) {
    const guild = this.client.guilds.cache.get(task.guildId);

    if (!guild) {
      console.log(task);
      return;
    }

    const channel = guild.channels.cache.get(task.channelId);

    if (!channel) {
      console.log(task);
      return;
    }

    if (channel.isTextBased()) {
      await channel.send(task.messagePayload);
    }
  }

  addTask(task: MessageEvent_MessageSendTask) {
    if (task.scheduledAt.startsWith("immediately")) {
      this.executeTask(task);
      return;
    }

    let bucket = this.tasks.get(task.scheduledAt);
    if (!bucket) {
      bucket = [task];
      this.tasks.set(task.scheduledAt, bucket);
    }

    bucket.push(task);
    this.tasks.set(task.scheduledAt, bucket);
  }
}

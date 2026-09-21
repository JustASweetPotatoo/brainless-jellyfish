import { Collection, User } from "discord.js";

export interface UserTracker {
  readonly id: string;
  limitTimestamp: number;
  counter: number;
}

export interface LimiterOptions {
  /**
   * @description Time by miliseconds
   */
  timeout: number;
  /**
   * @description The limit specifies the number of times a user can use a feature; exceeding this limit will result in being blocked.
   */
  limit: number;
  /**
   * @description The time period during which the cache will be cleaned, time by miliseconds, default is 1 hour
   */
  flushing_TTL?: number;
}

export default class Limiter {
  private timeout: number;
  private limit: number;
  private flushingTTL?: number;
  private userCollection: Collection<string, UserTracker> = new Collection();

  private now: number = new Date().getTime();

  constructor(options: LimiterOptions) {
    this.timeout = options.timeout;
    this.limit = options.limit;
    this.flushingTTL = options.flushing_TTL;

    setInterval(
      () => {
        this.userCollection.clear();
      },
      this.flushingTTL ?? 1_000 * 60 * 60,
    );

    setInterval(() => {
      this.now = new Date().getTime();
    }, 1_000);
  }

  track(user: string | User): boolean {
    const userId = user instanceof User ? user.id : user;

    let tracker = this.userCollection.get(userId);

    if (!tracker) {
      tracker = {
        id: userId,
        counter: 0,
        limitTimestamp: this.now,
      };
    }

    // Reset window
    if (this.now - tracker.limitTimestamp > this.timeout) {
      tracker.counter = 0;
      tracker.limitTimestamp = this.now;
    }

    // Đã vượt giới hạn
    if (tracker.counter >= this.limit) {
      this.userCollection.set(userId, tracker);
      return false;
    }

    // Ghi nhận một lần thực thi
    tracker.counter++;

    this.userCollection.set(userId, tracker);

    return true;
  }

  setFlushTTL(value: number) {
    this.flushingTTL = value;
  }

  setTimeout(value: number) {
    this.timeout = value;
  }

  setLimit(value: number) {
    this.limit = value;
  }

  getFlushTTL() {
    return this.flushingTTL;
  }

  getTimeout() {
    return this.timeout;
  }

  getLimit() {
    return this.limit;
  }

  getDiscordTimestamp(): number {
    return Math.floor(this.now / 1000);
  }
}

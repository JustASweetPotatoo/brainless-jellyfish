import type { UserProfile } from "./User";

export interface Emoji {
  readonly id: string;
  readonly source: string;
}

export interface EmojiReaction {
  readonly emoji: Emoji;
  readonly counter: number;
  users?: UserProfile[];
}

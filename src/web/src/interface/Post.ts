import type { UserCommonData } from "../service/userService";
import type { EmojiReaction } from "./Emoji";
import type { PostImage } from "./Media";
import type { UserProfile } from "./User";

export interface PostComment {
  readonly id: string;
  readonly content: string;
  readonly postId: string;
  readonly userProfile: UserProfile;
  readonly images: CommentImage[];
  upvote: number | undefined;
  downvote: number | undefined;
}

export interface CommentImage {
  readonly id: string;
  readonly commentId: string;
  readonly userProfile: string;
  readonly source: string;
}

export interface Post {
  readonly id: string;
  readonly userCommonData: UserCommonData;
  readonly description: string;
  readonly images?: PostImage[];
  readonly createTimestamp?: Date;
  upvote: number;
  downvote: number;
  emojiReactions: EmojiReaction[];
  comments: PostComment[];
  shares: [];
}

import { mockPosts } from "../assets/hooks/hookData";
import { base_url, auth_token } from "../config/url";
import { SERVICE_RUN_STATE } from "../dev/access";
import type { Post } from "../interface/Post";
import type { UserCommonData } from "./userService";

interface PostReqObject {
  newFeedList: {
    readonly id: string;
    readonly userCommonData: UserCommonData;
    readonly description: string;
    readonly createTimestamp: Date;
    upvote: number;
    downvote: number;
  }[];
  createTimestamp: Date;
}

const getNewFeed = async (userid: string): Promise<Post[]> => {
  // ============

  if (SERVICE_RUN_STATE === "dev-only") {
    return mockPosts;
  }

  const requestUrl = `${base_url}/api/post/new-feed?userId=${userid}`;

  const requestInit: RequestInit = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth_token,
    },
  };

  const response = await fetch(requestUrl, requestInit);

  if (!response.ok) {
    throw response.status;
  }

  const data = (await response.json()) as PostReqObject;

  if (!data.newFeedList) {
    return [];
  }

  return data.newFeedList.map((dataItem) => {
    return {
      id: dataItem.id,
      userCommonData: dataItem.userCommonData,
      description: dataItem.description,
      comments: [],
      upvote: 0,
      downvote: 0,
      emojiReactions: [],
      shares: [],
      createTimestamp: dataItem.createTimestamp,
    };
  });
};

export { getNewFeed };

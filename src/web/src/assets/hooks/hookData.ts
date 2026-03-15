import userHookImage from "../../assets/hooks/userImage.png";
import postImage from "../../assets/hooks/postImage.png";
import postImage2 from "../../assets/hooks/postImage2.jpg";
import type { UserProfile } from "../../interface/User";
import type { Post } from "../../interface/Post";

export interface UserData {
  name: string;
  username: string;
  image: string;
}

const userHookData: UserProfile = {
  name: "Quang Huy",
  username: "@quanghuy",
  avatar: userHookImage,
  id: "82183048882",
};

const userHookData2: UserProfile = {
  name: "Quang Huy",
  username: "@quanghuy",
  avatar: userHookImage,
  id: "82183048883",
};

const userHookData3: UserProfile = {
  name: "Quang Huy",
  username: "@quanghuy",
  avatar: userHookImage,
  id: "82183048884",
};

const userHookData4: UserProfile = {
  name: "Quang Huy",
  username: "@quanghuy",
  avatar: userHookImage,
  id: "82183048885",
};

const mockPosts: Post[] = [
  {
    id: "6",
    userCommonData: { id: "81287818301", firstName: "Quang", lastName: "Huy" },
    description: "This is descrption !",
    upvote: 12,
    downvote: 1,
    images: [
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "6",
      },
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "6",
      },
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "6",
      },
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "6",
      },
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "6",
      },
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "6",
      },
    ],

    emojiReactions: [
      {
        emoji: {
          id: "0",
          source: "😀",
        },
        users: [userHookData2, userHookData],
        counter: 12290,
      },
      {
        emoji: {
          id: "0",
          source: "😍",
        },
        users: [userHookData3, userHookData4],
        counter: 0,
      },
      {
        emoji: {
          id: "0",
          source: "😂",
        },
        users: [userHookData4],
        counter: 0,
      },

      {
        emoji: {
          id: "0",
          source: "😭",
        },
        users: [userHookData3, userHookData4, userHookData2, userHookData],
        counter: 0,
      },
    ],
    comments: [
      {
        id: "",
        postId: "",
        userProfile: userHookData,
        images: [],
        upvote: undefined,
        downvote: undefined,
        content: "This is Comment",
      },
      {
        id: "",
        postId: "",
        userProfile: userHookData,
        images: [],
        upvote: undefined,
        downvote: undefined,
        content: "This is Comment",
      },
      {
        id: "",
        postId: "",
        userProfile: userHookData,
        images: [],
        upvote: undefined,
        downvote: undefined,
        content: "This is Comment",
      },
      {
        id: "",
        postId: "",
        userProfile: userHookData,
        images: [],
        upvote: undefined,
        downvote: undefined,
        content: "This is Comment",
      },
      {
        id: "",
        postId: "",
        userProfile: userHookData,
        images: [],
        upvote: undefined,
        downvote: undefined,
        content: "This is Comment",
      },
      {
        id: "",
        postId: "",
        userProfile: userHookData,
        images: [],
        upvote: undefined,
        downvote: undefined,
        content: "This is Comment",
      },
      {
        id: "",
        postId: "",
        userProfile: userHookData,
        images: [],
        upvote: undefined,
        downvote: undefined,
        content: "This is Comment",
      },
      {
        id: "",
        postId: "",
        userProfile: userHookData,
        images: [],
        upvote: undefined,
        downvote: undefined,
        content: "This is Comment",
      },
    ],
    shares: [],
  },
  {
    id: "1",
    description: "This is descrption !",
    upvote: 0,
    userCommonData: { id: "81287818301", firstName: "Quang", lastName: "Huy" },
    images: [{ id: "1128731", src: postImage, userId: "82183048882", postId: "1" }],
    downvote: 0,
    emojiReactions: [],
    comments: [],
    shares: [],
  },
  {
    id: "2",
    description: "This is descrption !",
    upvote: 0,
    userCommonData: { id: "81287818301", firstName: "Quang", lastName: "Huy" },
    images: [
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "2",
      },
      {
        id: "1128732",
        src: postImage2,
        userId: "82183048882",
        postId: "2",
      },
    ],
    downvote: 0,
    emojiReactions: [],
    comments: [],
    shares: [],
  },
  {
    id: "3",
    description: "This is descrption !",
    upvote: 0,
    userCommonData: { id: "81287818301", firstName: "Quang", lastName: "Huy" },
    images: [
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "3",
      },
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "3",
      },
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "3",
      },
    ],
    downvote: 0,
    emojiReactions: [],
    comments: [],
    shares: [],
  },
  {
    id: "4",
    description: "This is descrption !",
    upvote: 0,
    userCommonData: { id: "81287818301", firstName: "Quang", lastName: "Huy" },
    images: [
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "4",
      },
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "4",
      },
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "4",
      },
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "4",
      },
    ],
    downvote: 0,
    emojiReactions: [],
    comments: [],
    shares: [],
  },
  {
    id: "5",
    description: "This is descrption !",
    upvote: 0,
    userCommonData: { id: "81287818301", firstName: "Quang", lastName: "Huy" },
    images: [
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "5",
      },
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "5",
      },
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "5",
      },
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "5",
      },
      {
        id: "1128731",
        src: postImage,
        userId: "82183048882",
        postId: "5",
      },
    ],
    downvote: 0,
    emojiReactions: [],
    comments: [],
    shares: [],
  },
  {
    id: "7",
    description: "This is descrption !",
    upvote: 0,
    userCommonData: { id: "81287818301", firstName: "Quang", lastName: "Huy" },
    downvote: 0,
    emojiReactions: [],
    comments: [],
    shares: [],
  },
  {
    id: "8",
    description: "This is descrption !",
    upvote: 0,
    userCommonData: { id: "81287818301", firstName: "Quang", lastName: "Huy" },
    downvote: 0,
    emojiReactions: [],
    comments: [],
    shares: [],
  },
  {
    id: "9",
    description: "This is descrption !",
    upvote: 0,
    userCommonData: { id: "81287818301", firstName: "Quang", lastName: "Huy" },
    downvote: 0,
    emojiReactions: [],
    comments: [],
    shares: [],
  },
  {
    id: "10",
    description: "This is descrption !",
    upvote: 0,
    userCommonData: { id: "81287818301", firstName: "Quang", lastName: "Huy" },
    downvote: 0,
    emojiReactions: [],
    comments: [],
    shares: [],
  },
];

export { userHookData, mockPosts };

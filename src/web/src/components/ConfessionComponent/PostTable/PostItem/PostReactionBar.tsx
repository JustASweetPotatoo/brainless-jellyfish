import { faChevronDown, faPlus, faChevronUp, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Post } from "../../../../interface/Post";
import type React from "react";
import { useDispatch } from "react-redux";
import { setDisplayPost } from "../../../../redux/reducer/slices/PostDisplayingModalSlice";
import { useTranslation } from "react-i18next";
import EmojiPostReactionBarItem from "../../Emoji/EmojiPostReactionBarItem";
import EmojiSelectorButton from "../../Emoji/EmojiSelectorButton";
import { calcNumberRender } from "../../../../utils/function";

interface PostReactionBarProps {
  handleClickFunction?: {
    handleUpvoteButtonClick?: (e: React.MouseEvent) => void;
    handleDownvoteButtonClick?: (e: React.MouseEvent) => void;
    handleShareButtonClick?: (e: React.MouseEvent) => void;
  };
  post: Post;
}

const PostReactionBar: React.FC<PostReactionBarProps> = ({ post, handleClickFunction }) => {
  const dispatch = useDispatch();

  const handlePostClickAction = (_e: React.MouseEvent) => {
    dispatch(setDisplayPost(post));
  };

  const handleShareButtonClick = () => {};
  const handleEmojiClickButton = () => {};

  const { t } = useTranslation();

  const emojiReactionList = post.emojiReactions.slice().sort((a, b) => {
    return b.counter - a.counter;
  });

  return (
    <div className="flex flex-row h-10 mt-5 w-full justify-between dark:bg-[#383838] rounded-2xl">
      <div className="h-full flex flex-row space-x-2">
        <button className="transition-colors cursor-pointer duration-200 hover:bg-gray-300 dark:hover:bg-[#838383] px-3 rounded-2xl">
          <FontAwesomeIcon icon={faChevronUp} className="text-xl" /> {calcNumberRender(post.upvote)}
        </button>
        <button className="transition-colors cursor-pointer duration-200 hover:bg-gray-300 dark:hover:bg-[#838383] px-3 rounded-2xl">
          <FontAwesomeIcon icon={faChevronDown} className="text-xl" /> {calcNumberRender(post.downvote)}
        </button>

        {emojiReactionList.map((reactionData, index) => index <= 2 && reactionData.counter != 0 && <EmojiPostReactionBarItem reactionData={reactionData} />)}

        <EmojiSelectorButton />

        <button className="transition-colors cursor-pointer duration-200 hover:bg-gray-300 dark:hover:bg-[#838383] px-3 rounded-2xl">
          <FontAwesomeIcon icon={faChevronDown} className="text-xl" /> {}
        </button>
      </div>

      <div className="h-full flex flex-row space-x-4 px-4">
        <div className="rounded-2xl hover:underline cursor-pointer transition-all duration-200" onClick={handlePostClickAction}>
          <div className="h-full flex items-center">
            {post.comments.length} {t("confession.post.reactionBar.comment")}
          </div>
          <div className="border-none group-hover:border-t"></div>
        </div>
        <div className="rounded-2xl hover:underline cursor-pointer transition-all duration-200" onClick={handleShareButtonClick}>
          <div className="h-full flex items-center">
            {post.shares.length ?? 0} {t("confession.post.reactionBar.share")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostReactionBar;

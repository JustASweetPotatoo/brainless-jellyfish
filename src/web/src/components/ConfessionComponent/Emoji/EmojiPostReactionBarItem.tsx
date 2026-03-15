import type React from "react";
import type { EmojiReaction } from "../../../interface/Emoji";
import { calcNumberRender } from "../../../utils/function";

interface Props {
  reactionData: EmojiReaction;
}

const EmojiPostReactionBarItem: React.FC<Props> = ({ reactionData }) => {
  return (
    <button className="transition-colors cursor-pointer duration-200 hover:bg-gray-300 dark:hover:bg-[#838383] px-2 rounded-2xl">
      {reactionData.emoji.source} {calcNumberRender(reactionData.counter)}
    </button>
  );
};

export default EmojiPostReactionBarItem;

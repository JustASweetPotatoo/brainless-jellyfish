import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faComment, faShare, faBookmark, faImage } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type React from "react";
import { useTranslation } from "react-i18next";

interface PostActionBarProps {
  handleClickFunction?: {
    handleImageButtonClick?: (e: React.MouseEvent) => void;
    handleCommentButtonClick?: (e: React.MouseEvent) => void;
    handleShareButtonClick?: (e: React.MouseEvent) => void;
    handleSaveButtonClick?: (e: React.MouseEvent) => void;
  };
  disabledItems: Array<"comment" | "share" | "save" | "addImage">;
}

interface PostActionBarButton {
  readonly id: string;
  readonly callback?: (e: React.MouseEvent) => void;
  icon?: IconProp;
}

const PostActionBar: React.FC<PostActionBarProps> = ({ disabledItems, handleClickFunction }) => {
  const { t } = useTranslation();

  const items: PostActionBarButton[] = [
    {
      id: "addImage",
      icon: faImage,
      callback: handleClickFunction?.handleImageButtonClick,
    },
    {
      id: "comment",
      icon: faComment,
      callback: handleClickFunction?.handleCommentButtonClick,
    },
    {
      id: "share",
      icon: faShare,
      callback: handleClickFunction?.handleShareButtonClick,
    },
    {
      id: "save",
      icon: faBookmark,
      callback: handleClickFunction?.handleSaveButtonClick,
    },
  ];

  const filteredItems = items.filter((item) => !disabledItems.includes(item.id as "comment" | "share" | "save" | "addImage"));

  return (
    <div className="flex flex-row h-10 w-full justify-between dark:bg-[#383838] rounded-2xl">
      {filteredItems.map((itemData) => (
        <div className="w-full h-full flex justify-center">
          <button className="w-full transition-colors cursor-pointer duration-200 hover:bg-gray-300 dark:hover:bg-[#838383] px-4 rounded-2xl" onClick={itemData.callback}>
            {itemData.icon && <FontAwesomeIcon icon={itemData.icon} className="text-xl" />} {t(`confession.post.actionBar.${itemData.id}`)}
          </button>
        </div>
      ))}
    </div>
  );
};

export default PostActionBar;

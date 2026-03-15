import type React from "react";
import UserProfileShortCut from "../../UserProfileShortCut";
import PostImageRender from "./PostItem/PostImageRender";
// import PostReactionBar from "./PostItem/PostReactionBar";
// import PostActionBar from "./PostItem/PostActionBar";
import { formatFriendlyTimestamp } from "../../../utils/function";

const PostItemSkelecton: React.FC = () => {
  return (
    <div key="zero" className="p-4 border border-gray-300 dark:border-[#383838] rounded-lg bg-white dark:bg-[#252525]">
      <UserProfileShortCut userProfile={undefined} data={formatFriendlyTimestamp(new Date().getTime())} className="flex items-center gap-4 w-full mb-5" />

      <div className="mt-5 h-6 rounded-xl dark:bg-[#5c5c5c] w-1/3 animate-pulse"></div>
      <div className="mt-2 h-6 rounded-xl dark:bg-[#5c5c5c] w-2/3 animate-pulse"></div>
      <div className="mt-2 h-6 rounded-xl dark:bg-[#5c5c5c] w-1/5 animate-pulse"></div>

      {<PostImageRender post={undefined} images={[]}></PostImageRender>}
      {/*
      {!disableReactionBar && <PostReactionBar post={post} />}
      <div className="w-full border-1 my-2 border-[#4f4f4f]"></div>
      {!disableActionBar && (
        <PostActionBar
          disabledItems={disableActionBarItems}
          handleClickFunction={{
            handleCommentButtonClick: (e) => handlePostClickAction(e),
            handleSaveButtonClick: () => testFunction(),
            handleShareButtonClick: () => testFunction(),
            handleImageButtonClick: () => testFunction(),
          }}
        />
      )} */}
    </div>
  );
};

export default PostItemSkelecton;

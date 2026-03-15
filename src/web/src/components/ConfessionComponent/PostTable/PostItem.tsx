import type React from "react";
import UserProfileShortCut from "../../UserProfileShortCut";
import PostImageRender from "./PostItem/PostImageRender";
import type { Post } from "../../../interface/Post";
import { useDispatch } from "react-redux";
import { setDisplayPost } from "../../../redux/reducer/slices/PostDisplayingModalSlice";
import PostReactionBar from "./PostItem/PostReactionBar";
import PostActionBar from "./PostItem/PostActionBar";
import { formatFriendlyTimestamp } from "../../../utils/function";
import { useEffect, useState } from "react";
import { type UserCommonData } from "../../../service/userService";
import PostCommentRender from "./PostItem/PostCommentRender";

interface PostItemProps {
  post: Post;
  disableReactionBar?: boolean;
  disableActionBar?: boolean;
  renderCommentSection?: boolean;
  disable: Array<"comment" | "share" | "save" | "addImage">;
}

const PostItem: React.FC<PostItemProps> = ({ post, disable: disableActionBarItems, disableActionBar, disableReactionBar, renderCommentSection }) => {
  const dispatch = useDispatch();

  const handlePostClickAction = (_e: React.MouseEvent) => {
    dispatch(setDisplayPost(post));
  };

  const [userCommondData, setUserCommondData] = useState<UserCommonData>();

  const testFunction = () => {};

  useEffect(() => {
    setUserCommondData(post.userCommonData as UserCommonData);
  }, []);

  return (
    <>
      <div key={post.id} className="p-4 border border-gray-300 dark:border-[#383838] rounded-lg bg-white dark:bg-[#252525]">
        <UserProfileShortCut userProfile={userCommondData} data={formatFriendlyTimestamp(post.createTimestamp)} className="flex items-center gap-4 w-full mb-5" />
        <div className="mt-5" onClick={handlePostClickAction}>
          {post.description}
        </div>
        {post.images && <PostImageRender post={post} images={post.images}></PostImageRender>}

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
        )}
      </div>

      {renderCommentSection ? <PostCommentRender post={post} /> : <></>}
    </>
  );
};

export default PostItem;

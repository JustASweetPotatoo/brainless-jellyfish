import { useNavigate, useParams } from "react-router-dom";
import layoutCrafter from "./layouts/common/LayoutCrafter";
import { mockPosts } from "../assets/hooks/hookData";
import PostItem from "../components/ConfessionComponent/PostTable/PostItem";
import { ConfessionPageRouteConfig } from "../routes/config";
import type { Layout } from "./layouts/common/interface";
import { useEffect, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import type { Post } from "../interface/Post";
import { ConfessionLayout } from "./layouts/ls/ConfessionLayout";
import UserProfileShortCut from "../components/UserProfileShortCut";
import PostActionBar from "../components/ConfessionComponent/PostTable/PostItem/PostActionBar";
import PostReactionBar from "../components/ConfessionComponent/PostTable/PostItem/PostReactionBar";
import PostImageRender from "../components/ConfessionComponent/PostTable/PostItem/PostImageRender";
import PostCommentRender from "../components/ConfessionComponent/PostTable/PostItem/PostCommentRender";
import { formatFriendlyTimestamp } from "../utils/function";

const debugStateDummy = mockPosts[0];

const PostPage = () => {
  const navigate = useNavigate();

  const params = useParams<{ confessionId: string }>();
  const [post, setPost] = useState<Post | undefined>(undefined);
  const [postId, setPostid] = useState<string>(params.confessionId ?? "");

  const isPrivatePost = false;

  // debugger;

  let contentWrapper;

  const { t } = useTranslation();

  useEffect(() => {
    setPost(mockPosts.find((p) => p.id === params.confessionId));
    setPostid(params.confessionId ?? "");
  }, []);

  let content = <></>;

  if (!post) {
    content = <span>{t("confession.post.notification.invalidOrDeletedPost")}</span>;
  } else if (isPrivatePost) {
    content = <span>{t("confession.post.notification.privatePost")}</span>;
  } else {
    content = <PostItem disable={["addImage", "comment"]} post={post} renderCommentSection={true} />;
  }

  let ptx = <></>;

  const testFunction = () => {};

  if (post) {
    ptx = (
      <>
        <div key={post.id} className="p-4 border border-gray-300 max-h-screen  dark:border-[#383838] rounded-lg bg-white dark:bg-[#252525]">
          <UserProfileShortCut userProfile={post.userCommonData} data={formatFriendlyTimestamp(post.createTimestamp)} className="flex items-center gap-4 w-full mb-5" />
          <div className="mt-5" onClick={testFunction}>
            {post.description}
          </div>
          {post.images && <PostImageRender post={post} images={post.images}></PostImageRender>}

          {!false && <PostReactionBar post={post} />}

          <div className="w-full border-1 my-2 border-[#4f4f4f]"></div>

          {!false && (
            <PostActionBar
              disabledItems={[]}
              handleClickFunction={{
                handleCommentButtonClick: () => testFunction(),
                handleSaveButtonClick: () => testFunction(),
                handleShareButtonClick: () => testFunction(),
                handleImageButtonClick: () => testFunction(),
              }}
            />
          )}
        </div>

        {true ? <PostCommentRender post={post} /> : <></>}
      </>
    );
  }

  contentWrapper = (
    <div className="pt-20 w-full min-h-screen flex justify-center text-black dark:text-white bg-white dark:bg-[#252525]">
      <div className="container justify-center">{ptx}</div>
    </div>
  );

  const defaultL = ConfessionLayout;

  return layoutCrafter.loadLayout(contentWrapper, defaultL);
};

export default PostPage;

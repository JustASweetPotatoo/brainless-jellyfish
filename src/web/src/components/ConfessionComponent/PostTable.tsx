import { userHookData } from "../../assets/hooks/hookData";
import PostItem from "./PostTable/PostItem";
import PostTableHeader from "./PostTable/Header";
import type React from "react";
import { useEffect, useState } from "react";
import type { Post } from "../../interface/Post";
import { getNewFeed } from "../../service/postService";
import PostItemSkelecton from "./PostTable/PostItemSkelectorn";
import PostItemNoInternet from "./PostTable/PostItem/PostItemNoInternet";
import { checkInternetConnection } from "../../utils/function";

const PostTable: React.FC = () => {
  const userData = userHookData;

  // Init the first item is undefined. If list not change, it mean the feed is not loaded
  const [postList, setPostList] = useState<Array<Post>>([]);
  const [error, setError] = useState<Error | undefined>();

  const [isLoadingNewFeed, setIsLoadingNewFeed] = useState(true);
  const [noInternet, setNoInternet] = useState(false);

  // useEffect(() => {
  //   checkInternetConnection().then((status) => setNoInternet(!status));
  // }, [postList]);

  useEffect(() => {
    getNewFeed("04f5ac10-a346-43bc-ad93-00c57f8a72b3")
      .then((data) => {
        setPostList(data);
        setIsLoadingNewFeed(false);
      })
      .catch((error) => {
        setError(error);
        setPostList([]);
        setIsLoadingNewFeed(false);
      });
  }, []);

  const renderList = () => {
    if (noInternet) {
      return <PostItemNoInternet />;
    } else {
      return postList.map((postItem) => <PostItem post={postItem} disable={["addImage"]} />);
    }
  };

  return (
    <div className="w-full min-w-3xl text-black dark:text-white px-4">
      {/* Head content */}
      <PostTableHeader userProfile={userData} />

      {/* Post list */}
      <div className="space-y-4 pb-5">{isLoadingNewFeed ? <PostItemSkelecton /> : renderList()}</div>
    </div>
  );
};

export default PostTable;

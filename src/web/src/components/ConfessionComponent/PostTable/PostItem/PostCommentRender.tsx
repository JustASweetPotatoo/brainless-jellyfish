import type React from "react";
import type { Post } from "../../../../interface/Post";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faComment, faFaceSmile, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

export interface PostCommentRenderProps {
  post: Post;
}

const PostCommentRender: React.FC<PostCommentRenderProps> = (props) => {
  return props.post.comments.length <= 0 ? (
    <div className="p-4 mt-2 pb-5 border border-gray-300 dark:border-none rounded-lg bg-white dark:bg-[#252525]">
      <div className="">
        <h1 className="flex justify-center text-2xl">Chưa có bình luận nào cả !</h1>
        <h3 className="flex justify-center text-xl">Hãy là người đầu tiên bình luận cho bài viết này.</h3>
      </div>
    </div>
  ) : (
    <div className="p-4 mt-2 border border-gray-300 dark:border-none rounded-lg bg-white dark:bg-[#252525]">
      <div className="w-full">
        {props.post.comments.map((comment, index) => (
          <div key={comment.id ?? index} className="flex items-start gap-4 w-full mb-5">
            <Link to={`/${comment.userProfile.username}`}>
              <img src={comment.userProfile.avatar} alt="User" className={`rounded-full object-cover w-10 h-10`} />
            </Link>
            <div className="flex-1">
              <Link to={`/${comment.userProfile.username}`} className="hover:underline">
                <h1 className="font-bold text-base">{comment.userProfile.name}</h1>
              </Link>

              <span className="font-light text-lg dark:bg-[#383838] bg-[#e5e5e5] rounded-xl px-3 py-2 block mt-2">{comment.content}</span>

              <div className="flex flex-row h-10 mt-1 w-full rounded-2xl">
                <button className="transition-colors cursor-pointer duration-200 hover:bg-gray-300 dark:hover:bg-[#838383] px-4 rounded-2xl">
                  <FontAwesomeIcon icon={faChevronUp} className="text-xl" /> {comment.upvote ?? 0}
                </button>
                <button className="transition-colors cursor-pointer duration-200 hover:bg-gray-300 dark:hover:bg-[#838383] px-4 rounded-2xl">
                  <FontAwesomeIcon icon={faChevronDown} className="text-xl" /> {comment.downvote ?? 0}
                </button>
                <button className="transition-colors cursor-pointer duration-200 hover:bg-gray-300 dark:hover:bg-[#838383] px-4 rounded-2xl">
                  <FontAwesomeIcon icon={faComment} className="text-xl" /> Trả lời
                </button>
                <button className="transition-colors cursor-pointer duration-200 hover:bg-gray-300 dark:hover:bg-[#838383] px-4 rounded-2xl space-x-2">
                  <FontAwesomeIcon icon={faFaceSmile} className="text-xl" />
                  <FontAwesomeIcon icon={faPlus} className="text-xl" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostCommentRender;

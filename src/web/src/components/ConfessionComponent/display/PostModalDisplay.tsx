import React, { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { type Post } from "../../../interface/Post";
import { removeDisplayPost } from "../../../redux/reducer/slices/PostDisplayingModalSlice";
import { useDispatch } from "react-redux";
import PostItem from "../PostTable/PostItem";
import PostCommentRender from "../PostTable/PostItem/PostCommentRender";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import PostCommentInput from "../PostTable/PostItem/PostCommentInput";
import useEscape from "../../../hooks/useEscape";

interface PostModalDisplayProps {
  post: Post;
}

const PostModalDisplay: React.FC<PostModalDisplayProps> = ({ post }) => {
  const dispatch = useDispatch();

  const ref = useRef<HTMLDivElement>(null);
  useEscape(() => handlePostCloseAction());
  useOutsideClick(ref, () => handlePostCloseAction());

  const handlePostCloseAction = () => {
    dispatch(removeDisplayPost());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000a2]">
      <div className="bg-[#EBEBEF] dark:bg-[#1a1a1a] text-black dark:text-white w-full max-w-[70rem] max-h-[90vh] overflow-auto rounded-xl shadow-lg" ref={ref}>
        {/* Close Button */}
        <button onClick={handlePostCloseAction} className="absolute top-3 right-3 text-2xl text-gray-600 dark:text-gray-300 hover:text-red-500 z-50 cursor-pointer">
          <FontAwesomeIcon icon={faXmark} />
        </button>

        {/* Content */}
        <PostItem post={post} disable={["comment"]} />

        {/* Comment section */}
        <PostCommentRender post={post} />

        {/* {Inut section} */}
        <PostCommentInput post={post} />
      </div>
    </div>
  );
};

export default PostModalDisplay;

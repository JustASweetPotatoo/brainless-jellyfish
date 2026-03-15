import React, { useRef } from "react";
import type { Post } from "../../../../interface/Post";
import PostActionBar from "./PostActionBar";
import { useDispatch, useSelector } from "react-redux";
import { addImage } from "../../../../redux/reducer/slices/PostDisplayingModalSlice";
import type { RootState } from "../../../../redux/store";
import PostItemSelectedFileRender from "./PostItemSelectedFileRender";

interface PostCommentInputProps {
  post: Post;
}

const PostCommentInput: React.FC<PostCommentInputProps> = ({ post }) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addedFiles = useSelector((state: RootState) => state.postDisplayingModalSlice.files);
  const dispatch = useDispatch();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(addImage(e.target.files));
    console.log(addedFiles.length);
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="sticky bottom-0 z-10 p-4 mt-2 rounded-lg bg-white dark:bg-[#252525] shadow-md">
      <div className="flex space-x-5">
        <img src={""} alt="User" className="rounded-full object-cover w-10 h-10" />

        <div className="w-full h-fit rounded-2xl bg-[#EBEBEF] dark:bg-[#383838] p-2">
          <textarea
            ref={inputRef}
            id="post-modal-comment-input"
            placeholder="Viết bình luận"
            className="w-full min-h-10 max-h-[50rem] resize-y text-xl focus:outline-1 focus:outline-[#4e4e4e] p-2 rounded-xl"
          ></textarea>

          {/* File preview */}
          {addedFiles.length > 0 && <PostItemSelectedFileRender files={addedFiles} />}

          {/* Hidden file input */}
          <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />

          {/* Action bar */}
          <PostActionBar
            disabledItems={["save", "share"]}
            handleClickFunction={{
              handleImageButtonClick,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PostCommentInput;

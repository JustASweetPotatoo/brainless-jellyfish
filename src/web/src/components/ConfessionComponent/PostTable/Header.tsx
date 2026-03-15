import { faPaperPlane, faImage, faCommentDots, faGear } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { UserProfile } from "../../../interface/User";
import type React from "react";

interface PostTableHeaderProps {
  userProfile: UserProfile;
}

const PostTableHeader: React.FC<PostTableHeaderProps> = ({ userProfile }) => {
  return (
    <div className="w-full my-6">
      <div className="rounded-xl pb-4 pt-5 py-3 bg-white dark:bg-[#252525] shadow-sm">
        {/* User input */}
        <div className="w-full px-5">
          <div className="flex items-center w-full h-10 gap-4">
            <img src={userProfile.avatar} alt="User" className="rounded-full w-10 h-10 object-cover" />
            <input type="text" placeholder="Bạn đang nghĩ gì?" className="flex-grow px-3 py-2 rounded-xl border border-gray-300 dark:border-[#4f4f4f] bg-transparent focus:outline-none" />
            <button className="w-10 h-full text-primary hover:text-blue-600 transition-colors duration-200 cursor-pointer flex-shrink-0">
              <FontAwesomeIcon icon={faPaperPlane} className="h-6 w-6 text-2xl" />
            </button>
          </div>
        </div>

        <div className="h-10 flex items-center justify-between mt-5 px-5">
          <button className="h-10 w-[30%] cursor-pointer flex justify-center items-center rounded-2xl dark:hover:bg-[#838383] hover:bg-gray-300 transition-all duration-200">
            <FontAwesomeIcon icon={faImage} className="text-2xl px-3"></FontAwesomeIcon>
            <h1>Tải Ảnh Lên</h1>
          </button>
          <button className="h-10 w-[30%] cursor-pointer flex justify-center items-center rounded-2xl dark:hover:bg-[#838383] hover:bg-gray-300 transition-all duration-200">
            <FontAwesomeIcon icon={faCommentDots} className="text-2xl px-3"></FontAwesomeIcon>
            <h1>Tạo Confession</h1>
          </button>
          <button className="h-10 w-[30%] cursor-pointer flex justify-center items-center rounded-2xl dark:hover:bg-[#838383] hover:bg-gray-300 transition-all duration-200">
            <FontAwesomeIcon icon={faGear} className="text-2xl px-3"></FontAwesomeIcon>
            <h1>Cài Đặt Bài đăng</h1>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostTableHeader;

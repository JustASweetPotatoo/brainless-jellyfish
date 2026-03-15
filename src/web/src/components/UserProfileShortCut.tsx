import type React from "react";
import { Link } from "react-router-dom";
import userHookImage from "../assets/hooks/userImage.png";
import type { UserCommonData } from "../service/userService";

interface UserProfileImageProps {
  userProfile?: UserCommonData;
  avatarSize?: "w-12 h-12" | "w-10 h-10";
  className?: string;
  data?: number | string | undefined;
}

const UserProfileShortCut: React.FC<UserProfileImageProps> = (props) => {
  return (
    <div className={props.className}>
      {props.userProfile ? (
        <Link to={`/${props.userProfile.id}`}>
          <img src={userHookImage} alt="User" className={`rounded-full object-cover ${props.avatarSize ?? "w-12 h-12"}`} />
        </Link>
      ) : (
        <div className={`rounded-full object-cover dark:bg-[#5c5c5c] animate-pulse skeleton ${props.avatarSize ?? "w-12 h-12"}`}></div>
      )}

      <div className="h-12 flex flex-col justify-between">
        {props.userProfile ? (
          <Link to={`/${props.userProfile.id}`} className="hover:underline">
            <h1 className="h-6 font-bold text-xl">{props.userProfile.firstName + " " + props.userProfile.lastName}</h1>
          </Link>
        ) : (
          <div>
            <h1 className="h-6 font-bold text-xl animate-pulse">{"Loading..."}</h1>
          </div>
        )}

        {props.data && props.userProfile && <h3 className="h-4 font-light text-sm">{props.data}</h3>}
      </div>
    </div>
  );
};

export default UserProfileShortCut;

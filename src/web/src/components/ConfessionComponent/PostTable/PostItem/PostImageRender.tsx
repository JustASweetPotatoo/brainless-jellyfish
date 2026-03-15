import type React from "react";
import type { PostImage } from "../../../../interface/Media";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setDisplayMedia } from "../../../../redux/reducer/slices/DisplayMedialSlice";
import type { Post } from "../../../../interface/Post";
import { removeDisplayPost } from "../../../../redux/reducer/slices/PostDisplayingModalSlice";

interface PostImageRenderProps {
  post?: Post;
  images: PostImage[];
}

const PostImageRender: React.FC<PostImageRenderProps> = ({ post, images }) => {
  const dispatch = useDispatch();

  const handleClickAction = post
    ? (imageId: string) => {
        dispatch(setDisplayMedia({ post: post, mediaId: imageId }));
        dispatch(removeDisplayPost());
        return;
      }
    : () => {};

  // const imageFirstRow = images.slice(0, Math.min(3, images.length));
  // const imageSecondRow = images.slice(3, 5);

  // let style = {
  //   firstRow: { imageFlexDirection: "flex-row", imageWidthSize: "w-full", imageHeightSize: "h-[30rem]" },
  //   secondRow: { imageFlexDirection: "flex-row", imageWidthSize: "w-full", imageHeightSize: "h-[40rem]" },
  // };

  // if (images.length <= 2) {
  //   const firstImage = new Image();
  //   firstImage.src = images[0].src;

  //   firstImage.onload = () => {
  //     if (firstImage.width > firstImage.height) {
  //       style.firstRow.imageFlexDirection = "flex-row";
  //     } else {
  //       style.firstRow.imageFlexDirection = "flex-col";
  //     }
  //   };

  //   if (images.length == 1) {
  //     style.firstRow.imageWidthSize = "w-full";
  //   }

  //   return (
  //     <div className={`w-full mt-5 rounded-2xl flex gap-1 overflow-hidden ${style.firstRow.imageFlexDirection}`}>
  //       {images.map((image, i) => (
  //         <Link to={`/confession/media/${image.id}`} className={`cursor-pointer ${style.firstRow.imageWidthSize}`} onClick={() => handleClickAction(image.id)}>
  //           <img src={image.src} key={i} alt="" className={`object-cover ${style.firstRow.imageHeightSize}`} />
  //         </Link>
  //       ))}
  //     </div>
  //   );
  // } else {
  //   const firstImageRow1 = new Image();
  //   firstImageRow1.src = imageFirstRow[0].src;

  //   firstImageRow1.onload = () => {
  //     if (firstImageRow1.width > firstImageRow1.height) {
  //       style.firstRow.imageFlexDirection = "flex-row";
  //     } else {
  //       style.firstRow.imageFlexDirection = "flex-col";
  //     }
  //   };

  //   const firstImageRow2 = new Image();
  //   firstImageRow2.src = imageSecondRow[0].src;
  //   firstImageRow2.onload = () => {
  //     if (firstImageRow2.width > firstImageRow2.height) {
  //       style.secondRow.imageFlexDirection = "flex-row";
  //     } else {
  //       style.secondRow.imageFlexDirection = "flex-col";
  //     }
  //   };
  // }

  if (images.length == 1) {
    return (
      <div className="w-full mt-5 rounded-2xl flex gap-1 overflow-hidden">
        {images.map((image, i) => (
          <Link to={`/confession/media/${image.id}`} className="cursor-pointer" onClick={() => handleClickAction(image.id)}>
            <img src={image.src} key={i} alt="" className="w-full object-cover h-[40rem]" />
          </Link>
        ))}
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="w-full mt-5 rounded-2xl flex flex-row gap-1 overflow-hidden">
        {images.map((image, i) => (
          <Link to={`/confession/media/${image.id}`} className="cursor-pointer w-1/2" onClick={() => handleClickAction(image.id)}>
            <img src={image.src} key={i} alt="" className="w-full object-cover h-[20rem]" />
          </Link>
        ))}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className="w-full mt-5 rounded-2xl space-y-1 overflow-hidden">
        <div className="flex gap-1">
          {images.slice(0, 2).map((image, i) => (
            <Link to={`/confession/media/${image.id}`} className="w-1/2 cursor-pointer" onClick={() => handleClickAction(image.id)}>
              <img src={image.src} key={i} alt="" className="object-cover h-[20rem]" />
            </Link>
          ))}
        </div>
        <img src={images[2].src} alt="" className="w-full object-cover h-[20rem]" />
      </div>
    );
  }

  if (images.length === 4) {
    return (
      <div className="w-full mt-5 rounded-2xl space-y-1 overflow-hidden">
        <div className="flex gap-1">
          {images.slice(0, 2).map((image, i) => (
            <Link to={`/confession/media/${image.id}`} className="w-1/2 cursor-pointer" onClick={() => handleClickAction(image.id)}>
              <img src={image.src} key={i} alt="" className="object-cover h-[20rem]" />
            </Link>
          ))}
        </div>
        <div className="flex gap-1">
          {images.slice(2).map((image, i) => (
            <Link to={`/confession/media/${image.id}`} className="w-1/2 cursor-pointer" onClick={() => handleClickAction(image.id)}>
              <img src={image.src} key={i + 2} alt="" className="object-cover h-[20rem]" />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 5) {
    return (
      <div className="w-full mt-5 rounded-2xl space-y-1 overflow-hidden">
        <div className="flex gap-1">
          {images.slice(0, 2).map((image, i) => (
            <Link to={`/confession/media/${image.id}`} className="w-1/2 cursor-pointer" onClick={() => handleClickAction(image.id)}>
              <img src={image.src} key={i} alt="" className="object-cover h-[20rem]" />
            </Link>
          ))}
        </div>
        <div className="flex gap-1">
          {images.slice(2).map((image, i) => (
            <Link to={`/confession/media/${image.id}`} className="w-1/3 cursor-pointer" onClick={() => handleClickAction(image.id)}>
              <img src={image.src} key={i + 2} alt="" className="object-cover h-[20rem]" />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (images.length > 5) {
    return (
      <div className="w-full mt-5 rounded-2xl space-y-1 overflow-hidden">
        <div className="flex gap-1">
          {images.slice(0, 2).map((image, i) => (
            <Link to={`/confession/media/${image.id}`} className="w-1/2 cursor-pointer" onClick={() => handleClickAction(image.id)}>
              <img src={image.src} key={i} alt="" className="object-cover h-[20rem]" />
            </Link>
          ))}
        </div>
        <div className="flex gap-1">
          {images.slice(2, 4).map((image, i) => (
            <Link to={`/confession/media/${image.id}`} className="w-1/3 cursor-pointer" onClick={() => handleClickAction(image.id)}>
              <img src={image.src} key={i + 2} alt="" className="object-cover h-[20rem]" />
            </Link>
          ))}
          <div className="w-1/3 h-[20rem]">
            <div className="relative w-full h-full">
              <img src={images[5].src} alt="" className="w-full h-full object-cover" />
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white text-2xl font-bold bg-[#00000052]">+{images.length - 5}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PostImageRender;

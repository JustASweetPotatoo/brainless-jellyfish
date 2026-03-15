import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faChevronRight, faChevronLeft, faMagnifyingGlassMinus, faMagnifyingGlassPlus } from "@fortawesome/free-solid-svg-icons";
import type { PostImage } from "../../interface/Media";
import { clearDisplayingMedia } from "../../redux/reducer/slices/DisplayMedialSlice";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

const Media = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [imageZoomNumber, setImageZoomNumber] = useState(70);
  const [image, setImage] = useState<PostImage | undefined>(undefined);

  const displayingMedia = useSelector((state: RootState) => state.displayingMedialSlice);

  const getImage = () => {
    console.log(displayingMedia);
    if (displayingMedia.post && displayingMedia.post.images) {
      const data = displayingMedia.post.images.find((imgae) => imgae.id === displayingMedia.mediaId);
      setImage(data);
    }
  };

  useEffect(() => {
    if (!displayingMedia.mediaId || !displayingMedia.post) {
      navigate("/confession");
      return;
    }

    getImage();
    // const found = displayingMedia.post.images.find((img) => img.id === displayingMedia.mediaId);
    // setImage(found);
  }, [displayingMedia]);

  const handleCloseButton = () => {
    navigate(-1);
    dispatch(clearDisplayingMedia());
  };

  const handleNextImageButton = () => {
    // if (!displayingMedia.post) return;
    // const images = displayingMedia.post.images;
    // const currentIndex = images.findIndex((img) => img.id === displayingMedia.mediaId);
    // if (currentIndex < images.length - 1) {
    //   const nextImage = images[currentIndex + 1];
    //   setImage(nextImage);
    //   dispatch(setDisplayMedia({ post: displayingMedia.post, mediaId: nextImage.id }));
    // }
  };

  const handlePreviousImageButton = () => {
    // if (!displayingMedia.post) return;
    // const images = displayingMedia.post.images;
    // const currentIndex = images.findIndex((img) => img.id === displayingMedia.mediaId);
    // if (currentIndex > 0) {
    //   const prevImage = images[currentIndex - 1];
    //   setImage(prevImage);
    //   dispatch(setDisplayMedia({ post: displayingMedia.post, mediaId: prevImage.id }));
    // }
  };

  const handleZoomInImageButton = () => {
    setImageZoomNumber((prev) => Math.min(prev + 10, 150));
  };

  const handleZoomOutImageButton = () => {
    setImageZoomNumber((prev) => Math.max(prev - 10, 20));
  };

  return (
    <div className="fixed inset-0 z-40 pt-[4rem] bg-[#000000a2] min-w-2xl">
      <PanelGroup autoSaveId="media-panel-layout" direction="horizontal" className="h-full">
        {/* Left Panel: Hình ảnh */}
        <Panel defaultSize={60} minSize={60} maxSize={80} className="relative bg-black">
          {/* Previous */}
          <button onClick={handlePreviousImageButton} className="absolute top-0 left-0 h-full w-16 hover:bg-[#ffffff17] text-2xl p-4 transition duration-200 text-white cursor-pointer z-10">
            <FontAwesomeIcon icon={faChevronLeft} className="text-4xl" />
          </button>

          {/* Close */}
          <button onClick={handleCloseButton} className="absolute top-5 left-1/2 transform -translate-x-1/2 text-2xl p-4 transition duration-200 text-white hover:text-red-500 cursor-pointer z-10">
            <FontAwesomeIcon icon={faXmark} className="text-4xl" />
          </button>

          {/* Zoom In */}
          <button onClick={handleZoomInImageButton} className="absolute top-5 right-20 text-2xl p-4 transition duration-200 text-white hover:text-green-400 cursor-pointer z-10">
            <FontAwesomeIcon icon={faMagnifyingGlassPlus} className="text-2xl" />
          </button>

          {/* Zoom Out */}
          <button onClick={handleZoomOutImageButton} className="absolute top-5 right-36 text-2xl p-4 transition duration-200 text-white hover:text-yellow-400 cursor-pointer z-10">
            <FontAwesomeIcon icon={faMagnifyingGlassMinus} className="text-2xl" />
          </button>

          {/* Image */}
          <div className="h-full flex items-center justify-center overflow-hidden">
            <img
              src={image?.src ?? ""}
              alt=""
              style={{ width: `${imageZoomNumber}rem` }} // ✅ Sửa ở đây
              className="object-contain max-w-screen transition-all duration-200"
            />
          </div>

          {/* Next */}
          <button onClick={handleNextImageButton} className="absolute top-0 right-0 h-full w-16 hover:bg-[#ffffff17] text-2xl p-4 transition duration-200 text-white cursor-pointer z-10">
            <FontAwesomeIcon icon={faChevronRight} className="text-4xl" />
          </button>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="bg-gray-600 w-1 hover:bg-gray-400 cursor-col-resize" />

        {/* Right Panel: Sidebar info */}
        <Panel defaultSize={20} minSize={20} maxSize={30} className="bg-white dark:bg-[#1a1a1a] p-4 overflow-y-auto">
          <h2 className="text-xl font-bold text-black dark:text-white">Thông tin hình ảnh</h2>
          <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">ID: {displayingMedia.mediaId}</p>
          <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">Post ID: {displayingMedia.post?.id}</p>
          <div className="mt-4 text-gray-500 dark:text-gray-300">Thông tin thêm ở đây...</div>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default Media;

const PostItemNoInternet: React.FC = () => {
  return (
    <div key="zero" className="p-4 border border-gray-300 dark:border-[#383838] rounded-lg bg-white dark:bg-[#252525]">
      <h1>Không có kết nối mạng !</h1>

      {/*
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
      )} */}
    </div>
  );
};

export default PostItemNoInternet;

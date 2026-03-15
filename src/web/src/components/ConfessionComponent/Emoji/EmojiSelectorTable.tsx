import React, { useMemo, useState } from "react";
import { useInfiniteScroll } from "../../../hooks/useInfiniteScroll";

import defaultEmoji from "../../../assets/defaultEmoji.json";

interface Props {
  className?: string;
  searchString?: string;
}

const EmojiSelector: React.FC<Props> = ({ className, searchString = "" }) => {
  const allCategories = useMemo(() => defaultEmoji, []);

  const [visibleCategories, setVisibleCategories] = useState(() => allCategories.slice(0, 1));
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = visibleCategories.length < allCategories.length;

  const loadMore = () => {
    if (!hasMore) return;
    setIsLoading(true);
    setTimeout(() => {
      setVisibleCategories((prev) => [...prev, ...allCategories.slice(prev.length, prev.length + 2)]);
      setIsLoading(false);
    }, 300);
  };

  const lastCategoryRef = useInfiniteScroll(loadMore, hasMore, isLoading);

  return (
    <div className={className + " p-2 space-y-2"}>
      <div className="h-full overflow-x-hidden overflow-y-auto custom-scrollbar text-black dark:text-white">
        {visibleCategories.map((category, i) => {
          const isLast = i === visibleCategories.length - 1;
          return (
            <div key={i} ref={isLast ? lastCategoryRef : undefined} className="space-y-1">
              <h4 className="font-semibold text-sm px-2">{category.categoryName}</h4>
              {category.emojiChunks.map((chunk, chunkIndex) => (
                <div key={chunkIndex} className="w-full flex justify-between">
                  {chunk.map((emoji, emojiIndex) => (
                    <>
                      {emoji.id.toLowerCase().includes(searchString.toLowerCase()) && (
                        <button key={emojiIndex} title={emoji.id} className="text-3xl hover:scale-110 cursor-pointer transition-transform">
                          {emoji.source}
                        </button>
                      )}
                    </>
                  ))}
                </div>
              ))}
            </div>
          );
        })}
        {isLoading && <p className="text-center text-gray-500 text-sm">Đang tải...</p>}
      </div>
    </div>
  );
};

export default EmojiSelector;

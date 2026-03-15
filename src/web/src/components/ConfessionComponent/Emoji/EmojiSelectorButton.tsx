import { faPlus, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useRef, useState } from "react";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import EmojiSelector from "./EmojiSelectorTable";

const EmojiSelectorButton: React.FC = () => {
  const [displayEmojiSelector, setDisplayEmojiSelector] = useState(false);
  const [searchString, setSearchString] = useState<string | undefined>();
  const ref = useRef<HTMLDivElement>(null);

  // Đóng emoji selector khi click bên ngoài
  useOutsideClick(ref, () => setDisplayEmojiSelector(false));

  const handleButtonClick = () => {
    setDisplayEmojiSelector((prev) => !prev);
  };

  return (
    <div className="relative">
      <button className="transition-colors cursor-pointer duration-200 hover:bg-gray-300 dark:hover:bg-[#838383] px-4 py-2 rounded-2xl" title="Thêm Emoji" onClick={handleButtonClick}>
        <FontAwesomeIcon icon={faPlus} className="text-xl" />
      </button>

      {displayEmojiSelector && (
        <div className="absolute bottom-12 right-0 lg:left-0 w-[25rem] h-[18rem] max-h-[18rem] bg-amber-200 rounded-xl shadow-md z-50 overflow-visible" ref={ref}>
          <div className="h-[2.5rem] bg-amber-600 rounded-xl flex px-2 py-1 space-x-2">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="text-xl" />
            </div>
            <input type="text" onChange={(e) => setSearchString(e.target.value)} placeholder="Nhập tên emoji cần tìm..." className="focus:outline-none h-full rounded-2xl w-full px-2 bg-white" />
          </div>
          <EmojiSelector className="w-full h-full max-h-[15.25rem] overflow-y-auto bg-amber-800 rounded-xl mt-1" searchString={searchString} />
        </div>
      )}
    </div>
  );
};

export default EmojiSelectorButton;

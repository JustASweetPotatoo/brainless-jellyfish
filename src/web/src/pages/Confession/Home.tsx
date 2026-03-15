import type React from "react";
import LeftMenu from "../../components/ConfessionComponent/LeftMenu";
import PostTable from "../../components/ConfessionComponent/PostTable";
import { ConfessionHomeLayout } from "../layouts/list/ConfessionHomeLayout";
import layoutCrafter from "../layouts/common/LayoutCrafter";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import PostModalDisplay from "../../components/ConfessionComponent/display/PostModalDisplay";

const ConfessionHome: React.FC = () => {
  const selectedPost = useSelector((state: RootState) => state.postDisplayingModalSlice.post);

  const MainContent = (
    <section className="bg-[hsl(240,11%,93%)] pt-[4rem] dark:bg-[#1a1a1a] transition-all">
      <div className="container max-h-[calc(100vh-4rem)] mx-auto max-w-[100rem] flex flex-row justify-between min-h-[calc(100vh-4rem)]">
        {/* Left Menu */}

        <div className="w-[20rem] min-w-[18rem] px-5 py-6 hidden lg:block font-bold text-[#4d4d4d] dark:text-white">
          <LeftMenu />
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-[60rem] max-h-full overflow-y-scroll custom-scrollbar border-x border-[#4f4f4f] dark:border-[#4f4f4f]">
          <PostTable />
        </div>

        {/* Right Section */}
        <div className="w-[20rem] px-4 hidden xl:block">
          {/* Optional Right Sidebar */}
          Right section here
        </div>
      </div>
      {selectedPost && <PostModalDisplay post={selectedPost} />}
    </section>
  );

  return layoutCrafter.loadLayout(MainContent, ConfessionHomeLayout);
};

export default ConfessionHome;

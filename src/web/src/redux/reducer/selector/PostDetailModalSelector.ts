import type { RootState } from "../../store";

const PostDetailModalSelector = (state: RootState) => state.postDisplayingModalSlice;

export default PostDetailModalSelector;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Post } from "../../../interface/Post";

interface MediaModalState {
  post?: Post;
  mediaId?: string;
}

const initialState: MediaModalState = {
  post: undefined,
  mediaId: undefined,
};

const displayingMediaSlice = createSlice({
  name: "displayingMediaSlice",
  initialState,
  reducers: {
    setDisplayingMedia: (state, action: PayloadAction<{ post: Post; mediaId: string }>) => {
      state.post = action.payload.post;
      state.mediaId = action.payload.mediaId;

      console.log(`Action: setDisplayingMedia, raw: ${{ ...state }}`);
    },
    clearDisplayingMedia: (state) => {
      console.log("Action: clearDisplayingMedia");

      state.post = undefined;
      state.mediaId = undefined;
    },
  },
});

export const { setDisplayingMedia: setDisplayMedia, clearDisplayingMedia: clearDisplayingMedia } = displayingMediaSlice.actions;
export default displayingMediaSlice;

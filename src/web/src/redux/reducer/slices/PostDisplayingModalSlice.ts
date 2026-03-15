import type { Post } from "../../../interface/Post";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface PostDisplayingModalState {
  post: Post | undefined;
  files: File[];
  commentInput: string;
}

const initialState: PostDisplayingModalState = {
  post: undefined,
  commentInput: "",
  files: [],
};

const postDisplayingModalSlice = createSlice({
  name: "postDisplayingModalSlice",
  initialState,
  reducers: {
    setComment: (state, action: PayloadAction<string>) => {
      state.commentInput = action.payload;
    },
    addImage: (state, action: PayloadAction<FileList | null>) => {
      state.files = action.payload ? state.files.concat(Array.from(action.payload)) : state.files;
    },
    setDisplayPost: (state, action: PayloadAction<Post>) => {
      state.post = action.payload;
    },
    removeDisplayPost: (state) => {
      state.post = undefined;
    },
    clearData: (state) => {
      state.commentInput = "";
      state.files = [];
    },
  },
});

export const { setComment, addImage, setDisplayPost, removeDisplayPost, clearData } = postDisplayingModalSlice.actions;
export default postDisplayingModalSlice;

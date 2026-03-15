import { configureStore } from "@reduxjs/toolkit";
import themeSlice from "./reducer/slices/ThemeSlices";
import { saveThemeToLocalStorage } from "./middleware/saveThemeLocalStorage";
import postDisplayingModalSlice from "./reducer/slices/PostDisplayingModalSlice";
import displayingMediaSlice from "./reducer/slices/DisplayMedialSlice";
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";

export const store = configureStore({
  reducer: {
    themeSlice: themeSlice.reducer,
    postDisplayingModalSlice: postDisplayingModalSlice.reducer,
    displayingMedialSlice: displayingMediaSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          "postDisplayingModalSlice/addImage", // ✅ bỏ qua action chứa File[]
        ],
        ignoredPaths: [
          "postDisplayingModalSlice.files", // ✅ bỏ qua đường dẫn chứa File[]
        ],
      },
    }).concat(saveThemeToLocalStorage); // ✅ sửa concat lỗi (bạn đang dùng `.concat` nhưng không có gì sau)
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

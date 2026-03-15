// hooks.ts
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { AppDispatch as AppDispatch, RootState } from "./store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

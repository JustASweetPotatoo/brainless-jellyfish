import { useLocalStorage } from "../localStorage/storage";
import type { RouteConfig, RouteStateType } from "../routes/config";

export const defineState = (conf: RouteConfig): RouteStateType => {
  if (conf.requiredAuth) {
    const [jwt] = useLocalStorage<string>("jwt", "2025");

    if (jwt) {
      // chưa xong, xử lý vào trang
      return "loggedIn";
    } else {
      return "loggedOut";
    }
  } else {
    return "default";
  }
};

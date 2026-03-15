import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        confession: {
          menu: {
            home: "Home",
            messages: "Messages",
            saved: "Saved",
            recent: "Recent",
            settings: "Settings",
            account: "Account",
            language: "Language",
            darkTheme: "Dark Theme",
            logout: "Logout",
          },
          post: {
            reactionBar: {
              comment: "Comments",
              share: "Shares",
            },
            actionBar: {
              addImage: "Add image",
              comment: "Comment",
              share: "Share",
              save: "Save",
            },
            notification: {
              invalidOrDeletedPost: "This post is invalid or has been deleted !",
              privatePost: "This post was in private mode !",
            },
          },
        },
      },
    },
    vi: {
      translation: {
        confession: {
          menu: {
            home: "Trang Chủ",
            messages: "Tin Nhắn",
            saved: "Đã lưu",
            recent: "Tương Tác Gần Đây",
            settings: "Cài Đặt",
            account: "Tài Khoản",
            language: "Ngôn Ngữ",
            darkTheme: "Nền Tối",
            logout: "Đăng xuất",
          },
          post: {
            reactionBar: {
              comment: "Bình Luận",
              share: "Chia Sẻ",
            },
            actionBar: {
              addImage: "Thêm ảnh",
              comment: "Bình luận",
              share: "Chia sẻ",
              save: "Lưu post",
            },
            notification: {
              invalidOrDeletedPost: "Bài viết không tồn tại hoặc đã bị xóa !",
              privatePost: "Bài viết này đang ở chế độ riêng tư",
            },
          },
        },
      },
    },
  },
  lng: "vi",
  fallbackLng: "en",

  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

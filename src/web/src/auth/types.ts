export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthSession {
  user: User;

  accessToken: string;

  /**
   * Access token hết hạn lúc nào
   */
  accessTokenExpiresAt: number;

  /**
   * Mock refresh token.
   *
   * Sau này backend thật sẽ chuyển thành
   * HttpOnly Cookie.
   */
  refreshToken: string;

  /**
   * Session hết hạn lúc nào
   */
  refreshTokenExpiresAt: number;
}

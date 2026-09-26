export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
}

export interface AuthSession {
  user: User;
  expiresAt: number;
}

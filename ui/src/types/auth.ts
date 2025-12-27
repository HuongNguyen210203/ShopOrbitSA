export type RegisterPayload = {
  fullName: string;
  username: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type AuthResponse = {
  message?: string;
  Message?: string;
  token?: string;
  expiration?: string;
};

export interface UserProfile {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  roles: string[];
}

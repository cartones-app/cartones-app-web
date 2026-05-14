import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
    roles: string[];
    user: DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
    error?: string;
    roles?: string[];
  }
}

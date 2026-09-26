import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  appBaseUrl: process.env.NODE_ENV === "production" ? "https://www.dxmedical.us" : undefined,
});

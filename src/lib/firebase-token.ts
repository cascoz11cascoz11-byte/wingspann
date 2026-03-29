import { GoogleAuth } from "google-auth-library";

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getFirebaseAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const auth = new GoogleAuth({
    credentials: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!),
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  cachedToken = tokenResponse.token!;
  tokenExpiry = Date.now() + 55 * 60 * 1000; // cache for 55 mins
  return cachedToken;
}

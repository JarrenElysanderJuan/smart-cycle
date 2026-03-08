import { Auth0Client } from '@auth0/nextjs-auth0/server';

/**
 * Singleton Auth0 client instance.
 * Reads configuration from environment variables automatically:
 * AUTH0_SECRET, AUTH0_BASE_URL, AUTH0_ISSUER_BASE_URL, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET
 */
export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: process.env.AUTH0_SCOPE ?? 'openid profile email',
  },
  // Return 204 instead of 401 when checking profile while not logged in.
  // Prevents Auth0Provider from logging console errors on every page load.
  noContentProfileResponseWhenUnauthenticated: true,
});

/**
 * Custom claims namespace — must match the Auth0 Post-Login Action
 * and the backend auth middleware.
 */
const CLAIMS_NAMESPACE = 'https://smart-cycle.com';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface UserClaims {
  role: string | null;
  storeId: string | null;
  foodBankId: string | null;
  organizationId: string | null;
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

interface UserProfile {
  role: string;
  store_id: string | null;
  food_bank_id: string | null;
  organization_id: string | null;
}

/**
 * Fetch the user profile from our database as a fallback
 * when JWT claims don't contain role info.
 */
async function fetchUserProfile(auth0Id: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/users/profile/${encodeURIComponent(auth0Id)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json() as { data: UserProfile };
    return json.data;
  } catch {
    return null;
  }
}

/**
 * Extract Smart Cycle custom claims from the Auth0 session.
 * Falls back to checking the user_profiles database table
 * when JWT claims don't contain role info (e.g. after onboarding).
 *
 * Use in Server Components / layouts.
 */
export async function getUserClaims(): Promise<UserClaims | null> {
  const session = await auth0.getSession();
  if (!session?.user) return null;

  const user = session.user;
  const sub = user.sub as string;

  // Try JWT claims first
  let role = (user[`${CLAIMS_NAMESPACE}/role`] as string) ?? null;
  let storeId = (user[`${CLAIMS_NAMESPACE}/store_id`] as string) ?? null;
  let foodBankId = (user[`${CLAIMS_NAMESPACE}/food_bank_id`] as string) ?? null;
  let organizationId = (user[`${CLAIMS_NAMESPACE}/organization_id`] as string) ?? null;

  // Fallback: check database if JWT claims don't have role
  if (!role) {
    const profile = await fetchUserProfile(sub);
    if (profile) {
      role = profile.role;
      storeId = storeId ?? profile.store_id;
      foodBankId = foodBankId ?? profile.food_bank_id;
      organizationId = organizationId ?? profile.organization_id;
    }
  }

  return {
    sub,
    name: (user.name as string) ?? 'User',
    email: (user.email as string) ?? '',
    picture: user.picture as string | undefined,
    role,
    storeId,
    foodBankId,
    organizationId,
  };
}

/**
 * Get the Auth0 access token for making authenticated API calls.
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const result = await auth0.getAccessToken();
    return result?.token ?? null;
  } catch {
    return null;
  }
}

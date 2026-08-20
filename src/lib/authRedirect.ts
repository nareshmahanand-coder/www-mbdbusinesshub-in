const POST_LOGIN_PATH = "/dashboard";
const ONBOARDING_REQUIRED_AFTER = Date.parse("2026-06-25T00:00:00.000Z");

type AuthRedirectUser = { created_at?: string } | null | undefined;

export const sanitizeAuthNextPath = (value: string | null | undefined): string => {
  if (!value) return POST_LOGIN_PATH;
  if (!value.startsWith("/")) return POST_LOGIN_PATH;
  if (value.startsWith("/login") || value.startsWith("/auth")) return POST_LOGIN_PATH;
  return value;
};

export const requiresPostLoginOnboarding = (
  user: AuthRedirectUser,
  isSuperUser = false,
): boolean => {
  if (!user || isSuperUser) return false;
  const createdAt = Date.parse(user.created_at ?? "");
  if (!Number.isFinite(createdAt)) return true;
  return createdAt >= ONBOARDING_REQUIRED_AFTER;
};

export const getPostLoginDestinationForUser = (
  user: AuthRedirectUser,
  requestedNext: string | null | undefined,
  isSuperUser = false,
): string => {
  return sanitizeAuthNextPath(requestedNext);
};
import * as Sentry from "@sentry/nextjs";

/**
 * Set user information in Sentry
 */
export function setUserContext(user: {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: any;
}) {
  Sentry.setUser(user);
}

/**
 * Clear user information from Sentry
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb to track user actions
 */
export function addBreadcrumb(
  message: string,
  category: string = 'ui',
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

/**
 * Set a tag for better filtering in Sentry
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * Set extra context data for errors
 */
export function setExtra(key: string, value: any) {
  Sentry.setExtra(key, value);
}

/**
 * Capture a custom message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  });
} 
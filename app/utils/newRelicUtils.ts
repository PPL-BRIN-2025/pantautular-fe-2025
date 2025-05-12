/**
 * New Relic utility functions
 * 
 * These functions provide a wrapper around the New Relic Browser Agent API
 * to make it easier to use and provide type safety.
 */

declare global {
  interface Window {
    newrelic?: {
      setCustomAttribute: (name: string, value: string | number | boolean) => void;
      setUserId: (userId: string) => void;
      setPageViewName: (name: string, host?: string) => void;
      setErrorHandler: (fn: (err: Error) => boolean) => void;
      noticeError: (err: Error | string, customAttributes?: Record<string, any>) => void;
      addPageAction: (name: string, attributes?: Record<string, any>) => void;
      setCurrentRouteName: (name: string) => void;
      interaction: () => any;
      recordMetric: (name: string, value: number) => void;
    };
  }
}

/**
 * Set a custom attribute for the current session
 */
export function setCustomAttribute(name: string, value: string | number | boolean): void {
  if (typeof window !== 'undefined' && window.newrelic) {
    window.newrelic.setCustomAttribute(name, value);
  }
}

/**
 * Set the user ID for the current session
 */
export function setUserId(userId: string): void {
  if (typeof window !== 'undefined' && window.newrelic) {
    window.newrelic.setUserId(userId);
  }
}

/**
 * Set the page view name
 */
export function setPageViewName(name: string, host?: string): void {
  if (typeof window !== 'undefined' && window.newrelic) {
    window.newrelic.setPageViewName(name, host);
  }
}

/**
 * Track a user interaction
 */
export function addPageAction(name: string, attributes?: Record<string, any>): void {
  if (typeof window !== 'undefined' && window.newrelic) {
    window.newrelic.addPageAction(name, attributes);
  }
}

/**
 * Report an error to New Relic
 */
export function noticeError(error: Error | string, customAttributes?: Record<string, any>): void {
  if (typeof window !== 'undefined' && window.newrelic) {
    window.newrelic.noticeError(error, customAttributes);
  }
}

/**
 * Set the current route name for SPA monitoring
 */
export function setCurrentRouteName(name: string): void {
  if (typeof window !== 'undefined' && window.newrelic) {
    window.newrelic.setCurrentRouteName(name);
  }
}

/**
 * Record a custom metric
 */
export function recordMetric(name: string, value: number): void {
  if (typeof window !== 'undefined' && window.newrelic) {
    window.newrelic.recordMetric(name, value);
  }
}

/**
 * Create a custom interaction trace
 */
export function createInteraction(name: string): () => void {
  if (typeof window !== 'undefined' && window.newrelic) {
    const interaction = window.newrelic.interaction();
    interaction.setName(name);
    return () => interaction.save();
  }
  return () => {}; // No-op if New Relic is not available
} 
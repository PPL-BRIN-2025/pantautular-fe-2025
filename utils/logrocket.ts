import LogRocket from "logrocket";

export function initLogRocket() {
  if (typeof window !== "undefined") {
    LogRocket.init("amkrwc/pantautular-fe"); // Replace with your LogRocket app ID
  }
}
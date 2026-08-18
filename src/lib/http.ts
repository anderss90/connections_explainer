export const USER_AGENT =
  "ConnectionsWordsSite/1.0 (https://github.com/anderss90/connections_explainer)";

export function clientHeaders(accept = "application/json"): {
  Accept: string;
  "User-Agent": string;
  "Api-User-Agent": string;
} {
  return {
    Accept: accept,
    "User-Agent": USER_AGENT,
    "Api-User-Agent": USER_AGENT,
  };
}

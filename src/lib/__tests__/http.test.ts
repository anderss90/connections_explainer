import { clientHeaders, USER_AGENT } from "../http";

describe("http client identity", () => {
  it("identifies the app and includes a contact URL", () => {
    expect(USER_AGENT).toContain("ConnectionsWordsSite/1.0");
    expect(USER_AGENT).toContain("https://github.com/anderss90/connections_explainer");
  });

  it("builds request headers with User-Agent and Api-User-Agent", () => {
    expect(clientHeaders("application/json")).toEqual({
      Accept: "application/json",
      "User-Agent": USER_AGENT,
      "Api-User-Agent": USER_AGENT,
    });
  });

  it("uses JSON Accept by default", () => {
    expect(clientHeaders().Accept).toBe("application/json");
  });
});

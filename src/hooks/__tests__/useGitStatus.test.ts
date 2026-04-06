import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchGitStatus } from "../../api/git";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchGitStatus", () => {
  it("fetches git status with filename param", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          available: true,
          branch: "main",
          fileStatus: "modified",
        }),
    } as Response);

    const result = await fetchGitStatus("test.html");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/git/status?filename=test.html",
    );
    expect(result).toEqual({
      available: true,
      branch: "main",
      fileStatus: "modified",
    });
  });

  it("fetches without filename when none provided", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ available: true, branch: "main" }),
    } as Response);

    const result = await fetchGitStatus();

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/git/status");
    expect(result).toEqual({ available: true, branch: "main" });
  });

  it("encodes special characters in filename", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ available: true, branch: "main" }),
    } as Response);

    await fetchGitStatus("my file.html");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/git/status?filename=my%20file.html",
    );
  });

  it("returns available: false on HTTP error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const result = await fetchGitStatus("test.html");
    expect(result).toEqual({ available: false });
  });

  it("returns available: false on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("Network error"),
    );

    const result = await fetchGitStatus("test.html");
    expect(result).toEqual({ available: false });
  });
});

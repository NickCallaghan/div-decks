import { formatSize, formatDate } from "../format";

describe("formatSize", () => {
  it("formats bytes", () => {
    expect(formatSize(0)).toBe("0 B");
    expect(formatSize(500)).toBe("500 B");
    expect(formatSize(1023)).toBe("1023 B");
  });

  it("formats kilobytes", () => {
    expect(formatSize(1024)).toBe("1.0 KB");
    expect(formatSize(1536)).toBe("1.5 KB");
    expect(formatSize(10240)).toBe("10.0 KB");
  });

  it("formats megabytes", () => {
    expect(formatSize(1048576)).toBe("1.0 MB");
    expect(formatSize(2621440)).toBe("2.5 MB");
  });
});

describe("formatDate", () => {
  it("formats an ISO date string", () => {
    const result = formatDate("2026-04-06T14:30:00Z");
    // Should contain day, month, and time components
    expect(result).toMatch(/\d/); // contains a digit
    expect(result).toMatch(/Apr/); // month abbreviation
  });

  it("handles different dates", () => {
    const jan = formatDate("2026-01-15T09:00:00Z");
    expect(jan).toMatch(/Jan/);

    const dec = formatDate("2025-12-25T18:00:00Z");
    expect(dec).toMatch(/Dec/);
  });
});

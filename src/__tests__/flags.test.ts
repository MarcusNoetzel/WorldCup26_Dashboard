import { getFlagUrl, getFlagUrlLarge } from "@/lib/utils/flags";

describe("getFlagUrl", () => {
  it("returns correct flagcdn URL for valid ISO2 code", () => {
    expect(getFlagUrl("BR")).toBe("https://flagcdn.com/w40/br.png");
    expect(getFlagUrl("DE")).toBe("https://flagcdn.com/w40/de.png");
    expect(getFlagUrl("US")).toBe("https://flagcdn.com/w40/us.png");
  });

  it("handles uppercase ISO2 codes", () => {
    expect(getFlagUrl("BR")).toBe("https://flagcdn.com/w40/br.png");
  });

  it("returns empty string for empty input", () => {
    expect(getFlagUrl("")).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(getFlagUrl("")).toBe("");
  });
});

describe("getFlagUrlLarge", () => {
  it("returns correct large flagcdn URL", () => {
    expect(getFlagUrlLarge("BR")).toBe("https://flagcdn.com/w80/br.png");
  });

  it("returns empty string for empty input", () => {
    expect(getFlagUrlLarge("")).toBe("");
  });
});

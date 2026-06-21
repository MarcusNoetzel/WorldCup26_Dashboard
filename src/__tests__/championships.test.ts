import { getPastChampionships } from "@/lib/utils/tournament";

describe("getPastChampionships", () => {
  it("returns correct championship count for known winners", () => {
    expect(getPastChampionships("BRA")).toBe(5);
    expect(getPastChampionships("GER")).toBe(4);
    expect(getPastChampionships("ITA")).toBe(4);
    expect(getPastChampionships("ARG")).toBe(3);
    expect(getPastChampionships("FRA")).toBe(2);
    expect(getPastChampionships("URU")).toBe(2);
    expect(getPastChampionships("ENG")).toBe(1);
    expect(getPastChampionships("ESP")).toBe(1);
  });

  it("returns 0 for teams with no championships", () => {
    expect(getPastChampionships("JPN")).toBe(0);
    expect(getPastChampionships("CAN")).toBe(0);
    expect(getPastChampionships("QAT")).toBe(0);
  });

  it("returns 0 for unknown FIFA codes", () => {
    expect(getPastChampionships("XXX")).toBe(0);
    expect(getPastChampionships("")).toBe(0);
  });
});

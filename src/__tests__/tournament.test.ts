import {
  transformApiTeam,
  transformApiGroup,
  buildBracketRounds,
  determineMatchStatus,
  getWinnerId,
  createTbdTeamInfo,
} from "@/lib/utils/tournament";
import type { ApiTeam, ApiGroup } from "@/lib/types/api";

describe("transformApiTeam", () => {
  it("transforms API team to internal Team type", () => {
    const apiTeam: ApiTeam = {
      _id: "test123",
      name_en: "Brazil",
      name_fa: "برزیل",
      flag: "https://flagcdn.com/w80/br.png",
      fifa_code: "BRA",
      iso2: "BR",
      groups: "C",
      id: "9",
    };

    const team = transformApiTeam(apiTeam);

    expect(team.id).toBe(9);
    expect(team.name).toBe("Brazil");
    expect(team.code).toBe("BRA");
    expect(team.iso2).toBe("BR");
    expect(team.flag).toBe("https://flagcdn.com/w80/br.png");
    expect(team.pastChampionships).toBe(5);
    expect(team.group).toBe("C");
  });

  it("uses flagcdn fallback when API flag is empty", () => {
    const apiTeam: ApiTeam = {
      _id: "test123",
      name_en: "Test",
      name_fa: "تست",
      flag: "",
      fifa_code: "TST",
      iso2: "TT",
      groups: "A",
      id: "99",
    };

    const team = transformApiTeam(apiTeam);

    expect(team.flag).toBe("https://flagcdn.com/w40/tt.png");
  });
});

describe("transformApiGroup", () => {
  it("transforms API group and sorts standings correctly", () => {
    const teamsMap = new Map([
      [1, { id: 1, name: "Mexico", code: "MEX", iso2: "MX", flag: "", pastChampionships: 0, group: "A" }],
      [2, { id: 2, name: "South Africa", code: "RSA", iso2: "ZA", flag: "", pastChampionships: 0, group: "A" }],
      [3, { id: 3, name: "South Korea", code: "KOR", iso2: "KR", flag: "", pastChampionships: 0, group: "A" }],
      [4, { id: 4, name: "Czech Republic", code: "CZE", iso2: "CZ", flag: "", pastChampionships: 0, group: "A" }],
    ]);

    const apiGroup: ApiGroup = {
      _id: "groupA",
      name: "A",
      teams: [
        { team_id: "1", mp: "2", w: "2", l: "0", d: "0", pts: "6", gf: "3", ga: "0", gd: "3", _id: "s1" },
        { team_id: "3", mp: "2", w: "1", l: "1", d: "0", pts: "3", gf: "2", ga: "2", gd: "0", _id: "s3" },
        { team_id: "4", mp: "2", w: "0", l: "1", d: "1", pts: "1", gf: "2", ga: "3", gd: "-1", _id: "s4" },
        { team_id: "2", mp: "2", w: "0", l: "1", d: "1", pts: "1", gf: "1", ga: "3", gd: "-2", _id: "s2" },
      ],
      createdAt: "2026-01-01T00:00:00Z",
      __v: 0,
    };

    const group = transformApiGroup(apiGroup, teamsMap);

    expect(group.name).toBe("A");
    expect(group.standings.length).toBe(4);
    expect(group.standings[0].team.name).toBe("Mexico");
    expect(group.standings[0].position).toBe(1);
    expect(group.standings[0].points).toBe(6);
    expect(group.standings[1].team.name).toBe("South Korea");
    expect(group.standings[1].position).toBe(2);
    expect(group.standings[3].team.name).toBe("South Africa");
    expect(group.standings[3].position).toBe(4);
  });

  it("sorts by goal difference when points are equal", () => {
    const teamsMap = new Map([
      [1, { id: 1, name: "Team A", code: "AAA", iso2: "AA", flag: "", pastChampionships: 0, group: "X" }],
      [2, { id: 2, name: "Team B", code: "BBB", iso2: "BB", flag: "", pastChampionships: 0, group: "X" }],
    ]);

    const apiGroup: ApiGroup = {
      _id: "groupX",
      name: "X",
      teams: [
        { team_id: "2", mp: "2", w: "1", l: "0", d: "1", pts: "4", gf: "5", ga: "2", gd: "3", _id: "s2" },
        { team_id: "1", mp: "2", w: "1", l: "0", d: "1", pts: "4", gf: "7", ga: "1", gd: "6", _id: "s1" },
      ],
      createdAt: "2026-01-01T00:00:00Z",
      __v: 0,
    };

    const group = transformApiGroup(apiGroup, teamsMap);

    expect(group.standings[0].team.name).toBe("Team A");
    expect(group.standings[1].team.name).toBe("Team B");
  });
});

describe("buildBracketRounds", () => {
  it("builds bracket rounds from matches", () => {
    const matches = [
      {
        id: 1,
        homeTeam: { id: 1, name: "Team A", code: "AAA", iso2: "AA", flag: "" },
        awayTeam: { id: 2, name: "Team B", code: "BBB", iso2: "BB", flag: "" },
        homeScore: 2,
        awayScore: 1,
        status: "finished" as const,
        stage: "quarterfinals" as const,
        date: "2026-07-01",
        winnerId: 1,
      },
      {
        id: 2,
        homeTeam: { id: 3, name: "Team C", code: "CCC", iso2: "CC", flag: "" },
        awayTeam: { id: 4, name: "Team D", code: "DDD", iso2: "DD", flag: "" },
        homeScore: null,
        awayScore: null,
        status: "scheduled" as const,
        stage: "quarterfinals" as const,
        date: "2026-07-02",
        winnerId: null,
      },
    ];

    const rounds = buildBracketRounds(matches);

    expect(rounds.length).toBe(1);
    expect(rounds[0].roundName).toBe("Quarterfinals");
    expect(rounds[0].matches.length).toBe(2);
  });

  it("returns empty array when no matches", () => {
    const rounds = buildBracketRounds([]);
    expect(rounds).toEqual([]);
  });
});

describe("determineMatchStatus", () => {
  it("returns finished when both scores are present", () => {
    expect(determineMatchStatus(2, 1)).toBe("finished");
    expect(determineMatchStatus(0, 0)).toBe("finished");
  });

  it("returns scheduled when scores are null", () => {
    expect(determineMatchStatus(null, null)).toBe("scheduled");
    expect(determineMatchStatus(1, null)).toBe("scheduled");
  });
});

describe("getWinnerId", () => {
  it("returns home team ID when home wins", () => {
    const match = {
      id: 1,
      homeTeam: { id: 1, name: "Home", code: "HHH", iso2: "HH", flag: "" },
      awayTeam: { id: 2, name: "Away", code: "AAA", iso2: "AA", flag: "" },
      homeScore: 3,
      awayScore: 1,
      status: "finished" as const,
      stage: "final" as const,
      date: "2026-07-19",
      winnerId: 1,
    };
    expect(getWinnerId(match)).toBe(1);
  });

  it("returns away team ID when away wins", () => {
    const match = {
      id: 1,
      homeTeam: { id: 1, name: "Home", code: "HHH", iso2: "HH", flag: "" },
      awayTeam: { id: 2, name: "Away", code: "AAA", iso2: "AA", flag: "" },
      homeScore: 1,
      awayScore: 3,
      status: "finished" as const,
      stage: "final" as const,
      date: "2026-07-19",
      winnerId: 2,
    };
    expect(getWinnerId(match)).toBe(2);
  });

  it("returns null for scheduled matches", () => {
    const match = {
      id: 1,
      homeTeam: { id: 1, name: "Home", code: "HHH", iso2: "HH", flag: "" },
      awayTeam: { id: 2, name: "Away", code: "AAA", iso2: "AA", flag: "" },
      homeScore: null,
      awayScore: null,
      status: "scheduled" as const,
      stage: "final" as const,
      date: "2026-07-19",
      winnerId: null,
    };
    expect(getWinnerId(match)).toBe(null);
  });

  it("returns null for draws", () => {
    const match = {
      id: 1,
      homeTeam: { id: 1, name: "Home", code: "HHH", iso2: "HH", flag: "" },
      awayTeam: { id: 2, name: "Away", code: "AAA", iso2: "AA", flag: "" },
      homeScore: 1,
      awayScore: 1,
      status: "finished" as const,
      stage: "final" as const,
      date: "2026-07-19",
      winnerId: null,
    };
    expect(getWinnerId(match)).toBe(null);
  });
});

describe("createTbdTeamInfo", () => {
  it("returns a TBD team placeholder", () => {
    const tbd = createTbdTeamInfo();
    expect(tbd.id).toBe(0);
    expect(tbd.name).toBe("TBD");
    expect(tbd.code).toBe("TBD");
    expect(tbd.iso2).toBe("");
    expect(tbd.flag).toBe("");
  });
});

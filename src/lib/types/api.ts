// API response types from worldcup26.ir

export interface ApiTeam {
  _id: string;
  name_en: string;
  name_fa: string;
  flag: string;
  fifa_code: string;
  iso2: string;
  groups: string;
  id: string;
}

export interface ApiTeamStanding {
  team_id: string;
  mp: string; // matches played
  w: string; // wins
  l: string; // losses
  d: string; // draws
  pts: string; // points
  gf: string; // goals for
  ga: string; // goals against
  gd: string; // goal difference
  _id: string;
}

export interface ApiGroup {
  _id: string;
  name: string;
  teams: ApiTeamStanding[];
  createdAt: string;
  updatedAt?: string;
  __v: number;
}

// TODO: ApiStadium is defined but currently unused by the dashboard.
// If stadium data is needed (e.g., venue info on match cards), wire it up.
export interface ApiStadium {
  _id: string;
  id: string;
  name_en: string;
  name_fa: string;
  fifa_name: string;
  city_en: string;
  city_fa: string;
  country_en: string;
  country_fa: string;
  capacity: number;
  region: string;
}

export interface ApiTeamsResponse {
  teams: ApiTeam[];
}

export interface ApiGroupsResponse {
  groups: ApiGroup[];
}

// TODO: ApiStadiumsResponse is defined but currently unused by the dashboard.
export interface ApiStadiumsResponse {
  stadiums: ApiStadium[];
}

// TODO: Verify these fields match the actual worldcup26.ir /get/games response schema
export interface ApiMatch {
  _id: string;
  id: number;
  home_team_id: number;
  away_team_id: number;
  home_team_name: string;
  away_team_name: string;
  home_team_code: string;
  away_team_code: string;
  home_team_flag: string;
  away_team_flag: string;
  home_team_label: string;
  away_team_label: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  stage: string;
  date: string;
  time: string;
  venue: string;
  group: string;
}

export interface ApiMatchesResponse {
  matches: ApiMatch[];
}

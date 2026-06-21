export interface Team {
  id: number;
  name: string;
  code: string; // FIFA 3-letter code (e.g., "BRA", "GER")
  iso2: string; // ISO 2-letter country code (e.g., "br", "de")
  flag: string; // URL to flag image
  pastChampionships: number;
  group: string; // Group letter (A-L)
}

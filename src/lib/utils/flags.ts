export function getFlagUrl(iso2Code: string): string {
  if (!iso2Code) return "";
  return `https://flagcdn.com/w40/${iso2Code.toLowerCase()}.png`;
}

export function getFlagUrlLarge(iso2Code: string): string {
  if (!iso2Code) return "";
  return `https://flagcdn.com/w80/${iso2Code.toLowerCase()}.png`;
}

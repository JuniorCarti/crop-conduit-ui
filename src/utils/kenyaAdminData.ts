import countyCsv from "../../county.csv?raw";

export type KenyaAdminData = Record<string, Record<string, string[]>>;

type ConstituencyEntry = {
  name: string;
  wards: Map<string, string>;
};

type CountyEntry = {
  name: string;
  constituencies: Map<string, ConstituencyEntry>;
};

let cachedData: KenyaAdminData | null = null;
let cachedCounties: string[] | null = null;

const normalizeKey = (value: string) => value.trim().toLowerCase();
const sortAlpha = (a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base" });

function parseKenyaAdminCsv(csv: string): KenyaAdminData {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return {};

  const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
  const countyIndex = headers.indexOf("county_name");
  const constituencyIndex = headers.indexOf("constituency_name");
  const wardIndex = headers.indexOf("constituencies_wards");

  if (countyIndex < 0 || constituencyIndex < 0 || wardIndex < 0) {
    return {};
  }

  const counties = new Map<string, CountyEntry>();

  for (let i = 1; i < lines.length; i += 1) {
    const row = lines[i].split(",");
    const countyRaw = row[countyIndex]?.trim() ?? "";
    const constituencyRaw = row[constituencyIndex]?.trim() ?? "";
    const wardRaw = row[wardIndex]?.trim() ?? "";

    if (!countyRaw || !constituencyRaw || !wardRaw) continue;

    const countyKey = normalizeKey(countyRaw);
    const constituencyKey = normalizeKey(constituencyRaw);
    const wardKey = normalizeKey(wardRaw);

    let countyEntry = counties.get(countyKey);
    if (!countyEntry) {
      countyEntry = { name: countyRaw, constituencies: new Map() };
      counties.set(countyKey, countyEntry);
    }

    let constituencyEntry = countyEntry.constituencies.get(constituencyKey);
    if (!constituencyEntry) {
      constituencyEntry = { name: constituencyRaw, wards: new Map() };
      countyEntry.constituencies.set(constituencyKey, constituencyEntry);
    }

    if (!constituencyEntry.wards.has(wardKey)) {
      constituencyEntry.wards.set(wardKey, wardRaw);
    }
  }

  const result: KenyaAdminData = {};
  const orderedCounties = Array.from(counties.values()).sort((a, b) => sortAlpha(a.name, b.name));
  orderedCounties.forEach((countyEntry) => {
    const constituencies = Array.from(countyEntry.constituencies.values()).sort((a, b) =>
      sortAlpha(a.name, b.name)
    );
    const constituencyMap: Record<string, string[]> = {};
    constituencies.forEach((constituency) => {
      const wards = Array.from(constituency.wards.values()).sort(sortAlpha);
      constituencyMap[constituency.name] = wards;
    });
    result[countyEntry.name] = constituencyMap;
  });

  return result;
}

export function loadKenyaAdminData(): KenyaAdminData {
  if (!cachedData) {
    cachedData = parseKenyaAdminCsv(countyCsv);
  }
  return cachedData;
}

export function getCounties(): string[] {
  if (!cachedCounties) {
    const data = loadKenyaAdminData();
    cachedCounties = Object.keys(data).sort(sortAlpha);
  }
  return cachedCounties;
}

export function getConstituencies(county: string): string[] {
  if (!county) return [];
  const data = loadKenyaAdminData();
  const constituencies = Object.keys(data[county] || {});
  return constituencies.sort(sortAlpha);
}

export function getWards(county: string, constituency: string): string[] {
  if (!county || !constituency) return [];
  const data = loadKenyaAdminData();
  const wards = data[county]?.[constituency] || [];
  return [...wards].sort(sortAlpha);
}

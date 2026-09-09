export type WatchCompetitor = {
  name: string;
  aliases: string[];
  priority: 1 | 2 | 3;
};

export const defaultWasteCompetitors: WatchCompetitor[] = [
  { name: "PreZero", aliases: ["prezero", "prezero recycling"], priority: 1 },
  { name: "Ragn-Sells", aliases: ["ragn-sells", "ragn sells", "ragnsells"], priority: 1 },
  { name: "Stena Recycling", aliases: ["stena recycling", "stena recycling ab"], priority: 1 },
  { name: "REMONDIS", aliases: ["remondis", "remondis sweden"], priority: 2 },
  { name: "Verdis", aliases: ["verdis"], priority: 2 },
  { name: "Ohlssons", aliases: ["ohlssons", "ohlssons ab"], priority: 2 },
];

export const swedishGeographies = [
  "Sverige", "Örebro", "Värmland", "Västmanland", "Södermanland", "Stockholm",
  "Uppsala", "Dalarna", "Gävleborg", "Östergötland", "Jönköping", "Västra Götaland",
  "Skåne", "Halland", "Kalmar", "Kronoberg", "Blekinge", "Gotland", "Norrbotten",
  "Västerbotten", "Västernorrland", "Jämtland"
];

function includesNormalized(text: string, value: string) {
  return text.toLocaleLowerCase("sv-SE").includes(value.toLocaleLowerCase("sv-SE"));
}

export function matchCompetitors(text: string, competitors = defaultWasteCompetitors) {
  return competitors.filter(c => c.aliases.some(alias => includesNormalized(text, alias)));
}

export function matchGeographies(text: string) {
  return swedishGeographies.filter(area => includesNormalized(text, area));
}


function normalizeCompetitorName(value:string){
  return value.toLocaleLowerCase("sv-SE").replace(/[^a-z0-9åäö]+/g," ").replace(/\s+/g," ").trim();
}

export function canonicalizeCompetitorName(value:string, competitors=defaultWasteCompetitors){
  const normalized=normalizeCompetitorName(value);
  const match=competitors.find(c=>normalizeCompetitorName(c.name)===normalized||c.aliases.some(alias=>normalizeCompetitorName(alias)===normalized));
  return match?.name??value.trim();
}

export function canonicalizeCompetitorNames(values:string[], competitors=defaultWasteCompetitors){
  return [...new Set(values.map(value=>canonicalizeCompetitorName(value,competitors)).filter(Boolean))];
}

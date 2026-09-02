export type WatchCompetitor = {
  name: string;
  aliases: string[];
  priority: 1 | 2 | 3;
};

export const defaultWasteCompetitors: WatchCompetitor[] = [
  { name: "PreZero", aliases: ["prezero"], priority: 1 },
  { name: "Ragn-Sells", aliases: ["ragn-sells", "ragn sells", "ragnsells"], priority: 1 },
  { name: "Stena Recycling", aliases: ["stena recycling"], priority: 1 },
  { name: "Remondis", aliases: ["remondis"], priority: 2 },
  { name: "Verdis", aliases: ["verdis"], priority: 2 },
  { name: "Ohlssons", aliases: ["ohlssons"], priority: 2 },
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

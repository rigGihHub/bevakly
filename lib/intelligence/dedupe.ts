export type Candidate = { title: string; url: string; source: string; sourceId: string };

const stopWords = new Set(["och", "i", "på", "för", "att", "en", "ett", "med", "av", "till", "om", "den", "det", "de", "som"]);

function tokens(title: string) {
  return new Set(
    title.toLocaleLowerCase("sv-SE")
      .replace(/[^a-zåäö0-9 ]/gi, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
  );
}

function similarity(a: string, b: string) {
  const at = tokens(a); const bt = tokens(b);
  if (!at.size || !bt.size) return 0;
  let intersection = 0;
  for (const token of at) if (bt.has(token)) intersection += 1;
  return intersection / (at.size + bt.size - intersection);
}

export function dedupeCandidates(items: Candidate[]) {
  const groups: Array<Candidate & { duplicates: Candidate[] }> = [];
  for (const item of items) {
    const existing = groups.find((group) => similarity(group.title, item.title) >= 0.62);
    if (existing) existing.duplicates.push(item);
    else groups.push({ ...item, duplicates: [] });
  }
  return groups;
}

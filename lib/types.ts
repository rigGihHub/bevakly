export type Importance = "Kritisk" | "Mycket viktig" | "Relevant" | "Bevaka";

export type EventItem = {
  id: string;
  title: string;
  summary: string;
  whyItMatters: string;
  score: number;
  importance: Importance;
  category: string;
  company?: string;
  sourceCount: number;
  primarySource: string;
  date: string;
  geography: string;
  demo: boolean;
};

export type Competitor = {
  id: string;
  name: string;
  priority: 1 | 2 | 3;
  activityScore: number;
  latestSignal: string;
  mentions30d: number;
};

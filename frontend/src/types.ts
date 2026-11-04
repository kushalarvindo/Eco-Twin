export type Zone = {
  id: string;
  name: string;
  kind: string;
  description: string;
  map_number: number | null;
};
export type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  moderator: boolean;
  points: number;
  reports: number;
  challenges: number;
  badges: string[];
  rewards: {
    id: number;
    description: string;
    points: number;
    created_at: string;
  }[];
};
export type Fact = {
  fact_id: string;
  topic: string;
  field: string;
  value: string | number;
  unit: string | null;
  source_url: string;
  source_period: string | null;
  note: string;
};
export type Report = {
  id: number;
  title: string;
  category: string;
  description: string;
  zone: string;
  zone_name: string;
  status: string;
  assignee: string;
  mine: boolean;
  author: string;
  created_at: string;
  image: string;
  history: { status: string; note: string; created_at: string }[];
};
export type Challenge = {
  id: number;
  title: string;
  category: string;
  description: string;
  instructions: string;
  points: number;
  starts: string;
  ends: string;
  status: string | null;
  review_note: string;
  participants: number;
};
export type Result = {
  baseline: number;
  scenario: number;
  saved: number;
  percent: number | null;
  unit: string;
  model_version: string;
  assumptions: string;
  id?: number;
};
export type Saved = {
  id: number;
  title: string;
  kind: string;
  zone_id: string;
  result: Result;
  created_at: string;
};
export type Post = {
  id: number;
  body: string;
  author: string;
  zone_name: string;
  votes: number;
  voted: boolean;
  created_at: string;
};
export type Review = {
  id: number;
  challenge: string;
  user: string;
  note: string;
  image: string;
  status: string;
};

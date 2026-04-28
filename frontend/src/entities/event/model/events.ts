export type EventId =
  | "rev1905"
  | "ww1"
  | "rev1917"
  | "interwar"
  | "ww2"
  | "coldwar"
  | "ussr_end"
  | "russia90";

export interface HistoricEvent {
  id: EventId;
  label: string;
  years: [number, number];
  color: string;
}

export const EVENTS: HistoricEvent[] = [
  { id: "rev1905",  label: "Революция 1905",    years: [1905, 1907], color: "#c84b31" },
  { id: "ww1",      label: "Первая мировая",     years: [1914, 1918], color: "#8b3a3a" },
  { id: "rev1917",  label: "Революция 1917",     years: [1917, 1922], color: "#c84b31" },
  { id: "interwar", label: "Межвоенный период",  years: [1923, 1938], color: "#7a6a3a" },
  { id: "ww2",      label: "Вторая мировая",     years: [1939, 1945], color: "#2855a0" },
  { id: "coldwar",  label: "Холодная война",     years: [1946, 1991], color: "#2855a0" },
  { id: "ussr_end", label: "Распад СССР",        years: [1985, 1993], color: "#c84b31" },
  { id: "russia90", label: "Россия 1990-х",      years: [1991, 2000], color: "#2d7d59" },
];

export function deriveEvents(year: number): EventId[] {
  return EVENTS.filter((e) => year >= e.years[0] && year <= e.years[1]).map(
    (e) => e.id
  );
}

export type Theme = "Wars & Conflicts" | "Political Systems" | "Culture & Society";

export const THEME_COLOR: Record<Theme, string> = {
  "Wars & Conflicts":  "#c84b31",
  "Political Systems": "#2855a0",
  "Culture & Society": "#2d7d59",
};

export const THEME_LABEL: Record<Theme, string> = {
  "Wars & Conflicts":  "Войны",
  "Political Systems": "Политика",
  "Culture & Society": "Общество",
};

export const THEME_ICON: Record<Theme, string> = {
  "Wars & Conflicts":  "⚔",
  "Political Systems": "⚑",
  "Culture & Society": "◉",
};

export const CHANNEL_HUE: Record<string, number> = {
  "МИНАЕВ LIVE":       0,
  "Файб":              210,
  "Простая экономика": 150,
  "Владимир Логинов":  270,
};

export const ACCENT = "#c84b31";

// Keyword-based theme derivation from Russian main_topic text
export function deriveTheme(mainTopic: string | null, eventName: string | null): Theme {
  const text = `${mainTopic ?? ""} ${eventName ?? ""}`.toLowerCase();
  if (/война|конфликт|battle|armed|military|блокада|оборон/.test(text)) return "Wars & Conflicts";
  if (/полит|революц|систем|власт|государств|парт|реформ|перестрой|распад|кризис|конституц/.test(text)) return "Political Systems";
  return "Culture & Society";
}

export const PX = 76;   // pixels per year
export const SY = 1900; // start year
export const EY = 2001; // end year (exclusive)
export const LPAD = 140;
export const RPAD = 200;
export const TW = LPAD + (EY - SY) * PX + RPAD; // total canvas width

export const CW = 190; // card width

export const ROWS_COMFORT = [28, 224, 420];
export const ROWS_COMPACT = [24, 172, 320];
export const CH_COMFORT = 170;
export const CH_COMPACT = 136;

export const xOf = (year: number) => LPAD + (year - SY) * PX;

export const PERIODS = [
  { label: "Рубеж веков",         start: 1900, end: 1913, h: 45  },
  { label: "Первая мировая",      start: 1914, end: 1918, h: 15  },
  { label: "Межвоенный период",   start: 1919, end: 1938, h: 160 },
  { label: "Вторая мировая",      start: 1939, end: 1945, h: 0   },
  { label: "Холодная война",      start: 1946, end: 1991, h: 220 },
  { label: "Постсоветская эпоха", start: 1992, end: 2000, h: 280 },
] as const;

export const DECADES = Array.from({ length: 11 }, (_, i) => 1900 + i * 10);

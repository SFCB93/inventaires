import type { TimeRange } from "./types";

export const DEDUP_DISTANCE_METERS = 10;
export const MIN_PING_INTERVAL_SECONDS = 55;
export const MAX_TIMESTAMP_DRIFT_SECONDS = 60;
export const POSITION_RETENTION_DAYS = 90;
export const MAX_POSITION_HISTORY_POINTS = 5000;
export const POWERED_ALERT_THRESHOLD_HOURS = 4;

export const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const HOURS_PER_DAY = 24;

export const MS_PER_DAY = HOURS_PER_DAY * MS_PER_HOUR;

export const TIME_RANGE_HOURS: Record<TimeRange, number> = {
  "24h": HOURS_PER_DAY,
  "7d": HOURS_PER_DAY * 7,
  "30d": HOURS_PER_DAY * 30,
  "90d": HOURS_PER_DAY * 90,
};

export const ERROR_UNAUTHORIZED = "Accès non autorisé.";
export const ERROR_RATE_LIMITED = "Débit anormal.";

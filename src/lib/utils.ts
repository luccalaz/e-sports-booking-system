import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { fromZonedTime, format } from "date-fns-tz";
import { addDays, startOfDay } from "date-fns";
import { TIME_INTERVAL_MINUTES } from "./consts";

export function safeParseInt(value: string | undefined, defaultValue: number): number {
  const parsed = parseInt(value || "", 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Returns the start and end dates for a given number of days in advance.
 */
export function getDateRange(maxDaysAdvance: number): { startDate: Date; endDate: Date } {
  const now = new Date();
  const startDate = startOfDay(now);
  const endDate = addDays(startDate, maxDaysAdvance);
  return { startDate, endDate };
}

/**
 * Formats a duration in minutes to a human-readable string.
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(hours + (hours === 1 ? " hour" : " hours"));
  }

  if (remainingMinutes > 0) {
    parts.push(remainingMinutes + (remainingMinutes === 1 ? " minute" : " minutes"));
  }

  // If the duration is 0 minutes, return "0 minutes"
  if (parts.length === 0) {
    return "0 minutes";
  }

  return parts.join(" ");
}

/**
 * Merges two availability schedules, using the primary schedule if available.
 */
export function parseAvailability(
  primary: AvailabilityInput[],
  secondary?: AvailabilityInput[]
): AvailabilityOutput {
  const defaultAvailability: AvailabilityOutput = {
    "0": null,
    "1": null,
    "2": null,
    "3": null,
    "4": null,
    "5": null,
    "6": null,
  };

  const parseRaw = (raw: AvailabilityInput[]): AvailabilityOutput => {
    const output = { ...defaultAvailability };
    raw.forEach((item) => {
      output[String(item.weekday)] = {
        open: item.open_time,
        close: item.close_time,
        timezone: item.timezone,
      };
    });
    return output;
  };

  const primaryAvailability = parseRaw(primary);
  const secondaryAvailability = secondary ? parseRaw(secondary) : defaultAvailability;
  const merged: AvailabilityOutput = {};
  for (let day = 0; day < 7; day++) {
    const key = String(day);
    merged[key] = primaryAvailability[key] || secondaryAvailability[key] || null;
  }
  return merged;
}

export type AvailabilityInput = {
  weekday: number;
  open_time: string;
  close_time: string;
  timezone: string;
};

export type AvailabilityOutput = {
  [day: string]: { open: string; close: string; timezone: string } | null;
};

/**
 * Parses a time string and combines it with a date, treating the time as being in the provided timezone.
 */
export function parseTimeStringToDate(date: Date, timeStr: string, timezone: string): Date {
  const [timePart] = timeStr.split("-");
  const dateStr = format(date, "yyyy-MM-dd", { timeZone: timezone });
  const dateTimeStr = `${dateStr} ${timePart}`;
  return fromZonedTime(dateTimeStr, timezone);
}

/**
 * Transforms an array of settings rows into a key-value object.
 */
export function parseSettings(rawSettings: SettingsRow[]): Record<string, string> {
  return rawSettings.reduce((acc: Record<string, string>, row: SettingsRow) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

export type SettingsRow = {
  key: string;
  value: string;
};

/**
 * Rounds up a given date to the next quarter-hour.
 */
export function roundUpToNextQuarterHour(date: Date): Date {
  const d = new Date(date);
  const minutes = d.getMinutes();
  const remainder = minutes % TIME_INTERVAL_MINUTES;
  if (remainder === 0) {
    d.setMinutes(minutes + TIME_INTERVAL_MINUTES, 0, 0);
  } else {
    d.setMinutes(minutes + (TIME_INTERVAL_MINUTES - remainder), 0, 0);
  }
  return d;
}

/**
 * Capitalizes the first letter of each word in a string.
 */
export function capitalizeFirstLetter(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Merges class names using clsx and tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

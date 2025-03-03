import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Booking } from "./types";
import { fromZonedTime, format } from "date-fns-tz"

export type AvailabilityInput = {
  weekday: number;
  open_time: string;
  close_time: string;
};

export type AvailabilityOutput = {
  [day: string]: { open: string; close: string } | null;
};

export type SettingsRow = {
  key: string,
  value: string
}

/**
 * Checks if there is an available time slot within a given time range that can accommodate a booking of specified minimum duration.
 * 
 * @param bookings - Array of existing bookings to check against
 * @param dayStart - Start date/time of the range to check
 * @param dayEnd - End date/time of the range to check
 * @param minBookingDuration - Minimum booking duration needed (in minutes)
 * @returns Promise that resolves to a boolean indicating if a suitable slot is available
 */
export async function checkRangeSlotAvailability(bookings: Booking[], dayStart: Date, dayEnd: Date, minBookingDuration: number): Promise<boolean> {
  // Each interval is 15 minutes
  const intervalMs = 15 * 60 * 1000;

  // Determine how many consecutive 15-min intervals are needed
  const requiredIntervals = minBookingDuration / 15;

  let slotStart = new Date(dayStart);
  let freeIntervals = 0; // Count of consecutive free 15-min intervals

  while (slotStart < dayEnd) {
    const slotEnd = new Date(slotStart.getTime() + intervalMs);

    // If the slot would go past dayEnd, we can't fit a full 15-min interval
    if (slotEnd > dayEnd) break;

    // Check if this 15-minute interval overlaps any booking
    let isBlocked = false;
    isBlocked = bookings.some((bk: Booking) => {
      return (
        bk.start_timestamp < slotEnd &&
        bk.end_timestamp > slotStart
      );
    });

    if (!isBlocked) {
      freeIntervals++;
      // If we reached the required consecutive intervals, we have enough free time
      if (freeIntervals >= requiredIntervals) {
        return true;
      }
    } else {
      // Reset consecutive free count if blocked
      freeIntervals = 0;
    }

    // Move to the next 15-minute interval
    slotStart = slotEnd;
  }

  // If we never found enough consecutive free 15-min intervals
  return false;
}

/**
 * Merges two availability schedules, with the primary schedule taking precedence.
 * Each schedule defines opening and closing times for days of the week (0-6, Sunday to Saturday).
 * 
 * @param primary - The primary availability schedule that takes precedence
 * @param secondary - Optional secondary/fallback availability schedule
 * @returns An object mapping each day of the week (0-6) to either opening/closing times or null
 */
export function parseAvailability(primary: AvailabilityInput[], secondary?: AvailabilityInput[]): AvailabilityOutput {
  // Initialize an object with keys "0".."6" all set to null.
  const defaultAvailability: AvailabilityOutput = { "0": null, "1": null, "2": null, "3": null, "4": null, "5": null, "6": null };

  // Parse a raw array into an AvailabilityOutput object.
  const parseRaw = (raw: AvailabilityInput[]): AvailabilityOutput => {
    const output = { ...defaultAvailability };
    raw.forEach((item) => {
      // Use item.weekday as key (converted to string).
      output[String(item.weekday)] = {
        open: item.open_time,
        close: item.close_time,
      };
    });
    return output;
  };

  const primaryAvailability = parseRaw(primary);
  const secondaryAvailability = secondary ? parseRaw(secondary) : defaultAvailability;

  // Merge the two: for each day, use primary if available; otherwise use secondary.
  const merged: AvailabilityOutput = {};
  for (let day = 0; day < 7; day++) {
    const key = String(day);
    merged[key] = primaryAvailability[key] || secondaryAvailability[key] || null;
  }

  return merged;
}

/**
 * Parses a time string (from availability) and combines it with the provided date,
 * treating the time as being in the timezone. Returns a UTC Date.
 *
 * @param {Date} date - The date to which the time will be applied.
 * @param {string} timeStr - The time string (e.g. "09:00:00-04"). The offset may be ignored.
 * @param {string} timezone - The timezone of the client
 * @returns {Date} A UTC Date representing the combined date and local time.
 */
export function parseTimeStringToDate(date: Date, timeStr: string, timezone: string): Date {
  // Remove any timezone offset from the time string if present.
  const [timePart] = timeStr.split("-");
  // Format the date portion as YYYY-MM-DD.
  // (Assume the availability times are stored for the America/Halifax timezone.)
  const dateStr = format(date, "yyyy-MM-dd", { timeZone: timezone });
  const dateTimeStr = `${dateStr} ${timePart}`;
  // Convert the date-time string in the desired timezone to a UTC Date.
  return fromZonedTime(dateTimeStr, timezone);
}

/**
 * Transforms an array of settings rows into a key-value object.
 * 
 * @param rawSettings - An array of SettingsRow objects containing key-value pairs
 * @returns A record object where each key from the input array maps to its corresponding value
 */
export function parseSettings(rawSettings: SettingsRow[]): Record<string, string> {
  return rawSettings.reduce((acc: Record<string, string>, row: SettingsRow) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

/**
 * Returns a UTC Date representing the start of the day in the specified timezone.
 * For example, if the client is in America/New_York and it's Feb 26,
 * this function returns the UTC Date corresponding to Feb 26 00:00 in New York.
 *
 * @param {Date} date - The date to base the calculation on.
 * @param {string} timeZone - The client's IANA timezone.
 * @returns {Date} A UTC Date representing the start of that day in the given timezone.
 */
export function getStartOfDayInTimeZone(date: Date, timeZone: string): Date {
  const dateStr = format(date, "yyyy-MM-dd", { timeZone });
  return fromZonedTime(dateStr, timeZone);
}

/**
 * Rounds up a given date to the nearest 15-minute interval
 * For example: 14:23 becomes 14:30, 14:31 becomes 14:45
 * 
 * @param date - The input Date object to round up
 * @returns A new Date object rounded up to the nearest 15-minute interval
 */
export function roundUp15(date: Date): Date {
  const d = new Date(date);
  const minutes = d.getMinutes();
  const remainder = minutes % 15;
  if (remainder !== 0) {
    d.setMinutes(minutes + (15 - remainder), 0, 0);
  }
  return d;
}

/**
 * Capitalizes the first letter of each word in a string.
 * @param {string} string - The input string to be capitalized.
 * @returns {string} The string with the first letter of each word capitalized.
 */
export function capitalizeFirstLetter(string: string): string {
  return string.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
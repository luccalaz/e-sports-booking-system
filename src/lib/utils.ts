import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Booking } from "./types";

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

export async function checkRangeSlotAvailability(bookings: Booking[], dayStart: Date, dayEnd: Date, minBookingDuration: number, stationId?: string): Promise<boolean> {
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

export function parseAvailability(primary: AvailabilityInput[], secondary?: AvailabilityInput[]): AvailabilityOutput {
  // Helper: initialize an object with keys "0".."6" all set to null.
  const defaultAvailability: AvailabilityOutput = { "0": null, "1": null, "2": null, "3": null, "4": null, "5": null, "6": null };

  // Helper: parse a raw array into an AvailabilityOutput object.
  const parseRaw = (raw: AvailabilityInput[]): AvailabilityOutput => {
    const output = { ...defaultAvailability };
    raw.forEach((item) => {
      // Use item.day_of_week as key (converted to string).
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

export function parseSettings(rawSettings: SettingsRow[]): Record<string, string> {
  return rawSettings.reduce((acc: Record<string, string>, row: SettingsRow) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalizeFirstLetter(string: string) {
  return string.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function parseTimeStringToDate(date: Date, timeStr: string): Date {
  const parts = timeStr.split(":");
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1] || "0", 10);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0, 0);
}

export function roundUp15(date: Date): Date {
  const d = new Date(date);
  const minutes = d.getMinutes();
  const remainder = minutes % 15;
  if (remainder !== 0) {
    d.setMinutes(minutes + (15 - remainder), 0, 0);
  }
  return d;
}
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Booking } from "./types";
import { fromZonedTime, format } from "date-fns-tz";
import { addDays, startOfDay } from "date-fns";
import { createClient } from "@/utils/supabase/client";

// ========================
// Constants & Helpers
// ========================

const DEFAULT_MAX_DAYS_ADVANCE = 30;
const TIME_INTERVAL_MINUTES = 15;
const TIME_INTERVAL_MS = TIME_INTERVAL_MINUTES * 60 * 1000;

function safeParseInt(value: string | undefined, defaultValue: number): number {
  const parsed = parseInt(value || "", 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Returns the start and end dates for a given number of days in advance.
 */
function getDateRange(maxDaysAdvance: number): { startDate: Date; endDate: Date } {
  const now = new Date();
  const startDate = startOfDay(now);
  const endDate = addDays(startDate, maxDaysAdvance);
  return { startDate, endDate };
}

/**
 * Iterates over the date range and checks each day for at least one available slot.
 */
async function computeAvailableDates(
  startDate: Date,
  maxDaysAdvance: number,
  now: Date,
  availability: AvailabilityOutput,
  bookings: Booking[],
  minBookingDuration: number
): Promise<Date[]> {
  const availableDates: Date[] = [];
  for (let i = 0; i < maxDaysAdvance; i++) {
    const currentDate = addDays(startDate, i);
    const weekday = currentDate.getDay();
    const schedule = availability[String(weekday)];
    if (!schedule) continue;

    let dayStart = parseTimeStringToDate(currentDate, schedule.open, schedule.timezone);
    const dayEnd = parseTimeStringToDate(currentDate, schedule.close, schedule.timezone);

    // If today and current time is later than open time, start from the next available block.
    if (i === 0 && now > dayStart) {
      dayStart = roundUpToNextQuarterHour(now);
      if (dayStart >= dayEnd) continue;
    }
    const isSlotAvailable = await checkRangeSlotAvailability(bookings, dayStart, dayEnd, minBookingDuration);
    if (isSlotAvailable) {
      availableDates.push(currentDate);
    }
  }
  return availableDates;
}

// ========================
// Booking Flow Logic
// ========================

/**
 * Retrieves available booking dates for either lounge or station bookings.
 */
export async function getAvailableDates(stationId?: string): Promise<Date[]> {
  try {
    const supabase = createClient();

    // Fetch booking settings.
    const { data: settingsRows, error: settingsError } = await supabase
      .from("settings")
      .select()
      .in("key", [
        "lounge_max_days_in_advance",
        "station_max_days_in_advance",
        "lounge_min_booking_minutes",
        "station_min_booking_minutes",
      ]);
    if (settingsError || !settingsRows) {
      throw new Error("Error fetching settings");
    }
    const settingsMap = parseSettings(settingsRows);

    // Delegate to the appropriate branch.
    return stationId
      ? await getStationAvailableDates(stationId, settingsMap)
      : await getLoungeAvailableDates(settingsMap);
  } catch (err) {
    console.error(err);
    return [];
  }
}

/**
 * Retrieves available dates for lounge bookings.
 */
async function getLoungeAvailableDates(settingsMap: Record<string, string>): Promise<Date[]> {
  try {
    const supabase = createClient();
    const maxDaysAdvance = safeParseInt(settingsMap["lounge_max_days_in_advance"], DEFAULT_MAX_DAYS_ADVANCE);
    const minBookingDuration = safeParseInt(settingsMap["lounge_min_booking_minutes"], 30);
    const now = new Date();
    const { startDate, endDate } = getDateRange(maxDaysAdvance);

    // Fetch global lounge availability schedules.
    const { data: rawAvailability, error: availabilityError } = await supabase
      .from("availability_schedules")
      .select("weekday, open_time, close_time, timezone")
      .eq("type", "global_lounge");
    if (availabilityError || !rawAvailability) {
      throw new Error("Error fetching availability schedules");
    }
    const availability = parseAvailability(rawAvailability);

    // Fetch approved lounge bookings within the date range.
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("lounge_bookings")
      .select()
      .eq("status", "approved")
      .gte("start_timestamp", startDate.toISOString())
      .lte("start_timestamp", endDate.toISOString());
    if (bookingsError || !bookingsData) {
      throw new Error("Error fetching bookings");
    }
    const bookings = bookingsData.map((b: Booking) => ({
      ...b,
      start_timestamp: new Date(b.start_timestamp),
      end_timestamp: new Date(b.end_timestamp),
    }));

    return await computeAvailableDates(startDate, maxDaysAdvance, now, availability, bookings, minBookingDuration);
  } catch (err) {
    console.error(err);
    return [];
  }
}

/**
 * Retrieves available dates for station bookings.
 */
async function getStationAvailableDates(
  stationId: string,
  settingsMap: Record<string, string>
): Promise<Date[]> {
  try {
    const supabase = createClient();
    const maxDaysAdvance = safeParseInt(settingsMap["station_max_days_in_advance"], DEFAULT_MAX_DAYS_ADVANCE);
    const minBookingDuration = safeParseInt(settingsMap["station_min_booking_minutes"], 30);
    const now = new Date();
    const { startDate, endDate } = getDateRange(maxDaysAdvance);

    // Fetch availability schedules concurrently.
    const globalAvailabilityPromise = supabase
      .from("availability_schedules")
      .select("weekday, open_time, close_time, timezone")
      .eq("type", "global_station");
    const stationAvailabilityPromise = supabase
      .from("availability_schedules")
      .select("weekday, open_time, close_time, timezone")
      .eq("type", "station")
      .eq("station_id", stationId);
    const [globalAvailabilityResponse, stationAvailabilityResponse] = await Promise.all([
      globalAvailabilityPromise,
      stationAvailabilityPromise,
    ]);
    if (globalAvailabilityResponse.error || !globalAvailabilityResponse.data) {
      throw new Error("Error fetching global availability schedules");
    }
    const globalAvailabilityData = globalAvailabilityResponse.data;
    const stationAvailabilityData = stationAvailabilityResponse.data || [];
    const availability = parseAvailability(stationAvailabilityData, globalAvailabilityData);

    // Fetch bookings concurrently.
    const loungeBookingsPromise = supabase
      .from("lounge_bookings")
      .select()
      .eq("status", "approved")
      .gte("start_timestamp", startDate.toISOString())
      .lte("start_timestamp", endDate.toISOString());
    const stationBookingsPromise = supabase
      .from("station_bookings")
      .select()
      .eq("station_id", stationId)
      .neq("status", "cancelled")
      .gte("start_timestamp", startDate.toISOString())
      .lte("start_timestamp", endDate.toISOString());
    const [loungeBookingsResponse, stationBookingsResponse] = await Promise.all([
      loungeBookingsPromise,
      stationBookingsPromise,
    ]);
    if (
      loungeBookingsResponse.error ||
      stationBookingsResponse.error ||
      !loungeBookingsResponse.data ||
      !stationBookingsResponse.data
    ) {
      throw new Error("Error fetching bookings");
    }
    const bookingsData = [...loungeBookingsResponse.data, ...stationBookingsResponse.data];
    const bookings = bookingsData.map((b: Booking) => ({
      ...b,
      start_timestamp: new Date(b.start_timestamp),
      end_timestamp: new Date(b.end_timestamp),
    }));

    return await computeAvailableDates(startDate, maxDaysAdvance, now, availability, bookings, minBookingDuration);
  } catch (err) {
    console.error(err);
    return [];
  }
}

/**
 * Retrieves all available starting times for a given date.
 * If a stationId is provided, station start times are returned; otherwise, lounge start times.
 */
export async function getAvailableStartTimes(
  selectedDate: Date,
  stationId?: string
): Promise<Date[]> {
  return stationId
    ? await getStationAvailableStartTimes(selectedDate, stationId)
    : await getLoungeAvailableStartTimes(selectedDate);
}

/**
 * Retrieves available start times for lounge bookings.
 */
async function getLoungeAvailableStartTimes(selectedDate: Date): Promise<Date[]> {
  try {
    const supabase = createClient();
    const weekday = selectedDate.getDay();
    const settingsKey = "lounge_min_booking_minutes";

    // Fetch booking settings.
    const { data: settingsRows, error: settingsError } = await supabase
      .from("settings")
      .select()
      .in("key", [settingsKey]);
    if (settingsError || !settingsRows) {
      throw new Error("Error fetching settings");
    }
    const settingsMap = parseSettings(settingsRows);
    const minBookingDuration = safeParseInt(settingsMap[settingsKey], 15);

    // Fetch lounge availability schedules.
    const { data: loungeAvailabilityData, error: loungeAvailabilityError } = await supabase
      .from("availability_schedules")
      .select("weekday, open_time, close_time, timezone")
      .eq("type", "global_lounge");
    if (loungeAvailabilityError || !loungeAvailabilityData) {
      throw new Error("Error fetching lounge availability");
    }
    const availabilityData = parseAvailability(loungeAvailabilityData);
    if (!availabilityData[String(weekday)]) return [];
    const schedule = availabilityData[String(weekday)]!;
    const dayStart = parseTimeStringToDate(selectedDate, schedule.open, schedule.timezone);
    const dayEnd = parseTimeStringToDate(selectedDate, schedule.close, schedule.timezone);

    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    let candidateStartTime = dayStart.getTime();
    if (isToday) {
      const roundedNow = roundUpToNextQuarterHour(now);
      candidateStartTime = Math.max(dayStart.getTime(), roundedNow.getTime());
    }

    // Fetch lounge bookings for the day.
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("lounge_bookings")
      .select()
      .eq("status", "approved")
      .gte("start_timestamp", dayStart.toISOString())
      .lte("start_timestamp", dayEnd.toISOString());
    if (bookingsError || !bookingsData) {
      throw new Error("Error fetching lounge bookings");
    }
    const bookings = bookingsData.map((b: Booking) => ({
      ...b,
      start_timestamp: new Date(b.start_timestamp),
      end_timestamp: new Date(b.end_timestamp),
    }));

    // Iterate over candidate start times in 15-minute increments.
    const availableStartTimes: Date[] = [];
    const latestCandidateTime = dayEnd.getTime() - minBookingDuration * 60 * 1000;
    for (let candidateTime = candidateStartTime; candidateTime <= latestCandidateTime; candidateTime += TIME_INTERVAL_MS) {
      const candidateStart = new Date(candidateTime);
      const candidateEnd = new Date(candidateTime + minBookingDuration * 60 * 1000);
      const slotAvailable = await checkRangeSlotAvailability(bookings, candidateStart, candidateEnd, minBookingDuration);
      if (slotAvailable) {
        availableStartTimes.push(candidateStart);
      }
    }
    return availableStartTimes;
  } catch (err) {
    console.error(err);
    return [];
  }
}

/**
 * Retrieves available start times for station bookings.
 */
async function getStationAvailableStartTimes(
  selectedDate: Date,
  stationId: string
): Promise<Date[]> {
  try {
    const supabase = createClient();
    const weekday = selectedDate.getDay();
    const settingsKey = "station_min_booking_minutes";

    // Fetch booking settings.
    const { data: settingsRows, error: settingsError } = await supabase
      .from("settings")
      .select()
      .in("key", [settingsKey]);
    if (settingsError || !settingsRows) {
      throw new Error("Error fetching settings");
    }
    const settingsMap = parseSettings(settingsRows);
    const minBookingDuration = safeParseInt(settingsMap[settingsKey], 30);

    // Fetch station availability schedules concurrently.
    const stationAvailabilityPromise = supabase
      .from("availability_schedules")
      .select("weekday, open_time, close_time, timezone")
      .eq("type", "station")
      .eq("station_id", stationId);
    const globalAvailabilityPromise = supabase
      .from("availability_schedules")
      .select("weekday, open_time, close_time, timezone")
      .eq("type", "global_station");
    const [stationAvailabilityResponse, globalAvailabilityResponse] = await Promise.all([
      stationAvailabilityPromise,
      globalAvailabilityPromise,
    ]);
    if (globalAvailabilityResponse.error || !globalAvailabilityResponse.data) {
      throw new Error("Error fetching global station availability");
    }
    const availabilityData = parseAvailability(
      stationAvailabilityResponse.data || [],
      globalAvailabilityResponse.data
    );
    if (!availabilityData[String(weekday)]) return [];
    const schedule = availabilityData[String(weekday)]!;
    const dayStart = parseTimeStringToDate(selectedDate, schedule.open, schedule.timezone);
    const dayEnd = parseTimeStringToDate(selectedDate, schedule.close, schedule.timezone);

    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    let candidateStartTime = dayStart.getTime();
    if (isToday) {
      const roundedNow = roundUpToNextQuarterHour(now);
      candidateStartTime = Math.max(dayStart.getTime(), roundedNow.getTime());
    }

    // Fetch station bookings concurrently.
    const loungeBookingsPromise = supabase
      .from("lounge_bookings")
      .select()
      .eq("status", "approved")
      .gte("start_timestamp", dayStart.toISOString())
      .lte("start_timestamp", dayEnd.toISOString());
    const stationBookingsPromise = supabase
      .from("station_bookings")
      .select()
      .eq("station_id", stationId)
      .neq("status", "cancelled")
      .gte("start_timestamp", dayStart.toISOString())
      .lte("start_timestamp", dayEnd.toISOString());
    const [loungeBookingsResponse, stationBookingsResponse] = await Promise.all([
      loungeBookingsPromise,
      stationBookingsPromise,
    ]);
    if (
      loungeBookingsResponse.error ||
      stationBookingsResponse.error ||
      !loungeBookingsResponse.data ||
      !stationBookingsResponse.data
    ) {
      throw new Error("Error fetching bookings");
    }
    const bookings = [...loungeBookingsResponse.data, ...stationBookingsResponse.data].map((b: Booking) => ({
      ...b,
      start_timestamp: new Date(b.start_timestamp),
      end_timestamp: new Date(b.end_timestamp),
    }));

    // Iterate over candidate start times in 15-minute increments.
    const availableStartTimes: Date[] = [];
    const latestCandidateTime = dayEnd.getTime() - minBookingDuration * 60 * 1000;
    for (let candidateTime = candidateStartTime; candidateTime <= latestCandidateTime; candidateTime += TIME_INTERVAL_MS) {
      const candidateStart = new Date(candidateTime);
      const candidateEnd = new Date(candidateTime + minBookingDuration * 60 * 1000);
      const slotAvailable = await checkRangeSlotAvailability(bookings, candidateStart, candidateEnd, minBookingDuration);
      if (slotAvailable) {
        availableStartTimes.push(candidateStart);
      }
    }
    return availableStartTimes;
  } catch (err) {
    console.error(err);
    return [];
  }
}

/**
 * Checks if there is an available time slot within a given time range that can accommodate a booking.
 */
export async function checkRangeSlotAvailability(
  bookings: Booking[],
  dayStart: Date,
  dayEnd: Date,
  minBookingDuration: number
): Promise<boolean> {
  const requiredIntervals = minBookingDuration / TIME_INTERVAL_MINUTES;
  let slotStart = new Date(dayStart);
  let freeIntervals = 0;

  while (slotStart < dayEnd) {
    const slotEnd = new Date(slotStart.getTime() + TIME_INTERVAL_MS);
    if (slotEnd > dayEnd) break;
    const isBlocked = bookings.some(
      (bk: Booking) => bk.start_timestamp < slotEnd && bk.end_timestamp > slotStart
    );
    if (!isBlocked) {
      freeIntervals++;
      if (freeIntervals >= requiredIntervals) {
        return true;
      }
    } else {
      freeIntervals = 0;
    }
    slotStart = slotEnd;
  }
  return false;
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
 * Returns a UTC Date representing the start of the day in a given timezone.
 */
export function getStartOfDayInTimeZone(date: Date, timeZone: string): Date {
  const dateStr = format(date, "yyyy-MM-dd", { timeZone });
  return fromZonedTime(dateStr, timeZone);
}

/**
 * Rounds up a given date to the next quarter-hour.
 */
export function roundUpToNextQuarterHour(date: Date): Date {
  const d = new Date(date);
  const minutes = d.getMinutes();
  const remainder = minutes % TIME_INTERVAL_MINUTES;
  if (remainder !== 0) {
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

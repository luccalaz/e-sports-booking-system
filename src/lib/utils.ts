import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalizeFirstLetter(string: string) {
  return string.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function genPass(len: number, upper: boolean = true, nums: boolean = true, special: boolean = true) {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numChars = "0123456789";
  const specialChars = "!@#$%^&*()-_=+[]{}|;:,.<>?";
  let chars = lower;

  if (upper) chars += upperChars;
  if (nums) chars += numChars;
  if (special) chars += specialChars;

  let pass = "";
  for (let i = 0; i < len; i++) {
      const randIdx = Math.floor(Math.random() * chars.length);
      pass += chars[randIdx];
  }

  return pass;
}
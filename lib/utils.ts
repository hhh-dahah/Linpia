import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "M月d日", { locale: zhCN });
}

export function isBeforeToday(date: string) {
  return new Date(date).getTime() < new Date().setHours(0, 0, 0, 0);
}

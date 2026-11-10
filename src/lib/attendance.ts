import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

export const ATTENDANCE_CLASSES = [
  "LLB 3rd Semester",
  "LLB 5th Semester",
  "Islamic Studies",
] as const;

export const AttendanceSubmissionSchema = z.object({
  studentName: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(100, "Name must be 100 characters or fewer."),
  rollNumber: z
    .string()
    .trim()
    .min(1, "Enter your roll number.")
    .max(40, "Roll number must be 40 characters or fewer."),
  className: z.enum(ATTENDANCE_CLASSES, { message: "Choose your class." }),
});

const AttendanceFiltersSchema = z.object({
  className: z.enum(ATTENDANCE_CLASSES).optional(),
  attendanceDate: z.string().date().optional(),
});

export type AttendanceFilters = z.infer<typeof AttendanceFiltersSchema>;
export type AttendanceRow = Database["public"]["Tables"]["attendance_records"]["Row"];

export const getAttendanceRecords = createServerFn({ method: "GET" })
  .inputValidator((input: AttendanceFilters) => AttendanceFiltersSchema.parse(input))
  .handler(async ({ data }): Promise<AttendanceRow[]> => {
    const url =
      process.env["SUPABASE_URL"] ??
      process.env["VITE_SUPABASE_URL"] ??
      "https://nxrsuzfukeaskaecmpyi.supabase.co";
    const key =
      process.env["SUPABASE_PUBLISHABLE_KEY"] ??
      process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
      "sb_publishable_Uwb9RgZlIMpn9WStLDJYCA_hwkLcdQQ";
    if (!url || !key) {
      throw new Error("Attendance records are not available right now.");
    }

    const database = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    let query = database
      .from("attendance_records")
      .select("id, student_name, roll_number, class_name, attendance_date, marked_at")
      .order("attendance_date", { ascending: false })
      .order("marked_at", { ascending: false });

    if (data.className) query = query.eq("class_name", data.className);
    if (data.attendanceDate) query = query.eq("attendance_date", data.attendanceDate);

    const { data: records, error } = await query;
    if (error) {
      console.error("Attendance records could not be loaded.", error.code);
      throw new Error("Attendance records could not be loaded. Please try again.");
    }
    return records;
  });

export function getKarachiIsoDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: "year" | "month" | "day") =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function csvCell(value: string): string {
  const safeValue = /^[\s\u200b]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function buildAttendanceCsv(records: AttendanceRow[]): string {
  const header = ["Student Name", "Roll Number", "Class", "Date", "Time (Pakistan)"];
  const rows = records.map((record) => [
    record.student_name,
    record.roll_number,
    record.class_name,
    record.attendance_date,
    new Intl.DateTimeFormat("en-PK", {
      timeZone: "Asia/Karachi",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(record.marked_at)),
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

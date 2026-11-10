import { useState, useTransition } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Calendar,
  ChevronDown,
  Download,
  Filter,
  GraduationCap,
  LoaderCircle,
  RefreshCw,
  Search,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ATTENDANCE_CLASSES,
  buildAttendanceCsv,
  getKarachiIsoDate,
  type AttendanceRow,
} from "@/lib/attendance";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "Attendance Records | Campus Attendance Register" },
      { name: "description", content: "View and export campus student attendance records." },
    ],
  }),
  component: RecordsPage,
});

function formatPakistanDateTime(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("en-PK", {
      timeZone: "Asia/Karachi",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function RecordsPage() {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [, startTransition] = useTransition();

  const {
    data: records = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<AttendanceRow[]>({
    queryKey: ["attendance_records", selectedClass, selectedDate],
    queryFn: async () => {
      let query = supabase
        .from("attendance_records")
        .select("id, student_name, roll_number, class_name, attendance_date, marked_at")
        .order("attendance_date", { ascending: false })
        .order("marked_at", { ascending: false });

      if (selectedClass && selectedClass !== "all") {
        query = query.eq("class_name", selectedClass);
      }
      if (selectedDate) {
        query = query.eq("attendance_date", selectedDate);
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(error.message);
      }
      return data ?? [];
    },
  });

  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.student_name.toLowerCase().includes(q) ||
      r.roll_number.toLowerCase().includes(q) ||
      r.class_name.toLowerCase().includes(q)
    );
  });

  function handleDownloadCsv() {
    if (filteredRecords.length === 0) return;
    const csvContent = buildAttendanceCsv(filteredRecords);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateSuffix = selectedDate || getKarachiIsoDate(new Date());
    link.href = url;
    link.setAttribute("download", `attendance-records-${dateSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleResetFilters() {
    setSelectedClass("all");
    setSelectedDate("");
    setSearchQuery("");
  }

  return (
    <main className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-[70px] w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            to="/"
            className="inline-flex min-w-0 items-center gap-3 text-foreground no-underline"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground">
              <BookOpen className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-serif text-[15px] font-semibold">
                Campus Attendance
              </span>
              <span className="hidden text-[11px] text-muted-foreground sm:block">
                Student register
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex shrink-0 items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <UserCheck className="size-4" aria-hidden="true" />
              <span>Mark attendance</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              <span className="size-2 rounded-full bg-brand-accent" />
              <span>Register archive</span>
            </div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Attendance Records
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Historical records and class summaries logged in Pakistan Standard Time.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                startTransition(() => {
                  refetch();
                })
              }
              disabled={isFetching}
              className="h-10 text-xs font-semibold"
            >
              <RefreshCw className={`mr-1.5 size-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadCsv}
              disabled={filteredRecords.length === 0}
              className="h-10 text-xs font-semibold"
            >
              <Download className="mr-1.5 size-3.5" />
              Export CSV ({filteredRecords.length})
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 rounded-md border border-border bg-card p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="register-label text-xs" htmlFor="class-filter">
                Filter by class
              </Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="register-control text-sm" id="class-filter">
                  <SelectValue placeholder="All classes" />
                  <ChevronDown className="sr-only" aria-hidden="true" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {ATTENDANCE_CLASSES.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="register-label text-xs" htmlFor="date-filter">
                Filter by date
              </Label>
              <div className="relative">
                <Input
                  id="date-filter"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="register-control text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="register-label text-xs" htmlFor="search-filter">
                Search student or roll #
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search-filter"
                  type="text"
                  placeholder="e.g. 101 or Ahmed"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="register-control pl-9 text-sm"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={handleResetFilters}
                className="h-11 w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Reset filters
              </Button>
            </div>
          </div>
        </div>

        {/* Records Table / States */}
        <div className="mt-6 overflow-hidden rounded-md border border-border bg-card">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <LoaderCircle className="size-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Loading attendance logs…</p>
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-destructive">
                Could not load attendance records.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {(error as Error).message || "Please check connection and try again."}
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <GraduationCap className="size-6" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
                No attendance records found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedClass !== "all" || selectedDate || searchQuery
                  ? "Try clearing some filters to see more results."
                  : "No attendance has been registered yet."}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                {selectedClass !== "all" || selectedDate || searchQuery ? (
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Clear filters
                  </Button>
                ) : null}
                <Button asChild size="sm">
                  <Link to="/">Mark attendance now</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">
                      Student Name
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Roll Number
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Class
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Date (PKT)
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Marked Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="transition-colors hover:bg-muted/20">
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-foreground">
                        {record.student_name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                        <span className="rounded bg-secondary px-2 py-0.5 font-mono text-xs text-secondary-foreground">
                          {record.roll_number}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-brand-accent" />
                          <span>{record.class_name}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                        {record.attendance_date}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-muted-foreground">
                        {formatPakistanDateTime(record.marked_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

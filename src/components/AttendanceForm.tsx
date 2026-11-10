import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { BookOpen, CheckCircle2, ChevronDown, ClipboardList, LoaderCircle } from "lucide-react";

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
  AttendanceSubmissionSchema,
  getKarachiIsoDate,
} from "@/lib/attendance";
import { supabase } from "@/integrations/supabase/client";

type AttendanceSuccess = { name: string; date: string };

function formatKarachiDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: "Asia/Karachi",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function AttendanceForm() {
  const [studentName, setStudentName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [className, setClassName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<AttendanceSuccess | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(null);

    const parsed = AttendanceSubmissionSchema.safeParse({ studentName, rollNumber, className });
    if (!parsed.success) {
      setError(
        z.flattenError(parsed.error).formErrors[0] ?? "Please check your details and try again.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from("attendance_records").insert({
        student_name: parsed.data.studentName,
        roll_number: parsed.data.rollNumber,
        class_name: parsed.data.className,
      });

      if (insertError?.code === "23505") {
        setError("Attendance is already marked for this roll number and class today.");
        return;
      }
      if (insertError) {
        console.error("Attendance could not be submitted.", insertError.code);
        setError("Attendance could not be saved. Please try again.");
        return;
      }

      setSuccess({
        name: parsed.data.studentName,
        date: formatKarachiDate(getKarachiIsoDate(new Date())),
      });
      setStudentName("");
      setRollNumber("");
      setClassName("");
    } catch {
      setError("A connection issue prevented attendance from being saved. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
          <Link
            to="/records"
            className="inline-flex shrink-0 items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary"
          >
            <ClipboardList className="size-4" aria-hidden="true" />
            <span>Records</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-12 px-5 pb-16 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1fr_400px] lg:gap-20 lg:pb-24 lg:pt-24">
        <section className="max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            <span className="size-2 rounded-full bg-brand-accent" />
            <span>Student register</span>
          </div>
          <h1 className="max-w-lg font-serif text-[2.6rem] leading-[1.12] text-foreground sm:text-5xl sm:leading-[1.12]">
            Attendance,
            <br />
            recorded with care.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
            Enter your student details to mark today’s class attendance.
          </p>
          <div className="mt-9 grid max-w-md grid-cols-1 gap-x-8 gap-y-3 border-t border-border py-5 text-sm sm:grid-cols-2 sm:gap-y-4">
            {ATTENDANCE_CLASSES.map((name) => (
              <div key={name} className="flex min-w-0 items-center gap-2.5 text-foreground">
                <span className="size-1.5 shrink-0 rounded-full bg-brand-accent" />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full border-t-2 border-primary bg-card pt-6 sm:pt-8 lg:border-t-[3px]">
          <div className="mb-7">
            <h2 className="font-serif text-[26px] font-semibold text-foreground">
              Mark attendance
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              Fill in each field to register your presence.
            </p>
          </div>

          {success ? (
            <div
              className="border border-success/20 bg-success/5 px-5 py-6"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 className="size-9 text-success" aria-hidden="true" />
              <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">
                Attendance recorded
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {success.name}, your attendance is saved for {success.date} (Pakistan time).
              </p>
              <Button className="mt-5" variant="outline" onClick={() => setSuccess(null)}>
                Mark another student
              </Button>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <Label className="register-label" htmlFor="student-name">
                  Student name
                </Label>
                <Input
                  id="student-name"
                  className="register-control"
                  autoComplete="name"
                  placeholder="Enter full name"
                  value={studentName}
                  maxLength={100}
                  required
                  onChange={(event) => setStudentName(event.target.value)}
                />
              </div>
              <div>
                <Label className="register-label" htmlFor="roll-number">
                  Roll number
                </Label>
                <Input
                  id="roll-number"
                  className="register-control"
                  autoComplete="off"
                  placeholder="Enter roll number"
                  value={rollNumber}
                  maxLength={40}
                  required
                  onChange={(event) => setRollNumber(event.target.value)}
                />
              </div>
              <div>
                <Label className="register-label" htmlFor="class-select">
                  Select class
                </Label>
                <Select value={className} onValueChange={setClassName}>
                  <SelectTrigger
                    className="register-control"
                    id="class-select"
                    aria-label="Select class"
                  >
                    <SelectValue placeholder="Choose your class" />
                    <ChevronDown className="sr-only" aria-hidden="true" />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTENDANCE_CLASSES.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="h-11 w-full rounded-sm text-sm font-semibold"
                disabled={submitting}
              >
                {submitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
                {submitting ? "Saving attendance…" : "Mark attendance"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Recorded in Pakistan Standard Time
              </p>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  roll_number text NOT NULL,
  class_name text NOT NULL,
  attendance_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'Asia/Karachi')::date),
  marked_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_records_name_length CHECK (char_length(btrim(student_name)) BETWEEN 1 AND 100),
  CONSTRAINT attendance_records_roll_length CHECK (char_length(btrim(roll_number)) BETWEEN 1 AND 40),
  CONSTRAINT attendance_records_class_allowed CHECK (class_name IN ('LLB 3rd Semester', 'LLB 5th Semester', 'Islamic Studies')),
  CONSTRAINT attendance_records_unique_student_day UNIQUE (roll_number, class_name, attendance_date)
);
GRANT SELECT ON public.attendance_records TO anon;
GRANT INSERT (student_name, roll_number, class_name) ON public.attendance_records TO anon;
GRANT ALL ON public.attendance_records TO service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view attendance records" ON public.attendance_records FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can mark attendance" ON public.attendance_records FOR INSERT TO anon WITH CHECK (true);
CREATE OR REPLACE FUNCTION public.set_attendance_clock()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.student_name := btrim(NEW.student_name);
  NEW.roll_number := btrim(NEW.roll_number);
  NEW.attendance_date := (pg_catalog.now() AT TIME ZONE 'Asia/Karachi')::date;
  NEW.marked_at := pg_catalog.now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.set_attendance_clock() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER set_attendance_clock_before_insert
BEFORE INSERT ON public.attendance_records
FOR EACH ROW EXECUTE FUNCTION public.set_attendance_clock();
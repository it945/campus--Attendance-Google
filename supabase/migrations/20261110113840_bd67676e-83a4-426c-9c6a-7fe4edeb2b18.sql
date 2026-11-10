GRANT SELECT ON public.attendance_records TO authenticated;
GRANT INSERT (student_name, roll_number, class_name) ON public.attendance_records TO authenticated;
CREATE POLICY "Signed-in visitors can view attendance records" ON public.attendance_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in visitors can mark attendance" ON public.attendance_records FOR INSERT TO authenticated WITH CHECK (true);
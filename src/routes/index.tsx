import { createFileRoute } from "@tanstack/react-router";
import { AttendanceForm } from "@/components/AttendanceForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus Attendance Register" },
      { name: "description", content: "Mark and record student attendance for campus classes." },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  return <AttendanceForm />;
}

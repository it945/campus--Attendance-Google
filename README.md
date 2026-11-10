# Campus Attendance Register

Create a very simple, mobile-friendly Student Attendance Register web app.

Student Form:

Student Name (text input)

Roll Number (text input)

Select Class (dropdown)

Mark Attendance (button)

Classes:

LLB 3rd Semester

LLB 5th Semester

Islamic Studies

Functionality:

Students open a shared link, enter their details, select their class, and click "Mark Attendance".

Automatically save their name, roll number, class, date, and time in a Supabase database.

Show a success message after attendance is saved.

Prevent duplicate attendance for the same roll number, class, and date.

Use Pakistan time (Asia/Karachi) for attendance dates.

Add a simple /records page where I can view attendance records, filter by class and date, and download CSV.

Design:

Clean white background with dark blue buttons.

Simple, professional university-style layout.

Mobile responsive.

Important:

No login or authentication for now.

Connect to a real Supabase database, not dummy data.

Keep database structure simple. Use supbase

No additional features, charts, animations, or unnecessary pages.

Minimize implementation complexity and credit usage.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9e7baa68-da2c-4947-9774-658d31a1e034).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

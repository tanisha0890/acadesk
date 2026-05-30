import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SyncSpace - AI Collaborative Academic Timetable & Workload Planner",
  description: "Optimize your academic schedule, predict workloads, balance team tasks, find focus blocks, and eliminate deadline collisions with intelligent planning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}

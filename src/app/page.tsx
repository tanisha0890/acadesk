"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface Deadline {
  id: string;
  title: string;
  date: string;
  time: string;
  groupName: string;
  type: "Exam" | "Submission";
  severity: "Low" | "Medium" | "High"; // Low: 🟢, Medium: 🟡, High: 🔴
}

interface GroupActivity {
  id: string;
  name: string;
  deadlinesThisWeek: number;
  nearestDeadline: string;
  courseCode: string;
}

export default function Home() {
  const [currentPage, setCurrentPage] = useState<"splash" | "login" | "signup" | "dashboard">("splash");
  const [activeSubPage, setActiveSubPage] = useState<"main" | "heatmap" | "group">("main");
  const [selectedGroup, setSelectedGroup] = useState<GroupActivity | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  
  // Logged In User State
  const [loggedInEmail, setLoggedInEmail] = useState("surajchoudhary5002@gmail.com");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [tempAvatarUrl, setTempAvatarUrl] = useState<string | null>(null);
  const [showChangeProfileModal, setShowChangeProfileModal] = useState(false);

  // Form Password Eye Toggle States
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Form Fields State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // Quick Add Deadline State
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("23:59");
  const [newGroup, setNewGroup] = useState("CS301: Advanced Algorithms");
  const [newType, setNewType] = useState<"Exam" | "Submission">("Submission");

  // Edit / View Modal State
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);

  // Seed Data: User Groups
  const [groups, setGroups] = useState<GroupActivity[]>([
    { id: "group-1", name: "CS301: Advanced Algorithms", courseCode: "CS301", deadlinesThisWeek: 2, nearestDeadline: "Algorithms Midterm Exam - Tomorrow" },
    { id: "group-2", name: "CS302: Web Development", courseCode: "CS302", deadlinesThisWeek: 1, nearestDeadline: "Web Dev Lab Assignment - Jun 3" },
    { id: "group-3", name: "MA201: Linear Algebra", courseCode: "MA201", deadlinesThisWeek: 1, nearestDeadline: "Homework 4 - Jun 5" },
  ]);

  // Seed Data: Upcoming Deadlines (soonest first)
  const [deadlines, setDeadlines] = useState<Deadline[]>([
    { id: "dl-1", title: "Algorithms Midterm Exam", date: "2026-05-31", time: "10:00 AM", groupName: "CS301: Advanced Algorithms", type: "Exam", severity: "High" },
    { id: "dl-1-b", title: "Web Dev Quiz 2", date: "2026-05-31", time: "02:00 PM", groupName: "CS302: Web Development", type: "Exam", severity: "Medium" },
    { id: "dl-1-c", title: "Algorithms Assignment 3", date: "2026-05-31", time: "11:59 PM", groupName: "CS301: Advanced Algorithms", type: "Submission", severity: "Medium" },
    { id: "dl-2", title: "Database Design Submission", date: "2026-06-02", time: "11:59 PM", groupName: "CS302: Web Development", type: "Submission", severity: "Medium" },
    { id: "dl-2-b", title: "Algorithms Lab 4", date: "2026-06-02", time: "05:00 PM", groupName: "CS301: Advanced Algorithms", type: "Submission", severity: "Low" },
    { id: "dl-2-c", title: "Linear Algebra Quiz 3", date: "2026-06-02", time: "11:00 AM", groupName: "MA201: Linear Algebra", type: "Exam", severity: "High" },
    { id: "dl-2-d", title: "Web Dev Reading Response", date: "2026-06-02", time: "09:00 PM", groupName: "CS302: Web Development", type: "Submission", severity: "Low" },
    { id: "dl-3", title: "Web Dev Lab Assignment", date: "2026-06-03", time: "04:00 PM", groupName: "CS302: Web Development", type: "Submission", severity: "Low" },
    { id: "dl-4", title: "Linear Algebra Homework 4", date: "2026-06-05", time: "11:59 PM", groupName: "MA201: Linear Algebra", type: "Submission", severity: "High" },
    { id: "dl-5", title: "Software Engineering Presentation", date: "2026-06-07", time: "02:00 PM", groupName: "CS301: Advanced Algorithms", type: "Exam", severity: "Low" },
  ]);

  // Coordinate-normalized mouse movement hook
  useEffect(() => {
    let stopTimeout: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent) => {
      if (stopTimeout) {
        clearTimeout(stopTimeout);
      }

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      const ratioX = (e.clientX - centerX) / centerX;
      const ratioY = (e.clientY - centerY) / centerY;

      const targetX = ratioX * 40;
      const targetY = ratioY * 40;

      setMouseOffset({ x: targetX, y: targetY });

      stopTimeout = setTimeout(() => {
        setMouseOffset({ x: 0, y: 0 });
      }, 500);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (stopTimeout) {
        clearTimeout(stopTimeout);
      }
    };
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!showProfileDropdown) return;
    const closeDropdown = () => setShowProfileDropdown(false);
    window.addEventListener("click", closeDropdown);
    return () => window.removeEventListener("click", closeDropdown);
  }, [showProfileDropdown]);

  // Persistent avatar load on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAvatar = localStorage.getItem("syncspace_avatar");
      if (savedAvatar) {
        setAvatarUrl(savedAvatar);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      alert("Invalid file format. Please upload a JPG or PNG image! 🖼️");
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      alert("Image is too large! Please choose an image smaller than 2MB. ⚖️");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTempAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGetStarted = () => {
    setCurrentPage("login");
  };

  const navigateToSplash = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentPage("splash");
  };

  const navigateToSignup = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentPage("signup");
  };

  const navigateToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentPage("login");
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("Password reset link sent! ✉️");
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoggedInEmail(loginEmail || "student@university.edu");
    setCurrentPage("dashboard");
    setActiveSubPage("main");
  };

  // Sign up handler
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoggedInEmail(signupEmail || "student@university.edu");
    setCurrentPage("dashboard");
    setActiveSubPage("main");
  };

  // Log out handler
  const handleLogOut = () => {
    setCurrentPage("login");
    setActiveSubPage("main");
  };

  // Quick Add Deadline Handler
  const handleAddDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate) {
      alert("Please enter a title and select a date! 📅");
      return;
    }

    // Determine severity color based on title or random
    let severity: "Low" | "Medium" | "High" = "Low";
    if (newTitle.toLowerCase().includes("exam") || newTitle.toLowerCase().includes("midterm")) {
      severity = "High";
    } else if (newTitle.toLowerCase().includes("homework") || newTitle.toLowerCase().includes("assignment")) {
      severity = "Medium";
    }

    const newDl: Deadline = {
      id: `dl-${Date.now()}`,
      title: newTitle,
      date: newDate,
      time: newTime,
      groupName: newGroup,
      type: newType,
      severity
    };

    // Update upcoming list (sorting chronologically)
    const updatedDl = [...deadlines, newDl].sort((a, b) => {
      return new Date(`${a.date}T${a.time.includes("AM") || a.time.includes("PM") ? "12:00" : a.time}`).getTime() -
             new Date(`${b.date}T${b.time.includes("AM") || b.time.includes("PM") ? "12:00" : b.time}`).getTime();
    });

    setDeadlines(updatedDl);

    // Update corresponding group deadlines count
    setGroups(groups.map(g => {
      if (g.name === newGroup) {
        return {
          ...g,
          deadlinesThisWeek: g.deadlinesThisWeek + 1,
          nearestDeadline: `${newTitle} - ${newDate.substring(5)}`
        };
      }
      return g;
    }));

    // Reset inputs
    setNewTitle("");
    setNewDate("");
    alert("Deadline added successfully! 🚀");
  };

  // Mock Delete Deadline Handler
  const handleDeleteDeadline = (id: string) => {
    setDeadlines(deadlines.filter(dl => dl.id !== id));
    setSelectedDeadline(null);
    alert("Deadline deleted! 🗑️");
  };

  // Mock update/close modal
  const handleSaveDeadline = () => {
    setSelectedDeadline(null);
    alert("Deadline details saved! 💾");
  };

  // Dynamic 7-day schedule generator starting from "2026-05-30"
  const get7DayWindow = () => {
    const days = [];
    const today = new Date("2026-05-30"); // Anchor date matching our mock data timeline
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const date = String(d.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${date}`;
      
      const mmm = d.toLocaleString("en-US", { month: "short" });
      const dd = d.getDate();
      const displayDate = `${mmm} ${dd}`;
      
      const weekdayName = d.toLocaleString("en-US", { weekday: "short" });
      
      days.push({
        name: weekdayName,
        date: displayDate,
        dateString
      });
    }
    return days;
  };

  const weekdays = get7DayWindow();

  const getHeatmapColor = (dateString: string) => {
    // Count deadlines matching this day's date string
    const count = deadlines.filter(dl => dl.date === dateString).length;
    
    if (count <= 1) return { color: "bg-emerald-500", text: "Low Workload", indicator: "🟢", count };
    if (count <= 3) return { color: "bg-amber-500", text: "Medium Workload", indicator: "🟡", count };
    return { color: "bg-rose-500", text: "High Workload", indicator: "🔴", count };
  };

  return (
    <main className={`min-h-screen w-full flex flex-col items-center px-6 relative font-sans overflow-hidden transition-colors duration-500 ${
      darkMode ? "bg-[#0a0914]" : "bg-[#F0F4F8]"
    } ${currentPage === "dashboard" ? "py-8 justify-start" : "justify-center"}`}>
      
      {/* Absolute Dark Mode Toggle Button */}
      <button
        onClick={toggleDarkMode}
        className={`absolute top-6 right-6 z-50 p-3.5 rounded-full border shadow-md hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center ${
          darkMode 
            ? "bg-slate-900/80 border-slate-700 text-yellow-400 hover:bg-slate-800" 
            : "bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-50"
        }`}
        aria-label="Toggle Dark Mode"
      >
        {darkMode ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      {/* Fixed Back Arrow Button (Only active on login, signup & dashboard subpages) */}
      {(currentPage === "login" || currentPage === "signup" || (currentPage === "dashboard" && activeSubPage !== "main")) && (
        <button
          onClick={(e) => {
            if (currentPage === "dashboard") {
              setActiveSubPage("main");
            } else {
              navigateToSplash(e);
            }
          }}
          className={`fixed top-5 left-5 z-50 p-2 bg-transparent border-none cursor-pointer flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${
            darkMode 
              ? "text-[#38bdf8] hover:text-[#4ade80]" 
              : "text-[#3F51B5] hover:text-[#303F9F]"
          }`}
          aria-label="Go back"
        >
          <svg className="w-[28px] h-[28px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
      )}

      {/* Soft Abstract Background Circles */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div 
          className={`absolute -top-[100px] -right-[100px] w-[400px] h-[400px] rounded-full blur-[80px] transition-colors duration-500 ${
            darkMode ? "bg-indigo-900/35" : "bg-[#E0E7FF] opacity-80"
          }`}
          style={{
            transform: `translate(${mouseOffset.x}px, ${mouseOffset.y}px)`,
            transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), bg-color 0.5s ease"
          }}
        />
        <div 
          className={`absolute -bottom-[100px] -left-[100px] w-[350px] h-[350px] rounded-full blur-[80px] transition-colors duration-500 ${
            darkMode ? "bg-purple-950/30" : "bg-[#EDE9FE] opacity-80"
          }`}
          style={{
            transform: `translate(${mouseOffset.x}px, ${mouseOffset.y}px)`,
            transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), bg-color 0.5s ease"
          }}
        />
      </div>

      {/* RENDER CURRENT PAGE */}
      {currentPage === "splash" && (
        /* ==========================================================================
           SPLASH SCREEN
           ========================================================================== */
        <div className="w-full flex flex-col items-center justify-center animate-[fade-in_0.4s_ease-out_forwards]">
          <section className="w-full h-[70vh] flex flex-col justify-center items-center text-center select-none relative z-10" aria-labelledby="brand-title">
            <div className="relative w-[28vh] h-[28vh] max-w-[300px] max-h-[300px] min-w-[180px] min-h-[180px] mb-8 overflow-hidden rounded-lg">
              <div className="absolute inset-0 w-full h-[166%] top-0 left-0">
                <Image src="/logo.png" alt="SyncSpace Logo Symbol" fill priority className="object-cover object-top" />
              </div>
            </div>
            <h1 id="brand-title" className="text-[48px] sm:text-[72px] md:text-[96px] font-bold uppercase leading-none font-sans flex items-center justify-center">
              <span className={darkMode ? "text-[#38bdf8]" : "text-[#0c4786]"}>SYNC</span>
              <span className={darkMode ? "text-[#4ade80]" : "text-[#1fa291]"}>SPACE</span>
            </h1>
            <p className={`text-[14px] sm:text-[18px] md:text-[24px] font-normal tracking-[2px] uppercase leading-relaxed max-w-[950px] mt-6 font-sans transition-colors duration-500 ${
              darkMode ? "text-slate-400" : "text-[#6e7278]"
            }`}>
              COLLABORATIVE TIMETABLE & DEADLINE MANAGER
            </p>
          </section>

          <div className="mt-[50px] flex justify-center items-center relative z-10">
            <button
              onClick={handleGetStarted}
              className="w-[220px] h-[50px] text-[18px] font-bold text-white bg-[#3F51B5] hover:bg-[#303F9F] rounded-[50px] border-none shadow-sm hover:shadow-[0_10px_20px_rgba(0,0,0,0.15)] transition-all duration-300 ease-in-out transform hover:scale-[1.05] active:scale-[0.98] cursor-pointer flex items-center justify-center font-sans btn-shine"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {currentPage === "login" && (
        /* ==========================================================================
           LOGIN SCREEN
           ========================================================================== */
        <div className="w-full max-w-[400px] flex flex-col items-center justify-center relative z-10 animate-[fade-in-up_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
          <header className="flex flex-col items-center text-center mb-8 select-none">
            <div className="relative w-14 h-14 mb-3 overflow-hidden rounded-md">
              <div className="absolute inset-0 w-full h-[166%] top-0 left-0">
                <Image src="/logo.png" alt="SyncSpace Logo" fill priority className="object-cover object-top" />
              </div>
            </div>
            <h2 className="text-[40px] font-bold uppercase leading-none font-sans flex items-center justify-center">
              <span className={darkMode ? "text-[#38bdf8]" : "text-[#0c4786]"}>SYNC</span>
              <span className={darkMode ? "text-[#4ade80]" : "text-[#1fa291]"}>SPACE</span>
            </h2>
            <p className={`text-[14px] font-normal tracking-[1px] uppercase leading-none mt-2 font-sans transition-colors duration-500 ${
              darkMode ? "text-slate-400" : "text-[#6e7278]"
            }`}>
              COLLABORATIVE TIMETABLE & DEADLINE MANAGER
            </p>
          </header>

          <form onSubmit={handleLoginSubmit} className={`rounded-[24px] p-[40px] w-full flex flex-col transition-all duration-500 ${
            darkMode 
              ? "bg-[#131224]/80 border border-white/[0.06] shadow-[0_20px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-md text-white" 
              : "bg-white border-none shadow-[0_20px_35px_-10px_rgba(0,0,0,0.1)] text-slate-800"
          }`}>
            <h3 className={`text-[24px] font-bold text-center mb-1 font-sans ${darkMode ? "text-white" : "text-slate-800"}`}>Welcome Back</h3>
            <p className="text-[14px] text-center mb-8 font-sans text-slate-400">Sign in to continue</p>

            <div className="flex flex-col mb-5">
              <label htmlFor="login-email" className="text-[12px] font-semibold uppercase tracking-wider mb-2 block font-sans text-slate-400">Email</label>
              <input
                id="login-email"
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="student@university.edu"
                className={`w-full h-[48px] px-4 border rounded-[12px] text-[15px] font-sans transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#3F51B5] focus:border-[#3F51B5] ${
                  darkMode ? "bg-black/35 border-white/[0.08] text-white placeholder-slate-500" : "bg-white border-[#E2E8F0] text-slate-800 placeholder-slate-400"
                }`}
              />
            </div>

            <div className="flex flex-col mb-2">
              <label htmlFor="login-password" className="text-[12px] font-semibold uppercase tracking-wider mb-2 block font-sans text-slate-400">Password</label>
              <div className="relative w-full flex items-center">
                <input
                  id="login-password"
                  type={showLoginPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full h-[48px] pl-4 pr-12 border rounded-[12px] text-[15px] font-sans transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#3F51B5] focus:border-[#3F51B5] ${
                    darkMode ? "bg-black/35 border-white/[0.08] text-white placeholder-slate-500" : "bg-white border-[#E2E8F0] text-slate-800 placeholder-slate-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200 cursor-pointer flex items-center justify-center"
                >
                  {showLoginPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="text-right mb-6">
              <a href="#" onClick={handleForgotPassword} className="text-[13px] font-medium text-[#3F51B5] hover:text-[#303F9F] hover:underline font-sans">Forgot Password?</a>
            </div>

            <button type="submit" className="w-full h-[48px] text-[18px] font-bold text-white bg-[#3F51B5] hover:bg-[#303F9F] rounded-[50px] border-none shadow-sm hover:shadow-[0_10px_20px_rgba(0,0,0,0.15)] transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center font-sans btn-shine">
              Sign In
            </button>

            <div className={`text-center mt-6 text-sm font-sans ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Don't have an account?{" "}
              <a href="#" onClick={navigateToSignup} className="text-[#3F51B5] font-semibold hover:underline">Sign Up</a>
            </div>
          </form>
        </div>
      )}

      {currentPage === "signup" && (
        /* ==========================================================================
           SIGNUP SCREEN
           ========================================================================== */
        <div className="w-full max-w-[400px] flex flex-col items-center justify-center relative z-10 animate-[fade-in-up_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
          <header className="flex flex-col items-center text-center mb-8 select-none">
            <div className="relative w-14 h-14 mb-3 overflow-hidden rounded-md">
              <div className="absolute inset-0 w-full h-[166%] top-0 left-0">
                <Image src="/logo.png" alt="SyncSpace Logo" fill priority className="object-cover object-top" />
              </div>
            </div>
            <h2 className="text-[40px] font-bold uppercase leading-none font-sans flex items-center justify-center">
              <span className={darkMode ? "text-[#38bdf8]" : "text-[#0c4786]"}>SYNC</span>
              <span className={darkMode ? "text-[#4ade80]" : "text-[#1fa291]"}>SPACE</span>
            </h2>
            <p className={`text-[14px] font-normal tracking-[1px] uppercase leading-none mt-2 font-sans transition-colors duration-500 ${darkMode ? "text-slate-400" : "text-[#6e7278]"}`}>
              COLLABORATIVE TIMETABLE & DEADLINE MANAGER
            </p>
          </header>

          <form onSubmit={handleSignupSubmit} className={`rounded-[24px] p-[40px] w-full flex flex-col transition-all duration-500 ${
            darkMode 
              ? "bg-[#131224]/80 border border-white/[0.06] shadow-[0_20px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-md text-white" 
              : "bg-white border-none shadow-[0_20px_35px_-10px_rgba(0,0,0,0.1)] text-slate-800"
          }`}>
            <h3 className={`text-[24px] font-bold text-center mb-1 font-sans ${darkMode ? "text-white" : "text-slate-800"}`}>Create Account</h3>
            <p className="text-[14px] text-center mb-8 font-sans text-slate-400">Sign up to get started</p>

            <div className="flex flex-col mb-5">
              <label htmlFor="signup-name" className="text-[12px] font-semibold uppercase tracking-wider mb-2 block font-sans text-slate-400">Full Name</label>
              <input
                id="signup-name"
                type="text"
                required
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="Alex Rivera"
                className={`w-full h-[48px] px-4 border rounded-[12px] text-[15px] font-sans transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#3F51B5] focus:border-[#3F51B5] ${
                  darkMode ? "bg-black/35 border-white/[0.08] text-white placeholder-slate-500" : "bg-white border-[#E2E8F0] text-slate-800 placeholder-slate-400"
                }`}
              />
            </div>

            <div className="flex flex-col mb-5">
              <label htmlFor="signup-email" className="text-[12px] font-semibold uppercase tracking-wider mb-2 block font-sans text-slate-400">Email</label>
              <input
                id="signup-email"
                type="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="student@university.edu"
                className={`w-full h-[48px] px-4 border rounded-[12px] text-[15px] font-sans transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#3F51B5] focus:border-[#3F51B5] ${
                  darkMode ? "bg-black/35 border-white/[0.08] text-white placeholder-slate-500" : "bg-white border-[#E2E8F0] text-slate-800 placeholder-slate-400"
                }`}
              />
            </div>

            <div className="flex flex-col mb-6">
              <label htmlFor="signup-password" className="text-[12px] font-semibold uppercase tracking-wider mb-2 block font-sans text-slate-400">Password</label>
              <div className="relative w-full flex items-center">
                <input
                  id="signup-password"
                  type={showSignupPassword ? "text" : "password"}
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Create a password"
                  className={`w-full h-[48px] pl-4 pr-12 border rounded-[12px] text-[15px] font-sans transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#3F51B5] focus:border-[#3F51B5] ${
                    darkMode ? "bg-black/35 border-white/[0.08] text-white placeholder-slate-500" : "bg-white border-[#E2E8F0] text-slate-800 placeholder-slate-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200 cursor-pointer flex items-center justify-center"
                >
                  {showSignupPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full h-[48px] text-[18px] font-bold text-white bg-[#3F51B5] hover:bg-[#303F9F] rounded-[50px] border-none shadow-sm hover:shadow-[0_10px_20px_rgba(0,0,0,0.15)] transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center font-sans btn-shine">
              Sign Up
            </button>

            <div className={`text-center mt-6 text-sm font-sans ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Already have an account?{" "}
              <a href="#" onClick={navigateToLogin} className="text-[#3F51B5] font-semibold hover:underline">Sign In</a>
            </div>
          </form>
        </div>
      )}

      {currentPage === "dashboard" && (
        /* ==========================================================================
           MAIN DASHBOARD SYSTEM
           ========================================================================== */
        <div className="w-full max-w-[1100px] flex flex-col relative z-10 animate-[fade-in_0.4s_ease-out_forwards] select-none">
          
          {/* A. Dynamic Navigation Header Card */}
          <header className={`rounded-[24px] p-5 flex justify-between items-center mb-8 border transition-all duration-500 ${
            darkMode 
              ? "bg-[#131224]/80 border-white/[0.06] shadow-[0_10px_25px_rgba(0,0,0,0.5)] backdrop-blur-md" 
              : "bg-white border-slate-100 shadow-[0_10px_25px_rgba(0,0,0,0.05)]"
          }`}>
            <div className="select-none">
              <h2 className="text-xl font-bold uppercase leading-none font-sans flex items-center">
                <span className={darkMode ? "text-[#38bdf8]" : "text-[#0c4786]"}>SYNC</span>
                <span className={darkMode ? "text-[#4ade80]" : "text-[#1fa291]"}>SPACE</span>
              </h2>
            </div>

            <div className="flex items-center gap-[10px] relative">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileDropdown(!showProfileDropdown);
                  }}
                  className="w-10 h-10 rounded-full bg-[#E2E8F0] hover:bg-[#cbd5e1] dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors duration-200 flex items-center justify-center font-bold text-slate-800 dark:text-slate-100 cursor-pointer shadow-sm focus:outline-none border-none overflow-hidden"
                  aria-label="User Menu"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    "S"
                  )}
                </button>
                {showProfileDropdown && (
                  <div className={`absolute left-0 top-12 mt-1 w-52 rounded-xl border py-1.5 z-50 shadow-md font-sans transition-all duration-200 animate-[fade-in-up_0.15s_ease-out_forwards] ${
                    darkMode 
                      ? "bg-[#131224] border-white/[0.08] text-white shadow-[0_10px_20px_rgba(0,0,0,0.5)]" 
                      : "bg-white border-slate-100 text-slate-800 shadow-[0_10px_20px_rgba(0,0,0,0.05)]"
                  }`}>
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        setTempAvatarUrl(avatarUrl);
                        setShowChangeProfileModal(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-[14px] font-medium text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors duration-150 cursor-pointer flex items-center gap-2 border-none"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                      </svg>
                      Change Profile Picture
                    </button>
                  </div>
                )}
              </div>
              <span className="text-[14px] font-normal text-[#64748B] dark:text-slate-400 transition-colors duration-500">
                {loggedInEmail}
              </span>
              <button
                onClick={handleLogOut}
                className={`p-2 bg-transparent border-none cursor-pointer rounded-full transition-colors duration-200 flex items-center justify-center ${
                  darkMode ? "hover:bg-white/[0.05]" : "hover:bg-slate-50"
                }`}
                title="Log Out"
                aria-label="Log Out"
              >
                <svg className="w-5 h-5 text-rose-500 dark:text-rose-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </header>

          {/* SUBPAGE VIEW: MAIN / HEATMAP / GROUP */}
          {activeSubPage === "main" ? (
            /* ==========================================
               MAIN ROUTER VIEW
               ========================================== */
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-8 items-start animate-[fade-in_0.4s_ease-out_forwards]">
              
              {/* LEFT COLUMN */}
              <div className="flex flex-col gap-8 w-full">
                
                {/* 1. Workload Heatmap Card */}
                <section 
                  onClick={() => setActiveSubPage("heatmap")}
                  className={`rounded-[24px] p-6 border cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
                    darkMode 
                      ? "bg-[#131224]/80 border-white/[0.06] shadow-[0_15px_30px_rgba(0,0,0,0.4)] backdrop-blur-md" 
                      : "bg-white border-slate-100 shadow-[0_15px_30px_rgba(0,0,0,0.05)] hover:shadow-md"
                  }`}
                >
                  <div className="flex justify-between items-center mb-5">
                    <h3 className={`text-[16px] font-bold uppercase tracking-wider font-sans ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      Workload Heatmap (7 Days)
                    </h3>
                    <span className="text-[12px] font-bold text-[#3F51B5] dark:text-[#38bdf8] uppercase tracking-wider hover:underline flex items-center gap-1">
                      Expand
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                      </svg>
                    </span>
                  </div>

                  {/* 7-Day Mini Heatmap Grid */}
                  <div className="grid grid-cols-7 gap-2.5">
                    {weekdays.map((day, idx) => {
                      const analysis = getHeatmapColor(day.dateString);
                      return (
                        <div 
                          key={day.name} 
                          className={`flex flex-col items-center p-2.5 rounded-xl border transition-all duration-300 ${
                            darkMode 
                              ? "bg-black/20 border-white/[0.04] hover:bg-black/40" 
                              : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                          }`}
                          title={`${day.name} - ${analysis.text} (${analysis.count} deadlines)`}
                        >
                          <span className={`text-[11px] font-bold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{day.name}</span>
                          <span className={`text-[13px] font-bold my-1 leading-tight tracking-tight text-center ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{day.date}</span>
                          <span className={`w-3.5 h-3.5 rounded-full ${analysis.color} shadow-sm animate-pulse`} />
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex justify-between items-center text-[12px] font-medium text-slate-400">
                    <span>🟢 0-1 Low</span>
                    <span>🟡 2-3 Med</span>
                    <span>🔴 4+ High</span>
                  </div>
                </section>

                {/* 2. Quick Add Deadline Form */}
                <section className={`rounded-[24px] p-6 border transition-all duration-500 ${
                  darkMode 
                    ? "bg-[#131224]/80 border-white/[0.06] shadow-[0_15px_30px_rgba(0,0,0,0.4)] backdrop-blur-md text-white" 
                    : "bg-white border-slate-100 shadow-[0_15px_30px_rgba(0,0,0,0.05)] text-slate-800"
                }`}>
                  <h3 className={`text-[16px] font-bold uppercase tracking-wider font-sans mb-5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Quick Add Deadline
                  </h3>
                  
                  <form onSubmit={handleAddDeadline} className="flex flex-col gap-4">
                    {/* Title */}
                    <div className="flex flex-col">
                      <label htmlFor="new-title" className="text-[11px] font-semibold text-slate-400 uppercase mb-1.5 tracking-wider">Title</label>
                      <input 
                        id="new-title"
                        type="text" 
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Lab Assignment 5"
                        className={`h-11 px-3.5 rounded-xl border text-[14px] font-sans focus:outline-none focus:ring-1 focus:ring-[#3F51B5] focus:border-[#3F51B5] transition-all duration-200 ${
                          darkMode ? "bg-black/35 border-white/[0.08] text-white" : "bg-white border-[#E2E8F0] text-slate-800"
                        }`}
                      />
                    </div>

                    {/* Grid: Date and Group */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label htmlFor="new-date" className="text-[11px] font-semibold text-slate-400 uppercase mb-1.5 tracking-wider">Date</label>
                        <input 
                          id="new-date"
                          type="date" 
                          required
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className={`h-11 px-3.5 rounded-xl border text-[14px] font-sans focus:outline-none focus:ring-1 focus:ring-[#3F51B5] focus:border-[#3F51B5] transition-all duration-200 ${
                            darkMode ? "bg-black/35 border-white/[0.08] text-white" : "bg-white border-[#E2E8F0] text-slate-800"
                          }`}
                        />
                      </div>

                      <div className="flex flex-col">
                        <label htmlFor="new-group" className="text-[11px] font-semibold text-slate-400 uppercase mb-1.5 tracking-wider">Group</label>
                        <select 
                          id="new-group"
                          value={newGroup}
                          onChange={(e) => setNewGroup(e.target.value)}
                          className={`h-11 px-3.5 rounded-xl border text-[14px] font-sans focus:outline-none focus:ring-1 focus:ring-[#3F51B5] focus:border-[#3F51B5] transition-all duration-200 ${
                            darkMode ? "bg-black/35 border-white/[0.08] text-white" : "bg-white border-[#E2E8F0] text-slate-800"
                          }`}
                        >
                          {groups.map(g => (
                            <option key={g.id} value={g.name}>{g.courseCode}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Grid: Time and Type */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label htmlFor="new-time" className="text-[11px] font-semibold text-slate-400 uppercase mb-1.5 tracking-wider">Time</label>
                        <input 
                          id="new-time"
                          type="time" 
                          required
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          className={`h-11 px-3.5 rounded-xl border text-[14px] font-sans focus:outline-none focus:ring-1 focus:ring-[#3F51B5] focus:border-[#3F51B5] transition-all duration-200 ${
                            darkMode ? "bg-black/35 border-white/[0.08] text-white animate-none" : "bg-white border-[#E2E8F0] text-slate-800"
                          }`}
                        />
                      </div>

                      <div className="flex flex-col">
                        <label htmlFor="new-type" className="text-[11px] font-semibold text-slate-400 uppercase mb-1.5 tracking-wider">Type</label>
                        <select 
                          id="new-type"
                          value={newType}
                          onChange={(e) => setNewType(e.target.value as "Exam" | "Submission")}
                          className={`h-11 px-3.5 rounded-xl border text-[14px] font-sans focus:outline-none focus:ring-1 focus:ring-[#3F51B5] focus:border-[#3F51B5] transition-all duration-200 ${
                            darkMode ? "bg-black/35 border-white/[0.08] text-white" : "bg-white border-[#E2E8F0] text-slate-800"
                          }`}
                        >
                          <option value="Submission">Submission</option>
                          <option value="Exam">Exam</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full h-11 text-base font-bold text-white bg-[#3F51B5] hover:bg-[#303F9F] rounded-[12px] border-none shadow-sm transition-all duration-300 ease-in-out transform hover:scale-[1.01] active:scale-[0.98] cursor-pointer flex items-center justify-center font-sans btn-shine mt-2"
                    >
                      Add Deadline
                    </button>
                  </form>
                </section>
              </div>

              {/* RIGHT COLUMN */}
              <div className="flex flex-col gap-8 w-full">
                
                {/* 3. Upcoming Deadlines Section */}
                <section className={`rounded-[24px] p-6 border transition-all duration-500 ${
                  darkMode 
                    ? "bg-[#131224]/80 border-white/[0.06] shadow-[0_15px_30px_rgba(0,0,0,0.4)] backdrop-blur-md text-white" 
                    : "bg-white border-slate-100 shadow-[0_15px_30px_rgba(0,0,0,0.05)] text-slate-800"
                }`}>
                  <h3 className={`text-[16px] font-bold uppercase tracking-wider font-sans mb-5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Upcoming Deadlines ({deadlines.length})
                  </h3>

                  <div className="flex flex-col gap-4 max-h-[380px] overflow-y-auto pr-1">
                    {deadlines.slice(0, 5).map(dl => {
                      const colorMap = { Low: "bg-emerald-500", Medium: "bg-amber-500", High: "bg-rose-500" };
                      return (
                        <div 
                          key={dl.id}
                          onClick={() => setSelectedDeadline(dl)}
                          className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-300 hover:translate-x-1 ${
                            darkMode 
                              ? "bg-black/20 border-white/[0.04] hover:bg-black/35 hover:border-white/[0.08]" 
                              : "bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${colorMap[dl.severity]}`} />
                            <div className="flex flex-col">
                              <h4 className={`text-[15px] font-bold transition-colors ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{dl.title}</h4>
                              <span className="text-[12px] text-slate-400 mt-0.5">{dl.groupName.split(":")[0]} • {dl.date} at {dl.time}</span>
                            </div>
                          </div>

                          <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            dl.type === "Exam" 
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                              : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                          }`}>
                            {dl.type}
                          </span>
                        </div>
                      );
                    })}

                    {deadlines.length === 0 && (
                      <div className="text-center py-10 text-slate-400 font-sans">
                        No upcoming deadlines! Enjoy your free time! 🎉
                      </div>
                    )}
                  </div>
                </section>



              </div>
            </div>
          ) : activeSubPage === "heatmap" ? (
            /* ==========================================
               FULL HEATMAP VIEW
               ========================================== */
            <div className={`rounded-[24px] p-[40px] border w-full flex flex-col transition-all duration-500 animate-[fade-in-up_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards] ${
              darkMode 
                ? "bg-[#131224]/80 border-white/[0.06] shadow-[0_20px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-md text-white" 
                : "bg-white border-none shadow-[0_20px_35px_-10px_rgba(0,0,0,0.1)] text-slate-800"
            }`}>
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                <div>
                  <h3 className="text-[24px] font-bold font-sans">Full Workload Heatmap</h3>
                  <p className="text-[14px] text-slate-400 mt-1">Detailed calendar schedule showing exam and homework loads for the week</p>
                </div>
                <button 
                  onClick={() => setActiveSubPage("main")}
                  className="px-4 py-2 text-sm font-semibold rounded-full bg-[#3F51B5] text-white hover:bg-[#303F9F] cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  ← Dashboard
                </button>
              </div>

              {/* Full Heatmap Columns */}
              <div className="flex flex-col gap-6 font-sans">
                {weekdays.map((day, idx) => {
                  const analysis = getHeatmapColor(day.dateString);
                  return (
                    <div 
                      key={day.name}
                      className={`p-5 rounded-xl border flex items-center justify-between transition-colors ${
                        darkMode ? "bg-black/25 border-white/[0.04]" : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-[110px] text-center font-bold py-2 rounded-xl text-sm ${
                          darkMode ? "bg-white/[0.03] text-white" : "bg-white text-slate-700 shadow-sm border border-slate-100"
                        }`}>
                          {day.name} {day.date}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-[15px] font-bold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{analysis.text}</span>
                          <span className="text-[12px] text-slate-400 mt-0.5">{analysis.count} deadline(s) scheduled for this day</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`w-3.5 h-3.5 rounded-full ${analysis.color} shadow-md animate-pulse`} />
                        <span className="text-sm font-bold text-slate-400 capitalize">{analysis.color.split("-")[1]} Mode</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ==========================================
               GROUP DETAILED VIEW
               ========================================== */
            selectedGroup && (
              <div className={`rounded-[24px] p-[40px] border w-full flex flex-col transition-all duration-500 animate-[fade-in-up_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards] ${
                darkMode 
                  ? "bg-[#131224]/80 border-white/[0.06] shadow-[0_20px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-md text-white" 
                  : "bg-white border-none shadow-[0_20px_35px_-10px_rgba(0,0,0,0.1)] text-slate-800"
              }`}>
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-[#3F51B5]/10 text-[#3F51B5] dark:text-[#38bdf8] dark:bg-white/[0.05] border border-[#3F51B5]/20 font-sans">
                      {selectedGroup.courseCode} Group
                    </span>
                    <h3 className="text-[24px] font-bold font-sans mt-3">{selectedGroup.name}</h3>
                  </div>
                  <button 
                    onClick={() => setActiveSubPage("main")}
                    className="px-4 py-2 text-sm font-semibold rounded-full bg-[#3F51B5] text-white hover:bg-[#303F9F] cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    ← Dashboard
                  </button>
                </div>

                {/* Group Details widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
                  
                  {/* Group Members and Info */}
                  <div className={`p-6 rounded-xl border ${
                    darkMode ? "bg-black/25 border-white/[0.04]" : "bg-slate-50 border-slate-100"
                  }`}>
                    <h4 className="text-lg font-bold mb-4">Course Information</h4>
                    <div className="flex flex-col gap-3 text-sm text-slate-400 leading-relaxed">
                      <p><strong>Code</strong>: {selectedGroup.courseCode}</p>
                      <p><strong>Professor</strong>: Dr. Marcus Vance</p>
                      <p><strong>Deadlines this week</strong>: {selectedGroup.deadlinesThisWeek} active schedule items</p>
                      <p><strong>Upcoming Nearest</strong>: {selectedGroup.nearestDeadline}</p>
                    </div>
                  </div>

                  {/* Group Schedule */}
                  <div className={`p-6 rounded-xl border ${
                    darkMode ? "bg-black/25 border-white/[0.04]" : "bg-slate-50 border-slate-100"
                  }`}>
                    <h4 className="text-lg font-bold mb-4">Active Calendar</h4>
                    <div className="flex flex-col gap-3.5">
                      {deadlines.filter(dl => dl.groupName === selectedGroup.name).map(dl => (
                        <div key={dl.id} className="p-3 rounded-lg bg-white dark:bg-black/20 border border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
                          <span className="text-[13px] font-bold">{dl.title}</span>
                          <span className="text-[11px] text-slate-400">{dl.date}</span>
                        </div>
                      ))}

                      {deadlines.filter(dl => dl.groupName === selectedGroup.name).length === 0 && (
                        <div className="text-center py-6 text-slate-400 text-sm">
                          No pending items for this group! 🛡️
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )
          )}

        </div>
      )}

      {/* DYNAMIC EDIT / DETAIL VIEW MODAL */}
      {selectedDeadline && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out_forwards]">
          <div 
            className={`rounded-[24px] p-8 max-w-[420px] w-full border relative animate-[fade-in-up_0.3s_cubic-bezier(0.16,1,0.3,1)_forwards] ${
              darkMode 
                ? "bg-[#131224] border-white/[0.08] text-white shadow-[0_25px_50px_rgba(0,0,0,0.6)]" 
                : "bg-white border-slate-100 text-slate-800 shadow-[0_25px_50px_rgba(0,0,0,0.15)]"
            }`}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                selectedDeadline.type === "Exam" 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                  : "bg-blue-500/10 border-blue-500/20 text-blue-500"
              }`}>
                {selectedDeadline.type}
              </span>
              <button 
                onClick={() => setSelectedDeadline(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer bg-transparent border-none"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <h4 className="text-xl font-bold mb-4 font-sans">{selectedDeadline.title}</h4>
            
            <div className="flex flex-col gap-3.5 text-[14px] text-slate-400 font-sans mb-8">
              <p><strong>Course Group</strong>: {selectedDeadline.groupName}</p>
              <p><strong>Scheduled Date</strong>: {selectedDeadline.date}</p>
              <p><strong>Target Time</strong>: {selectedDeadline.time}</p>
              <p className="flex items-center gap-1.5">
                <strong>Workload Status</strong>: 
                <span className={`w-2.5 h-2.5 rounded-full inline-block ${
                  selectedDeadline.severity === "High" 
                    ? "bg-rose-500" 
                    : selectedDeadline.severity === "Medium" 
                    ? "bg-amber-500" 
                    : "bg-emerald-500"
                }`} />
                {selectedDeadline.severity} priority
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button 
                onClick={handleSaveDeadline}
                className="flex-1 h-11 text-sm font-bold text-white bg-[#3F51B5] hover:bg-[#303F9F] rounded-xl border-none shadow-sm transition-all duration-200 cursor-pointer"
              >
                Save Details
              </button>
              <button 
                onClick={() => handleDeleteDeadline(selectedDeadline.id)}
                className="h-11 px-4 text-sm font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/20 transition-all duration-200 cursor-pointer"
                title="Delete deadline"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PROFILE PICTURE MODAL */}
      {showChangeProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out_forwards]">
          <div 
            className={`rounded-[24px] p-8 max-w-[380px] w-full border relative animate-[fade-in-up_0.3s_cubic-bezier(0.16,1,0.3,1)_forwards] flex flex-col items-center ${
              darkMode 
                ? "bg-[#131224] border-white/[0.08] text-white shadow-[0_25px_50px_rgba(0,0,0,0.6)]" 
                : "bg-white border-slate-100 text-slate-800 shadow-[0_25px_50px_rgba(0,0,0,0.15)]"
            }`}
          >
            {/* Modal Header */}
            <div className="w-full flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold font-sans">Change Profile Picture</h4>
              <button 
                onClick={() => {
                  setShowChangeProfileModal(false);
                  setTempAvatarUrl(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer bg-transparent border-none"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Body: Avatar Preview */}
            <div className="w-20 h-20 rounded-full bg-[#E2E8F0] dark:bg-slate-700 flex items-center justify-center font-bold text-[32px] text-slate-800 dark:text-slate-100 shadow-md border overflow-hidden mb-6 relative">
              {tempAvatarUrl ? (
                <img src={tempAvatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                "S"
              )}
            </div>

            {/* Actions / Buttons */}
            <div className="flex flex-col gap-3 w-full items-center mb-8">
              <label 
                htmlFor="avatar-file-upload" 
                className="w-full h-11 text-sm font-bold text-white bg-[#3F51B5] hover:bg-[#303F9F] rounded-xl cursor-pointer shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 9 9m-9-9v12" />
                </svg>
                Upload New Picture
              </label>
              <input 
                id="avatar-file-upload" 
                type="file" 
                accept="image/png, image/jpeg" 
                className="hidden" 
                onChange={handleFileChange} 
              />

              {tempAvatarUrl && (
                <button
                  type="button"
                  onClick={() => setTempAvatarUrl(null)}
                  className="w-full h-11 text-sm font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/20 transition-all duration-200 cursor-pointer"
                >
                  Remove Picture
                </button>
              )}

              <span className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-1">
                Supports JPG, PNG (Max 2MB)
              </span>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => {
                  setShowChangeProfileModal(false);
                  setTempAvatarUrl(null);
                }}
                className={`flex-1 h-11 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer border ${
                  darkMode
                    ? "bg-transparent border-white/[0.1] text-slate-300 hover:bg-white/[0.05]"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setAvatarUrl(tempAvatarUrl);
                  if (tempAvatarUrl) {
                    localStorage.setItem("syncspace_avatar", tempAvatarUrl);
                  } else {
                    localStorage.removeItem("syncspace_avatar");
                  }
                  setShowChangeProfileModal(false);
                  alert("Profile picture updated! 👤");
                }}
                className="flex-1 h-11 text-sm font-bold text-white bg-[#3F51B5] hover:bg-[#303F9F] rounded-xl border-none shadow-sm transition-all duration-200 cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

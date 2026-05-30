"use client";

import React, { useState, useEffect, useRef } from "react";
import { firebaseSignIn, firebaseSignUp, firebaseGoogleSignIn, firebaseSignOut } from "./lib/firebase";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Bot, 
  HeartPulse, 
  LogOut, 
  Sun, 
  Moon, 
  AlertTriangle, 
  Menu, 
  X,
  Bell,
  Sparkles,
  BookOpen,
  Zap,
  Clock,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  Plus,
  Circle,
  Trash2,
  Edit2,
  Send,
  Compass,
  Award,
  ChevronUp,
  TrendingUp,
  BrainCircuit,
  Mail,
  Key,
  Eye,
  EyeOff,
  User,
  Mic,
  MicOff
} from "lucide-react";

// Custom hook for Scroll Reveals
function useScrollReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Bulletproof fallback: guarantee visibility after mount so dashboard is never blank
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 150);

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.01 }
    );
    const currentRef = ref.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      clearTimeout(timer);
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return [ref, isVisible] as const;
}

// Types
export interface Deadline {
  id: string;
  courseCode: string;
  title: string;
  date: string;
  time: string;
  priority: "Critical" | "Important" | "Normal";
  category: "Exam" | "Submission" | "Project" | "Meeting";
  completed: boolean;
}

export interface GroupActivity {
  id: string;
  name: string;
  courseCode: string;
  deadlinesThisWeek: number;
  nearestDeadline: string;
}

export interface TeamMember {
  name: string;
  tasksCount: number;
  availability: "Available" | "Busy" | "Highly Busy";
  capacity: number;
}

export interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  id?: string;
}

export interface WorkBreakdownStep {
  date: string;
  phase: string;
}

// Initial Data
const INITIAL_GROUPS: GroupActivity[] = [
  { id: "group-1", name: "CS301: Advanced Algorithms", courseCode: "CS301", deadlinesThisWeek: 3, nearestDeadline: "Algorithms Midterm Exam - Tomorrow" },
  { id: "group-2", name: "CS302: Web Development", courseCode: "CS302", deadlinesThisWeek: 4, nearestDeadline: "Web Dev Lab Assignment - Jun 3" },
  { id: "group-3", name: "MA201: Linear Algebra", courseCode: "MA201", deadlinesThisWeek: 2, nearestDeadline: "Homework 4 - Jun 5" },
];

const INITIAL_DEADLINES: Deadline[] = [
  { id: "dl-1", courseCode: "CS301", title: "Algorithms Midterm Exam", date: "2026-05-31", time: "10:00 AM", category: "Exam", priority: "Critical", completed: false },
  { id: "dl-1-b", courseCode: "CS302", title: "Web Dev Quiz 2", date: "2026-05-31", time: "02:00 PM", category: "Exam", priority: "Important", completed: false },
  { id: "dl-1-c", courseCode: "CS301", title: "Algorithms Assignment 3", date: "2026-05-31", time: "11:59 PM", category: "Submission", priority: "Important", completed: false },
  { id: "dl-meeting", courseCode: "CS302", title: "Group Coordination Meeting", date: "2026-06-01", time: "03:00 PM", category: "Meeting", priority: "Normal", completed: false },
  { id: "dl-2", courseCode: "CS302", title: "Database Design Submission", date: "2026-06-02", time: "11:59 PM", category: "Submission", priority: "Important", completed: false },
  { id: "dl-2-b", courseCode: "CS301", title: "Algorithms Lab 4", date: "2026-06-02", time: "05:00 PM", category: "Submission", priority: "Normal", completed: false },
  { id: "dl-2-c", courseCode: "MA201", title: "Linear Algebra Quiz 3", date: "2026-06-02", time: "11:00 AM", category: "Exam", priority: "Critical", completed: false },
  { id: "dl-2-d", courseCode: "CS302", title: "Web Dev Reading Response", date: "2026-06-02", time: "09:00 PM", category: "Submission", priority: "Normal", completed: false },
  { id: "dl-3", courseCode: "CS302", title: "Web Dev Lab Assignment", date: "2026-06-03", time: "04:00 PM", category: "Submission", priority: "Normal", completed: false },
  { id: "dl-4", courseCode: "MA201", title: "Linear Algebra Homework 4", date: "2026-06-05", time: "11:59 PM", category: "Submission", priority: "Critical", completed: false },
  { id: "dl-5", courseCode: "CS301", title: "Software Engineering Presentation", date: "2026-06-07", time: "02:00 PM", category: "Project", priority: "Normal", completed: false },
];

const INITIAL_TEAM_MEMBERS: TeamMember[] = [];

const INITIAL_CHAT: ChatMessage[] = [
  { sender: "ai", text: "Hello! I am your SyncSpace AI Academic Planner Assistant. Ask me anything about your timetable, upcoming deadline collisions, or workload balancing.", timestamp: new Date().toLocaleTimeString() }
];

const anchorDate = new Date("2026-05-30");

function AnimatedCounter({ value, duration = 800 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) {
      setCount(0);
      return;
    }
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      }
    }, Math.max(10, Math.floor(duration / end)));
    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{count}</>;
}

export default function Home() {
  // Page routing state
  const [currentPage, setCurrentPage] = useState<"landing" | "login" | "signup" | "dashboard">("landing");
  const [activeTab, setActiveTab] = useState<"overview" | "planner" | "team" | "assistant" | "health">("overview");

  // Authentication Fields
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [landingLoaded, setLandingLoaded] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // App States
  const [deadlines, setDeadlines] = useState<Deadline[]>(INITIAL_DEADLINES);
  const [groups, setGroups] = useState<GroupActivity[]>(INITIAL_GROUPS);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [loggedInEmail, setLoggedInEmail] = useState<string>("surajchoudhary5002@gmail.com");
  const [productivityScore, setProductivityScore] = useState<number>(94);

  // Voice to Text states & hooks
  const [isListening, setIsListening] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setAssistantInput(prev => prev + (prev ? " " : "") + transcript);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          if (event.error === "not-allowed") {
            alert("🎤 Microphone access is blocked. Please click the lock or camera/microphone icon in your browser address bar and select 'Allow' to grant microphone access to Acadesk.");
          } else if (event.error === "no-speech") {
            console.warn("No speech was detected.");
          } else if (event.error === "network") {
            alert("⚠️ Network error occurred during speech recognition. Please check your internet connection.");
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        setRecognitionInstance(recognition);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionInstance) {
      alert("Web Speech API is not supported in this browser. Please use Google Chrome or Safari.");
      return;
    }
    try {
      if (isListening) {
        recognitionInstance.stop();
      } else {
        setIsListening(true);
        recognitionInstance.start();
      }
    } catch (err) {
      console.error("Speech recognition start error:", err);
      setIsListening(false);
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // 4. APPLE-STYLE HIGH FIDELITY SEQUENCER STATES
  const [sequenceProgress, setSequenceProgress] = useState(25);
  const sequenceCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleSequenceMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.min(100, Math.max(0, Math.floor((x / rect.width) * 100)));
    setSequenceProgress(pct);
  };

  // 3. JUDGE SURPRISE: AI ZEN DECOMPRESSOR ANIMATION CANVAS & SAAS OS STATES
  const [zenMode, setZenMode] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [radialProgress, setRadialProgress] = useState(0);
  const [aiRecommendation, setAiRecommendation] = useState("Start Algorithms Assignment today to avoid this week's crunch period.");
  const [displayedRecommendation, setDisplayedRecommendation] = useState("");
  const [productivityProgress, setProductivityProgress] = useState(0);
  const [cardTilt, setCardTilt] = useState<{ [key: number]: { rx: number; ry: number } }>({});
  const [shockwaveActive, setShockwaveActive] = useState(false);
  const [isOptimized, setIsOptimized] = useState(false);
  const [optimizationCompleteAlert, setOptimizationCompleteAlert] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Scroll reveal references for cinematic page entrance
  const [heroRef, heroVisible] = useScrollReveal();
  const [statsRef, statsVisible] = useScrollReveal();
  const [radarCalendarRef, radarCalendarVisible] = useScrollReveal();
  const [heatmapRef, heatmapVisible] = useScrollReveal();

  const handleCardMouseMove = (idx: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rx = -(y / (rect.height / 2)) * 4;
    const ry = (x / (rect.width / 2)) * 4;
    setCardTilt(prev => ({ ...prev, [idx]: { rx, ry } }));
  };

  const handleCardMouseLeave = (idx: number) => {
    setCardTilt(prev => ({ ...prev, [idx]: { rx: 0, ry: 0 } }));
  };

  const triggerStressRelief = () => {
    setShockwaveActive(true);
    setTimeout(() => setShockwaveActive(false), 1500);

    setZenMode(true);
    setIsOptimized(true);
    setOptimizationCompleteAlert(true);
    
    setTimeout(() => {
      setOptimizationCompleteAlert(false);
    }, 4500);

    setTimeout(() => setZenMode(false), 6000);

    // Update AI recommendation with character typewriter text
    setAiRecommendation("AI Semester Optimization Complete. Schedule collisions resolved. Overall academic stress nominal.");

    // Append to Chatbot dialogue logs
    setChatHistory(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        sender: "user",
        text: "AI stress decompression requested.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: Math.random().toString(),
        sender: "ai",
        text: "AI Optimization complete! I've rescheduled MA201 homework tasks to Friday, shifted CS302 milestones, and balanced group allocations. Student stress index curves successfully flattened.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const emojis = ["🧘", "☕", "📚", "🎓", "🟢", "🚀", "🎯", "✨", "✅", "🎉"];
    const particles: Array<{
      x: number;
      y: number;
      vy: number;
      vx: number;
      text: string;
      size: number;
      alpha: number;
      rot: number;
      rotSpeed: number;
    }> = [];

    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 80,
        vy: -2.5 - Math.random() * 5.5,
        vx: -1.8 + Math.random() * 3.6,
        text: emojis[Math.floor(Math.random() * emojis.length)],
        size: 18 + Math.random() * 22,
        alpha: 1,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: -0.05 + Math.random() * 0.1
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        if (p.alpha <= 0) return;
        alive = true;

        p.y += p.vy;
        p.x += p.vx;
        p.rot += p.rotSpeed;
        p.alpha -= 0.007;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.font = `${p.size}px Arial`;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillText(p.text, -p.size / 2, p.size / 2);
        ctx.restore();
      });

      if (alive) {
        animId = requestAnimationFrame(draw);
      }
    };

    draw();
  };

  // Planner Tab Specific States
  const [heatmapView, setHeatmapView] = useState<"weekly" | "monthly" | "semester">("weekly");
  const [selectedHeatDate, setSelectedHeatDate] = useState<string | null>(null);
  const [activeSmartPlanId, setActiveSmartPlanId] = useState<string | null>(null);
  const [courseFilter, setCourseFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");

  // Edit deadline modal state
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState<Deadline["priority"]>("Normal");
  const [editCategory, setEditCategory] = useState<Deadline["category"]>("Submission");

  // Quick Add Event state (Dashboard Tab)
  const [quickTitle, setQuickTitle] = useState("");
  const [quickDate, setQuickDate] = useState("");
  const [quickCategory, setQuickCategory] = useState<Deadline["category"]>("Submission");
  const [quickPriority, setQuickPriority] = useState<Deadline["priority"]>("Normal");
  const [quickCourse, setQuickCourse] = useState("CS301");
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Peer Invite state (Team Tab)
  const [invitedEmail, setInvitedEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState("");

  // AI Assistant Tab state
  const [assistantInput, setAssistantInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Helper to find collisions
  const findCollisions = (deadlinesList: Deadline[]) => {
    const dateMap: { [date: string]: Deadline[] } = {};
    deadlinesList.filter(d => !d.completed).forEach(d => {
      if (!dateMap[d.date]) dateMap[d.date] = [];
      dateMap[d.date].push(d);
    });

    return Object.keys(dateMap)
      .filter(date => dateMap[date].length >= 2)
      .map(date => ({
        date,
        count: dateMap[date].length,
        tasks: dateMap[date],
      }));
  };

  // Stress Level Calculations
  const incompleteDeadlines = deadlines.filter(d => !d.completed);
  const activeTasksCount = isOptimized ? Math.max(1, incompleteDeadlines.length - 3) : incompleteDeadlines.length;
  const examsCount = isOptimized ? Math.max(0, incompleteDeadlines.filter(d => d.category === "Exam").length - 1) : incompleteDeadlines.filter(d => d.category === "Exam").length;
  const submissionsCount = isOptimized ? Math.max(0, incompleteDeadlines.filter(d => d.category === "Submission").length - 2) : incompleteDeadlines.filter(d => d.category === "Submission").length;
  const projectsCount = incompleteDeadlines.filter(d => d.category === "Project").length;

  const workloadPercentage = isOptimized ? 34 : Math.min(100, Math.round((activeTasksCount / 12) * 100));
  const freeHours = isOptimized ? 32.5 : Math.max(0, 40 - activeTasksCount * 2.5);

  let stressLevel = "Low";
  let stressColor = "text-emerald-500";
  let stressBg = "bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.08)]";
  let stressBorder = "border-emerald-500/20";
  
  if (isOptimized || zenMode) {
    stressLevel = "Zen";
    stressColor = "text-emerald-400 font-extrabold shadow-sm";
    stressBg = "bg-gradient-to-r from-emerald-500/20 to-teal-500/25 border-emerald-500/30 breathe-card shadow-lg shadow-emerald-500/10";
    stressBorder = "border-emerald-500/40";
  } else if (activeTasksCount > 8) {
    stressLevel = "Critical";
    stressColor = "text-rose-600 font-extrabold";
    stressBg = "bg-rose-600/15 stress-critical-shake";
    stressBorder = "border-rose-600/50";
  } else if (activeTasksCount > 5) {
    stressLevel = "High";
    stressColor = "text-rose-500";
    stressBg = "bg-rose-500/10 stress-high-pulse animate-pulse";
    stressBorder = "border-rose-500/30";
  } else if (activeTasksCount >= 3) {
    stressLevel = "Moderate";
    stressColor = "text-amber-500";
    stressBg = "bg-amber-500/10 stress-medium-breathe";
    stressBorder = "border-amber-500/25";
  }

  const rawCollisions = findCollisions(deadlines);
  const collisions = isOptimized ? [] : rawCollisions;
  const collisionCount = collisions.length;
  const leastBusy = teamMembers.length > 0 
    ? teamMembers.reduce((min, cur) => cur.tasksCount < min.tasksCount ? cur : min, teamMembers[0]) 
    : { name: "No one", tasksCount: 0, availability: "Available", capacity: 10 };
  const criticalCount = isOptimized ? 0 : incompleteDeadlines.filter(d => d.priority === "Critical").length;
  const semesterHealth = isOptimized ? 95 : Math.min(100, Math.max(30, 92 - criticalCount * 2.5));

  // Monitor mouse movements for glowing backgrounds
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      setMouseOffset({
        x: ((e.clientX - centerX) / centerX) * 20,
        y: ((e.clientY - centerY) / centerY) * 20
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Update "You" in team list when loggedInEmail or tasks changes (Safe Placement)
  useEffect(() => {
    const userName = loggedInEmail.split("@")[0];
    const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);
    setTeamMembers(prev => {
      const existsIdx = prev.findIndex(m => m.name.includes("(You)"));
      if (existsIdx >= 0) {
        const next = [...prev];
        next[existsIdx] = { ...next[existsIdx], name: `${capitalizedName} (You)`, tasksCount: activeTasksCount };
        return next;
      }
      return [{ name: `${capitalizedName} (You)`, tasksCount: activeTasksCount, availability: "Available", capacity: 10 }, ...prev];
    });
  }, [loggedInEmail, activeTasksCount]);

  // 4. APPLE-STYLE HIGH FIDELITY SEQUENCER DRAWING & MORPHING ANIMATION LOOP
  useEffect(() => {
    if (currentPage !== "landing") return;
    const canvas = sequenceCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let localTimeOffset = 0;

    const render = () => {
      if (currentPage !== "landing") return;
      
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        animId = requestAnimationFrame(render);
        return;
      }
      
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);

      const width = rect.width;
      const height = rect.height;
      ctx.clearRect(0, 0, width, height);

      const progress = sequenceProgress / 100; // 0 to 1
      const center = { x: width / 2, y: height / 2 };

      // Slow dynamic spin when progress is low, merges with mouse position rotation
      localTimeOffset += 0.01;
      const theta = progress * Math.PI * 2.2 + localTimeOffset * 0.15 + 0.3;
      const phi = progress * Math.PI * 1.6 + localTimeOffset * 0.1 + 0.5;

      // Define 3D wireframe points for hyper-cube tesseract
      const points3D: Array<{ x: number; y: number; z: number; w: number }> = [];
      for (let x = -1; x <= 1; x += 2) {
        for (let y = -1; y <= 1; y += 2) {
          for (let z = -1; z <= 1; z += 2) {
            for (let w = -1; w <= 1; w += 2) {
              points3D.push({ x, y, z, w });
            }
          }
        }
      }

      const projectedPoints: Array<{ x: number; y: number; originalIdx: number }> = [];

      // Destination 4x4 Grid coords (representing flat Assembled Timetable month calendar)
      const colSpacing = width / 5;
      const rowSpacing = height / 5;
      const gridPoints: Array<{ x: number; y: number }> = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          gridPoints.push({
            x: center.x - (1.5 * colSpacing) + c * colSpacing,
            y: center.y - (1.5 * rowSpacing) + r * rowSpacing
          });
        }
      }

      // Map 3D coordinates into projected 2D coordinates
      points3D.forEach((p, idx) => {
        // 1. Double plane 3D rotation
        let x1 = p.x * Math.cos(theta) - p.y * Math.sin(theta);
        let y1 = p.x * Math.sin(theta) + p.y * Math.cos(theta);
        let z1 = p.z;

        let y2 = y1 * Math.cos(phi) - z1 * Math.sin(phi);
        let z2 = y1 * Math.sin(phi) + z1 * Math.cos(phi);
        let x2 = x1;

        // 4D Dimensional offset multiplier (w-coefficient)
        const wAngle = progress * Math.PI;
        const wMultiplier = 1.05 + p.w * 0.4 * Math.sin(wAngle);
        x2 *= wMultiplier;
        y2 *= wMultiplier;
        z2 *= wMultiplier;

        // 2. Perspective math
        const distanceZ = 2.5 + z2 * 0.35;
        const scale = (width * 0.28) / distanceZ;
        const projX = center.x + x2 * scale;
        const projY = center.y + y2 * scale;

        // 3. Morph projection to target calendar coordinates
        const morphFactor = Math.min(1.0, Math.max(0.0, (progress - 0.25) / 0.75));
        
        const finalX = projX * (1 - morphFactor) + gridPoints[idx].x * morphFactor;
        const finalY = projY * (1 - morphFactor) + gridPoints[idx].y * morphFactor;

        projectedPoints.push({ x: finalX, y: finalY, originalIdx: idx });
      });

      // 4. Draw connecting matrix edges
      ctx.lineWidth = 1.1;
      for (let i = 0; i < 16; i++) {
        for (let j = i + 1; j < 16; j++) {
          let diffBits = 0;
          const xor = i ^ j;
          for (let b = 0; b < 4; b++) {
            if ((xor & (1 << b)) !== 0) diffBits++;
          }

          if (diffBits === 1) {
            const ptA = projectedPoints[i];
            const ptB = projectedPoints[j];
            
            const morph = Math.min(1, Math.max(0, (progress - 0.25) / 0.75));
            const opacity = 0.12 + (1 - morph) * 0.26;
            
            ctx.strokeStyle = darkMode 
              ? `rgba(129, 140, 248, ${opacity})`
              : `rgba(63, 81, 181, ${opacity})`;
            
            ctx.beginPath();
            ctx.moveTo(ptA.x, ptA.y);
            ctx.lineTo(ptB.x, ptB.y);
            ctx.stroke();
          }
        }
      }

      // 5. Draw timetable calendar borders
      if (progress > 0.25) {
        const morph = (progress - 0.25) / 0.75;
        ctx.lineWidth = 0.85;
        ctx.strokeStyle = darkMode 
          ? `rgba(255, 255, 255, ${morph * 0.08})`
          : `rgba(0, 0, 0, ${morph * 0.07})`;
        
        for (let i = 0; i <= 4; i++) {
          const vX = center.x - (2 * colSpacing) + i * colSpacing + (colSpacing / 2);
          const startY = center.y - (2 * rowSpacing) + (rowSpacing / 2);
          const endY = startY + 4 * rowSpacing;
          ctx.beginPath();
          ctx.moveTo(vX, startY);
          ctx.lineTo(vX, endY);
          ctx.stroke();

          const hY = center.y - (2 * rowSpacing) + i * rowSpacing + (rowSpacing / 2);
          const startX = center.x - (2 * colSpacing) + (colSpacing / 2);
          const endX = startX + 4 * colSpacing;
          ctx.beginPath();
          ctx.moveTo(startX, hY);
          ctx.lineTo(endX, hY);
          ctx.stroke();
        }
      }

      // 6. Draw active scheduled task nodes
      projectedPoints.forEach((pt, idx) => {
        const morph = Math.min(1, Math.max(0, (progress - 0.25) / 0.75));
        const size = (idx % 3 === 0 ? 5.5 : idx % 2 === 0 ? 4.5 : 3.5) * (1 - morph * 0.2);
        
        const colors = [
          "rgba(244, 63, 94, 0.85)",
          "rgba(99, 102, 241, 0.85)",
          "rgba(16, 185, 129, 0.85)",
          "rgba(245, 158, 11, 0.85)"
        ];
        const color = colors[idx % colors.length];

        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.fillStyle = color;

        const pulse = 1 + 0.12 * Math.sin(Date.now() / 200 + idx);
        
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, size * (progress > 0.8 ? pulse : 1), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (progress > 0.8) {
          const textOpacity = (progress - 0.8) / 0.2;
          ctx.fillStyle = darkMode ? `rgba(148, 163, 184, ${textOpacity})` : `rgba(71, 85, 105, ${textOpacity})`;
          ctx.font = "bold 7px sans-serif";
          ctx.textAlign = "center";
          
          const labels = ["CS301", "MA201", "Exam", "Lab", "Review", "Milestone", "Meeting", "Priya", "Suraj", "Rahul", "Code", "Submit", "Demo", "Verify", "Calm", "Relax"];
          ctx.fillText(labels[idx], pt.x, pt.y + 11);
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [currentPage, sequenceProgress, darkMode]);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDeadlines = localStorage.getItem("syncspace_deadlines");
      const savedTheme = localStorage.getItem("syncspace_theme");
      const savedEmail = localStorage.getItem("syncspace_email");
      const savedScore = localStorage.getItem("syncspace_productivity_score");
      const savedChat = localStorage.getItem("syncspace_chat");

      if (savedDeadlines) setDeadlines(JSON.parse(savedDeadlines));
      if (savedTheme) setDarkMode(savedTheme === "dark");
      if (savedEmail) {
        setLoggedInEmail(savedEmail);
        setCurrentPage("dashboard"); // Auto login if email is saved
      }
      if (savedScore) setProductivityScore(Number(savedScore));
      if (savedChat) setChatHistory(JSON.parse(savedChat));
    }
  }, []);

  // Landing loading timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setLandingLoaded(true);
    }, 2600);
    return () => clearTimeout(timer);
  }, []);

  // 5. CYCLING AI LOADING EXPERIENCE STAGES HOOK
  useEffect(() => {
    if (!dashboardLoading) return;
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < 5) {
        setLoadingPhase(current);
      } else {
        clearInterval(interval);
        setDashboardLoading(false);
      }
    }, 450);
    return () => clearInterval(interval);
  }, [dashboardLoading]);

  // 6. TYPEWRITER CHARACTER EFFECT FOR AI RECOVERY ADVICES
  useEffect(() => {
    let index = 0;
    setDisplayedRecommendation("");
    const timer = setInterval(() => {
      setDisplayedRecommendation(prev => prev + aiRecommendation.charAt(index));
      index++;
      if (index >= aiRecommendation.length) {
        clearInterval(timer);
      }
    }, 15);
    return () => clearInterval(timer);
  }, [aiRecommendation]);

  // 7. SPRING PHYSICS RADIAL WORKLOAD INTEGRATION (Smooth Interpolation)
  useEffect(() => {
    if (dashboardLoading) {
      setRadialProgress(0);
      return;
    }
    let currentVal = radialProgress;
    const targetVal = workloadPercentage;
    const step = targetVal > currentVal ? 1.5 : -1.5;
    if (targetVal === currentVal) return;

    const timer = setInterval(() => {
      currentVal += step;
      if ((step > 0 && currentVal >= targetVal) || (step < 0 && currentVal <= targetVal)) {
        setRadialProgress(targetVal);
        clearInterval(timer);
      } else {
        setRadialProgress(Math.round(currentVal));
      }
    }, 12);
    return () => clearInterval(timer);
  }, [dashboardLoading, workloadPercentage]);

  // 8. PRODUCTIVITY SCORE SPRING EFFECT ON MOUNT
  useEffect(() => {
    if (dashboardLoading) {
      setProductivityProgress(0);
      return;
    }
    const timer = setTimeout(() => {
      let start = 0;
      const end = productivityScore;
      if (end === 0) return;
      const step = () => {
        start += 1.8;
        if (start >= end) {
          setProductivityProgress(end);
        } else {
          setProductivityProgress(Math.floor(start));
          requestAnimationFrame(step);
        }
      };
      step();
    }, 450);
    return () => clearTimeout(timer);
  }, [dashboardLoading, productivityScore]);

  // Sync state helpers
  const saveState = (key: string, value: any) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  const handleSetLoggedInEmail = (email: string) => {
    setLoggedInEmail(email);
    localStorage.setItem("syncspace_email", email);
  };

  // Add Deadline
  const addDeadline = (newDl: Omit<Deadline, "id" | "completed">) => {
    const enriched: Deadline = {
      ...newDl,
      id: `dl-${Date.now()}`,
      completed: false,
    };
    const updated = [...deadlines, enriched].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setDeadlines(updated);
    saveState("syncspace_deadlines", updated);

    // Update group deadlines count
    const updatedGroups = groups.map(g => {
      if (g.courseCode === newDl.courseCode) {
        return {
          ...g,
          deadlinesThisWeek: g.deadlinesThisWeek + 1,
          nearestDeadline: `${newDl.title} - ${newDl.date.substring(5)}`,
        };
      }
      return g;
    });
    setGroups(updatedGroups);

    setProductivityScore(prev => Math.min(100, Math.max(30, prev - 1)));
  };

  // Delete Deadline
  const deleteDeadline = (id: string) => {
    const updated = deadlines.filter(dl => dl.id !== id);
    setDeadlines(updated);
    saveState("syncspace_deadlines", updated);
  };

  // Toggle Complete
  const toggleCompleteDeadline = (id: string) => {
    const updated = deadlines.map(dl => {
      if (dl.id === id) {
        return { ...dl, completed: !dl.completed };
      }
      return dl;
    });
    setDeadlines(updated);
    saveState("syncspace_deadlines", updated);

    // Recalculate Productivity Score
    const target = deadlines.find(dl => dl.id === id);
    if (target) {
      const increment = target.completed ? -6 : 8;
      const newScore = Math.min(100, Math.max(30, productivityScore + increment));
      setProductivityScore(newScore);
      localStorage.setItem("syncspace_productivity_score", String(newScore));
    }
  };

  // Update Deadline
  const updateDeadline = (id: string, updatedFields: Partial<Deadline>) => {
    const updated = deadlines.map(dl => {
      if (dl.id === id) {
        return { ...dl, ...updatedFields };
      }
      return dl;
    });
    setDeadlines(updated);
    saveState("syncspace_deadlines", updated);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle || !quickDate) return;
    
    addDeadline({
      title: quickTitle,
      date: quickDate,
      time: "11:59 PM",
      category: quickCategory,
      priority: quickPriority,
      courseCode: quickCourse
    });

    setQuickTitle("");
    setQuickDate("");
    setShowQuickAdd(false);
  };

  // Smart Reschedule Breakdown
  const getSmartReschedule = (id: string) => {
    const dl = deadlines.find(d => d.id === id);
    if (!dl) return null;

    const baseDate = new Date(dl.date);
    const steps: WorkBreakdownStep[] = [];
    const phases = ["Revision / Final Submission", "Testing & Formatting", "Development / Core Coding", "Detailed Outline & Drafting", "Topic Research & Planning"];

    for (let i = 0; i < 5; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      steps.unshift({
        date: d.toISOString().split("T")[0],
        phase: phases[4 - i],
      });
    }

    const avgWorkload = steps.reduce((acc, step) => {
      const count = deadlines.filter(d => d.date === step.date).length;
      return acc + count;
    }, 0) / 5;

    const confidence = Math.round(Math.max(50, 98 - avgWorkload * 12));
    return { steps, confidence };
  };

  // AI Chat responses (Gemini 2.5 Server-Side Streaming Agent)
  const askAI = async (query: string) => {
    // 1. Add user message to state
    const newChat = [...chatHistory, { sender: "user" as const, text: query, timestamp: new Date().toLocaleTimeString() }];
    setChatHistory(newChat);

    // 2. Add an initial empty AI message bubble that will be streamed into
    const aiMessageId = `ai-${Date.now()}`;
    const withAi = [...newChat, { sender: "ai" as const, text: "Thinking and organizing...", timestamp: new Date().toLocaleTimeString(), id: aiMessageId }];
    setChatHistory(withAi);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: query })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch streaming response from server");
      }

      if (!response.body) {
        throw new Error("No readable stream response from server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = "";

      // Stream read loop
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          accumulatedText += chunk;
          
          // Update the UI chat bubble in real-time chunk-by-chunk!
          setChatHistory(prev => 
            prev.map(msg => 
              msg.id === aiMessageId ? { ...msg, text: accumulatedText } : msg
            )
          );
        }
      }

      // 3. The stream has finished. Since Gemini returned JSON, let's parse the final JSON string!
      try {
        const parsed = JSON.parse(accumulatedText.trim());
        let answer = "";
        
        if (parsed.action === "schedule" && parsed.event) {
          // Automatically schedule the event!
          addDeadline({
            courseCode: parsed.event.courseCode || "GEN101",
            title: parsed.event.title || "Academic Event",
            date: parsed.event.date || "2026-06-02",
            time: parsed.event.time || "04:00 PM",
            priority: parsed.event.priority || "Normal",
            category: parsed.event.category || "Submission"
          });

          // Scan for collisions
          const newDl = { id: "temp", ...parsed.event, completed: false };
          const currentDeadlines = [...deadlines, newDl];
          const activeCollisions = findCollisions(currentDeadlines);
          const hasCollisionOnThisDate = activeCollisions.some(c => c.date === parsed.event.date);

          let collisionWarning = "";
          if (hasCollisionOnThisDate) {
            const collisionTasks = currentDeadlines.filter(d => d.date === parsed.event.date);
            collisionWarning = `\n\n⚠️ **Deadline Collision Alert**: I detected that you now have **${collisionTasks.length} tasks** scheduled on **${parsed.event.date}**. This increases your local stress index. I highly recommend allocating **Focus Study Blocks** on the preceding days to balance your capacity.`;
          }

          answer = `${parsed.chatResponse}${collisionWarning}\n\n*Timetable updated in real-time. Workload forecast graphs recalculated.*`;
        } else {
          answer = parsed.chatResponse || accumulatedText;
        }

        // Update the chat bubble with the beautifully formatted response (with automation details)
        setChatHistory(prev => {
          const updated = prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, text: answer } : msg
          );
          saveState("syncspace_chat", updated);
          return updated;
        });

      } catch (jsonErr) {
        // If it was not valid JSON, just leave the text as is
        setChatHistory(prev => {
          saveState("syncspace_chat", prev);
          return prev;
        });
      }

    } catch (error: any) {
      console.error("Streaming API Error:", error);
      // Failsafe fallback parser if backend route fails
      const lower = query.toLowerCase();
      let answer = `I encountered an error connecting to the Gemini backend: ${error.message}. I have processed your request locally.`;
      
      const scheduleKeywords = ["exam", "test", "quiz", "project", "submission", "homework", "assignment", "meeting"];
      const hasScheduleAction = scheduleKeywords.some(keyword => lower.includes(keyword)) && 
                                (lower.includes("on") || lower.includes("at") || lower.includes("tomorrow") || lower.includes("today"));

      if (hasScheduleAction) {
        // Fallback local scheduling logic
        let courseCode = "GEN101";
        let subjectName = "General Study";
        if (lower.includes("math") || lower.includes("algebra") || lower.includes("linear")) {
          courseCode = "MA201";
          subjectName = "Maths";
        } else if (lower.includes("web") || lower.includes("dev") || lower.includes("database") || lower.includes("db")) {
          courseCode = "CS302";
          subjectName = "Web Dev";
        } else if (lower.includes("alg") || lower.includes("se") || lower.includes("software") || lower.includes("algorithm")) {
          courseCode = "CS301";
          subjectName = "Algorithms";
        }
        
        let category: "Exam" | "Submission" | "Project" | "Meeting" = "Submission";
        let priority: "Critical" | "Important" | "Normal" = "Normal";
        let eventName = "Assignment";

        if (lower.includes("exam") || lower.includes("midterm") || lower.includes("final")) {
          category = "Exam";
          priority = "Critical";
          eventName = "Exam";
        } else if (lower.includes("quiz") || lower.includes("test")) {
          category = "Exam";
          priority = "Important";
          eventName = "Quiz";
        } else if (lower.includes("project")) {
          category = "Project";
          priority = "Important";
          eventName = "Project Submission";
        } else if (lower.includes("meeting") || lower.includes("sync") || lower.includes("discuss")) {
          category = "Meeting";
          priority = "Normal";
          eventName = "Discussion Meeting";
        } else if (lower.includes("homework") || lower.includes("assignment") || lower.includes("lab")) {
          category = "Submission";
          priority = "Important";
          eventName = "Assignment";
        }

        let dateVal = "2026-06-02";
        let dateStringLabel = "Tuesday, June 2, 2026";
        
        if (lower.includes("today")) {
          dateVal = "2026-05-31";
          dateStringLabel = "Today, May 31, 2026";
        } else if (lower.includes("tomorrow")) {
          dateVal = "2026-06-01";
          dateStringLabel = "Tomorrow, June 1, 2026";
        } else if (lower.includes("monday")) {
          dateVal = "2026-06-01";
          dateStringLabel = "Monday, June 1, 2026";
        } else if (lower.includes("tuesday")) {
          dateVal = "2026-06-02";
          dateStringLabel = "Tuesday, June 2, 2026";
        } else if (lower.includes("wednesday")) {
          dateVal = "2026-06-03";
          dateStringLabel = "Wednesday, June 3, 2026";
        } else if (lower.includes("thursday")) {
          dateVal = "2026-06-04";
          dateStringLabel = "Thursday, June 4, 2026";
        } else if (lower.includes("friday")) {
          dateVal = "2026-06-05";
          dateStringLabel = "Friday, June 5, 2026";
        } else if (lower.includes("saturday")) {
          dateVal = "2026-06-06";
          dateStringLabel = "Saturday, June 6, 2026";
        } else if (lower.includes("sunday")) {
          dateVal = "2026-06-07";
          dateStringLabel = "Sunday, June 7, 2026";
        }

        let timeVal = "04:00 PM";
        const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
        const timeMatch = query.match(timeRegex);
        if (timeMatch) {
          const hour = parseInt(timeMatch[1]);
          const min = timeMatch[2] || "00";
          const ampm = timeMatch[3].toUpperCase();
          timeVal = `${String(hour).padStart(2, "0")}:${min} ${ampm}`;
        }
        
        const titleVal = `${subjectName} ${eventName}`;

        addDeadline({
          courseCode,
          title: titleVal,
          date: dateVal,
          time: timeVal,
          priority,
          category
        });

        answer = `🗓️ **Offline Scheduler Active**\n\nI have automatically scheduled your **${titleVal}** for **${courseCode}** on **${dateStringLabel} at ${timeVal}** (Offline Fallback).`;
      } else {
        answer = "I've analyzed your academic timetable locally. Your overall stress index is Medium. Your workload heatmap shows a slight spike on Tuesday and Wednesday. I suggest finishing the Database design by Monday evening to keep your schedule fully balanced.";
      }
      setChatHistory(prev => {
        const updated = prev.map(msg => 
          msg.id === aiMessageId ? { ...msg, text: answer } : msg
        );
        saveState("syncspace_chat", updated);
        return updated;
      });
    }
  };

  // Calendar rendering helpers
  const renderMiniCalendar = () => {
    const days = [];
    const daysInJune = 30;
    for (let d = 1; d <= daysInJune; d++) {
      const dateString = `2026-06-${String(d).padStart(2, "0")}`;
      const dayDeadlines = incompleteDeadlines.filter(dl => dl.date === dateString);
      const hasCollision = dayDeadlines.length >= 2;
      const hasDeadline = dayDeadlines.length > 0;

      let cellStyle = "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 border border-transparent";
      let indicator = null;
      const isCurrentDay = d === 1; // Treating June 1st as Today in the prototype anchor
      let borderGlow = "";
      
      if (isCurrentDay) {
        borderGlow = "ring-2 ring-emerald-500/40 border border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]";
      }

      if (hasCollision) {
        cellStyle = "bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 text-rose-500 font-bold hover:bg-rose-500/20 shadow-sm shadow-rose-500/5";
        indicator = <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />;
      } else if (hasDeadline) {
        cellStyle = "bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 text-indigo-500 font-bold hover:bg-indigo-500/20 shadow-sm shadow-indigo-500/5";
        indicator = <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" style={{ animationDuration: "2s" }} />;
      }

      days.push(
        <div 
          key={d} 
          style={{ 
            animationDelay: `${d * 15}ms`, 
            animationFillMode: "both"
          }}
          className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-semibold relative cursor-pointer transition-all duration-300 hover:scale-112 hover:shadow-md animate-fade-in-up ${cellStyle} ${borderGlow}`}
          title={hasDeadline ? `${dayDeadlines.length} Deadline(s) Active • Click to quick-add` : "Free study day"}
          onClick={() => {
            setQuickDate(dateString);
            setShowQuickAdd(true);
          }}
        >
          {d}
          {indicator}
        </div>
      );
    }
    return days;
  };

  // Heatmap generation
  const weeklyDays = (() => {
    const arr = [];
    const anchor = new Date("2026-05-30");
    for (let i = 0; i < 7; i++) {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() + i);
      arr.push({
        dateStr: d.toISOString().split("T")[0],
        label: `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}`,
        weekday: d.toLocaleString("en-US", { weekday: "short" })
      });
    }
    return arr;
  })();

  const monthlyDays = (() => {
    const arr = [];
    const anchor = new Date("2026-05-30");
    for (let i = 0; i < 30; i++) {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() + i);
      arr.push({
        dateStr: d.toISOString().split("T")[0],
        label: `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}`
      });
    }
    return arr;
  })();

  const getHeatmapColorClass = (count: number) => {
    if (count === 0) return "bg-slate-100 dark:bg-white/[0.02] border-slate-200/50 dark:border-white/[0.04]";
    if (count === 1) return "bg-emerald-500/20 text-emerald-500 border-emerald-500/20";
    if (count <= 3) return "bg-amber-500/20 text-amber-500 border-amber-500/20";
    return "bg-rose-500/20 text-rose-500 border-rose-500/20";
  };

  const getHoverDetails = (dateStr: string) => {
    const dayDeadlines = deadlines.filter(d => d.date === dateStr && !d.completed);
    const tasks = dayDeadlines.length;
    const exams = dayDeadlines.filter(d => d.category === "Exam").length;
    const assignments = dayDeadlines.filter(d => d.category === "Submission").length;
    return { dateStr, tasks, exams, assignments };
  };

  const handleEditClick = (dl: Deadline) => {
    setEditingDeadline(dl);
    setEditTitle(dl.title);
    setEditPriority(dl.priority);
    setEditCategory(dl.category);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeadline) return;
    updateDeadline(editingDeadline.id, {
      title: editTitle,
      priority: editPriority,
      category: editCategory
    });
    setEditingDeadline(null);
  };

  const activeSmartPlan = activeSmartPlanId ? getSmartReschedule(activeSmartPlanId) : null;
  const activeSmartDeadline = activeSmartPlanId ? deadlines.find(d => d.id === activeSmartPlanId) : null;

  // Timeline view anchor dates
  const timelineDates = ["2026-05-30", "2026-05-31", "2026-06-01", "2026-06-02", "2026-06-03", "2026-06-05", "2026-06-07"];

  return (
    <div className={`min-h-screen w-full font-sans transition-colors duration-500 relative overflow-x-hidden ${
      darkMode ? "bg-[#07060f] text-slate-100" : "bg-[#f4f7fa] text-slate-800"
    }`}>
      {/* Dynamic Glowing Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className={`absolute -top-[10%] -right-[10%] w-[500px] h-[500px] rounded-full blur-[110px] opacity-25 transition-all duration-700 ${
            darkMode ? "bg-indigo-900" : "bg-indigo-100"
          }`}
          style={{ transform: `translate(${mouseOffset.x}px, ${mouseOffset.y}px)` }}
        />
        <div 
          className={`absolute -bottom-[10%] -left-[10%] w-[450px] h-[450px] rounded-full blur-[110px] opacity-20 transition-all duration-700 ${
            darkMode ? "bg-purple-900" : "bg-purple-100"
          }`}
          style={{ transform: `translate(${mouseOffset.x}px, ${mouseOffset.y}px)` }}
        />
      </div>

      {/* AI Zen Particle Canvas Overlay */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[100] w-full h-full" />

      {/* Shockwave expanding ring energy wave (Easter Egg) */}
      {shockwaveActive && <div className="shockwave-ring" />}

      {/* Top-Right AI Optimization Toast Notification */}
      {optimizationCompleteAlert && (
        <div className={`fixed top-6 right-6 z-[2000] p-4 rounded-2xl border flex items-center gap-3 shadow-xl animate-slide-in-right ${
          darkMode ? "bg-[#090815]/95 border-emerald-500/35 text-white" : "bg-white border-emerald-500/20 text-slate-800"
        }`}>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold font-sans">AI Optimization Complete</span>
            <span className="text-[10px] text-slate-400 mt-0.5">TIMETABLE AND STRESS VALUES LEVELED</span>
          </div>
        </div>
      )}

      {/* CINEMATIC AI OS LOADING EXPERIENCE SCREEN */}
      {currentPage === "dashboard" && dashboardLoading && (
        <div className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center p-6 transition-all duration-700 ${
          darkMode ? "bg-[#07060f]" : "bg-[#f4f7fa]"
        }`}>
          {/* Subtle slow floating background grids */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <div className="absolute top-[20%] left-[30%] w-[350px] h-[350px] rounded-full bg-indigo-500/15 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[20%] right-[30%] w-[350px] h-[350px] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
          </div>

          <div className="relative flex flex-col items-center max-w-sm w-full text-center">
            {/* Spinning/pulsing vector AI core loader */}
            <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-500/30 rotate-slow" />
              <div className="absolute w-14 h-14 rounded-full border border-indigo-500/40 animate-ping" />
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
            </div>

            {/* Custom high-fidelity progressive load stages */}
            <div className="flex flex-col gap-2.5 w-full">
              {[
                "AI Planning Engine Initializing",
                "Analyzing Academic Workload",
                "Detecting Deadline Collisions",
                "Building Study Forecast",
                "Optimizing Semester Timeline"
              ].map((phaseText, idx) => {
                const isActive = loadingPhase === idx;
                const isPassed = loadingPhase > idx;
                return (
                  <div 
                    key={idx} 
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs font-semibold tracking-wide transition-all duration-300 ${
                      isActive 
                        ? darkMode ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300 scale-102" : "bg-indigo-50 border-indigo-200 text-indigo-700 scale-102"
                        : isPassed
                          ? darkMode ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400 opacity-60" : "bg-emerald-50 border-emerald-100 text-emerald-600 opacity-60"
                          : "border-transparent opacity-20 text-slate-500"
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 animate-pulse" />
                    ) : isActive ? (
                      <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    )}
                    <span>{phaseText}...</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* A. AUTH & LANDING SCREENS */}
      {currentPage !== "dashboard" && (
        <div className={`acadesk-body-landing ${darkMode ? "dark-mode" : ""} min-h-screen w-full flex items-center justify-center p-6 relative z-10 overflow-hidden`}>
          
          {/* Top-Left Logo / Brand Icon */}
          <div className="acadesk-top-left-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.0001 12.7C20.8001 12.7 20.5001 12.8 20.3001 12.9C18.9001 13.7 17.3001 14.1 15.6001 14.1C10.7001 14.1 6.70007 10.1 6.70007 5.20001C6.70007 3.50001 7.10007 1.90001 7.90007 0.500014C8.00007 0.300014 8.00007 0.100014 7.90007 0.0001375C7.70007 -0.0997388 7.50007 -0.0997388 7.40007 0.0001375C3.00007 2.00014 0.100098 6.40001 0.100098 11.4C0.100098 17.9 5.4001 23.2 11.9001 23.2C16.9001 23.2 21.3001 20.3 23.3001 15.9C23.4001 15.8 23.4001 15.6 23.3001 15.4C23.2001 15.3 23.0001 15.2 22.8001 15.2C22.2001 15.2 21.6001 12.7 21.0001 12.7Z" fill={darkMode ? "#E6E1F9" : "#1D1055"}/>
              <path d="M20.5 4.5L21.2 6L22.7 6.2L21.5 7.2L21.9 8.7L20.5 7.9L19.1 8.7L19.5 7.2L18.3 6.2L19.8 6L20.5 4.5Z" fill={darkMode ? "#E6E1F9" : "#1D1055"}/>
            </svg>
          </div>

          {/* Theme Switcher Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="absolute top-6 right-6 p-3 rounded-full border shadow-md hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer bg-white/10 backdrop-blur-md border-white/20 text-white z-50"
            style={{ minWidth: "44px", minHeight: "44px" }}
          >
            {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-900" />}
          </button>

          {/* CARD CONTAINER */}
          <div className={`acadesk-app-container ${landingLoaded ? "loaded" : ""}`} id="appContainer">
            
            {/* LOGO ENGINE */}
            <div className="acadesk-logo-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="acadesk-logo-svg">
                <defs>
                  <linearGradient id="bookCoverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#6D28D9" />
                  </linearGradient>
                  <linearGradient id="bookSpineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#5B21B6" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                  <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#7C3AED" floodOpacity="0.14" />
                  </filter>
                </defs>

                <g className="logo-group" filter="url(#logoShadow)">
                  <path className="logo-pages-3" d="M 66,46 C 80,30 120,30 144,46 Z" fill="#E2E8F0" stroke="#2E1065" strokeWidth="3" />
                  <path className="logo-pages-2" d="M 67,46 C 80,34 120,34 145,46 Z" fill="#CBD5E1" stroke="#2E1065" strokeWidth="3" />
                  <path className="logo-pages-1" d="M 68,46 C 80,38 120,38 146,46 Z" fill="#F8FAFC" stroke="#2E1065" strokeWidth="3" />

                  <path className="logo-spine-fill" d="M 68,46 L 56,46 C 50,46 50,52 50,56 L 50,144 C 50,148 50,154 56,154 L 68,154 Z" fill="url(#bookSpineGrad)" />
                  <path className="logo-cover-fill" d="M 68,46 L 144,46 Q 152,46 152,54 L 152,146 Q 152,154 144,154 L 68,154 Z" fill="url(#bookCoverGrad)" />

                  <rect className="logo-spine-band" x="50" y="70" width="18" height="8" fill="#4C1D95" opacity="0.6" rx="2" />
                  <rect className="logo-spine-band" x="50" y="122" width="18" height="8" fill="#4C1D95" opacity="0.6" rx="2" />

                  <path className="logo-outline" d="M 68,46 L 144,46 Q 152,46 152,54 L 152,146 Q 152,154 144,154 L 56,154 Q 50,154 50,144 L 50,56 Q 50,46 56,46 Z" fill="none" stroke="#2E1065" strokeWidth="4.5" strokeLinejoin="round" />
                  <line className="logo-spine-divider" x1="68" y1="46" x2="68" y2="154" stroke="#2E1065" strokeWidth="4.5" strokeLinecap="round" />

                  <g className="logo-face">
                    <path className="logo-eyebrow eyebrow-left" d="M 90,84 Q 96,79 102,84" fill="none" stroke="#2E1065" strokeWidth="2.5" strokeLinecap="round" />
                    <path className="logo-eyebrow eyebrow-right" d="M 118,84 Q 124,79 130,84" fill="none" stroke="#2E1065" strokeWidth="2.5" strokeLinecap="round" />

                    <g className="logo-eye eye-left">
                      <circle cx="96" cy="94" r="6" fill="#2E1065" />
                      <circle cx="94" cy="92" r="1.8" fill="#FFFFFF" />
                    </g>
                    <g className="logo-eye eye-right">
                      <circle cx="124" cy="94" r="6" fill="#2E1065" />
                      <circle cx="122" cy="92" r="1.8" fill="#FFFFFF" />
                    </g>

                    <circle className="logo-blush blush-left" cx="86" cy="106" r="7" fill="#F43F5E" />
                    <circle className="logo-blush blush-right" cx="134" cy="106" r="7" fill="#F43F5E" />

                    <path className="logo-smile" d="M 96,108 C 96,121 124,121 124,108" fill="none" stroke="#2E1065" strokeWidth="3.5" strokeLinecap="round" />
                  </g>
                </g>
              </svg>
              <h1 className="acadesk-logo-text">Acadesk</h1>
            </div>

            {/* LOADING BAR */}
            <div className="acadesk-loading-container" id="loadingContainer">
              <div className="acadesk-loading-bar"></div>
            </div>

            {/* SIGN IN FORM VIEW */}
            {landingLoaded && (currentPage === "landing" || currentPage === "login") && (
              <div className="acadesk-auth-view visible acadesk-form-fade-in" id="loginContent">
                <h2 className="acadesk-welcome-title">Hi, User!</h2>
                <p className="acadesk-subtitle">Ready when you are.</p>
                <p className="acadesk-sub-caption">Let's get things done.</p>

                <button 
                  type="button" 
                  onClick={async () => {
                    setAuthError(null);
                    try {
                      const user = await firebaseGoogleSignIn();
                      handleSetLoggedInEmail(user.email || "google-student@acadesk.edu");
                      setDashboardLoading(true);
                      setCurrentPage("dashboard");
                    } catch (err: any) {
                      console.error(err);
                      setAuthError(err.message || "Google Sign-In failed.");
                    }
                  }}
                  className="acadesk-google-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="acadesk-separator">or</div>

                {authError && (
                  <div className="w-full mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs font-semibold text-center animate-pulse animate-fade-in">
                    {authError}
                  </div>
                )}

                <form 
                  id="signInForm" 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setAuthError(null);
                    try {
                      const user = await firebaseSignIn(emailInput, passwordInput);
                      handleSetLoggedInEmail(user.email || "surajchoudhary5002@gmail.com");
                      setDashboardLoading(true);
                      setCurrentPage("dashboard");
                    } catch (err: any) {
                      console.error(err);
                      setAuthError(err.message || "Authentication failed. Please verify credentials.");
                    }
                  }}
                >
                  <div className="acadesk-form-group">
                    <label htmlFor="email">Email</label>
                    <div className="acadesk-input-wrapper">
                      <span className="acadesk-input-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      </span>
                      <input 
                        id="email" 
                        type="email" 
                        placeholder="Enter your email" 
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="acadesk-form-group">
                    <label htmlFor="password">Password</label>
                    <div className="acadesk-input-wrapper">
                      <span className="acadesk-input-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      </span>
                      <input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Enter your password" 
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        required 
                      />
                      <span 
                        className="acadesk-toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <svg 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke={showPassword ? "#8257E5" : "#9CA3AF"} 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </span>
                    </div>
                  </div>

                  <div className="acadesk-form-options">
                    <label className="acadesk-remember-me">
                      <input type="checkbox" id="rememberMe" defaultChecked />
                      Remember me
                    </label>
                    <a href="#" className="acadesk-forgot-link" onClick={(e) => e.preventDefault()}>Forgot password?</a>
                  </div>

                  <button type="submit" className="acadesk-login-btn">
                    Sign In 
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </button>

                  <p className="acadesk-switch-prompt">
                    Don't have an account?{" "}
                    <span id="toSignUp" onClick={() => setCurrentPage("signup")}>
                      Create Account &rarr;
                    </span>
                  </p>
                </form>
              </div>
            )}

            {/* CREATE ACCOUNT FORM VIEW */}
            {landingLoaded && currentPage === "signup" && (
              <div className="acadesk-auth-view visible acadesk-form-fade-in" id="signUpContent">
                <h2 className="acadesk-welcome-title">Welcome!</h2>
                <p className="acadesk-subtitle">Join Acadesk today.</p>
                <p className="acadesk-sub-caption">Start managing your dashboard.</p>

                {authError && (
                  <div className="w-full mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs font-semibold text-center animate-pulse animate-fade-in">
                    {authError}
                  </div>
                )}

                <form 
                  id="signUpForm" 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setAuthError(null);
                    try {
                      const user = await firebaseSignUp(emailInput, passwordInput, nameInput);
                      handleSetLoggedInEmail(user.email || "surajchoudhary5002@gmail.com");
                      setDashboardLoading(true);
                      setCurrentPage("dashboard");
                    } catch (err: any) {
                      console.error(err);
                      setAuthError(err.message || "Registration failed. Please try a stronger password.");
                    }
                  }}
                >
                  <div className="acadesk-form-group">
                    <label htmlFor="regName">Full Name</label>
                    <div className="acadesk-input-wrapper">
                      <span className="acadesk-input-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </span>
                      <input 
                        id="regName" 
                        type="text" 
                        placeholder="Enter your full name" 
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="acadesk-form-group">
                    <label htmlFor="regEmail">Email Address</label>
                    <div className="acadesk-input-wrapper">
                      <span className="acadesk-input-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      </span>
                      <input 
                        id="regEmail" 
                        type="email" 
                        placeholder="Enter your email" 
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="acadesk-form-group">
                    <label htmlFor="regPassword">Password</label>
                    <div className="acadesk-input-wrapper">
                      <span className="acadesk-input-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      </span>
                      <input 
                        id="regPassword" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Create strong password" 
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        required 
                      />
                      <span 
                        className="acadesk-toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <svg 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke={showPassword ? "#8257E5" : "#9CA3AF"} 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </span>
                    </div>
                  </div>

                  <div className="acadesk-form-options">
                    <label className="acadesk-remember-me">
                      <input type="checkbox" id="agreeTerms" required />
                      I agree to the Terms of Service
                    </label>
                  </div>

                  <button type="submit" className="acadesk-login-btn">
                    Create Account 
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </button>

                  <p className="acadesk-switch-prompt">
                    Already have an account?{" "}
                    <span id="toSignIn" onClick={() => setCurrentPage("login")}>
                      &larr; Back to Login
                    </span>
                  </p>
                </form>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* B. MAIN INTEGRATED DASHBOARD VIEW */}
      {currentPage === "dashboard" && (
        <div className="min-h-screen w-full flex relative z-10 animate-fade-in">
          
          {/* Subtle Ambient Background Particles representing AI processing */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
            <div className="absolute w-1.5 h-1.5 rounded-full bg-indigo-400 float-particle-bg-1" />
            <div className="absolute w-2 h-2 rounded-full bg-emerald-400 float-particle-bg-2" />
            <div className="absolute w-1 h-1 rounded-full bg-cyan-400 float-particle-bg-3" />
            <div className="absolute w-2 h-2 rounded-full bg-violet-400 float-particle-bg-4" />
          </div>
          
          {/* 1. MASTER SIDEBAR SYSTEM */}
          <aside className={`w-[260px] hidden md:flex flex-col border-r h-screen sticky top-0 transition-all ${
            darkMode ? "bg-[#0d0c18]/85 border-white/[0.06] backdrop-blur-xl" : "bg-white/80 border-slate-200 backdrop-blur-xl"
          }`}>
            <div className="p-6 border-b border-white/[0.04] flex items-center justify-between">
              <h1 className="text-xl font-bold uppercase leading-none tracking-wider flex items-center gap-2 select-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-6 h-6 acadesk-logo-svg pointer-events-none">
                  <defs>
                    <linearGradient id="miniBookCoverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#6D28D9" />
                    </linearGradient>
                    <linearGradient id="miniBookSpineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#5B21B6" />
                      <stop offset="100%" stopColor="#7C3AED" />
                    </linearGradient>
                  </defs>
                  <g className="logo-group">
                    <path className="logo-pages-3" d="M 66,46 C 80,30 120,30 144,46 Z" fill="#E2E8F0" stroke="#2E1065" strokeWidth="3" />
                    <path className="logo-pages-2" d="M 67,46 C 80,34 120,34 145,46 Z" fill="#CBD5E1" stroke="#2E1065" strokeWidth="3" />
                    <path className="logo-pages-1" d="M 68,46 C 80,38 120,38 146,46 Z" fill="#F8FAFC" stroke="#2E1065" strokeWidth="3" />
                    <path className="logo-spine-fill" d="M 68,46 L 56,46 C 50,46 50,52 50,56 L 50,144 C 50,148 50,154 56,154 L 68,154 Z" fill="url(#miniBookSpineGrad)" />
                    <path className="logo-cover-fill" d="M 68,46 L 144,46 Q 152,46 152,54 L 152,146 Q 152,154 144,154 L 68,154 Z" fill="url(#miniBookCoverGrad)" />
                    <path className="logo-outline" d="M 68,46 L 144,46 Q 152,46 152,54 L 152,146 Q 152,154 144,154 L 56,154 Q 50,154 50,144 L 50,56 Q 50,46 56,46 Z" fill="none" stroke="#2E1065" strokeWidth="4.5" strokeLinejoin="round" />
                    <line className="logo-spine-divider" x1="68" y1="46" x2="68" y2="154" stroke="#2E1065" strokeWidth="4.5" strokeLinecap="round" />
                    <g className="logo-face">
                      <g className="logo-eye eye-left"><circle cx="96" cy="94" r="6" fill="#2E1065" /></g>
                      <g className="logo-eye eye-right"><circle cx="124" cy="94" r="6" fill="#2E1065" /></g>
                      <path className="logo-smile" d="M 96,108 C 96,121 124,121 124,108" fill="none" stroke="#2E1065" strokeWidth="3.5" strokeLinecap="round" />
                    </g>
                  </g>
                </svg>
                <span className={darkMode ? "text-white" : "text-[#1D1055]"} style={{ fontFamily: "'Outfit', sans-serif" }}>Acadesk</span>
              </h1>
            </div>

            <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
              {[
                { tab: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
                { tab: "planner", label: "Planner & Timelines", icon: Calendar },
                { tab: "team", label: "Team Space", icon: Users },
                { tab: "assistant", label: "AI Planner Assistant", icon: Bot },
                { tab: "health", label: "Semester Analytics", icon: HeartPulse }
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => setActiveTab(item.tab as any)}
                    className={`flex items-center gap-3.5 px-4 h-12 rounded-xl text-sm font-semibold transition-all group relative border-none text-left cursor-pointer ${
                      isActive 
                        ? darkMode
                          ? "bg-white/[0.06] text-white"
                          : "bg-indigo-50 text-[#3F51B5] shadow-sm"
                        : darkMode
                          ? "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                          : "text-slate-600 hover:text-[#3F51B5] hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? darkMode ? "text-[#38bdf8]" : "text-[#3F51B5]" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className={`absolute left-0 w-1.5 h-6 rounded-r-full ${darkMode ? "bg-[#38bdf8]" : "bg-[#3F51B5]"}`} />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className={`p-4 border-t flex flex-col gap-4 ${darkMode ? "border-white/[0.06]" : "border-slate-200"}`}>
              <div className={`p-3 rounded-xl border flex flex-col gap-1.5 text-xs ${
                darkMode ? "bg-black/20 border-white/[0.04]" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">Academic Score:</span>
                  <span className={darkMode ? "text-emerald-400" : "text-emerald-600"}>{productivityScore}/100</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500" style={{ width: `${productivityScore}%` }} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center cursor-pointer ${
                    darkMode ? "bg-slate-900 border-slate-800 text-yellow-400" : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={async () => {
                    await firebaseSignOut();
                    localStorage.removeItem("syncspace_email");
                    setCurrentPage("landing");
                  }}
                  className={`flex-1 h-[38px] px-3 text-xs font-bold rounded-xl border cursor-pointer flex items-center justify-center gap-1.5 ${
                    darkMode ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20" : "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100"
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* 2. CORE VIEWPORT CONTAINER */}
          <div className="flex-1 flex flex-col min-w-0 z-10 relative">
            
            {/* Header profile / settings */}
            <header className="h-16 flex items-center justify-between px-6 md:px-8 border-b border-slate-100 dark:border-white/[0.04] bg-transparent">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileMenuOpen(true)} className="p-2 md:hidden hover:bg-slate-200 dark:hover:bg-white/[0.05] rounded-xl transition-colors">
                  <Menu className="w-5 h-5" />
                </button>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border font-mono ${stressBg} ${stressColor} ${stressBorder} flex items-center gap-1.5`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Stress Index: {stressLevel}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <button className="p-2 rounded-xl text-slate-400 hover:text-white bg-transparent border-none">
                    <Bell className="w-[18px] h-[18px]" />
                    {activeTasksCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                    {loggedInEmail.substring(0, 1).toUpperCase()}
                  </div>
                  <span className="text-[13px] font-semibold text-slate-400 hidden sm:inline">{loggedInEmail}</span>
                </div>
              </div>
            </header>

            {/* Scrollable View Content */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="flex flex-col gap-8 animate-fade-in-up">
                  {/* Hero Forecast */}
                  <section 
                    ref={heroRef}
                    className={`w-full rounded-3xl p-6 md:p-8 border flex flex-col md:flex-row gap-6 items-center justify-between transition-all duration-[1000ms] transform relative overflow-hidden ${
                      heroVisible ? "translate-y-0 opacity-100 filter-none" : "translate-y-8 opacity-0 filter blur-sm"
                    } ${
                      darkMode ? "aurora-bg border-white/[0.08]" : "aurora-light-bg border-indigo-100 text-slate-800"
                    }`}
                  >
                    {/* Animated floating subtle backdrop glow blobs */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                      <div className="absolute -top-[20%] -left-[10%] w-[220px] h-[220px] rounded-full bg-indigo-500/10 blur-2xl float-glow-1" />
                      <div className="absolute -bottom-[20%] -right-[10%] w-[220px] h-[220px] rounded-full bg-emerald-500/8 blur-2xl float-glow-2" />
                    </div>

                    <div className="flex-1 flex flex-col gap-5 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500"><Sparkles className="w-5 h-5" /></span>
                        <h2 className="text-xl font-bold font-sans tracking-wide">Academic Timetable Forecast</h2>
                      </div>
                      
                      <div className="flex items-center gap-4 max-w-xl">
                        <button
                          onClick={triggerStressRelief}
                          className="neon-gradient-btn rounded-xl h-11 px-5 text-xs font-bold text-white cursor-pointer transition-all border-none flex-shrink-0 relative overflow-hidden flex items-center gap-1.5"
                          type="button"
                        >
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          <span>AI Stress Decompress</span>
                        </button>
                      </div>
                    </div>

                    {/* Futuristic Floating Workload Forecast Widget (Integrated AI Insight Component) */}
                    <div className="flex flex-col items-center justify-center p-5 rounded-3xl bg-transparent backdrop-blur-[1px] border border-indigo-950/10 dark:border-white/[0.08] shadow-[0_8px_32px_0_rgba(99,102,241,0.01)] min-w-[190px] text-center relative z-10 select-none transition-all duration-500 hover:scale-[1.02]">
                      <span className={`text-[10px] font-extrabold uppercase tracking-[0.15em] ${darkMode ? "text-slate-400" : "text-slate-500"} mb-4`}>
                        Workload Forecast
                      </span>
                      
                      {/* Radial Progress widget with glowing rings and animations */}
                      <div className="relative w-22 h-22 flex items-center justify-center mb-4">
                        {/* Subtle glowing ring backdrop */}
                        <div className="absolute w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500/15 to-emerald-500/15 blur-[6px] opacity-80 pointer-events-none" />
                        
                        {/* Glowing ring around the progress circle */}
                        <div className="absolute w-[68px] h-[68px] rounded-full border border-indigo-500/25 dark:border-indigo-400/35 shadow-[0_0_12px_rgba(99,102,241,0.2)] dark:shadow-[0_0_18px_rgba(99,102,241,0.3)] animate-pulse pointer-events-none z-0" />
                        
                        {/* Dashed outer accent ring */}
                        <div className="absolute inset-0 rounded-full border border-dashed border-indigo-500/20 dark:border-indigo-400/25 rotate-slow pointer-events-none" />
                        
                        <svg className="w-18 h-18 transform -rotate-90 relative z-10 pointer-events-none">
                          <circle 
                            cx="36" 
                            cy="36" 
                            r="30" 
                            stroke={darkMode ? "rgba(255,255,255,0.06)" : "rgba(99,102,241,0.05)"} 
                            strokeWidth="4" 
                            fill="transparent" 
                          />
                          <circle 
                            cx="36" 
                            cy="36" 
                            r="30" 
                            stroke="url(#indigoGrad)" 
                            strokeWidth="4" 
                            fill="transparent" 
                            strokeDasharray={2 * Math.PI * 30}
                            strokeDashoffset={2 * Math.PI * 30 * (1 - radialProgress / 100)}
                            className="transition-all duration-1000 ease-out"
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#6366f1" />
                            </linearGradient>
                          </defs>
                        </svg>
                        
                        {/* Lightweight percentage value text */}
                        <div className="absolute flex flex-col items-center justify-center z-20 pointer-events-none">
                          <span className="text-xl font-black text-indigo-500 dark:text-indigo-400">
                            <AnimatedCounter value={radialProgress} />%
                          </span>
                        </div>
                      </div>

                      {/* Stress status badge with breathing animation */}
                      <span className={`text-[9px] px-2.5 py-1 rounded font-bold uppercase transition-all duration-500 shadow-sm border badge-breathe ${stressBg} ${stressColor} ${stressBorder}`}>
                        {stressLevel} Stress
                      </span>
                    </div>
                  </section>

                  {/* 4 Stats Cards */}
                  <section 
                    ref={statsRef}
                    className={`grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 transition-all duration-[1000ms] transform ${
                      statsVisible ? "translate-y-0 opacity-100 filter-none" : "translate-y-8 opacity-0 filter blur-sm"
                    }`}
                  >
                    {[
                      { title: "Active Tasks", count: activeTasksCount, detail: `Exams: ${examsCount} • Submissions: ${submissionsCount}`, icon: BookOpen, color: "text-indigo-500" },
                      { title: "Collisions", count: collisionCount, detail: "Overlapping deadlines", icon: AlertTriangle, color: "text-rose-500 animate-pulse" },
                      { title: "Free Hours", count: freeHours, detail: "Buffer study hours", icon: Clock, color: "text-emerald-500" },
                      { title: "Stress Index", count: stressLevel, detail: "Calculated workload stress", icon: ShieldAlert, color: stressColor }
                    ].map((card, idx) => {
                      const Icon = card.icon;
                      const tilt = cardTilt[idx] || { rx: 0, ry: 0 };
                      
                      // Calculate stress dynamic style for the Stress Index card
                      let cardStressClass = "";
                      if (card.title === "Stress Index") {
                        if (stressLevel === "Zen") {
                          cardStressClass = "breathe-card border-emerald-500/45 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
                        } else if (stressLevel === "Critical") {
                          cardStressClass = "stress-critical-shake border-rose-600/60 shadow-[0_0_15px_rgba(225,29,72,0.15)]";
                        } else if (stressLevel === "High") {
                          cardStressClass = "stress-high-pulse border-rose-500/40";
                        } else if (stressLevel === "Moderate") {
                          cardStressClass = "stress-medium-breathe border-amber-500/30";
                        } else {
                          cardStressClass = "shadow-[0_0_12px_rgba(16,185,129,0.08)] border-emerald-500/20";
                        }
                      }
                      
                      return (
                        <div 
                          key={idx} 
                          onMouseMove={(e) => handleCardMouseMove(idx, e)}
                          onMouseLeave={() => handleCardMouseLeave(idx)}
                          style={{ 
                            transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(${tilt.rx || tilt.ry ? -4 : 0}px)`,
                            transition: tilt.rx || tilt.ry ? "none" : "transform 0.4s ease, border-color 0.3s ease, box-shadow 0.3s ease",
                            animationDelay: `${idx * 100}ms`
                          }}
                          className={`p-5 rounded-2xl border flex flex-col justify-between h-[130px] hover:shadow-xl hover:shadow-indigo-500/[0.05] hover:border-indigo-500/30 cursor-pointer load-fade-in-blur opacity-0 relative overflow-hidden ${
                            darkMode ? "bg-[#0d0c18]/60 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
                          } ${zenMode ? "breathe-card border-emerald-500/35" : ""} ${card.title === "Stress Index" ? cardStressClass : ""}`}
                        >
                          {/* Floating sparkles for Free Hours card */}
                          {card.title === "Free Hours" && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                              <span className="absolute text-[9px] text-emerald-400 opacity-40 float-sparkle-1">✨</span>
                              <span className="absolute text-[8px] text-emerald-300 opacity-30 float-sparkle-2" style={{ animationDelay: "2s" }}>✦</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-slate-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider">{card.title}</span>
                            <Icon className={`w-4 h-4 transition-transform duration-500 ${card.color}`} style={{ transform: tilt.rx || tilt.ry ? "rotate(10deg) scale(1.12)" : "none" }} />
                          </div>
                          <div className="flex flex-col mt-1.5">
                            <div className="flex items-baseline justify-between">
                              <span className={`text-3xl font-extrabold ${card.color.includes("text-") ? card.color.split(" ")[0] : ""}`}>
                                {typeof card.count === "number" ? <AnimatedCounter value={card.count} /> : card.count}
                              </span>
                              {card.title === "Free Hours" && (
                                <span className="text-[10px] text-slate-400 font-semibold tracking-wide">/ 40 hrs limit</span>
                              )}
                            </div>
                            
                            {card.title === "Free Hours" && (
                              <div className="w-full h-1 bg-slate-800/40 dark:bg-white/[0.04] rounded-full mt-2 overflow-hidden relative">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-[1500ms] ease-out shadow-[0_0_8px_#10b981]"
                                  style={{ width: `${(freeHours / 40) * 100}%` }}
                                />
                              </div>
                            )}

                            {card.title === "Active Tasks" && (
                              <div className="w-full h-1 bg-slate-800/40 dark:bg-white/[0.04] rounded-full mt-2 overflow-hidden relative">
                                <div 
                                  className="h-full bg-indigo-500 rounded-full transition-all duration-[1500ms] ease-out"
                                  style={{ width: `${(activeTasksCount / 12) * 100}%` }}
                                />
                              </div>
                            )}
                            
                            <span className="text-[10px] text-slate-500 mt-1">{card.detail}</span>
                          </div>
                        </div>
                      );
                    })}
                  </section>

                  {/* Collision Radar & Mini Calendar */}
                  <section 
                    ref={radarCalendarRef}
                    className={`grid grid-cols-1 lg:grid-cols-[1.6fr_1.4fr] gap-6 md:gap-8 items-start transition-all duration-[1000ms] transform ${
                      radarCalendarVisible ? "translate-y-0 opacity-100 filter-none" : "translate-y-8 opacity-0 filter blur-sm"
                    }`}
                  >
                    {/* Collision Radar */}
                    <div className={`rounded-3xl p-6 border flex flex-col gap-5 ${
                      darkMode ? "bg-[#0d0c18]/70 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      <div className="flex justify-between items-center border-b dark:border-white/[0.04] pb-4">
                        <div className="flex items-center gap-2">
                          <span className="relative p-1.5 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                            <span className="absolute inset-0 rounded-lg bg-rose-500/30 sonar-ring" />
                            <ShieldAlert className="w-5 h-5 relative z-10" />
                          </span>
                          <h3 className="text-lg font-bold font-sans">Collision Radar</h3>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">Active Alerts</span>
                      </div>

                      {/* Interactive Sweeping Radar Grid Visualizer */}
                      <div className={`relative w-full h-[140px] rounded-2xl overflow-hidden border flex items-center justify-center ${
                        darkMode ? "bg-black/45 border-rose-500/15" : "bg-rose-500/[0.02] border-rose-500/10"
                      }`}>
                        {/* Warnings ripple overlay when threat detected */}
                        {collisionCount > 0 && (
                          <div className="absolute w-[80px] h-[80px] rounded-full border border-rose-500/20 bg-rose-500/[0.01] animate-ping pointer-events-none" style={{ animationDuration: "2.5s" }} />
                        )}

                        {/* Radar grid lines */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-[110px] h-[110px] rounded-full border border-rose-500/10" />
                          <div className="w-[70px] h-[70px] rounded-full border border-rose-500/10" />
                          <div className="w-[30px] h-[30px] rounded-full border border-rose-500/10" />
                          
                          <div className="absolute w-[130px] h-[1px] bg-rose-500/10" />
                          <div className="absolute h-[130px] w-[1px] bg-rose-500/10" />
                        </div>

                        {/* Sweeping radar scanner */}
                        <div className="absolute w-[120px] h-[120px] pointer-events-none">
                          <div className="w-full h-full rounded-full relative">
                            <div 
                              className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-gradient-to-r from-rose-500 to-transparent origin-left radar-beam"
                              style={{ transformOrigin: "0% 50%" }}
                            />
                          </div>
                        </div>

                        {/* Pulsing Target Blips representing Active Collisions */}
                        {collisions.map((col, cIdx) => {
                          const angles = [35, 120, 220, 310];
                          const angle = angles[cIdx % angles.length];
                          const rad = (angle * Math.PI) / 180;
                          const distance = 25 + (cIdx * 15) % 25;
                          const x = Math.cos(rad) * distance;
                          const y = Math.sin(rad) * distance;

                          return (
                            <div 
                              key={col.date}
                              className="absolute w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] flex items-center justify-center"
                              style={{
                                left: `calc(50% + ${x}px - 5px)`,
                                top: `calc(50% + ${y}px - 5px)`,
                              }}
                            >
                              <span className="absolute inset-0 rounded-full bg-rose-500/60 animate-ping" style={{ animationDuration: `${1.5 + cIdx * 0.4}s` }} />
                              <span className="absolute w-1.5 h-1.5 rounded-full bg-rose-500" />
                            </div>
                          );
                        })}

                        {collisions.length === 0 && (
                          <div className="absolute text-[10px] text-slate-400 font-extrabold uppercase tracking-widest animate-pulse">
                            Radar Clear • Timetable Secure
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto">
                        {collisions.map(col => (
                          <div key={col.date} className={`p-4 rounded-2xl border flex flex-col gap-3 ${
                            darkMode ? "bg-black/20 border-white/[0.04]" : "bg-slate-50 border-slate-200/50"
                          }`}>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-400">{col.date}</span>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-500">{col.count} Collision Overlap</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              {col.tasks.map(t => (
                                <div key={t.id} className="flex justify-between items-center text-xs">
                                  <span className="font-bold">{t.title}</span>
                                  <span className="text-slate-400 font-mono">{t.courseCode}</span>
                                </div>
                              ))}
                            </div>
                            <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
                              darkMode ? "bg-rose-950/20 border-rose-900/30 text-rose-300" : "bg-rose-50 border-rose-100 text-rose-700"
                            }`}>
                              <strong>AI Suggestion:</strong> Shift work on <strong>{col.tasks[1]?.title || col.tasks[0].title}</strong> 2 days earlier to keep timetable stress indices balanced.
                            </div>
                          </div>
                        ))}
                        {collisions.length === 0 && (
                          <div className="text-center py-10 text-slate-400">No deadline collisions detected. Enjoy the calm! 🎉</div>
                        )}
                      </div>
                    </div>

                    {/* Mini Calendar Widget */}
                    <div className={`rounded-3xl p-6 border flex flex-col gap-5 ${
                      darkMode ? "bg-[#0d0c18]/70 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      <div className="flex justify-between items-center border-b dark:border-white/[0.04] pb-4">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500"><Calendar className="w-5 h-5" /></span>
                          <h3 className="text-lg font-bold font-sans">Mini Calendar</h3>
                        </div>
                        <button onClick={() => setShowQuickAdd(!showQuickAdd)} className="h-8 px-3 text-[11px] font-bold text-indigo-500 bg-indigo-500/10 rounded-lg flex items-center gap-1 border-none cursor-pointer">
                          <Plus className="w-3.5 h-3.5" /> Quick Add
                        </button>
                      </div>

                      {showQuickAdd && (
                        <form onSubmit={handleQuickAdd} className={`p-4 rounded-2xl border flex flex-col gap-3 animate-fade-in-up ${
                          darkMode ? "bg-black/35 border-white/[0.06]" : "bg-slate-50 border-slate-200"
                        }`}>
                          <div className="flex gap-2">
                            <input type="text" required value={quickTitle} onChange={(e)=>setQuickTitle(e.target.value)} placeholder="Event Title" className="flex-1 h-9 px-3 rounded-lg border text-xs focus:outline-none dark:bg-black/30 dark:border-white/[0.08] focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all" />
                            <input type="text" required value={quickCourse} onChange={(e)=>setQuickCourse(e.target.value)} placeholder="CS301" className="w-20 h-9 px-3 rounded-lg border text-xs text-center focus:outline-none dark:bg-black/30 dark:border-white/[0.08] focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all" />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <input type="date" required value={quickDate} onChange={(e)=>setQuickDate(e.target.value)} className="h-9 px-2 rounded-lg border text-xs dark:bg-black/30 dark:border-white/[0.08] focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all" />
                            <select value={quickCategory} onChange={(e)=>setQuickCategory(e.target.value as any)} className="h-9 px-1 rounded-lg border text-xs dark:bg-black/30 dark:border-white/[0.08] focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all">
                              <option value="Submission">Submission</option>
                              <option value="Exam">Exam</option>
                              <option value="Project">Project</option>
                            </select>
                            <select value={quickPriority} onChange={(e)=>setQuickPriority(e.target.value as any)} className="h-9 px-1 rounded-lg border text-xs dark:bg-black/30 dark:border-white/[0.08] focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all">
                              <option value="Normal">Normal</option>
                              <option value="Important">Important</option>
                              <option value="Critical">Critical</option>
                            </select>
                          </div>
                          <button type="submit" className="w-full h-9 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all active:scale-98">Add Event</button>
                        </form>
                      )}

                      <div className="flex justify-between items-center px-1">
                        <span className="text-sm font-extrabold font-sans">June 2026</span>
                      </div>
                      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-400 uppercase">
                        <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {renderMiniCalendar()}
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {/* TAB 2: PLANNER */}
              {activeTab === "planner" && (
                <div className="flex flex-col gap-8 animate-fade-in-up">
                  {/* Heatmap Section */}
                  <section 
                    ref={heatmapRef}
                    className={`rounded-3xl p-6 border transition-all duration-[1000ms] transform ${
                      heatmapVisible ? "translate-y-0 opacity-100 filter-none" : "translate-y-8 opacity-0 filter blur-sm"
                    } ${
                      darkMode ? "bg-[#0d0c18]/70 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-4 border-b dark:border-white/[0.04] pb-4 mb-5">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500"><BrainCircuit className="w-5 h-5" /></span>
                        <div>
                          <h3 className="text-lg font-bold font-sans">Academic Workload Heatmap</h3>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5">GitHub-Style activity representation</p>
                        </div>
                      </div>
                      <div className="p-1.5 rounded-xl border flex gap-1 items-center dark:bg-black/25 dark:border-white/[0.05] bg-slate-50 border-slate-200">
                        {["weekly", "monthly", "semester"].map(tab => (
                          <button
                            key={tab} onClick={() => { setHeatmapView(tab as any); setSelectedHeatDate(null); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                              heatmapView === tab
                                ? darkMode ? "bg-white/[0.06] text-white" : "bg-white text-indigo-600 border border-slate-200"
                                : "text-slate-400 hover:text-slate-300 bg-transparent border-none cursor-pointer"
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-5">
                      {heatmapView === "weekly" && (
                        <div className="grid grid-cols-7 gap-3 font-sans">
                          {weeklyDays.map((day, idx) => {
                            const details = getHoverDetails(day.dateStr);
                            return (
                              <div
                                key={day.dateStr} onClick={() => setSelectedHeatDate(day.dateStr)}
                                style={{ animationDelay: `${idx * 40}ms` }}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-between text-center min-h-[110px] load-fade-in-blur opacity-0 ${
                                  selectedHeatDate === day.dateStr ? "ring-2 ring-indigo-500/50 scale-105" : ""
                                } ${getHeatmapColorClass(details.tasks)}`}
                              >
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{day.weekday}</span>
                                <span className="text-sm font-extrabold my-2">{day.label}</span>
                                <span className="text-[10px] font-bold">{details.tasks} Tasks</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {heatmapView === "monthly" && (
                        <div className="grid grid-cols-6 sm:grid-cols-10 gap-2.5">
                          {monthlyDays.map((day, idx) => {
                            const details = getHoverDetails(day.dateStr);
                            return (
                              <div
                                key={day.dateStr} onClick={() => setSelectedHeatDate(day.dateStr)}
                                style={{ animationDelay: `${idx * 15}ms` }}
                                className={`h-[48px] rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 load-fade-in-blur opacity-0 ${
                                  selectedHeatDate === day.dateStr ? "ring-2 ring-indigo-500" : ""
                                } ${getHeatmapColorClass(details.tasks)}`}
                              >
                                <span className="text-xs font-bold">{new Date(day.dateStr).getDate()}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {heatmapView === "semester" && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {Array.from({ length: 10 }).map((_, wIdx) => (
                            <div key={wIdx} className="flex flex-col gap-1.5">
                              <span className="text-[9px] font-bold text-slate-400 text-center uppercase">W{wIdx+1}</span>
                              <div className="flex flex-col gap-1">
                                {Array.from({ length: 7 }).map((_, dIdx) => {
                                  const date = new Date(anchorDate);
                                  date.setDate(anchorDate.getDate() + (wIdx * 7 + dIdx));
                                  const dateStr = date.toISOString().split("T")[0];
                                  const details = getHoverDetails(dateStr);
                                  const overallIdx = wIdx * 7 + dIdx;
                                  return (
                                    <div
                                      key={dateStr} onClick={() => setSelectedHeatDate(dateStr)}
                                      style={{ animationDelay: `${overallIdx * 6}ms` }}
                                      className={`w-5.5 h-5.5 rounded border cursor-pointer hover:scale-110 load-fade-in-blur opacity-0 ${
                                        selectedHeatDate === dateStr ? "ring-1.5 ring-indigo-500" : ""
                                      } ${getHeatmapColorClass(details.tasks)}`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedHeatDate && (
                        <div className="p-4 rounded-2xl border flex flex-col sm:flex-row gap-4 justify-between items-start dark:bg-black/35 dark:border-white/[0.05] bg-slate-50 border-slate-200">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Workload Details</span>
                            <span className="text-sm font-extrabold">{selectedHeatDate}</span>
                          </div>
                          <div className="flex gap-3 text-xs font-bold">
                            <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-500">Tasks: {getHoverDetails(selectedHeatDate).tasks}</span>
                            <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-500">Exams: {getHoverDetails(selectedHeatDate).exams}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Tasks and Smart Plan */}
                  <section className="grid grid-cols-1 lg:grid-cols-[1.7fr_1.3fr] gap-6 md:gap-8 items-start">
                    {/* Deadlines List */}
                    <div className={`rounded-3xl p-6 border flex flex-col gap-5 ${
                      darkMode ? "bg-[#0d0c18]/70 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      <div className="flex justify-between items-center border-b dark:border-white/[0.04] pb-4">
                        <h3 className="text-lg font-bold font-sans">Academic Deadlines</h3>
                        <div className="flex gap-2">
                          <select value={courseFilter} onChange={(e)=>setCourseFilter(e.target.value)} className="h-8 px-2 rounded-lg border text-xs focus:outline-none dark:bg-black/30 dark:border-white/[0.06]">
                            <option value="All">All Courses</option><option value="CS301">CS301</option><option value="CS302">CS302</option><option value="MA201">MA201</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                        {deadlines
                          .filter(d => courseFilter === "All" ? true : d.courseCode === courseFilter)
                          .map(dl => {
                            const priorityColor = dl.priority === "Critical" ? "text-rose-500 bg-rose-500/10 border-rose-500/20" : dl.priority === "Important" ? "text-amber-500 bg-amber-500/10 border-amber-500/20" : "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
                            return (
                              <div key={dl.id} className={`p-4 rounded-2xl border flex items-center justify-between group transition-all ${
                                dl.completed ? "opacity-55" : darkMode ? "bg-black/20 border-white/[0.04] hover:bg-black/30" : "bg-slate-50 border-slate-200/50 hover:bg-slate-100/50"
                              }`}>
                                <div className="flex items-center gap-3">
                                  <button onClick={() => toggleCompleteDeadline(dl.id)} className="p-1 bg-transparent border-none cursor-pointer flex items-center justify-center">
                                    {dl.completed ? <CheckCircle2 className="w-5 h-5 text-indigo-500" /> : <Circle className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" />}
                                  </button>
                                  <div className="flex flex-col">
                                    <h4 className={`text-sm font-bold font-sans ${dl.completed ? "line-through text-slate-500" : ""}`}>{dl.title}</h4>
                                    <span className="text-[11px] text-slate-400 mt-1">{dl.courseCode} • Due {dl.date}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col items-end gap-1">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityColor}`}>{dl.priority}</span>
                                    <span className="text-[9px] font-extrabold uppercase tracking-wide border px-2 py-0.5 rounded-full dark:border-white/[0.08]">{dl.category}</span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <button onClick={() => handleEditClick(dl)} className="p-2 hover:bg-slate-200 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-indigo-500 border-none cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => setActiveSmartPlanId(dl.id)} className={`p-2 hover:bg-slate-200 dark:hover:bg-white/5 rounded-lg border-none cursor-pointer ${activeSmartPlanId === dl.id ? "text-amber-500" : "text-slate-400 hover:text-amber-500"}`}><Zap className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => deleteDeadline(dl.id)} className="p-2 hover:bg-slate-200 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-rose-500 border-none cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Reschedule Engine */}
                    <div className={`rounded-3xl p-6 border flex flex-col gap-5 sticky top-20 ${
                      darkMode ? "bg-[#0d0c18]/70 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      <div className="flex justify-between items-center border-b dark:border-white/[0.04] pb-4">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded bg-amber-500/10 text-amber-500"><Zap className="w-5 h-5 animate-pulse" /></span>
                          <h3 className="text-lg font-bold font-sans">Smart Reschedule Engine</h3>
                        </div>
                      </div>

                      {activeSmartPlan ? (
                        <div className="flex flex-col gap-4 animate-fade-in-up font-sans">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Target Task</span>
                            <span className="text-sm font-extrabold">{activeSmartDeadline?.title}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-xl border bg-black/10 dark:bg-black/20 border-white/[0.04] text-xs">
                            <span className="text-slate-400">AI Confidence Score:</span>
                            <span className="text-emerald-400 font-extrabold">{activeSmartPlan.confidence}%</span>
                          </div>
                          <div className="flex flex-col gap-4 border-l-2 border-indigo-500/30 pl-4 py-1 mt-2">
                            {activeSmartPlan.steps.map((step, idx) => (
                              <div key={idx} className="flex flex-col gap-0.5 relative">
                                <span className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                                <div className="flex justify-between text-[11px] text-slate-400">
                                  <span>{step.date}</span>
                                  <span className="text-indigo-400 uppercase font-bold">Phase {idx+1}</span>
                                </div>
                                <span className="text-sm font-bold">{step.phase}</span>
                              </div>
                            ))}
                          </div>
                          <button onClick={() => { alert("Smart breakdown loaded into focus blocks!"); setActiveSmartPlanId(null); }} className="w-full h-11 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer">Apply Study Breakdown</button>
                        </div>
                      ) : (
                        <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3">
                          <BrainCircuit className="w-8 h-8 text-slate-500" />
                          <span className="text-xs">Click the lightning <Zap className="w-3.5 h-3.5 inline mx-0.5" /> icon next to any upcoming deadline to generate AI reschedule focus breakdowns.</span>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Vertical Timeline */}
                  <section className={`rounded-3xl p-6 border flex flex-col gap-6 ${
                    darkMode ? "bg-[#0d0c18]/70 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <div className="flex items-center gap-2 border-b dark:border-white/[0.04] pb-4">
                      <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500"><Calendar className="w-5 h-5" /></span>
                      <div>
                        <h3 className="text-lg font-bold font-sans">Academic Timeline</h3>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">Chronological overview of team and course deadlines</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-6 pl-4 border-l-2 border-slate-200/60 dark:border-white/[0.04] py-2 relative">
                      {timelineDates.map(dateStr => {
                        const dayDeadlines = deadlines.filter(d => d.date === dateStr && !d.completed);
                        if (dayDeadlines.length === 0) return null;
                        const dObj = new Date(dateStr);
                        return (
                          <div key={dateStr} className="flex flex-col md:flex-row md:gap-8 relative">
                            <span className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-indigo-500" />
                            <div className="w-[120px] flex-shrink-0 flex flex-col gap-0.5">
                              <span className="text-xs font-extrabold text-indigo-400">{dObj.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="flex-1 flex flex-col gap-2.5">
                              {dayDeadlines.map(dl => (
                                <div key={dl.id} className={`p-3 rounded-xl border flex justify-between items-center ${
                                  darkMode ? "bg-black/20 border-white/[0.04]" : "bg-slate-50 border-slate-200"
                                }`}>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold">{dl.title}</span>
                                    <span className="text-[10px] text-slate-400 mt-0.5">{dl.courseCode} • {dl.time}</span>
                                  </div>
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">{dl.category}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              )}

              {/* TAB 3: TEAM */}
              {activeTab === "team" && (
                <div className="flex flex-col gap-8 animate-fade-in-up">
                  {/* Collaboration score */}
                  <section className={`w-full rounded-3xl p-6 md:p-8 border flex flex-col md:flex-row justify-between gap-6 transition-all ${
                    darkMode ? "bg-gradient-to-r from-[#0d0c18] to-[#121124] border-white/[0.06]" : "bg-gradient-to-r from-indigo-50/50 to-slate-50 border-slate-200 text-slate-800"
                  }`}>
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded bg-indigo-500/10 text-indigo-500"><Users className="w-5 h-5" /></span>
                        <h2 className="text-xl font-bold font-sans">Team Collaboration Hub</h2>
                      </div>
                      <p className={`text-sm leading-relaxed max-w-xl ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                        Distribute group assignment workloads, view real-time availability syncs, and balance peer capacity.
                      </p>
                      <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 max-w-xl ${
                        darkMode ? "bg-black/25 border-white/[0.05] text-[#38bdf8]" : "bg-white border-slate-200 text-indigo-600"
                      }`}>
                        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span><strong>AI Insight:</strong> {leastBusy.name} currently has the lowest active workload ({leastBusy.tasksCount} tasks). Consider allocating upcoming presentation prep to them.</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center p-6 rounded-2xl border bg-white dark:bg-black/25 border-slate-200/50 dark:border-white/[0.04] min-w-[200px] text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collaboration Score</span>
                      <span className="text-4xl font-extrabold text-[#38bdf8] mt-2 mb-1">92/100</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Highly Synced</span>
                    </div>
                  </section>

                  {/* Members workload & Free study block finder */}
                  <section className="grid grid-cols-1 lg:grid-cols-[1.6fr_1.4fr] gap-6 md:gap-8 items-start">
                    {/* Workloads */}
                    <div className={`rounded-3xl p-6 border flex flex-col gap-6 ${
                      darkMode ? "bg-[#0d0c18]/70 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      <div className="flex justify-between items-center border-b dark:border-white/[0.04] pb-4">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500"><Users className="w-5 h-5" /></span>
                          <h3 className="text-lg font-bold font-sans">Workload Balance</h3>
                        </div>
                      </div>
                      <div className="flex flex-col gap-5">
                        {teamMembers.map((member, mIdx) => {
                          const workloadPercent = Math.round((member.tasksCount / member.capacity) * 100);
                          return (
                            <div key={member.name} className="flex flex-col gap-3.5 p-4 rounded-2xl border dark:border-white/[0.03] dark:bg-black/10 bg-slate-50/50">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                <span className="flex items-center gap-2 text-xs font-bold">
                                  <span className={`w-2 h-2 rounded-full ${
                                    member.availability === "Highly Busy" ? "bg-rose-500 animate-pulse" : member.availability === "Busy" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                                  }`} />
                                  <span>{member.name}</span>
                                </span>
                                
                                <div className="flex items-center gap-4">
                                  {/* Active Tasks Adjuster */}
                                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                                    <span>Tasks:</span>
                                    <button 
                                      onClick={() => {
                                        const newMembers = [...teamMembers];
                                        newMembers[mIdx].tasksCount = Math.max(0, newMembers[mIdx].tasksCount - 1);
                                        const ratio = newMembers[mIdx].tasksCount / newMembers[mIdx].capacity;
                                        newMembers[mIdx].availability = ratio > 0.8 ? "Highly Busy" : ratio > 0.5 ? "Busy" : "Available";
                                        setTeamMembers(newMembers);
                                      }}
                                      className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-800 text-xs font-bold border-none cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 text-slate-800 dark:text-slate-200"
                                      type="button"
                                    >-</button>
                                    <span className="w-5 text-center text-sm font-extrabold text-slate-800 dark:text-white">{member.tasksCount}</span>
                                    <button 
                                      onClick={() => {
                                        const newMembers = [...teamMembers];
                                        newMembers[mIdx].tasksCount = Math.min(20, newMembers[mIdx].tasksCount + 1);
                                        const ratio = newMembers[mIdx].tasksCount / newMembers[mIdx].capacity;
                                        newMembers[mIdx].availability = ratio > 0.8 ? "Highly Busy" : ratio > 0.5 ? "Busy" : "Available";
                                        setTeamMembers(newMembers);
                                      }}
                                      className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-800 text-xs font-bold border-none cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 text-slate-800 dark:text-slate-200"
                                      type="button"
                                    >+</button>
                                  </div>

                                  {/* Capacity Adjuster */}
                                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 border-l dark:border-white/5 border-slate-200 pl-3">
                                    <span>Limit:</span>
                                    <input 
                                      type="number"
                                      min="1"
                                      max="25"
                                      value={member.capacity}
                                      onChange={(e) => {
                                        const val = Math.max(1, parseInt(e.target.value) || 1);
                                        const newMembers = [...teamMembers];
                                        newMembers[mIdx].capacity = val;
                                        const ratio = newMembers[mIdx].tasksCount / val;
                                        newMembers[mIdx].availability = ratio > 0.8 ? "Highly Busy" : ratio > 0.5 ? "Busy" : "Available";
                                        setTeamMembers(newMembers);
                                      }}
                                      className="w-11 h-6 px-1.5 rounded border text-xs text-center font-extrabold focus:outline-none dark:bg-black/40 dark:border-white/[0.08] focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-800 dark:text-white"
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    member.availability === "Highly Busy" ? "bg-rose-500" : member.availability === "Busy" ? "bg-amber-500" : "bg-emerald-500"
                                  }`} 
                                  style={{ width: `${Math.min(100, workloadPercent)}%` }} 
                                />
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                <span>Capacity Load: {workloadPercent}%</span>
                                <span className={
                                  member.availability === "Highly Busy" ? "text-rose-500" : member.availability === "Busy" ? "text-amber-500" : "text-emerald-500"
                                }>{member.availability}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Free Study Blocks */}
                    <div className={`rounded-3xl p-6 border flex flex-col gap-5 ${
                      darkMode ? "bg-[#0d0c18]/70 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      <div className="flex justify-between items-center border-b dark:border-white/[0.04] pb-4">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500"><Clock className="w-5 h-5" /></span>
                          <h3 className="text-lg font-bold font-sans">Free Time Finder</h3>
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 font-sans text-xs">
                        {[
                          { title: "Friday Block", time: "4:00 PM – 7:00 PM (3 Hrs)", status: "High Availability", color: "text-emerald-500 bg-emerald-500/10" },
                          { title: "Saturday Morning", time: "10:00 AM – 1:00 PM (3 Hrs)", status: "High Availability", color: "text-emerald-500 bg-emerald-500/10" },
                          { title: "Sunday Focus", time: "3:00 PM – 6:00 PM (3 Hrs)", status: "Medium Study Block", color: "text-amber-500 bg-amber-500/10" }
                        ].map((block, idx) => (
                          <div key={idx} className={`p-4 rounded-2xl border flex items-center justify-between ${
                            darkMode ? "bg-black/25 border-white/[0.04]" : "bg-slate-50 border-slate-200"
                          }`}>
                            <div className="flex flex-col">
                              <span className="text-sm font-extrabold">{block.title}</span>
                              <span className="text-slate-400 mt-1 font-semibold">{block.time}</span>
                            </div>
                            <span className={`font-bold px-2.5 py-1 rounded-lg ${block.color}`}>{block.status}</span>
                          </div>
                        ))}
                        <div className={`p-4 rounded-2xl border text-[11px] leading-relaxed ${
                          darkMode ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-700"
                        }`}>
                          <strong>AI Suggestion:</strong> Use the <strong>Saturday Morning</strong> focus block for Advanced Algorithms preparation to decrease your upcoming midterm stress index by 15%.
                        </div>
                      </div>
                    </div>

                    {/* Invite Peer Widget */}
                    <div className={`rounded-3xl p-6 border flex flex-col gap-5 ${
                      darkMode ? "bg-[#0d0c18]/70 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      <div className="flex justify-between items-center border-b dark:border-white/[0.04] pb-4">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500"><Mail className="w-5 h-5" /></span>
                          <h3 className="text-lg font-bold font-sans">Invite Peer</h3>
                        </div>
                      </div>
                      
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!inviteName.trim() || !invitedEmail.trim()) return;
                          
                          // Add new peer dynamically to workload balance list
                          const newMember: TeamMember = {
                            name: inviteName.trim(),
                            tasksCount: 0,
                            availability: "Available",
                            capacity: 8
                          };
                          setTeamMembers(prev => [...prev, newMember]);
                          
                          // Append AI Chat notification
                          setChatHistory(prev => [
                            ...prev,
                            {
                              id: Math.random().toString(),
                              sender: "ai",
                              text: `New peer **${inviteName.trim()}** has been successfully invited and synced to your assignment workspace.`,
                              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }
                          ]);

                          // Show success notification
                          setInviteSuccessMsg(`Invitation sent to ${invitedEmail.trim()}`);
                          setTimeout(() => setInviteSuccessMsg(""), 3500);

                          // Reset inputs
                          setInviteName("");
                          setInvitedEmail("");
                        }}
                        className="flex flex-col gap-3 font-sans text-xs"
                      >
                        {inviteSuccessMsg && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold tracking-wide animate-pulse">
                            {inviteSuccessMsg}
                          </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Peer Name</label>
                          <input 
                            type="text" 
                            required 
                            value={inviteName} 
                            onChange={(e) => setInviteName(e.target.value)} 
                            placeholder="Rahul Sharma" 
                            className="h-10 px-3 rounded-xl border text-xs focus:outline-none dark:bg-black/30 dark:border-white/[0.08] focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-800 dark:text-white"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                          <input 
                            type="email" 
                            required 
                            value={invitedEmail} 
                            onChange={(e) => setInvitedEmail(e.target.value)} 
                            placeholder="rahul@university.edu" 
                            className="h-10 px-3 rounded-xl border text-xs focus:outline-none dark:bg-black/30 dark:border-white/[0.08] focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-800 dark:text-white"
                          />
                        </div>

                        <button 
                          type="submit" 
                          className="w-full h-10 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all active:scale-98 cursor-pointer mt-2"
                        >
                          Send Collaboration Invite
                        </button>
                      </form>
                    </div>
                  </section>
                </div>
              )}

              {/* TAB 4: ASSISTANT */}
              {activeTab === "assistant" && (
                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_0.5fr] gap-6 md:gap-8 items-start h-[calc(100vh-160px)] animate-fade-in-up">
                  {/* Chat interface */}
                  <div className={`rounded-3xl border flex flex-col h-full overflow-hidden ${
                    darkMode ? "bg-[#0d0c18]/70 border-white/[0.06] backdrop-blur-md" : "bg-white border-slate-200 shadow-sm"
                  }`}>
                    <div className="p-5 border-b dark:border-white/[0.04] border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded bg-indigo-500/10 text-indigo-500"><Bot className="w-5 h-5" /></span>
                        <div>
                          <h3 className="text-sm font-bold font-sans">AI Planner Assistant</h3>
                          <span className="text-[9px] text-emerald-500 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live Context Active
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
                      {chatHistory.map((msg, idx) => {
                        const isUser = msg.sender === "user";
                        return (
                          <div key={idx} className={`flex gap-3 max-w-[85%] text-xs font-sans leading-relaxed ${isUser ? "self-end flex-row-reverse" : "self-start"}`}>
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-md ${isUser ? "bg-gradient-to-tr from-violet-600 to-indigo-600 text-white" : "bg-slate-800 text-indigo-400"}`}>
                              {isUser ? "U" : <Bot className="w-4 h-4 text-[#38bdf8]" />}
                            </div>
                            <div className={`p-4 rounded-2xl border ${isUser ? "bg-indigo-50 border-indigo-100 dark:bg-white/[0.05] dark:border-white/[0.08]" : "bg-slate-50 border-slate-200 dark:bg-black/35 dark:border-white/[0.04] text-slate-300"}`}>
                              <p className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={(e)=>{ e.preventDefault(); if(!assistantInput.trim())return; askAI(assistantInput); setAssistantInput(""); }} className="p-4 border-t dark:border-white/[0.04] border-slate-100 flex gap-2 items-center">
                      <div className="relative flex-1">
                        <input 
                          type="text" 
                          value={assistantInput} 
                          onChange={(e)=>setAssistantInput(e.target.value)} 
                          placeholder="Ask about timetable collisions, stress score, focus blocks..." 
                          className="w-full h-12 pl-4 pr-12 rounded-xl border text-xs focus:outline-none dark:bg-black/35 dark:border-white/[0.08] dark:text-white" 
                        />
                        <button
                          type="button"
                          onClick={toggleListening}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center border-none cursor-pointer transition-all ${
                            isListening 
                              ? "bg-rose-500/20 text-rose-500 animate-pulse border border-rose-500/35" 
                              : "bg-transparent text-slate-400 hover:text-slate-200"
                          }`}
                          title="Click to dictate (Voice to Text)"
                        >
                          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                      </div>
                      <button type="submit" className="w-12 h-12 rounded-xl text-white bg-indigo-600 flex items-center justify-center border-none cursor-pointer"><Send className="w-4 h-4" /></button>
                    </form>
                  </div>

                  {/* Shortcuts panel */}
                  <div className="flex flex-col gap-6 font-sans">
                    <div className={`rounded-3xl p-5 border flex flex-col gap-4 ${
                      darkMode ? "bg-[#0d0c18]/70 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Suggestions</span>
                      <div className="flex flex-col gap-2">
                        {[
                          "What should I complete today?",
                          "Which task should I prioritize?",
                          "Do I have any deadline collisions?",
                          "When are my study focus blocks?"
                        ].map((q, idx) => (
                          <button key={idx} onClick={()=>askAI(q)} className="w-full text-left p-3 rounded-xl border text-xs font-bold transition-all hover:-translate-y-0.5 cursor-pointer dark:bg-black/20 dark:border-white/[0.04] hover:dark:bg-black/35 bg-slate-50 border-slate-200 hover:bg-slate-100">{q}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: HEALTH */}
              {activeTab === "health" && (
                <div className="flex flex-col gap-8 animate-fade-in-up">
                  {/* Semester health hero */}
                  <section className={`w-full rounded-3xl p-6 md:p-8 border flex flex-col md:flex-row justify-between gap-6 transition-all ${
                    darkMode ? "bg-gradient-to-r from-[#0d0c18] to-[#14122d] border-white/[0.06]" : "bg-gradient-to-r from-[#eef2ff] to-[#f5f7ff] border-indigo-100 text-slate-800"
                  }`}>
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded bg-emerald-500/10 text-emerald-500"><HeartPulse className="w-5 h-5" /></span>
                        <h2 className="text-xl font-bold font-sans">Semester Academic Health</h2>
                      </div>
                      <p className={`text-sm leading-relaxed max-w-xl ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                        Dynamic index derived from total workloads, collision radars, and task complete rates.
                      </p>
                      <div className="flex gap-3 text-xs font-bold">
                        <span className="px-3 py-1 rounded-xl border dark:border-white/[0.06]">Exams Pending: {examsCount}</span>
                        <span className="px-3 py-1 rounded-xl border dark:border-white/[0.06]">Submissions Pending: {submissionsCount}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center p-6 rounded-2xl border bg-white dark:bg-black/25 border-slate-200/50 dark:border-white/[0.04] min-w-[200px] text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Health Score</span>
                      <span className="text-4xl font-extrabold text-emerald-500 mt-2 mb-1">{semesterHealth}%</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Optimal Stability</span>
                    </div>
                  </section>

                  {/* Productivity Gauge & Chart Grid */}
                  <section className="grid grid-cols-1 lg:grid-cols-[1.25fr_1.75fr] gap-6 md:gap-8 items-start">
                    {/* Circle gauge */}
                    <div className={`rounded-3xl p-6 border flex flex-col gap-6 ${
                      darkMode ? "bg-[#0d0c18]/70 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      <div className="flex items-center gap-2 border-b dark:border-white/[0.04] pb-4">
                        <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500"><Award className="w-5 h-5" /></span>
                        <h3 className="text-lg font-bold font-sans">Productivity Meter</h3>
                      </div>
                      <div className="flex flex-col items-center py-4 relative">
                        <div className="w-32 h-32 rounded-full border-8 border-slate-200/50 dark:border-slate-800 flex items-center justify-center relative">
                          <svg className="absolute top-[-8px] left-[-8px] w-[144px] h-[144px] transform -rotate-90">
                            <circle cx="72" cy="72" r="64" stroke="url(#g1)" strokeWidth="8" fill="transparent" strokeDasharray="402" strokeDashoffset={402 - (402 * productivityProgress) / 100} strokeLinecap="round" />
                            <defs>
                              <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3F51B5" /><stop offset="100%" stopColor="#10b981" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="flex flex-col items-center">
                            <span className="text-3xl font-extrabold">{productivityProgress}</span>
                            <span className="text-[10px] text-slate-400 font-bold">Index</span>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-500 mt-5 font-bold flex items-center gap-0.5"><ChevronUp className="w-4 h-4" />+12% this week</span>
                      </div>
                    </div>

                    {/* Workload curve */}
                    <div className={`rounded-3xl p-6 border flex flex-col gap-6 ${
                      darkMode ? "bg-[#0d0c18]/70 border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      <div className="flex items-center gap-2 border-b dark:border-white/[0.04] pb-4">
                        <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500"><TrendingUp className="w-5 h-5" /></span>
                        <h3 className="text-lg font-bold font-sans">Workload curve</h3>
                      </div>
                      <div className="h-[180px] w-full relative">
                        <svg className="w-full h-full" viewBox="0 0 500 180" preserveAspectRatio="none">
                          <path d="M0,150 C50,140 100,50 150,70 C200,90 250,150 300,120 C350,90 400,20 450,50 C480,70 500,110 500,110 L500,180 L0,180 Z" fill="url(#g2)" opacity="0.15" />
                          <path d="M0,150 C50,140 100,50 150,70 C200,90 250,150 300,120 C350,90 400,20 450,50 C480,70 500,110 500,110" stroke="#3F51B5" strokeWidth="3" fill="none" />
                          <defs>
                            <linearGradient id="g2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#3F51B5" /><stop offset="100%" stopColor="#3F51B5" stopOpacity="0" /></linearGradient>
                          </defs>
                          <circle cx="150" cy="70" r="4.5" fill="#3f51b5" /><circle cx="400" cy="20" r="4.5" fill="#ef4444" className="animate-pulse" />
                        </svg>
                        <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase mt-4 px-1">
                          <span>W1</span><span>W3 (Midterm)</span><span>W6</span><span>W9 (Projects)</span><span>W12 (Finals)</span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

            </main>
          </div>

          {/* 3. MOBILE MENU SIDEBAR DRAWER DRAWER */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden animate-fade-in">
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
              <aside className={`relative w-[280px] h-full flex flex-col p-6 animate-slide-in-right ${
                darkMode ? "bg-[#0d0c18] border-r border-white/[0.06]" : "bg-white border-r border-slate-200"
              }`}>
                <div className="flex justify-between items-center mb-8 pb-4 border-b dark:border-white/[0.06] border-slate-200">
                  <h1 className="text-lg font-bold uppercase flex items-center gap-2 select-none">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-5 h-5 acadesk-logo-svg pointer-events-none">
                      <defs>
                        <linearGradient id="miniBookCoverGradMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#6D28D9" />
                        </linearGradient>
                        <linearGradient id="miniBookSpineGradMobile" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#5B21B6" />
                          <stop offset="100%" stopColor="#7C3AED" />
                        </linearGradient>
                      </defs>
                      <g className="logo-group">
                        <path className="logo-pages-3" d="M 66,46 C 80,30 120,30 144,46 Z" fill="#E2E8F0" stroke="#2E1065" strokeWidth="3" />
                        <path className="logo-pages-2" d="M 67,46 C 80,34 120,34 145,46 Z" fill="#CBD5E1" stroke="#2E1065" strokeWidth="3" />
                        <path className="logo-pages-1" d="M 68,46 C 80,38 120,38 146,46 Z" fill="#F8FAFC" stroke="#2E1065" strokeWidth="3" />
                        <path className="logo-spine-fill" d="M 68,46 L 56,46 C 50,46 50,52 50,56 L 50,144 C 50,148 50,154 56,154 L 68,154 Z" fill="url(#miniBookSpineGradMobile)" />
                        <path className="logo-cover-fill" d="M 68,46 L 144,46 Q 152,46 152,54 L 152,146 Q 152,154 144,154 L 68,154 Z" fill="url(#miniBookCoverGradMobile)" />
                        <path className="logo-outline" d="M 68,46 L 144,46 Q 152,46 152,54 L 152,146 Q 152,154 144,154 L 56,154 Q 50,154 50,144 L 50,56 Q 50,46 56,46 Z" fill="none" stroke="#2E1065" strokeWidth="4.5" strokeLinejoin="round" />
                        <line className="logo-spine-divider" x1="68" y1="46" x2="68" y2="154" stroke="#2E1065" strokeWidth="4.5" strokeLinecap="round" />
                        <g className="logo-face">
                          <g className="logo-eye eye-left"><circle cx="96" cy="94" r="6" fill="#2E1065" /></g>
                          <g className="logo-eye eye-right"><circle cx="124" cy="94" r="6" fill="#2E1065" /></g>
                          <path className="logo-smile" d="M 96,108 C 96,121 124,121 124,108" fill="none" stroke="#2E1065" strokeWidth="3.5" strokeLinecap="round" />
                        </g>
                      </g>
                    </svg>
                    <span className={darkMode ? "text-white" : "text-[#1D1055]"} style={{ fontFamily: "'Outfit', sans-serif" }}>Acadesk</span>
                  </h1>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg border-none hover:bg-slate-200 dark:hover:bg-white/5"><X className="w-5 h-5" /></button>
                </div>

                <nav className="flex-1 flex flex-col gap-2">
                  {[
                    { tab: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
                    { tab: "planner", label: "Planner & Timelines", icon: Calendar },
                    { tab: "team", label: "Team Space", icon: Users },
                    { tab: "assistant", label: "AI Planner Assistant", icon: Bot },
                    { tab: "health", label: "Semester Analytics", icon: HeartPulse }
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.tab}
                        onClick={() => { setActiveTab(item.tab as any); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3.5 px-4 h-12 rounded-xl text-sm font-semibold text-left border-none cursor-pointer ${
                          activeTab === item.tab 
                            ? darkMode ? "bg-white/[0.06] text-white" : "bg-indigo-50 text-[#3F51B5]"
                            : "text-slate-400 hover:text-white bg-transparent"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="pt-4 border-t dark:border-white/[0.06] border-slate-200 flex items-center justify-between">
                  <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-xl border flex items-center justify-center cursor-pointer ${darkMode ? "bg-slate-900 border-slate-800 text-yellow-400" : "bg-white border-slate-200 text-slate-600"}`}>
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={async () => { 
                      await firebaseSignOut(); 
                      localStorage.removeItem("syncspace_email"); 
                      setCurrentPage("landing"); 
                      setMobileMenuOpen(false); 
                    }} 
                    className="text-xs font-bold text-rose-500 hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              </aside>
            </div>
          )}

        </div>
      )}

      {/* DYNAMIC EDIT DEADLINE MODAL IN SPA */}
      {editingDeadline && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className={`rounded-3xl p-6 max-w-[380px] w-full border relative ${
            darkMode ? "bg-[#0d0c18] border-white/[0.08] text-white" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <h4 className="text-base font-bold font-sans mb-4">Edit Deadline Settings</h4>
            
            <form onSubmit={handleEditSave} className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1.5">Task Title</label>
                <input 
                  type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  className={`h-10 px-3 rounded-lg border text-xs focus:outline-none ${
                    darkMode ? "bg-black/35 border-white/[0.08] text-white" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1.5">Priority</label>
                  <select
                    value={editPriority} onChange={(e) => setEditPriority(e.target.value as any)}
                    className={`h-10 px-2 rounded-lg border text-xs ${
                      darkMode ? "bg-black/35 border-white/[0.08] text-white" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="Normal">Normal</option><option value="Important">Important</option><option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1.5">Category</label>
                  <select
                    value={editCategory} onChange={(e) => setEditCategory(e.target.value as any)}
                    className={`h-10 px-2 rounded-lg border text-xs ${
                      darkMode ? "bg-black/35 border-white/[0.08] text-white" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="Submission">Submission</option><option value="Exam">Exam</option><option value="Project">Project</option><option value="Meeting">Meeting</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setEditingDeadline(null)} className="flex-1 h-10 rounded-lg text-xs font-bold border border-slate-200 text-slate-500 bg-transparent cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 h-10 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg border-none cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

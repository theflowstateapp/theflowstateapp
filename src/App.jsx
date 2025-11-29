
import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/**
 * FlowState App – Landing + Dashboard single-file (Vite + React + Tailwind)
 * - BACKEND: 'local' (default) or 'supabase' via VITE_BACKEND
 * - Supabase creds via VITE_SUPABASE_URL and VITE_SUPABASE_KEY
 */

const BACKEND = (import.meta.env.VITE_BACKEND || 'local').toLowerCase(); // 'local' | 'supabase'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "";
const supabase = (BACKEND === 'supabase' && SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// ---------- Types & Defaults ----------
const todayISO = () => new Date().toISOString().slice(0, 10);

const DEFAULT_GOALS = {
  wakeGoal: "07:00",
  workoutGoal: "19:00",
  lunchTime: "13:30",
  dinnerTime: "21:00",
};

// P.A.R.A. Method Categories
const PARA_CATEGORIES = {
  PROJECTS: "Projects", // Specific outputs with deadlines
  AREAS: "Areas", // Ongoing responsibilities to maintain standards
  RESOURCES: "Resources", // Topics of ongoing interest
  ARCHIVES: "Archives" // Inactive items from the above categories
};

// AI Processing Structure
const AI_CAPABILITIES = {
  TASK_EXTRACTION: "Extract tasks and to-dos",
  SCHEDULE_PARSING: "Parse time-based information", 
  SENTIMENT_ANALYSIS: "Analyze mood and energy levels",
  HABIT_TRACKING: "Track habit patterns and suggestions",
  GOAL_ALIGNMENT: "Connect daily activities to broader goals"
};

// Tutorial Steps
const TOUR_STEPS = [
  {
    id: "welcome",
    title: "Welcome to FlowState",
    content: "Your AI-powered Life OS that organizes everything using the P.A.R.A. method. Let's take a quick tour!",
    position: "center",
    action: "Welcome to your new Life OS!"
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    content: "Just start chatting! Tell me about your day, goals, tasks - I'll automatically organize everything for you.",
    position: "bottom",
    target: "[data-tour='ai-assistant']"
  },
  {
    id: "para-method",
    title: "P.A.R.A. Organization",
    content: "Everything gets categorized into Projects (deadline-driven), Areas (ongoing standards), Resources (learning), and Archives (completed).",
    position: "top",
    target: "[data-tour='para-dashboard']"
  },
  {
    id: "daily-tracking",
    title: "Daily Habits",
    content: "Track wake times, workouts, meals, and mood. The AI extracts this from your chats automatically.",
    position: "left",
    target: "[data-tour='daily-tracking']"
  },
  {
    id: "quick-edit",
    title: "Quick Edit",
    content: "Manually adjust any data or add notes. Changes sync across your entire Life OS.",
    position: "right",
    target: "[data-tour='quick-edit']"
  },
  {
    id: "navigation",
    title: "Navigation",
    content: "Switch between Landing, Dashboard, and AI Assistant. Look for tooltips (💡) for extra help.",
    position: "bottom",
    target: "[data-tour='navigation']"
  }
];

// ---------- Local Storage Helpers ----------
const STORAGE_KEY = "flowstate.daily";

function loadAllDaysLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllDaysLocal(obj) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

function upsertDayLocal(date, data) {
  const all = loadAllDaysLocal();
  all[date] = { ...(all[date] || {}), ...data };
  saveAllDaysLocal(all);
  return all[date];
}

function readDayLocal(date) {
  const all = loadAllDaysLocal();
  return all[date] || null;
}

// ---------- Supabase Adapter ----------
async function loadAllDays() {
  if (BACKEND === "supabase" && supabase) {
    try {
      const { data, error } = await supabase.from("flowstate_days").select("*");
      if (error) throw error;
      const entries = {};
      data.forEach((row) => { entries[row.date] = row.payload; });
      return entries;
    } catch (e) {
      console.warn("Supabase loadAllDays failed, using local fallback", e);
      return loadAllDaysLocal();
    }
  }
  return loadAllDaysLocal();
}

async function upsertDay(date, data) {
  if (BACKEND === "supabase" && supabase) {
    try {
      const { data: upserted, error } = await supabase
        .from("flowstate_days")
        .upsert({ date, payload: data }, { onConflict: "date" })
        .select();
      if (error) throw error;
      return upserted?.[0]?.payload || data;
    } catch (e) {
      console.warn("Supabase upsert failed, using local fallback", e);
      return upsertDayLocal(date, data);
    }
  }
  return upsertDayLocal(date, data);
}

async function readDay(date) {
  if (BACKEND === "supabase" && supabase) {
    try {
      const { data, error } = await supabase
        .from("flowstate_days")
        .select("*")
        .eq("date", date)
        .maybeSingle();
      if (error) throw error;
      return data?.payload || null;
    } catch (e) {
      console.warn("Supabase read failed, using local fallback", e);
      return readDayLocal(date);
    }
  }
  return readDayLocal(date);
}

// ---------- Seed ----------
async function seedIfEmpty() {
  const all = await loadAllDays();
  if (Object.keys(all).length === 0) {
    const d = todayISO();
    await upsertDay(d, {
      wakeTime: "10:00",
      lunch: { time: "13:30", details: "veg + one vegetable + dal" },
      dinner: { time: "21:00", details: "grilled protein (chicken or fish)" },
      workout: { time: "19:00", status: "skipped" },
      notes: "Kickoff day. Establishing routine and dashboard.",
      goals: { ...DEFAULT_GOALS },
    });
  }
}
seedIfEmpty();

// ---------- Small UI primitives ----------
const Container = ({ children, className = "" }) => (
  <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
);
const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur ${className}`}>{children}</div>
);
const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
    {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
  </div>
);
const Badge = ({ children, className = "" }) => (
  <span className={`inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 ${className}`}>
    {children}
  </span>
);
const Tooltip = ({ children, content, position = "top" }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative inline-block">
      <div 
        onMouseEnter={() => setVisible(true)} 
        onMouseLeave={() => setVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {visible && (
        <div className={`absolute z-50 px-2 py-1 text-xs text-white bg-slate-900 rounded shadow-lg whitespace-nowrap ${
          position === 'top' ? 'bottom-full mb-1 left-1/2 transform -translate-x-1/2' :
          position === 'bottom' ? 'top-full mt-1 left-1/2 transform -translate-x-1/2' :
          position === 'left' ? 'right-full mr-1 top-1/2 transform -translate-y-1/2' :
          'left-full ml-1 top-1/2 transform -translate-y-1/2'
        }`}>
          {content}
          <div className={`absolute w-0 h-0 ${
            position === 'top' ? 'top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900' :
            position === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-900' :
            position === 'left' ? 'left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-slate-900' :
            'right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-slate-900'
          }`}></div>
        </div>
      )}
    </div>
  );
};
const Button = ({ children, onClick, type = "button", className = "" }) => (
  <button type={type} onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition hover:shadow ${className}`}>
    {children}
  </button>
);
const Input = (props) => (
  <input {...props} className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 ${props.className || ""}`} />
);
const Textarea = (props) => (
  <textarea {...props} className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 ${props.className || ""}`} />
);

// ---------- KPI helpers ----------
function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}
function scoreWake(wakeTime, goal = DEFAULT_GOALS.wakeGoal) {
  const wt = timeToMinutes(wakeTime);
  const gt = timeToMinutes(goal);
  if (wt == null || gt == null) return null;
  const diff = Math.abs(wt - gt);
  const s = Math.max(0, 100 - (diff / 110) * 100);
  return Math.round(s);
}
function pillStatusColor(status) {
  if (status === "done") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "skipped") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

// ---------- Tour Component ----------
function QuickDemo() {
  const [activeDemo, setActiveDemo] = useState(0);
  const demos = [
    {
      icon: "💬",
      title: "Just Chat Naturally",
      example: "Hey! I woke up at 7 AM, had breakfast, and I'm planning to learn Python today.",
      result: "✓ Wake time logged\n✓ Meal tracked\n✓ Learning goal added"
    },
    {
      icon: "📊", 
      title: "Everything Organized",
      example: "I need to call my mom this weekend and prepare for my presentation next Tuesday.",
      result: "✓ Reminder set\n✓ Task scheduled\n✓ Presentation project created"
    },
    {
      icon: "🎯",
      title: "Goals & Insights",
      example: "Feeling great after this workout! My goal is to run a 5K by March.",
      result: "✓ Workout logged\n✓ Mood recorded\n✓ 5K goal tracked with timeline"
    }
  ];

  return (
    <div className="text-center py-8 bg-gradient-to-br from-indigo-50 to-emerald-50 rounded-xl border border-slate-200">
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="text-2xl">{demos[activeDemo].icon}</div>
        <h3 className="text-xl font-bold text-slate-900">{demos[activeDemo].title}</h3>
      </div>
      
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-600 mb-2">You say:</p>
          <p className="text-slate-800 font-medium italic">"{demos[activeDemo].example}"</p>
        </div>
        
        <div className="bg-gradient-to-r from-indigo-100 to-emerald-100 rounded-lg p-4 border border-indigo-200">
          <p className="text-sm text-indigo-800 mb-2">AI automatically:</p>
          <div className="text-indigo-900 whitespace-pre-line font-medium">{demos[activeDemo].result}</div>
        </div>
        
        <div className="flex justify-center gap-2">
          {demos.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveDemo(i)}
              className={`w-2 h-2 rounded-full ${
                i === activeDemo ? 'bg-indigo-500' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AppTour({ isOpen, onClose, onNext, onPrev, currentStep, totalSteps }) {
  if (!isOpen) return null;
  
  const step = TOUR_STEPS[currentStep];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg mx-4 relative animate-in fade-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 text-sm font-bold text-white">
              Flow
            </div>
            <span className="text-sm font-semibold text-slate-900">FlowState Tour</span>
          </div>
          <span className="text-sm text-slate-500">{currentStep + 1} of {totalSteps}</span>
        </div>
        
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
          <p className="text-slate-600 leading-relaxed">{step.content}</p>
          {step.action && (
            <div className="mt-3 p-3 bg-gradient-to-r from-indigo-50 to-emerald-50 rounded-lg border border-slate-200">
              <span className="text-sm text-slate-700">{step.action}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button onClick={onPrev} className="border border-slate-300 bg-white text-slate-900">
                Previous
              </Button>
            )}
            {currentStep === totalSteps - 1 && (
              <Button onClick={onClose} className="bg-slate-900 text-white hover:bg-slate-800">
                Complete Tour
              </Button>
            )}
          </div>
          
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === currentStep 
                    ? 'bg-gradient-to-r from-indigo-500 to-emerald-500' 
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          
          {currentStep < totalSteps - 1 && (
            <Button onClick={onNext} className="bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:from-indigo-600 hover:to-emerald-600">
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Landing ----------
function Landing({ onGetStarted, onStartTour, onStartChatting }) {
  return (
    <div className="relative">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.12),transparent_40%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.12),transparent_40%)]" />
        <Container className="pt-16 pb-20">
          <div className="flex flex-col items-center text-center">
              <Badge className="bg-gradient-to-r from-indigo-100 to-emerald-100 border-indigo-200 text-indigo-800">
                🤖 AI‑Powered Life Assistant
              </Badge>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              🚀🚀🚀 NUCLEAR DEPLOYMENT SUCCESSFUL! 🚀🚀🚀
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              Just chat naturally! Your AI assistant listens, understands, and automatically organizes everything — from daily habits to big goals. No complicated forms, no confusing buttons.
            </p>
            <div className="mt-8 flex gap-4">
              <Button 
                onClick={onStartChatting}
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:from-indigo-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 px-8 py-4 text-lg font-bold"
              >
                <span className="mr-3">🤖</span>
                Start Chatting Now
              </Button>
              <Button onClick={onGetStarted} className="border-2 border-slate-300 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-400 px-8 py-4 text-lg font-semibold">
                See Your Life Organized 👀
              </Button>
            </div>
            
            <div className="mt-6">
              <Button onClick={onStartTour} className="text-slate-500 hover:text-slate-700 text-sm underline">
                👋 New? Take a Quick Tour
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Quick Demo Section */}
      <Container className="py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">See It In Action</h2>
          <p className="text-lg text-slate-600">Watch how easy it is to organize your life with AI</p>
        </div>
        <QuickDemo />
      </Container>

      <Container className="py-12">
        <SectionTitle 
          title="Here's How Your AI Assistant Helps" 
          subtitle="Real examples of how people use their AI Life Assistant" 
        />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { 
              icon: "🏃‍♀️", 
              title: "Track Your Habits", 
              example: "\"I woke up at 7 AM and did a 20-minute workout\"",
              desc: "Your assistant automatically logs wake times, workouts, meals, and more — just speak naturally!"
            },
            { 
              icon: "📝", 
              title: "Capture Everything", 
              example: "\"Remind me to call mom this weekend\"",
              desc: "Jot down tasks, ideas, reminders, and appointments. Your assistant remembers everything."
            },
            { 
              icon: "📊", 
              title: "Set & Track Goals", 
              example: "\"I want to learn Spanish by June\"",
              desc: "Turn goals into actionable plans and track progress automatically over time."
            },
            { 
              icon: "📱", 
              title: "Plan Your Day", 
              example: "\"I have meetings at 2 PM and need lunch at 1 PM\"",
              desc: "Schedule your day effortlessly — your assistant organizes everything logically."
            },
            { 
              icon: "🧠", 
              title: "Mood & Energy Tracking", 
              example: "\"Feeling really energetic today after that workout\"",
              desc: "Track how you feel and discover patterns between activities and mood."
            },
            { 
              icon: "🎯", 
              title: "Remember Everything Important", 
              example: "\"Sarah likes almond lattes — remember for her birthday\"",
              desc: "Store important details about friends, family, projects, and personal preferences."
            },
          ].map((f, i) => (
            <Card key={i} className="p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-bl-full opacity-50 group-hover:opacity-70"></div>
              <div className="relative">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg mb-3 border border-blue-100">
                  <p className="text-sm font-medium text-slate-700 italic">"{f.example.replace(/"/g, '')}"</p>
                </div>
                <p className="text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </Container>

      <Container className="pb-16">
        <SectionTitle 
          title="Simple as Having a Conversation" 
          subtitle="No learning curve, no complicated menus — just chat!" 
        />
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            { 
              n: 1, 
              t: "Speak Naturally", 
              d: "Chat like you're talking to a smart friend. Say whatever's on your mind!",
              emoji: "💬",
              highlight: "No forms to fill out"
            },
            { 
              n: 2, 
              t: "AI Understands & Organizes", 
              d: "Your assistant automatically captures tasks, habits, goals, and memories.",
              emoji: "🧠",
              highlight: "Zero manual work"
            },
            { 
              n: 3, 
              t: "See Everything Clearly", 
              d: "Your organized life appears instantly — habits, goals, and insights at a glance.",
              emoji: "📊",
              highlight: "Personal dashboard"
            },
          ].map((s) => (
            <Card key={s.n} className="p-8 text-center relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-emerald-50 opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative">
                <div className="text-4xl mb-4">{s.emoji}</div>
                <div className="flex h-12 w-12 mx-auto mb-6 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 text-lg font-bold text-white">{s.n}</div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{s.t}</h4>
                <div className="inline-block bg-gradient-to-r from-indigo-100 to-emerald-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                  {s.highlight}
                </div>
                <p className="text-slate-600 leading-relaxed">{s.d}</p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
}

// ---------- Dashboard ----------
function KPI({ label, value, hint, icon, trend }) {
  const getTrendColor = (trend) => {
    if (trend === 'up') return 'text-emerald-500';
    if (trend === 'down') return 'text-red-500';
    return 'text-slate-400';
  };

  return (
    <Card className="p-5 hover:shadow-lg transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-50 to-emerald-50 rounded-bl-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-slate-600 uppercase tracking-wide">{label}</div>
          {icon && <div className="text-xl">{icon}</div>}
        </div>
        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold text-slate-900">{value}</div>
          {trend && (
            <div className={`text-sm font-medium ${getTrendColor(trend)}`}>
              {trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : ''}
            </div>
          )}
        </div>
        {hint && (
          <div className="mt-2 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-full inline-block">
            {hint}
          </div>
        )}
      </div>
    </Card>
  );
}
function ProgressBar({ value }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className="h-2 rounded-full bg-slate-900" style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} />
    </div>
  );
}
function QuickCapture({ onAdd }) {
  const [v, setV] = useState("");
  return (
    <div className="mt-3 flex gap-2">
      <Input value={v} onChange={(e) => setV(e.target.value)} placeholder="Write a thought or task…" />
      <Button onClick={() => { if (!v.trim()) return; onAdd(v.trim()); setV(""); }} className="bg-slate-900 text-white hover:bg-slate-800">Add</Button>
    </div>
  );
}

function TodaySummary({ date, data }) {
  const wakeScore = useMemo(() => scoreWake(data?.wakeTime), [data]);
  const workoutStatus = data?.workout?.status || "pending";
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 grid gap-6">
        <Card className="p-5" data-tour="daily-tracking">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-900">Today – {date}</h3>
              <Tooltip content="Daily habits are extracted automatically from AI chats. Click Edit to manually adjust." position="top">
                <span className="text-slate-400 cursor-help">💡</span>
              </Tooltip>
            </div>
            <Badge>Routine</Badge>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm text-slate-500">Wake Time</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{data?.wakeTime || "—"}</div>
              <div className="mt-3">
                <ProgressBar value={wakeScore} />
                <div className="mt-1 text-xs text-slate-500">Goal {data?.goals?.wakeGoal || DEFAULT_GOALS.wakeGoal} • Score {wakeScore ?? "—"}</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Workout</div>
              <div className={`mt-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${pillStatusColor(workoutStatus)}`}>
                <span className="h-2 w-2 rounded-full bg-current opacity-70" />
                {data?.workout?.time || DEFAULT_GOALS.workoutGoal} • {workoutStatus}
              </div>
              <div className="mt-3 text-xs text-slate-500">Target {data?.goals?.workoutGoal || DEFAULT_GOALS.workoutGoal}</div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm text-slate-500">Lunch</div>
              <div className="mt-1 text-slate-900">{data?.lunch?.time || DEFAULT_GOALS.lunchTime} — {data?.lunch?.details || "veg + one vegetable + dal"}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Dinner</div>
              <div className="mt-1 text-slate-900">{data?.dinner?.time || DEFAULT_GOALS.dinnerTime} — {data?.dinner?.details || "grilled protein (chicken or fish)"}</div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold text-slate-900">Notes</h3>
          <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{data?.notes || "Add a quick note below to reflect on today."}</p>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-slate-900">Insights</h3>
          <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
            <li>Try winding down 30–45 min earlier to hit your 07:00 wake goal.</li>
            <li>Front‑load hydration before lunch to improve afternoon energy.</li>
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-slate-900">Goals</h3>
          <div className="mt-3 space-y-3 text-sm text-slate-700">
            <div>
              <div className="flex items-center justify-between"><span>Wake by {data?.goals?.wakeGoal || DEFAULT_GOALS.wakeGoal}</span><span className="font-semibold">{scoreWake(data?.wakeTime)}%</span></div>
              <ProgressBar value={wakeScore} />
            </div>
            <div>
              <div className="flex items-center justify-between"><span>Workout @ {data?.goals?.workoutGoal || DEFAULT_GOALS.workoutGoal}</span><span className="font-semibold">{(data?.workout?.status === "done" ? 100 : data?.workout?.status === "skipped" ? 10 : 50)}%</span></div>
              <ProgressBar value={(data?.workout?.status === "done" ? 100 : data?.workout?.status === "skipped" ? 10 : 50)} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function QuickEdit({ date, data, onSave }) {
  const [form, setForm] = useState(() => ({
    wakeTime: data?.wakeTime || "",
    lunchTime: data?.lunch?.time || "13:30",
    lunchDetails: data?.lunch?.details || "veg + one vegetable + dal",
    dinnerTime: data?.dinner?.time || "21:00",
    dinnerDetails: data?.dinner?.details || "grilled protein (chicken or fish)",
    workoutTime: data?.workout?.time || "19:00",
    workoutStatus: data?.workout?.status || "pending",
    notes: data?.notes || "",
  }));
  function update(k, v) { setForm((s) => ({ ...s, [k]: v })); }
  function submit(e) {
    e.preventDefault();
    onSave({
      wakeTime: form.wakeTime,
      lunch: { time: form.lunchTime, details: form.lunchDetails },
      dinner: { time: form.dinnerTime, details: form.dinnerDetails },
      workout: { time: form.workoutTime, status: form.workoutStatus },
      notes: form.notes,
      goals: { ...DEFAULT_GOALS },
    });
  }
  return (
    <Card className="p-5" data-tour="quick-edit">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-slate-900">Quick Edit – {date}</h3>
        <Tooltip content="Manually adjust any data. Changes sync across your entire Life OS." position="top">
          <span className="text-slate-400 cursor-help">💡</span>
        </Tooltip>
      </div>
      <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div><label className="text-xs text-slate-500">Wake Time</label><Input type="time" value={form.wakeTime} onChange={(e) => update("wakeTime", e.target.value)} /></div>
        <div><label className="text-xs text-slate-500">Workout Time</label><Input type="time" value={form.workoutTime} onChange={(e) => update("workoutTime", e.target.value)} /></div>
        <div>
          <label className="text-xs text-slate-500">Workout Status</label>
          <select value={form.workoutStatus} onChange={(e) => update("workoutStatus", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-100">
            <option value="pending">pending</option>
            <option value="done">done</option>
            <option value="skipped">skipped</option>
          </select>
        </div>
        <div className="sm:col-span-2" />
        <div><label className="text-xs text-slate-500">Lunch Time</label><Input type="time" value={form.lunchTime} onChange={(e) => update("lunchTime", e.target.value)} /></div>
        <div><label className="text-xs text-slate-500">Lunch Details</label><Input value={form.lunchDetails} onChange={(e) => update("lunchDetails", e.target.value)} placeholder="veg + dal" /></div>
        <div><label className="text-xs text-slate-500">Dinner Time</label><Input type="time" value={form.dinnerTime} onChange={(e) => update("dinnerTime", e.target.value)} /></div>
        <div><label className="text-xs text-slate-500">Dinner Details</label><Input value={form.dinnerDetails} onChange={(e) => update("dinnerDetails", e.target.value)} placeholder="grilled protein" /></div>
        <div className="sm:col-span-2"><label className="text-xs text-slate-500">Notes</label><Textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Reflection, wins, blockers..." /></div>
        <div className="sm:col-span-2 flex justify-end gap-3">
          <Button className="border border-slate-300 bg-white text-slate-900" onClick={() => setForm({
            wakeTime: "",
            lunchTime: DEFAULT_GOALS.lunchTime,
            lunchDetails: "veg + one vegetable + dal",
            dinnerTime: DEFAULT_GOALS.dinnerTime,
            dinnerDetails: "grilled protein (chicken or fish)",
            workoutTime: DEFAULT_GOALS.workoutGoal,
            workoutStatus: "pending",
            notes: "",
          })}>Reset</Button>
          <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800">Save Day</Button>
        </div>
      </form>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-gradient-to-r from-indigo-100 to-emerald-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-3xl">🤖</span>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">Welcome to Your FlowState!</h3>
      <p className="text-slate-600 mb-6 max-w-md mx-auto">
        Start chatting with your AI assistant to see everything organized automagically here.
      </p>
      <Button 
        onClick={() => {/* Navigate to AI - connect to parent */}}
        className="bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:from-indigo-600 hover:to-emerald-600 shadow-lg hover:shadow-xl px-8 py-3"
      >
        <span className="mr-2">💬</span>
        Start Your First Conversation
      </Button>
    </div>
  );
}

function Dashboard({ aiProcessedData, setAiProcessedData, setActive }) {
  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState({});
  const [all, setAll] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const loaded = await loadAllDays();
      setAll(loaded);
      const d = todayISO();
      setDate((prev) => prev || d);
      const rd = await readDay(d);
      setData(rd || {});
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const rd = await readDay(date);
      setData(rd || {});
    })();
  }, [date]);

  async function saveDay(partial) {
    const updated = await upsertDay(date, partial);
    setData(updated || {});
    const reloaded = await loadAllDays();
    setAll(reloaded);
  }

  const dates = useMemo(() => Object.keys(all).sort().reverse(), [all]);

  if (loading) {
    return (
      <Container className="py-10">
        <div className="animate-pulse text-slate-500">Loading your dashboard…</div>
      </Container>
    );
  }

  // Show empty state if no meaningful data exists
  const hasData = data?.wakeTime || data?.workout?.status || data?.lunch?.time || data?.dinner?.time || aiProcessedData;
  if (!hasData) {
    return (
      <Container className="py-10">
        <div className="flex flex-col items-center gap-6">
          <EmptyState />
          <Button onClick={() => {/* Connect to setActive */}} className="bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:from-indigo-600 hover:to-emerald-600 px-6 py-2">
            Chat with Your AI Assistant
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <div className="">
      <Container className="py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">Your FlowState</h1>
              <div className="bg-gradient-to-r from-indigo-100 to-emerald-100 px-3 py-1 rounded-full">
                <span className="text-xs font-semibold text-indigo-700">Live Updates</span>
              </div>
            </div>
            <p className="text-lg text-slate-600">Everything organized automatically from your conversations 💬</p>
          </div>
          <div className="flex gap-3 items-center">
            <select value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm">
              {dates.map((d) => (<option key={d} value={d}>{d}</option>))}
            </select>
            <Button onClick={async () => {
              const d = todayISO();
              setDate(d);
              const rd = await readDay(d);
              if (!rd) await saveDay({});
            }} className="border border-slate-300 bg-white text-slate-900 shadow-sm hover:shadow-md">Today</Button>
            <Button onClick={() => setActive("ai-assistant")} className="bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:from-indigo-600 hover:to-emerald-600 shadow-md hover:shadow-lg">
              <span className="mr-2">🤖</span>
              Chat Now
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <KPI 
            label="Flow Score" 
            value={`${scoreWake(data?.wakeTime) ?? "—"}%`} 
            hint={`Morning goal: ${data?.goals?.wakeGoal || DEFAULT_GOALS.wakeGoal}`} 
            icon="🌅"
            trend={scoreWake(data?.wakeTime) > 80 ? 'up' : scoreWake(data?.wakeTime) < 50 ? 'down' : null}
          />
          <KPI 
            label="Energy Level" 
            value={data?.workout?.status || "fresh"} 
            hint={`Activity: ${data?.goals?.workoutGoal || DEFAULT_GOALS.workoutGoal}`} 
            icon="💪"
            trend={data?.workout?.status === 'done' ? 'up' : null}
          />
          <KPI 
            label="Fuel Intake" 
            value={data?.lunch?.time || DEFAULT_GOALS.lunchTime} 
            hint={data?.lunch?.details || "Balanced meal"} 
            icon="🍽️"
          />
          <KPI 
            label="Wind Down" 
            value={data?.dinner?.time || DEFAULT_GOALS.dinnerTime} 
            hint={data?.dinner?.details || "Protein focused"} 
            icon="🌙"
          />
        </div>

        <div className="mt-6">
          {/* P.A.R.A. Navigation */}
          <div className="mb-6">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              {Object.entries(PARA_CATEGORIES).map(([key, label]) => (
                <button
                  key={key}
                  className="flex-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white hover:shadow-sm transition"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <TodaySummary date={date} data={data} />
              <PARADashboard />
              <QuickEdit date={date} data={data} onSave={saveDay} />
            </div>
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="text-lg font-semibold text-slate-900">Quick Capture</h3>
              <p className="mt-2 text-sm text-slate-600">Type anything — tasks, ideas, notes.</p>
              <QuickCapture onAdd={async (text) => {
                const prev = data?.notes ? data.notes + "\\n" : "";
                await saveDay({ notes: prev + "• " + text });
              }} />
            </Card>

          <AIChatbot onProcess={async (processedData) => {
            // Save AI processed data to current day
            const updatedData = { ...data };
            
            // Merge AI extracted data
            if (processedData.habits.wakeTime) {
              updatedData.wakeTime = processedData.habits.wakeTime;
            }
            if (processedData.habits.workoutIntended) {
              updatedData.workout = { ...updatedData.workout, status: "intended" };
            }
            if (processedData.mood !== "neutral") {
              updatedData.mood = processedData.mood;
            }
            if (processedData.insights.length > 0) {
              const prevNotes = data?.notes ? data.notes + "\\n" : "";
              updatedData.notes = prevNotes + "AI Insights: " + processedData.insights.join(", ");
            }
            
            await saveDay(updatedData);
            setAiProcessedData(processedData);
          }} />

          <Card className="p-5">
            <h3 className="text-lg font-semibold text-slate-900">Export</h3>
            <p className="mt-2 text-sm text-slate-600">Copy your data JSON for backup或 to push into Sheets/Airtable.</p>
            <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify({ [date]: data }, null, 2)}</pre>
          </Card>
        </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

// ---------- P.A.R.A. Dashboard Components ----------
function PARADashboard() {
  const [paraLayout, setParaLayout] = useState('grid'); // 'grid' | 'list'
  const [activeCategory, setActiveCategory] = useState('PROJECTS');
  
  // Sample data for demonstration - in real app, this would come from your data store
  const paraData = {
    PROJECTS: [
      { id: 1, title: "Website Redesign", deadline: "Dec 15", status: "in-progress", priority: "high" },
      { id: 2, title: "Client Proposal", deadline: "Dec 10", status: "pending", priority: "medium" },
      { id: 3, title: "Learn React Hooks", deadline: "Dec 20", status: "pending", priority: "low" }
    ],
    AREAS: [
      { id: 1, title: "Health & Fitness", lastActive: "Today", status: "maintained", priority: "high" },
      { id: 2, title: "Financial Management", lastActive: "Yesterday", status: "maintained", priority: "high" },
      { id: 3, title: "Professional Development", lastActive: "2 days ago", status: "needs-attention", priority: "medium" }
    ],
    RESOURCES: [
      { id: 1, title: "React Documentation", type: "documentation", lastViewed: "Yesterday" },
      { id: 2, title: "Design System Components", type: "design", lastViewed: "3 days ago" },
      { id: 3, title: "Productivity Articles", type: "articles", lastViewed: "1 week ago" }
    ],
    ARCHIVES: [
      { id: 1, title: "Old Project Files", archivedOn: "Nov 15", reason: "completed" },
      { id: 2, title: "Previous Meeting Notes", archivedOn: "Nov 20", reason: "outdated" },
      { id: 3, title: "Legacy Documentation", archivedOn: "Oct 30", reason: "superseded" }
    ]
  };

  const getStatusColor = (status, category) => {
    if (category === 'PROJECTS') {
      return status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 
             status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
             'bg-slate-100 text-slate-800';
    }
    return status === 'maintained' ? 'bg-emerald-100 text-emerald-800' : 
           status === 'needs-attention' ? 'bg-amber-100 text-amber-800' : 
           'bg-slate-100 text-slate-800';
  };

  return (
    <Card className="p-5" data-tour="para-dashboard">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-900">P.A.R.A. Organization</h3>
          <Tooltip content="Projects = specific outputs, Areas = ongoing responsibilities, Resources = learning topics, Archives = completed items" position="top">
            <span className="text-slate-400 cursor-help">💡</span>
          </Tooltip>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setParaLayout('grid')}
            className={`p-1 rounded ${paraLayout === 'grid' ? 'bg-slate-200' : 'hover:bg-slate-100'}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
          </button>
          <button 
            onClick={() => setParaLayout('list')}
            className={`p-1 rounded ${paraLayout === 'list' ? 'bg-slate-200' : 'hover:bg-slate-100'}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(PARA_CATEGORIES).map(([key, label]) => {
          const items = paraData[key];
          return (
            <div key={key} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  {key === 'PROJECTS' && '📁'}
                  {key === 'AREAS' && '🏢'}
                  {key === 'RESOURCES' && '📚'}
                  {key === 'ARCHIVES' && '📦'}
                  {label} ({items.length})
                </h4>
                <Badge className="text-xs">
                  {key === 'PROJECTS' && 'Active Outputs'}
                  {key === 'AREAS' && 'Ongoing Standards'}
                  {key === 'RESOURCES' && 'Knowledge Base'}
                  {key === 'ARCHIVES' && 'Completed Items'}
                </Badge>
              </div>
              
              {paraLayout === 'grid' ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.slice(0, 3).map((item) => (
                    <div key={item.id} className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-sm transition">
                      <h5 className="text-sm font-medium text-slate-900 truncate">{item.title}</h5>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(item.status, key)}`}>
                          {item.status}
                        </span>
                        <span className="text-xs text-slate-500">
                          {item.deadline || item.lastActive || item.lastViewed || item.archivedOn}
                        </span>
                      </div>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div className="bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 p-3 flex items-center justify-center">
                      <span className="text-sm text-slate-500">+{items.length - 3} more</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {items.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-sm text-slate-900 truncate">{item.title}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status, key)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {items.length > 4 && (
                    <div className="text-sm text-slate-500 text-center py-2">
                      +{items.length - 4} more items
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="text-center">
          <p className="text-sm text-slate-600 mb-3">Add new items via AI Assistant or Quick Capture</p>
          <Button className="bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:from-indigo-600 hover:to-emerald-600">
            Open AI Assistant
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ---------- AI Chatbot Components ----------
function AIChatbot({ onProcess }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      content: "Hi! I'm your AI Life Assistant. I can help you organize your thoughts, tasks, and daily information automatically. Tell me about your day, goals, or anything on your mind!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const processMessage = async (text) => {
    if (!text.trim()) return;
    
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      // Simulate AI processing - in real implementation, this would call an AI service
      const processedData = await simulateAIProcessing(text);
      
      const aiMessage = {
        id: messages.length + 2,
        type: "ai",
        content: processedData.response,
        processedInfo: processedData.extractedData,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      onProcess(processedData.extractedData);
    } catch (error) {
      const errorMessage = {
        id: messages.length + 2,
        type: "ai",
        content: "Sorry, I encountered an error processing your message. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setIsProcessing(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    processMessage(input);
  };

  return (
    <Card className="p-5 h-96 flex flex-col" data-tour="ai-assistant">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 text-xs font-bold text-white">AI</div>
        <h3 className="text-lg font-semibold text-slate-900">AI Life Assistant</h3>
        <Tooltip content="Chat naturally - I'll extract tasks, habits, schedules, and mood automatically" position="top">
          <span className="text-slate-400 cursor-help">💡</span>
        </Tooltip>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              message.type === 'user' 
                ? 'bg-slate-900 text-white' 
                : 'bg-slate-100 text-slate-900'
            }`}>
              <div>{message.content}</div>
              {message.processedInfo && (
                <div className="mt-2 text-xs opacity-70">
                  📋 Detected: {Object.keys(message.processedInfo).join(', ')}
                </div>
              )}
              <div className="mt-1 text-xs opacity-50">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-900 rounded-lg px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-3 w-3 border border-slate-600 border-t-transparent rounded-full"></div>
                Processing...
              </div>
            </div>
          </div>
        )}
      </div>
        
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Tell me about your day, goals, or challenges..." 
          disabled={isProcessing}
        />
        <Button 
          type="submit" 
          disabled={isProcessing || !input.trim()}
          className="bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:from-indigo-600 hover:to-emerald-600 disabled:opacity-50"
        >
          Send
        </Button>
      </form>
    </Card>
  );
}

// Simulate AI processing - in real implementation, this would integrate with OpenAI, Anthropic, or similar
async function simulateAIProcessing(text) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
  
  const extractedData = {
    tasks: [],
    habits: {},
    mood: "neutral",
    insights: [],
    paraCategory: null,
    scheduledItems: []
  };

  const responses = [
    "I've analyzed your input and organized the information. Let me break down what I found:",
    "Great! I've processed your message and extracted key information for your dashboard.",
    "Thanks for sharing that with me! Here's how I've organized what you told me:",
    "I've captured the important details and structured them for your Life OS.",
  ];

  // Basic keyword detection for demo purposes
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('wake') || lowerText.includes('morning')) {
    const timeMatch = text.match(/(\d{1,2}:\d{2}|\d{1,2}\s*am|\d{1,2}\s*pm)/i);
    if (timeMatch) {
      extractedData.habits.wakeTime = timeMatch[1];
      extractedData.insights.push(`Wake time noted: ${timeMatch[1]}`);
    }
  }
  
  if (lowerText.includes('workout') || lowerText.includes('exercise') || lowerText.includes('gym')) {
    extractedData.habits.workoutIntended = true;
    extractedData.insights.push("Workout activity detected");
  }
  
  if (lowerText.includes('task') || lowerText.includes('todo') || lowerText.includes('need to')) {
    // Extract potential tasks (simplified)
    const taskKeywords = ['finish', 'complete', 'start', 'work on', 'prepare'];
    taskKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        extractedData.tasks.push({ text: `Complete task related to: ${keyword}`, category: 'Projects' });
      }
    });
  }
  
  if (lowerText.includes('learn') || lowerText.includes('study') || lowerText.includes('research')) {
    extractedData.paraCategory = PARA_CATEGORIES.RESOURCES;
    extractedData.insights.push("Learning activity detected - categorized under Resources");
  }
  
  if (lowerText.includes('project') || lowerText.includes('deadline') || lowerText.includes('deliver')) {
    extractedData.paraCategory = PARA_CATEGORIES.PROJECTS;
    extractedData.insights.push("Project-related activity detected");
  }
  
  // Mood detection
  if (lowerText.includes('stressed') || lowerText.includes('overwhelmed') || lowerText.includes('tired')) {
    extractedData.mood = "low";
  } else if (lowerText.includes('excited') || lowerText.includes('great') || lowerText.includes('awesome')) {
    extractedData.mood = "high";
  }

  const response = responses[Math.floor(Math.random() * responses.length)];
  
  return {
    response,
    extractedData
  };
}

// ---------- FlowState Dashboard ----------
function FlowStateDashboard() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flowstate-theme');
      return saved || 'light';
    }
    return 'light';
  });
  const [metrics, setMetrics] = useState(() => {
    const defaults = {
      weight: 79.4,
      bodyFat: 28,
      steps: 0,
      stepsGoal: 15000,
      calories: 0,
      caloriesGoal: 1600,
      water: 0,
      waterGoal: 2.5
    };
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('flowstate-metrics');
        return saved ? JSON.parse(saved) : defaults;
      } catch {
        return defaults;
      }
    }
    return defaults;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('flowstate-theme', theme);
    }
  }, [theme]);

  const updateMetric = (key, value) => {
    const updated = { ...metrics, [key]: parseFloat(value) || 0 };
    setMetrics(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('flowstate-metrics', JSON.stringify(updated));
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-slate-900' : 'bg-slate-50';
  const textClass = isDark ? 'text-slate-100' : 'text-slate-900';
  const textMutedClass = isDark ? 'text-slate-400' : 'text-slate-600';
  const cardBgClass = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white/80 border-slate-200';
  const inputClass = isDark 
    ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-slate-500 focus:ring-slate-600' 
    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:ring-slate-100';

  return (
    <div className={`min-h-screen transition-colors ${bgClass}`}>
      <Container className="py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className={`text-3xl font-bold ${textClass}`}>FlowState</h1>
              <h2 className={`text-2xl font-semibold mt-2 ${textClass}`}>FlowState Dashboard</h2>
              <p className={`mt-1 ${textMutedClass}`}>Central control panel for my life.</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`self-start sm:self-auto rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition hover:shadow ${isDark ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'}`}
            >
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 - Body & Fitness */}
          <div className={`rounded-2xl border shadow-sm backdrop-blur p-6 ${cardBgClass}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Body & Fitness</h3>
            <div className="space-y-4">
              <div>
                <div className={`text-sm ${textMutedClass}`}>Weight</div>
                <div className={`text-xl font-semibold ${textClass}`}>{metrics.weight} kg</div>
                <input
                  type="number"
                  step="0.1"
                  value={metrics.weight}
                  onChange={(e) => updateMetric('weight', e.target.value)}
                  placeholder="Weight"
                  className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 ${inputClass}`}
                />
              </div>
              <div>
                <div className={`text-sm ${textMutedClass}`}>Approx Body Fat</div>
                <div className={`text-xl font-semibold ${textClass}`}>{metrics.bodyFat}%</div>
              </div>
              <div>
                <div className={`text-sm ${textMutedClass}`}>Steps Today</div>
                <div className={`text-xl font-semibold ${textClass}`}>{metrics.steps} / {metrics.stepsGoal.toLocaleString()}</div>
                <input
                  type="number"
                  value={metrics.steps}
                  onChange={(e) => updateMetric('steps', e.target.value)}
                  placeholder="Steps"
                  className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 ${inputClass}`}
                />
              </div>
              <div>
                <div className={`text-sm ${textMutedClass}`}>Calories Today</div>
                <div className={`text-xl font-semibold ${textClass}`}>{metrics.calories} / {metrics.caloriesGoal}</div>
                <input
                  type="number"
                  value={metrics.calories}
                  onChange={(e) => updateMetric('calories', e.target.value)}
                  placeholder="Calories"
                  className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 ${inputClass}`}
                />
              </div>
              <div>
                <div className={`text-sm ${textMutedClass}`}>Water</div>
                <div className={`text-xl font-semibold ${textClass}`}>{metrics.water} / {metrics.waterGoal}L</div>
                <input
                  type="number"
                  step="0.1"
                  value={metrics.water}
                  onChange={(e) => updateMetric('water', e.target.value)}
                  placeholder="Water (L)"
                  className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 ${inputClass}`}
                />
              </div>
            </div>
          </div>

          {/* Card 2 - Daily Routine */}
          <div className={`rounded-2xl border shadow-sm backdrop-blur p-6 ${cardBgClass}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Daily Routine</h3>
            <ul className={`space-y-2 text-sm ${textClass}`}>
              <li>7:00 AM – Wake</li>
              <li>7:30 AM – Walk</li>
              <li>8:30 AM – Breakfast</li>
              <li>9:00–12:00 – Focus Work</li>
              <li>4:00 PM – Workout</li>
              <li>7:00 PM – Dinner</li>
              <li>11:00 PM – Sleep</li>
            </ul>
          </div>

          {/* Card 3 - Life Admin */}
          <div className={`rounded-2xl border shadow-sm backdrop-blur p-6 ${cardBgClass}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Life Admin</h3>
            <ul className={`space-y-2 text-sm ${textClass}`}>
              <li>• Renew Driving License</li>
              <li>• Pay Society Bill</li>
              <li>• Deep Cleaning</li>
              <li>• Pest Control</li>
              <li>• Buy Sunglasses</li>
            </ul>
          </div>

          {/* Card 4 - Habits */}
          <div className={`rounded-2xl border shadow-sm backdrop-blur p-6 ${cardBgClass}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Habits</h3>
            <ul className={`space-y-2 text-sm ${textClass}`}>
              <li>• No Alcohol</li>
              <li>• 15k Steps</li>
              <li>• High-Protein Meals</li>
              <li>• Sleep by 11 PM</li>
              <li>• 20-min Declutter</li>
            </ul>
          </div>

          {/* Card 5 - Goals */}
          <div className={`rounded-2xl border shadow-sm backdrop-blur p-6 ${cardBgClass}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Goals</h3>
            <ul className={`space-y-2 text-sm ${textClass}`}>
              <li>• Bali Body by Dec 24</li>
              <li>• 6-Pack by Birthday</li>
              <li>• Life Clean-Up</li>
            </ul>
          </div>

          {/* Card 6 - Cheat Day Calendar */}
          <div className={`rounded-2xl border shadow-sm backdrop-blur p-6 ${cardBgClass}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Cheat Day Calendar</h3>
            <ul className={`space-y-2 text-sm ${textClass}`}>
              <li>• Dec 30 – Lunch</li>
              <li>• Dec 30 – Dinner + Drinks</li>
              <li>• Jan 6 – Dinner</li>
              <li>• Jan 13 – Dinner</li>
              <li>• Jan 20 – Lunch/Dinner</li>
            </ul>
          </div>

          {/* Card 7 - Weight Progress */}
          <div className={`rounded-2xl border shadow-sm backdrop-blur p-6 sm:col-span-2 lg:col-span-3 ${cardBgClass}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Weight Progress</h3>
            <p className={`text-sm ${textMutedClass} mb-4`}>Weight graph coming soon.</p>
            <ul className={`space-y-1 text-sm ${textClass}`}>
              <li>Dec 1 – 79.4 kg</li>
            </ul>
          </div>
        </div>
      </Container>
    </div>
  );
}

// ---------- App Shell ----------
function Nav({ active, setActive }) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <Container className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 shadow-lg">
              <span className="text-lg font-bold text-white">Flow</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900">FlowState</span>
              <span className="text-xs text-slate-500 -mt-1">AI Life Assistant</span>
            </div>
          </div>
        </div>
        <nav className="flex items-center gap-2" data-tour="navigation">
          {[
            { key: "landing", label: "Home", tooltip: "Learn more about your AI assistant" },
            { key: "dashboard", label: "Your Life 💎", tooltip: "See everything organized automatically" },
            { key: "lifeos", label: "Dashboard 📊", tooltip: "Personal FlowState Dashboard" },
            { key: "ai-assistant", label: "Chat Now 🤖", tooltip: "Start talking to your AI assistant" },
          ].map((t) => (
            <Tooltip key={t.key} content={t.tooltip} position="bottom">
              <button 
                onClick={() => setActive(t.key)} 
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${active === t.key ? "bg-gradient-to-r from-indigo-500 to-emerald-500 text-white shadow-lg" : "text-slate-700 hover:bg-slate-100 hover:shadow-sm"}`}
                data-tour={t.key === 'ai-assistant' ? 'ai-assistant' : undefined}
              >
                {t.label}
              </button>
            </Tooltip>
          ))}
        </nav>
      </Container>
    </header>
  );
}

function AIAssistant() {
  return (
    <Container className="py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">🤖 Your AI Life Assistant</h1>
          <p className="text-lg text-slate-600">Chat naturally — I'll remember and organize everything for you!</p>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <AIChatbot onProcess={(processedData) => {
              console.log("AI Processed Data:", processedData);
            }} />
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl">💬</div>
                <h3 className="text-lg font-bold text-slate-900">Conversation Tips</h3>
              </div>
              <div className="space-y-4 text-sm text-slate-700">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="font-medium text-blue-900">🗣️ "I woke up at 7 AM"</p>
                  <p className="text-blue-700">→ Automatically logged as habit</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <p className="font-medium text-green-900">📝 "Remind me to call mom"</p>
                  <p className="text-green-700">→ Added to tasks list</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <p className="font-medium text-purple-900">🎯 "Learning Spanish"</p>
                  <p className="text-purple-700">→ Set as ongoing goal</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl">✨</div>
                <h3 className="text-lg font-bold text-slate-900">What I Remember</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 text-xs mt-1">✓</span>
                  <div>
                    <p className="font-medium">Daily Habits</p>
                    <p className="text-slate-500">Wake times, workouts, meals, sleep</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 text-xs mt-1">✓</span>
                  <div>
                    <p className="font-medium">Tasks & Reminders</p>
                    <p className="text-slate-500">To-dos, calls, appointments</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 text-xs mt-1">✓</span>
                  <div>
                    <p className="font-medium">Goals & Dreams</p>
                    <p className="text-slate-500">Learning plans, career goals</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 text-xs mt-1">✓</span>
                  <div>
                    <p className="font-medium">Important Details</p>
                    <p className="text-slate-500">Personal info, preferences</p>
                  </div>
                </li>
              </ul>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-indigo-50 to-emerald-50 border-indigo-200">
              <div className="text-center">
                <div className="text-2xl mb-2">🚀</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Ready to Start?</h3>
                <p className="text-sm text-slate-600 mb-4">Just chat naturally — I understand everything!</p>
                <div className="bg-white rounded-lg p-3 border border-indigo-100">
                  <p className="text-xs text-indigo-700 italic">"Hi! Tell me about your day..."</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default function App() {
  const [active, setActive] = useState("landing");
  const [aiProcessedData, setAiProcessedData] = useState(null);
  const [isTouring, setIsTouring] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  
  // Debug: Log when app renders
  useEffect(() => {
    console.log('FlowState App loaded, active route:', active);
    console.log('App component rendered successfully');
  }, [active]);
  
  const startTour = () => {
    setIsTouring(true);
    setTourStep(0);
    setActive("dashboard"); // Move to dashboard for tour
  };
  
  const startChatting = () => {
    setActive("ai-assistant");
  };
  
  const endTour = () => {
    setIsTouring(false);
    setTourStep(0);
  };
  
  const nextTourStep = () => {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep(tourStep + 1);
      
      // Auto-navigate to appropriate sections for tour
      const currentStep = TOUR_STEPS[tourStep];
      if (currentStep?.target === "[data-tour='ai-assistant']") {
        setActive("ai-assistant");
      } else if (currentStep?.target === "[data-tour='daily-tracking']" || currentStep?.target === "[data-tour='para-dashboard']") {
        setActive("dashboard");
      }
    }
  };
  
  const prevTourStep = () => {
    if (tourStep > 0) {
      setTourStep(tourStep - 1);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Nav active={active} setActive={setActive} />
      {active === "landing" ? (
        <Landing 
          onGetStarted={() => setActive("dashboard")} 
          onStartTour={startTour}
          onStartChatting={startChatting}
        />
      ) : active === "dashboard" ? (
        <Dashboard aiProcessedData={aiProcessedData} setAiProcessedData={setAiProcessedData} setActive={setActive} />
      ) : active === "lifeos" ? (
        <FlowStateDashboard />
      ) : (
        <AIAssistant />
      )}
      
      <AppTour 
        isOpen={isTouring}
        onClose={endTour}
        onNext={nextTourStep}
        onPrev={prevTourStep}
        currentStep={tourStep}
        totalSteps={TOUR_STEPS.length}
      />
      
      <footer className="mt-20 border-t border-slate-200 bg-gradient-to-r from-indigo-50 to-emerald-50">
        <Container className="py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 shadow-lg">
                  <span className="text-lg font-bold text-white">Flow</span>
                </div>
                <span className="text-xl font-bold text-slate-900">🚀 FlowState AI v2.0 DEPLOYED 🚀</span>
              </div>
              <p className="text-slate-600 mb-4 max-w-md">
                Your AI Life Assistant that organizes everything automatically. Just chat naturally, and watch your life flow beautifully organized.
              </p>
              <div className="flex gap-3">
                <div className="bg-white rounded-full px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm">
                  🤖 AI-Powered
                </div>
                <div className="bg-white rounded-full px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm">
                  🌊 Natural Flow
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Quick Actions</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><button onClick={() => {/* Implement */}} className="hover:text-indigo-600">Start Chatting</button></li>
                <li><button onClick={() => {/* Implement */}} className="hover:text-indigo-600">View Dashboard</button></li>
                <li><button onClick={() => {/* Implement */}} className="hover:text-indigo-600">Take Tour</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">What FlowState Does</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>🗣️ Natural Conversations</li>
                <li>📊 Automatic Organization</li>
                <li>🎯 Goal Tracking</li>
                <li>🧠 Memory Management</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-200 mt-8 pt-6 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} FlowState • Making life flow beautifully with AI
          </div>
        </Container>
      </footer>
    </div>
  );
}

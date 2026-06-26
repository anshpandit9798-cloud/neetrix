import React, { useState, useEffect } from "react";
import { 
  Save, 
  FileDown, 
  CheckCircle, 
  Flame,
  Award,
  Calendar,
  Settings,
  Printer,
  ArrowLeft,
  ArrowRight,
  Search,
  FileText,
  LayoutDashboard,
  Cloud,
  CloudOff,
  Key,
  Database,
  Lock,
  Unlock,
  RefreshCw,
  LogOut,
  Mail,
  UserCheck,
  Check,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NeetData } from "./types";
import Stopwatch from "./components/Stopwatch";
import { 
  MorningSelfStudy, 
  DailyPractice, 
  DisciplineTracker, 
  ClassTracker, 
  NightRevision, 
  ErrorNotebook,
  MonthlySection
} from "./components/DashboardCards";
import { getSupabase, getSupabaseKeys, initSupabase } from "./lib/supabase";

function getTodayKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const isLastDayOfMonth = (dateStr: string): boolean => {
  if (!dateStr) return false;
  // Use local timezone correct parsing
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  const tomorrow = new Date(d);
  tomorrow.setDate(d.getDate() + 1);
  return tomorrow.getDate() === 1;
};

const getDefaultDataForDate = (dateStr: string, currentStreak: number = 14): NeetData => {
  return {
    studySeconds: 0,
    totalHours: "0.0",
    wakeUpOnTime: false,
    bioNcertReading: false,
    physicsQuestions: 0,
    chemOrganic: false,
    chemPhysical: false,
    chemInorganic: false,
    morningRevisionDone: false,
    bioMCQ: 0,
    phyMCQ: 0,
    chemMCQ: 0,
    sleepChecked: false,
    noSocialMedia: false,
    classAttended: false,
    notesMade: false,
    doubtsMarked: false,
    attentionMaintained: false,
    classRevisionDone: false,
    morningTopicsRevised: false,
    errorNotebookUpdated: false,
    lightMcqsDone: false,
    errors: "",
    streak: currentStreak,
    mockCount: 0,
    analysisDone: false,
    weakTopics: "",
  };
};

export default function App() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayKey());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'report'>('dashboard');

  // Initial state setup with load from localStorage
  const [data, setData] = useState<NeetData>(() => {
    const today = getTodayKey();
    try {
      const key = `NEET_${today}`;
      let saved = localStorage.getItem(key);
      if (!saved) {
        saved = localStorage.getItem("neetData");
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          studySeconds: parsed.studySeconds ?? Math.round((parseFloat(parsed.hours) || 0) * 3600),
          totalHours: parsed.hours ?? "0.0",
          wakeUpOnTime: parsed.wakeUpOnTime ?? false,
          bioNcertReading: parsed.bioNcertReading ?? false,
          physicsQuestions: parsed.physicsQuestions ?? 0,
          chemOrganic: parsed.chemOrganic ?? false,
          chemPhysical: parsed.chemPhysical ?? false,
          chemInorganic: parsed.chemInorganic ?? false,
          morningRevisionDone: parsed.morningRevisionDone ?? false,
          bioMCQ: parseInt(parsed.bioMCQ) || 0,
          phyMCQ: parseInt(parsed.phyMCQ) || 0,
          chemMCQ: parseInt(parsed.chemMCQ) || 0,
          sleepChecked: parsed.sleepChecked ?? false,
          noSocialMedia: parsed.noSocialMedia ?? false,
          classAttended: parsed.classAttended ?? false,
          notesMade: parsed.notesMade ?? false,
          doubtsMarked: parsed.doubtsMarked ?? false,
          attentionMaintained: parsed.attentionMaintained ?? false,
          classRevisionDone: parsed.classRevisionDone ?? false,
          morningTopicsRevised: parsed.morningTopicsRevised ?? false,
          errorNotebookUpdated: parsed.errorNotebookUpdated ?? false,
          lightMcqsDone: parsed.lightMcqsDone ?? false,
          errors: parsed.errors ?? "",
          streak: parsed.streak ?? 14,
          lastSavedAt: parsed.lastSavedAt ?? "",
          locked: parsed.locked ?? false,
          mockCount: parsed.mockCount ?? 0,
          analysisDone: parsed.analysisDone ?? false,
          weakTopics: parsed.weakTopics ?? "",
        };
      }
    } catch (e) {
      console.error("Failed to parse saved neetData", e);
    }

    // Default template state with potential monthly load fallback
    const defaultData = getDefaultDataForDate(today);
    if (isLastDayOfMonth(today)) {
      const parts = today.split('-');
      const monthKey = `NEET_MONTH_${parseInt(parts[1], 10) - 1}_${parts[0]}`;
      const monthSaved = localStorage.getItem(monthKey);
      if (monthSaved) {
        try {
          const monthParsed = JSON.parse(monthSaved);
          defaultData.mockCount = parseInt(monthParsed.mockCount) || 0;
          defaultData.analysisDone = !!monthParsed.analysisDone;
          defaultData.weakTopics = monthParsed.weakTopics ?? "";
        } catch (err) {
          console.error(err);
        }
      }
    }

    return defaultData;
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const today = getTodayKey();
    try {
      const key = `NEET_${today}`;
      let saved = localStorage.getItem(key);
      if (!saved) {
        saved = localStorage.getItem("neetData");
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.locked ?? false;
      }
    } catch (e) {
      console.error("Failed to parse saved neetData", e);
    }
    return false;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentQuote, setCurrentQuote] = useState("");
  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem("streak");
    if (saved) return parseInt(saved) || 0;
    return 14; // Default baseline streak for experienced users
  });

  // Supabase connection state
  const [user, setUser] = useState<any>(null);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState("");
  const [supabaseAnonKeyInput, setSupabaseAnonKeyInput] = useState("");
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);
  const [supabaseStreak, setSupabaseStreak] = useState<number>(14);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");

  // Load manually configured credentials on mount
  useEffect(() => {
    const { url, anonKey } = getSupabaseKeys();
    setSupabaseUrlInput(url);
    setSupabaseAnonKeyInput(anonKey);
    setIsSupabaseConfigured(!!url && !!anonKey);
  }, []);

  // Sync / Auto Session from Supabase
  useEffect(() => {
    const sb = getSupabase();
    if (sb) {
      sb.auth.getUser().then(({ data: { user: currentUser } }) => {
        if (currentUser) {
          setUser(currentUser);
          fetchAndUpdateSupabaseStreak(currentUser);
          syncDataFromSupabase(selectedDate, currentUser);
        }
      });

      const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          setUser(session.user);
          fetchAndUpdateSupabaseStreak(session.user);
          syncDataFromSupabase(selectedDate, session.user);
        } else {
          setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedDate]);

  const fetchAndUpdateSupabaseStreak = async (currentUser = user) => {
    const sb = getSupabase();
    if (!sb || !currentUser) return;
    
    try {
      const { data: logs, error } = await sb
        .from("daily_logs")
        .select("date")
        .eq("user_id", currentUser.id)
        .order("date", { ascending: false });
        
      if (error) throw error;
      
      if (logs && logs.length > 0) {
        let calcStreak = 0;
        let prevDate = new Date();
        
        for (let i = 0; i < logs.length; i++) {
          let d = new Date(logs[i].date);
          if (i === 0) {
            prevDate = d;
            calcStreak++;
          } else {
            let diff = (prevDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
            const diffDays = Math.round(diff);
            if (diffDays === 1) {
              calcStreak++;
              prevDate = d;
            } else if (diffDays > 1) {
              break;
            }
          }
        }
        
        setStreak(calcStreak);
        localStorage.setItem("streak", calcStreak.toString());
        setSupabaseStreak(calcStreak);
      }
    } catch (err) {
      console.error("Failed to update streak from Supabase:", err);
    }
  };

  const syncDataFromSupabase = async (dateStr: string, currentUser = user) => {
    const sb = getSupabase();
    if (!sb || !currentUser) return;
    
    try {
      const { data: dbData, error } = await sb
        .from("daily_logs")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("date", dateStr)
        .maybeSingle();
        
      if (dbData) {
        let parsedPayload: Partial<NeetData> = {};
        if (dbData.payload) {
          parsedPayload = typeof dbData.payload === "string" ? JSON.parse(dbData.payload) : dbData.payload;
        }
        
        const mergedData: NeetData = {
          studySeconds: parsedPayload.studySeconds ?? Math.round((parseFloat(dbData.hours) || 0) * 3600),
          totalHours: dbData.hours ?? parsedPayload.totalHours ?? "0.0",
          wakeUpOnTime: parsedPayload.wakeUpOnTime ?? false,
          bioNcertReading: parsedPayload.bioNcertReading ?? false,
          physicsQuestions: parsedPayload.physicsQuestions ?? 0,
          chemOrganic: parsedPayload.chemOrganic ?? false,
          chemPhysical: parsedPayload.chemPhysical ?? false,
          chemInorganic: parsedPayload.chemInorganic ?? false,
          morningRevisionDone: parsedPayload.morningRevisionDone ?? false,
          bioMCQ: parseInt(dbData.bio_mcq) || parsedPayload.bioMCQ || 0,
          phyMCQ: parseInt(dbData.phy_mcq) || parsedPayload.phyMCQ || 0,
          chemMCQ: parseInt(dbData.chem_mcq) || parsedPayload.chemMCQ || 0,
          sleepChecked: parsedPayload.sleepChecked ?? false,
          noSocialMedia: parsedPayload.noSocialMedia ?? false,
          classAttended: parsedPayload.classAttended ?? false,
          notesMade: parsedPayload.notesMade ?? false,
          doubtsMarked: parsedPayload.doubtsMarked ?? false,
          attentionMaintained: parsedPayload.attentionMaintained ?? false,
          classRevisionDone: parsedPayload.classRevisionDone ?? false,
          morningTopicsRevised: parsedPayload.morningTopicsRevised ?? false,
          errorNotebookUpdated: parsedPayload.errorNotebookUpdated ?? false,
          lightMcqsDone: parsedPayload.lightMcqsDone ?? false,
          errors: dbData.errors ?? parsedPayload.errors ?? "",
          streak: parsedPayload.streak ?? streak ?? 14,
          lastSavedAt: parsedPayload.lastSavedAt ?? "",
          locked: dbData.locked ?? parsedPayload.locked ?? false,
          mockCount: parsedPayload.mockCount ?? 0,
          analysisDone: parsedPayload.analysisDone ?? false,
          weakTopics: parsedPayload.weakTopics ?? "",
        };
        
        const key = `NEET_${dateStr}`;
        localStorage.setItem(key, JSON.stringify(mergedData));
        
        setData(mergedData);
        setIsLocked(mergedData.locked ?? false);
        
        if (dateStr === getTodayKey()) {
          localStorage.setItem("neetData", JSON.stringify(mergedData));
        }
        
        return mergedData;
      }
    } catch (err) {
      console.error("Failed to sync date from Supabase:", err);
    }
  };

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) {
      alert("Please configure your Supabase URL and Anon Key first!");
      return;
    }
    if (!authEmail || !authPassword) {
      alert("Please enter both email and password!");
      return;
    }
    setAuthLoading(true);
    try {
      const { data: authData, error } = await sb.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) throw error;
      setToastMessage("Login successful! Syncing cloud data... ✅");
      setTimeout(() => setToastMessage(null), 3000);
      setAuthPassword("");
    } catch (err: any) {
      alert(`Login failed: ${err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSupabaseSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) {
      alert("Please configure your Supabase URL and Anon Key first!");
      return;
    }
    if (!authEmail || !authPassword) {
      alert("Please enter both email and password!");
      return;
    }
    setAuthLoading(true);
    try {
      const { data: authData, error } = await sb.auth.signUp({
        email: authEmail,
        password: authPassword,
      });
      if (error) throw error;
      setToastMessage("Signup successful! Check email for verification 🔥");
      setTimeout(() => setToastMessage(null), 3000);
      setAuthPassword("");
    } catch (err: any) {
      alert(`Signup failed: ${err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSupabaseLogout = async () => {
    const sb = getSupabase();
    if (sb) {
      await sb.auth.signOut();
      setUser(null);
      setToastMessage("Logged out successfully");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrlInput || !supabaseAnonKeyInput) {
      alert("Please enter both Supabase URL and Anon Key!");
      return;
    }
    const client = initSupabase(supabaseUrlInput.trim(), supabaseAnonKeyInput.trim());
    if (client) {
      setIsSupabaseConfigured(true);
      setToastMessage("Supabase configuration saved! Connected successfully ⚡");
      setTimeout(() => setToastMessage(null), 3000);
      
      client.auth.getUser().then(({ data: { user: currentUser } }) => {
        if (currentUser) {
          setUser(currentUser);
          fetchAndUpdateSupabaseStreak(currentUser);
          syncDataFromSupabase(selectedDate, currentUser);
        }
      });
    } else {
      alert("Failed to initialize Supabase client. Check your keys!");
    }
  };

  const handleClearCredentials = () => {
    if (confirm("Are you sure you want to remove Supabase keys? This will log you out.")) {
      localStorage.removeItem("SUPABASE_URL");
      localStorage.removeItem("SUPABASE_ANON_KEY");
      setSupabaseUrlInput("");
      setSupabaseAnonKeyInput("");
      setIsSupabaseConfigured(false);
      setUser(null);
    }
  };

  const forceFullCloudSync = async () => {
    const sb = getSupabase();
    if (!sb || !user) return;
    
    setSyncStatus("syncing");
    setToastMessage("Performing full cloud backup... 🔄");
    
    try {
      const localKeys = Object.keys(localStorage).filter(k => k.startsWith("NEET_") && !k.startsWith("NEET_MONTH_"));
      let successCount = 0;
      
      for (const key of localKeys) {
        const dateStr = key.replace("NEET_", "");
        const raw = localStorage.getItem(key);
        if (raw) {
          const payload = JSON.parse(raw);
          const { error } = await sb
            .from("daily_logs")
            .upsert({
              user_id: user.id,
              date: dateStr,
              bio_mcq: (payload.bioMCQ ?? 0).toString(),
              phy_mcq: (payload.phyMCQ ?? 0).toString(),
              chem_mcq: (payload.chemMCQ ?? 0).toString(),
              errors: payload.errors ?? "",
              hours: payload.totalHours ?? "0.0",
              locked: payload.locked ?? false,
              payload: payload
            });
          if (!error) successCount++;
        }
      }
      
      await fetchAndUpdateSupabaseStreak(user);
      setSyncStatus("success");
      setToastMessage(`Synced ${successCount} entries to Supabase Cloud! ✅`);
    } catch (err: any) {
      console.error(err);
      setSyncStatus("error");
      setToastMessage(`Sync failed: ${err.message}`);
    } finally {
      setTimeout(() => {
        setSyncStatus("idle");
        setToastMessage(null);
      }, 4000);
    }
  };

  // STREAK SYSTEM CALCULATION ON LOAD (AUTO RUN)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastVisit = localStorage.getItem("lastVisit");
    let currentStreak = parseInt(localStorage.getItem("streak") || "14") || 14;

    if (!lastVisit) {
      // first time user
      currentStreak = 14;
    } else {
      const lastDate = new Date(lastVisit);
      const currentDate = new Date(today);

      const diffTime = currentDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // continue streak
        currentStreak++;
      } else if (diffDays > 1) {
        // streak break
        currentStreak = 1;
      }
      // if same day → no change
    }

    localStorage.setItem("streak", currentStreak.toString());
    localStorage.setItem("lastVisit", today);
    setStreak(currentStreak);

    // Sync state streak with standard dataset
    setData(prev => ({
      ...prev,
      streak: currentStreak
    }));

    // For any external scripts/DOM queries expecting the id="streak" element:
    const el = document.getElementById("streak");
    if (el) {
      el.innerText = currentStreak.toString();
    }
  }, []);

  const quotes = [
    "NCERT is your ultimate holy book. Read between the lines.",
    "Every mistake documented in your error notebook is a question saved in the real exam.",
    "The difference between ordinary and extraordinary is that little extra.",
    "Medicines cure diseases, but only doctors can cure patients.",
    "Your focus determines your reality. Stay disciplined.",
    "Efficiency is doing things right; effectiveness is doing the right things."
  ];



  useEffect(() => {
    // Select a random motivational quote for the session
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setCurrentQuote(randomQuote);
  }, []);

  const lockUI = () => {
    const inputs = document.querySelectorAll("input, textarea, button");
    inputs.forEach(el => {
      const htmlEl = el as HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement;
      if (!htmlEl.classList.contains("allow")) {
        htmlEl.disabled = true;
      }
    });
  };

  // Lock UI effect to enforce the submitted/locked state
  useEffect(() => {
    if (isLocked) {
      lockUI();
    } else {
      const inputs = document.querySelectorAll("input, textarea, button");
      inputs.forEach(el => {
        const htmlEl = el as HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement;
        if (!htmlEl.classList.contains("allow")) {
          htmlEl.disabled = false;
        }
      });
    }
  }, [isLocked, activeTab, selectedDate, data]);

  // Update studySeconds state helper
  const handleSetStudySeconds = (updater: number | ((prevSecs: number) => number)) => {
    setData((prev) => {
      const nextSeconds = typeof updater === "function" ? updater(prev.studySeconds) : updater;
      const nextHours = (nextSeconds / 3600).toFixed(1);
      return {
        ...prev,
        studySeconds: nextSeconds,
        totalHours: nextHours,
      };
    });
  };

  // Generic key-value editor
  const handleValueChange = <K extends keyof NeetData>(key: K, value: NeetData[K]) => {
    setData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Clickable streak incrementor
  const handleIncrementStreak = () => {
    const nextStreak = streak + 1;
    setStreak(nextStreak);
    localStorage.setItem("streak", nextStreak.toString());
    handleValueChange("streak", nextStreak);
    setToastMessage(`Streak updated to ${nextStreak} Days! Save your progress to persist.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load data from NEET_[dateStr] and set as active state
  const loadDayData = (dateStr: string): boolean => {
    try {
      const key = `NEET_${dateStr}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        const dayData: NeetData = {
          studySeconds: parsed.studySeconds ?? Math.round((parseFloat(parsed.hours) || 0) * 3600),
          totalHours: parsed.hours ?? "0.0",
          wakeUpOnTime: parsed.wakeUpOnTime ?? false,
          bioNcertReading: parsed.bioNcertReading ?? false,
          physicsQuestions: parsed.physicsQuestions ?? 0,
          chemOrganic: parsed.chemOrganic ?? false,
          chemPhysical: parsed.chemPhysical ?? false,
          chemInorganic: parsed.chemInorganic ?? false,
          morningRevisionDone: parsed.morningRevisionDone ?? false,
          bioMCQ: parseInt(parsed.bioMCQ) || 0,
          phyMCQ: parseInt(parsed.phyMCQ) || 0,
          chemMCQ: parseInt(parsed.chemMCQ) || 0,
          sleepChecked: parsed.sleepChecked ?? false,
          noSocialMedia: parsed.noSocialMedia ?? false,
          classAttended: parsed.classAttended ?? false,
          notesMade: parsed.notesMade ?? false,
          doubtsMarked: parsed.doubtsMarked ?? false,
          attentionMaintained: parsed.attentionMaintained ?? false,
          classRevisionDone: parsed.classRevisionDone ?? false,
          morningTopicsRevised: parsed.morningTopicsRevised ?? false,
          errorNotebookUpdated: parsed.errorNotebookUpdated ?? false,
          lightMcqsDone: parsed.lightMcqsDone ?? false,
          errors: parsed.errors ?? "",
          streak: parsed.streak ?? data.streak ?? 14,
          lastSavedAt: parsed.lastSavedAt ?? "",
          locked: parsed.locked ?? false,
          mockCount: parsed.mockCount ?? 0,
          analysisDone: parsed.analysisDone ?? false,
          weakTopics: parsed.weakTopics ?? "",
        };

        // If it's the last day of the month and monthly data is empty, check month key fallback
        if (isLastDayOfMonth(dateStr)) {
          const parts = dateStr.split('-');
          const monthKey = `NEET_MONTH_${parseInt(parts[1], 10) - 1}_${parts[0]}`;
          const monthSaved = localStorage.getItem(monthKey);
          if (monthSaved) {
            try {
              const monthParsed = JSON.parse(monthSaved);
              dayData.mockCount = dayData.mockCount || (parseInt(monthParsed.mockCount) || 0);
              dayData.analysisDone = dayData.analysisDone || !!monthParsed.analysisDone;
              dayData.weakTopics = dayData.weakTopics || (monthParsed.weakTopics ?? "");
            } catch (err) {
              console.error(err);
            }
          }
        }

        setData(dayData);
        const nextStreak = parsed.streak ?? streak ?? 14;
        setStreak(nextStreak);
        setIsLocked(parsed.locked ?? false);
        return true;
      }
    } catch (err) {
      console.error("Error loading day data", err);
    }
    setIsLocked(false);
    return false;
  };

  // Wrapper function to load a day with an alert/user-feedback
  const loadDay = (dateStr: string) => {
    const key = `NEET_${dateStr}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setSelectedDate(dateStr);
      loadDayData(dateStr);
      setToastMessage(`Loaded report for ${dateStr}!`);
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      alert(`No data for this day (${dateStr})`);
    }
  };

  const selectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const exists = loadDayData(dateStr);
    if (!exists) {
      const currentStreak = data.streak ?? 14;
      const defaultData = getDefaultDataForDate(dateStr, currentStreak);
      
      // Load fallback if last day of month
      if (isLastDayOfMonth(dateStr)) {
        const parts = dateStr.split('-');
        const monthKey = `NEET_MONTH_${parseInt(parts[1], 10) - 1}_${parts[0]}`;
        const monthSaved = localStorage.getItem(monthKey);
        if (monthSaved) {
          try {
            const monthParsed = JSON.parse(monthSaved);
            defaultData.mockCount = parseInt(monthParsed.mockCount) || 0;
            defaultData.analysisDone = !!monthParsed.analysisDone;
            defaultData.weakTopics = monthParsed.weakTopics ?? "";
          } catch (err) {
            console.error(err);
          }
        }
      }

      setData(defaultData);
      setIsLocked(false);
    }
  };

  // Save data using the exact key format NEET_YYYY-MM-DD
  const saveData = async () => {
    const timestamp = new Date().toLocaleString();
    const payload = {
      date: selectedDate,
      bioMCQ: data.bioMCQ,
      phyMCQ: data.phyMCQ,
      chemMCQ: data.chemMCQ,
      errors: data.errors,
      hours: data.totalHours,

      studySeconds: data.studySeconds,
      wakeUpOnTime: data.wakeUpOnTime,
      bioNcertReading: data.bioNcertReading,
      physicsQuestions: data.physicsQuestions,
      chemOrganic: data.chemOrganic,
      chemPhysical: data.chemPhysical,
      chemInorganic: data.chemInorganic,
      morningRevisionDone: data.morningRevisionDone,
      sleepChecked: data.sleepChecked,
      noSocialMedia: data.noSocialMedia,
      classAttended: data.classAttended,
      notesMade: data.notesMade,
      doubtsMarked: data.doubtsMarked,
      attentionMaintained: data.attentionMaintained,
      classRevisionDone: data.classRevisionDone,
      morningTopicsRevised: data.morningTopicsRevised,
      errorNotebookUpdated: data.errorNotebookUpdated,
      lightMcqsDone: data.lightMcqsDone,
      streak: streak,
      lastSavedAt: timestamp,
      locked: true, // 🔥 MAIN LINE
      mockCount: data.mockCount ?? 0,
      analysisDone: data.analysisDone ?? false,
      weakTopics: data.weakTopics ?? "",
    };

    const key = `NEET_${selectedDate}`;
    localStorage.setItem(key, JSON.stringify(payload));
    
    if (selectedDate === getTodayKey()) {
      localStorage.setItem("neetData", JSON.stringify(payload));
    }

    if (isLastDayOfMonth(selectedDate)) {
      const parts = selectedDate.split('-');
      const monthKey = `NEET_MONTH_${parseInt(parts[1], 10) - 1}_${parts[0]}`;
      const monthlyData = {
        mockCount: data.mockCount ?? 0,
        analysisDone: data.analysisDone ?? false,
        weakTopics: data.weakTopics ?? ""
      };
      localStorage.setItem(monthKey, JSON.stringify(monthlyData));
    }

    setData(prev => ({ 
      ...prev, 
      locked: true,
      mockCount: data.mockCount ?? 0,
      analysisDone: data.analysisDone ?? false,
      weakTopics: data.weakTopics ?? ""
    }));
    setIsLocked(true);
    
    // Lock immediately
    setTimeout(() => {
      lockUI();
    }, 50);

    // Sync to Supabase if logged in
    const sb = getSupabase();
    if (sb && user) {
      try {
        setToastMessage("Syncing with Supabase Cloud... 🔄");
        const { error } = await sb
          .from("daily_logs")
          .upsert({
            user_id: user.id,
            date: selectedDate,
            bio_mcq: payload.bioMCQ.toString(),
            phy_mcq: payload.phyMCQ.toString(),
            chem_mcq: payload.chemMCQ.toString(),
            errors: payload.errors,
            hours: payload.hours,
            locked: true,
            payload: payload
          });

        if (error) throw error;
        
        await fetchAndUpdateSupabaseStreak(user);
        setToastMessage("Saved & Synced with Supabase Cloud 🔒");
        alert("Saved & Synced with Supabase Cloud 🔒");
      } catch (err: any) {
        console.error("Supabase Sync Error:", err);
        setToastMessage(`Saved locally, but Cloud Sync failed: ${err.message}`);
        alert(`Saved locally, but Cloud Sync failed: ${err.message}`);
      }
    } else {
      setToastMessage(`Submitted & Locked 🔒 (Saved locally)`);
      alert("Submitted & Locked 🔒 (Saved locally)");
    }

    setTimeout(() => setToastMessage(null), 3000);
  };

  // Generate neat formatted NEET Daily Summary report
  const generatePDF = () => {
    const text = `
=========================================
      NEETRIX - DAILY DIGEST    
=========================================
Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

[1] FOCUS PERFORMANCE
-----------------------------------------
Study Hours: ${data.totalHours} hrs
Streak Met: ${data.streak ?? 14} DAYS

[2] MCQ SOLVING STATS
-----------------------------------------
Biology MCQs: ${data.bioMCQ}
Physics MCQs: ${data.phyMCQ}
Chemistry MCQs: ${data.chemMCQ}
Total MCQs Completed: ${data.bioMCQ + data.phyMCQ + data.chemMCQ}

[3] MORNING STUDY & CHECKS
-----------------------------------------
- Wake Up On Time: ${data.wakeUpOnTime ? "✔ YES" : "✘ NO"}
- Bio NCERT Reading: ${data.bioNcertReading ? "✔ COMPLETED" : "✘ PENDING"}
- Physics Numericals: ${data.physicsQuestions} questions solved
- Chemistry Focus Areas: ${
      [
        data.chemOrganic && "Organic",
        data.chemPhysical && "Physical",
        data.chemInorganic && "Inorganic"
      ].filter(Boolean).join(", ") || "None"
    }
- Revision Done: ${data.morningRevisionDone ? "✔ YES" : "✘ NO"}

[4] CLASS & DISCIPLINE
-----------------------------------------
- 7-8 Hours Sleep: ${data.sleepChecked ? "✔ COMPLETED" : "✘ NO"}
- No Social Media: ${data.noSocialMedia ? "✔ MAINTAINED" : "✘ DISTRACTED"}
- Attended Class: ${data.classAttended ? "✔ YES" : "✘ NO"}
- Notes Made: ${data.notesMade ? "✔ YES" : "✘ NO"}
- Doubts Resolved/Marked: ${data.doubtsMarked ? "✔ YES" : "✘ NO"}
- Focus Maintained: ${data.attentionMaintained ? "✔ YES" : "✘ NO"}

[5] NIGHTTIME REVIEW
-----------------------------------------
- Class Revision Done: ${data.classRevisionDone ? "✔ YES" : "✘ NO"}
- Morning Topics Revised: ${data.morningTopicsRevised ? "✔ YES" : "✘ NO"}
- Error Notebook Updated: ${data.errorNotebookUpdated ? "✔ YES" : "✘ NO"}
- Light Night MCQs: ${data.lightMcqsDone ? "✔ YES" : "✘ NO"}

[6] ERROR NOTEBOOK LOGS
-----------------------------------------
${data.errors ? data.errors.trim() : "No errors logged today. Perfect accuracy!"}
${isLastDayOfMonth(selectedDate) ? `
[7] MONTHLY REPORT SUMMARY
-----------------------------------------
- Mock Tests Attempted: ${data.mockCount ?? 0}
- Mock Test Analysis Done: ${data.analysisDone ? "✔ YES" : "✘ NO"}
- Weak Topics Identified:
${data.weakTopics ? data.weakTopics.trim() : "None listed."}
` : ""}
=========================================
         KEEP SOLVING, STAY HUNGRY!      
=========================================
`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Neetrix_Summary_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper calculation for daily score / completion metric
  const getProgressStats = () => {
    let totalItems = 15; // Total core indicators/targets
    let completedItems = 0;

    if (data.wakeUpOnTime) completedItems++;
    if (data.bioNcertReading) completedItems++;
    if (data.morningRevisionDone) completedItems++;
    if (data.sleepChecked) completedItems++;
    if (data.noSocialMedia) completedItems++;
    if (data.classAttended) completedItems++;
    if (data.notesMade) completedItems++;
    if (data.doubtsMarked) completedItems++;
    if (data.attentionMaintained) completedItems++;
    if (data.classRevisionDone) completedItems++;
    if (data.morningTopicsRevised) completedItems++;
    if (data.errorNotebookUpdated) completedItems++;
    if (data.lightMcqsDone) completedItems++;
    if (data.bioMCQ + data.phyMCQ + data.chemMCQ >= 50) completedItems += 2; // Bonus for good MCQ practice count

    const percentage = Math.round((completedItems / totalItems) * 100);
    return Math.min(percentage, 100);
  };

  interface SavedDayEntry {
    date: string;
    hours: string;
    mcqTotal: number;
    completedPercent: number;
  }

  const getSavedHistory = (): SavedDayEntry[] => {
    const history: SavedDayEntry[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("NEET_")) {
          const datePart = key.replace("NEET_", "");
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            const bio = parseInt(parsed.bioMCQ) || 0;
            const phy = parseInt(parsed.phyMCQ) || 0;
            const chem = parseInt(parsed.chemMCQ) || 0;
            
            // Calculate completed percentage
            let totalItems = 15;
            let completedItems = 0;
            if (parsed.wakeUpOnTime) completedItems++;
            if (parsed.bioNcertReading) completedItems++;
            if (parsed.morningRevisionDone) completedItems++;
            if (parsed.sleepChecked) completedItems++;
            if (parsed.noSocialMedia) completedItems++;
            if (parsed.classAttended) completedItems++;
            if (parsed.notesMade) completedItems++;
            if (parsed.doubtsMarked) completedItems++;
            if (parsed.attentionMaintained) completedItems++;
            if (parsed.classRevisionDone) completedItems++;
            if (parsed.morningTopicsRevised) completedItems++;
            if (parsed.errorNotebookUpdated) completedItems++;
            if (parsed.lightMcqsDone) completedItems++;
            if (bio + phy + chem >= 50) completedItems += 2;

            history.push({
              date: datePart,
              hours: parsed.hours ?? "0.0",
              mcqTotal: bio + phy + chem,
              completedPercent: Math.min(Math.round((completedItems / totalItems) * 100), 100),
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to read history", err);
    }
    
    return history.sort((a, b) => b.date.localeCompare(a.date));
  };

  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    const nextDateStr = current.toISOString().split('T')[0];
    selectDate(nextDateStr);
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 1);
    const nextDateStr = current.toISOString().split('T')[0];
    selectDate(nextDateStr);
  };

  const openSettings = () => {
    let date = prompt("Enter date (YYYY-MM-DD):");
    if (date) {
      loadDay(date);
    }
  };

  const aspirantScore = getProgressStats();

  return (
    <div className="min-h-screen bg-[#05070A] text-slate-200 selection:bg-cyan-500/30 selection:text-white flex flex-col justify-between">
      {/* Decorative gradient lights */}
      <div className="absolute top-0 left-1/4 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none no-print" />
      <div className="absolute bottom-10 right-10 h-[300px] w-[300px] rounded-full bg-orange-500/5 blur-[120px] pointer-events-none no-print" />

      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 flex-1 flex flex-col justify-between">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-6 border-b border-white/10 pb-4 gap-4 no-print">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-cyan-400 font-display">
              NEET<span className="text-white">RIX</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
              Medical Entrance Command Center • V4.2
            </p>
          </div>

          <div className="flex gap-8 items-center">
            {/* Streak indicator */}
            <div className="text-right flex flex-col items-end">
              <h3 className="text-base font-black text-orange-500 uppercase tracking-tight flex items-center gap-1">
                🔥 Streak: <span id="streak" className="text-xl font-mono text-orange-400">{streak}</span> days
              </h3>
              <button 
                onClick={handleIncrementStreak}
                title="Click to increment daily streak"
                className="allow text-[10px] text-slate-500 hover:text-orange-400 hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none transition-all"
              >
                Manual +1
              </button>
            </div>

            {/* Completion metrics */}
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Completion Index</p>
              <p className="text-xl font-mono font-bold text-[#00ffcc]">{aspirantScore}%</p>
            </div>


          </div>
        </header>

        {/* TAB NAVIGATION & DATE SELECTOR BAR */}
        <div className="no-print mb-6 p-3 bg-slate-900/40 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Active Date Selector */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevDay}
              title="Previous Day"
              className="allow p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-slate-300 rounded-lg cursor-pointer border-none"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/10">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <input 
                type="date"
                min="2026-01-01"
                max="2027-12-31"
                value={selectedDate}
                onChange={(e) => selectDate(e.target.value)}
                className="allow bg-transparent border-none text-white focus:outline-none font-mono text-sm cursor-pointer"
              />
            </div>

            <button 
              onClick={handleNextDay}
              title="Next Day"
              className="allow p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-slate-300 rounded-lg cursor-pointer border-none"
            >
              <ArrowRight className="h-4 w-4" />
            </button>

            <button 
              onClick={openSettings}
              title="Open Settings"
              className="allow p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-cyan-400 rounded-lg cursor-pointer border-none ml-1 flex items-center gap-1.5 font-bold text-xs uppercase"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>

          {/* Tab switches */}
          <div className="flex p-1 bg-slate-950 rounded-xl border border-white/5 gap-1 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`allow flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-none ${
                activeTab === 'dashboard' 
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`allow flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-none ${
                activeTab === 'history' 
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              History & Settings
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`allow flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-none ${
                activeTab === 'report' 
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Report (A4)
            </button>
          </div>
        </div>

        {/* MAIN BODY SWITCHER */}
        <div className="flex-1 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch"
              >
                {/* LEFT COLUMN: TIME & DISCIPLINE */}
                <div className="col-span-1 md:col-span-1 lg:col-span-3 flex flex-col gap-6">
                  <Stopwatch 
                    studySeconds={data.studySeconds}
                    setStudySeconds={handleSetStudySeconds}
                    totalHours={data.totalHours}
                  />

                  <DisciplineTracker data={data} onChange={handleValueChange} />
                </div>

                {/* CENTER COLUMN: THE WORKFLOW CHECKLISTS */}
                <div className="col-span-1 md:col-span-1 lg:col-span-6 flex flex-col gap-6">
                  <div className="grid grid-rows-1 sm:grid-rows-3 flex-1 gap-6">
                    <MorningSelfStudy data={data} onChange={handleValueChange} />
                    <ClassTracker data={data} onChange={handleValueChange} />
                    <NightRevision data={data} onChange={handleValueChange} />
                  </div>
                  <AnimatePresence>
                    {isLastDayOfMonth(selectedDate) && (
                      <MonthlySection 
                        mockCount={data.mockCount ?? 0}
                        analysisDone={data.analysisDone ?? false}
                        weakTopics={data.weakTopics ?? ""}
                        onChange={handleValueChange}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {/* RIGHT COLUMN: STATS, ERRORS & OPERATIONS */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col gap-6">
                  <DailyPractice data={data} onChange={handleValueChange} />
                  
                  <div className="flex-1 min-h-[220px]">
                    <ErrorNotebook errors={data.errors} setErrors={(val) => handleValueChange("errors", val)} />
                  </div>

                  {/* GLOBAL ACTIONS / OPERATIONS */}
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      id="btn-save-progress"
                      onClick={saveData}
                      className="allow w-full bg-[#00ffcc] text-black py-3 rounded-xl font-black text-xs uppercase tracking-tighter hover:bg-[#00ffcc]/90 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-cyan-500/5 flex items-center justify-center gap-1.5"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Finalize Daily Report
                    </button>

                    <button
                      id="btn-generate-pdf"
                      onClick={() => {
                        saveData();
                        setActiveTab('report');
                      }}
                      className="allow w-full bg-slate-800 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-tighter border border-white/10 hover:bg-slate-700 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Preview Report / Print
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="flex-1 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 no-print"
              >
                {/* LEFT COLUMN: SUPABASE CONFIG & AUTH (5 Cols) */}
                <div className="lg:col-span-5 bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-6 h-fit">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                        <Cloud className="h-5 w-5 text-cyan-400 shrink-0" />
                        🔐 Cloud Sync (Supabase)
                      </h2>
                      <p className="text-[11px] text-slate-400 mt-1">Connect your database to enable automated multi-device backup & sync</p>
                    </div>
                  </div>

                  {/* SUPABASE CONNECTION STATUS */}
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                    <div className="text-left">
                      <p className="text-xs font-bold text-white uppercase tracking-wider">Cloud Connection Status</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isSupabaseConfigured 
                          ? (user ? `Connected as ${user.email}` : "Client Initialized (Not Logged In)") 
                          : "No Supabase configuration detected"}
                      </p>
                    </div>
                    <div>
                      {isSupabaseConfigured ? (
                        user ? (
                          <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                          </span>
                        ) : (
                          <span className="flex h-3 w-3 relative">
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                          </span>
                        )
                      ) : (
                        <span className="flex h-3 w-3 relative">
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SUPABASE CREDENTIALS CONFIGURATION */}
                  {!getSupabaseKeys().isEnv && (
                    <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Key className="h-3.5 w-3.5 text-cyan-400" />
                          Supabase Keys Config
                        </h4>
                        {isSupabaseConfigured && (
                          <button 
                            type="button" 
                            onClick={handleClearCredentials}
                            className="text-[10px] text-red-400 hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none font-bold"
                          >
                            Clear Keys
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">Enter your project credentials below. Keys are stored locally in your browser cache.</p>
                      <form onSubmit={handleSaveCredentials} className="flex flex-col gap-2 mt-1">
                        <input
                          type="text"
                          placeholder="Supabase Project URL"
                          value={supabaseUrlInput}
                          onChange={(e) => setSupabaseUrlInput(e.target.value)}
                          className="allow bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-full"
                          required
                        />
                        <input
                          type="password"
                          placeholder="Supabase Anon Key"
                          value={supabaseAnonKeyInput}
                          onChange={(e) => setSupabaseAnonKeyInput(e.target.value)}
                          className="allow bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-full"
                          required
                        />
                        <button
                          type="submit"
                          className="allow bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs uppercase tracking-wider py-2 rounded-xl transition-all border border-white/10 cursor-pointer"
                        >
                          {isSupabaseConfigured ? "Update Credentials" : "Save Credentials"}
                        </button>
                      </form>
                    </div>
                  )}

                  {getSupabaseKeys().isEnv && (
                    <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                      <Database className="h-5 w-5 text-green-400 shrink-0" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-white uppercase tracking-wider">Default Server Keys Active</p>
                        <p className="text-[11px] text-slate-500">Loaded keys from environment variables. Custom inputs are disabled.</p>
                      </div>
                    </div>
                  )}

                  {/* AUTH LOG IN / SIGN UP OR SESSION INFO */}
                  {isSupabaseConfigured ? (
                    !user ? (
                      <div className="bg-slate-950/40 p-5 rounded-2xl border border-white/5 flex flex-col gap-4">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                          <Lock className="h-3.5 w-3.5 text-cyan-400" />
                          🔐 Account Access & Sync
                        </h3>
                        
                        <form className="flex flex-col gap-3">
                          <div className="flex flex-col gap-1 text-left">
                            <label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Email Address</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                              <input
                                type="email"
                                placeholder="neetrix@aspirant.com"
                                value={authEmail}
                                onChange={(e) => setAuthEmail(e.target.value)}
                                className="allow bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 w-full animate-none"
                                required
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 text-left">
                            <label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Password</label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                              <input
                                type="password"
                                placeholder="••••••••"
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                className="allow bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 w-full"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <button
                              type="button"
                              onClick={handleSupabaseLogin}
                              disabled={authLoading}
                              className="allow bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              {authLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Log In"}
                            </button>
                            <button
                              type="button"
                              onClick={handleSupabaseSignup}
                              disabled={authLoading}
                              className="allow bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all border border-white/10 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              Signup
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="bg-slate-950/40 p-5 rounded-2xl border border-white/5 flex flex-col gap-4">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                          <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
                          Authenticated Session Active
                        </h3>

                        <div className="text-xs text-slate-300 space-y-2.5 text-left bg-slate-900/40 p-3 rounded-xl border border-white/5">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Email:</span>
                            <span className="font-mono text-white text-[11px] truncate max-w-[180px]">{user.email}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">User ID:</span>
                            <span className="font-mono text-[10px] text-slate-400 truncate max-w-[180px]">{user.id}</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-white/5 pt-2">
                            <span className="text-slate-500">Cloud Streak:</span>
                            <span className="text-orange-400 font-bold flex items-center gap-1">
                              <Flame className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                              {supabaseStreak} days
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-1">
                          <button
                            type="button"
                            onClick={forceFullCloudSync}
                            disabled={syncStatus === "syncing"}
                            className="allow bg-[#00ffcc] text-black font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer border-none flex items-center justify-center gap-1.5"
                          >
                            {syncStatus === "syncing" ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                Syncing database...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-3.5 w-3.5" />
                                Full Backup to Cloud 🔄
                              </>
                            )}
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleSupabaseLogout}
                            className="allow bg-red-950/20 text-red-400 hover:bg-red-900/20 border border-red-500/10 font-bold text-xs uppercase tracking-wider py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            Log Out
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="bg-red-950/10 border border-red-500/10 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
                      <CloudOff className="h-10 w-10 text-red-500/55" />
                      <div>
                        <p className="text-xs font-bold text-slate-300">Sync Config Required</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-normal">Configure Supabase connection keys above or in environment variables to enable auth, remote backup, & cloud database capabilities.</p>
                      </div>
                    </div>
                  )}

                  {/* SUPABASE TABLE SCHEMA HINT */}
                  <div className="bg-slate-950/20 p-4 rounded-2xl border border-white/5 flex flex-col gap-2 text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Database className="h-3.5 w-3.5 text-cyan-400" />
                      Supabase Setup Guide
                    </p>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Run this script in your Supabase <strong>SQL Editor</strong> to configure the database schema:
                    </p>
                    <pre className="bg-slate-900/80 p-3 rounded-xl text-[9px] font-mono text-slate-400 overflow-x-auto border border-white/5 whitespace-pre selection:bg-cyan-500/10 max-h-[140px] leading-relaxed">
{`create table daily_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  date text,
  bio_mcq text,
  phy_mcq text,
  chem_mcq text,
  errors text,
  hours text,
  locked boolean default false,
  payload jsonb,
  created_at timestamp default now(),
  unique (user_id, date)
);`}
                    </pre>
                  </div>
                </div>

                {/* RIGHT COLUMN: HISTORICAL STUDY LOG (7 Cols) */}
                <div className="lg:col-span-7 bg-slate-900/30 border border-white/5 rounded-3xl p-6 flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-4 gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-cyan-400">📅 Historical Study Log</h2>
                      <p className="text-xs text-slate-400 mt-1">Select and load any historical study record (data is saved to persistent local storage by date-key and is never deleted)</p>
                    </div>
                    <button
                      onClick={openSettings}
                      className="allow bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer border-none flex items-center gap-1.5"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Settings
                    </button>
                  </div>

                  {/* Search / Manual Input Idea */}
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-left">
                      <p className="text-xs font-bold text-white uppercase tracking-wider">Fast Date Search</p>
                      <p className="text-[11px] text-slate-500">Pick any date to automatically load or initialize its study targets</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-white/10 w-full sm:w-auto">
                      <Calendar className="h-4 w-4 text-cyan-400 shrink-0" />
                      <input 
                        type="date"
                        min="2026-01-01"
                        max="2027-12-31"
                        value={selectedDate}
                        onChange={(e) => selectDate(e.target.value)}
                        className="allow bg-transparent border-none text-white focus:outline-none font-mono text-xs cursor-pointer w-full"
                      />
                    </div>
                  </div>

                  {/* History List */}
                  <div className="flex-1 overflow-y-auto max-h-[400px] border border-white/5 rounded-2xl bg-slate-950/40">
                    {getSavedHistory().length === 0 ? (
                      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                        <Calendar className="h-10 w-10 text-slate-600 animate-pulse" />
                        <div>
                          <p className="text-sm font-bold text-slate-400">No saved records found</p>
                          <p className="text-xs text-slate-600 mt-1">Start tracking and click "Finalize Daily Report" on the dashboard to save permanently!</p>
                        </div>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                            <th className="p-4">Study Date</th>
                            <th className="p-4">Study Hours</th>
                            <th className="p-4">MCQs Solved</th>
                            <th className="p-4">Completion</th>
                            <th className="p-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-sm">
                          {getSavedHistory().map((entry) => (
                            <tr key={entry.date} className={`hover:bg-white/5 transition-colors ${entry.date === selectedDate ? 'bg-cyan-500/10' : ''}`}>
                              <td className="p-4 font-bold text-white flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${entry.date === selectedDate ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                                {entry.date}
                              </td>
                              <td className="p-4 text-slate-300">{entry.hours} hrs</td>
                              <td className="p-4 text-slate-300">{entry.mcqTotal} MCQs</td>
                              <td className="p-4 text-slate-300">
                                <span className="text-[#00ffcc] font-bold">{entry.completedPercent}%</span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => loadDay(entry.date)}
                                  className="allow bg-slate-800 hover:bg-slate-700 hover:text-cyan-400 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-white/5 transition-all cursor-pointer font-sans font-semibold"
                                >
                                  Load Day
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="text-[10px] uppercase text-slate-600 tracking-wider text-center mt-2 flex items-center justify-center gap-1.5 font-bold">
                    <Award className="h-3.5 w-3.5 text-cyan-500" />
                    Your study records are saved locally and persist indefinitely across sessions.
                  </div>
                </div>
              </motion.div>
            )}


            {activeTab === 'report' && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col gap-6 max-w-3xl mx-auto w-full"
              >
                {/* Print Control Bar */}
                <div className="no-print bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-cyan-400">📄 A4 Document PDF Preview</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Click the print action to save as PDF directly without leaving the dashboard.</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 sm:flex-initial bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer border-none flex items-center justify-center gap-1.5"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Save as PDF / Print
                    </button>
                    <button
                      onClick={generatePDF}
                      className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-white/10 flex items-center justify-center gap-1.5"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      Download Raw TXT
                    </button>
                  </div>
                </div>

                {/* Print Container */}
                <div id="print-area" className="bg-white text-slate-900 shadow-2xl p-8 sm:p-12 rounded-3xl border border-slate-200 font-sans relative overflow-hidden print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 via-emerald-500 to-blue-500 print:hidden" />
                  
                  {/* Header */}
                  <div className="border-b-2 border-slate-200 pb-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-slate-950 uppercase flex items-center gap-2">
                        📊 NEETRIX DAILY PERFORMANCE REPORT
                      </h2>
                      <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">
                        Report generated for study date: <span className="font-bold text-slate-800">{selectedDate}</span>
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Preparation Streak</p>
                      <p className="text-xl font-bold text-orange-600 font-mono">{data.streak ?? 14} DAYS</p>
                    </div>
                  </div>

                  {/* MCQ Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                      <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Bio MCQs</p>
                      <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">{data.bioMCQ}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                      <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Physics MCQs</p>
                      <p className="text-2xl font-black text-cyan-600 mt-1 font-mono">{data.phyMCQ}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                      <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Chem MCQs</p>
                      <p className="text-2xl font-black text-amber-600 mt-1 font-mono">{data.chemMCQ}</p>
                    </div>
                  </div>

                  {/* Detailed metrics table */}
                  <div className="mb-6">
                    <h3 className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-2 border-b border-slate-100 pb-1">📊 Core Objectives Telemetry</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-700">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>Active Study Hours:</span>
                        <span className="font-bold font-mono text-slate-900">{data.totalHours} hrs</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>NCERT Revision Index:</span>
                        <span className="font-bold font-mono text-slate-900">{aspirantScore}%</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>Woke Up on Time:</span>
                        <span className={`font-bold ${data.wakeUpOnTime ? 'text-green-600' : 'text-slate-400'}`}>{data.wakeUpOnTime ? 'YES' : 'NO'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>Class Attended:</span>
                        <span className={`font-bold ${data.classAttended ? 'text-green-600' : 'text-slate-400'}`}>{data.classAttended ? 'YES' : 'NO'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>Morning NCERT Biology:</span>
                        <span className={`font-bold ${data.bioNcertReading ? 'text-green-600' : 'text-slate-400'}`}>{data.bioNcertReading ? 'COMPLETED' : 'PENDING'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>Digital Fast Maintained:</span>
                        <span className={`font-bold ${data.noSocialMedia ? 'text-green-600' : 'text-slate-400'}`}>{data.noSocialMedia ? 'YES' : 'NO'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Monthly summary index for last day of month */}
                  {isLastDayOfMonth(selectedDate) && (
                    <div className="mb-6">
                      <h3 className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-2 border-b border-slate-100 pb-1">📆 Monthly Summary Digest</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-700 mb-2">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>Mock Tests Attempted:</span>
                          <span className="font-bold font-mono text-slate-900">{data.mockCount ?? 0}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>Mock Analysis Completed:</span>
                          <span className={`font-bold ${data.analysisDone ? 'text-green-600' : 'text-slate-400'}`}>{data.analysisDone ? 'YES' : 'NO'}</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[60px] text-sm text-slate-700 whitespace-pre-wrap font-mono mt-1">
                        <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">Identified Weak Topics:</p>
                        {data.weakTopics ? data.weakTopics.trim() : "None listed."}
                      </div>
                    </div>
                  )}

                  {/* Errors log */}
                  <div className="mb-6">
                    <h3 className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-2 border-b border-slate-100 pb-1">📒 Mistakes & Conceptual Error Log</h3>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[100px] text-sm text-slate-700 whitespace-pre-wrap font-mono">
                      {data.errors ? data.errors.trim() : "No errors or mistakes logged for this day. Perfect score accuracy!"}
                    </div>
                  </div>

                  {/* Footer seal */}
                  <div className="mt-8 pt-4 border-t-2 border-slate-100 flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <span>Aspirant Session Verified</span>
                    <span>NEETRIX Daily Session Archive</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER STATUS BAR */}
        <footer className="mt-8 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-[10px] uppercase font-bold tracking-widest text-slate-600 gap-3 no-print">
          <div className="flex gap-6 items-center">
            <span>Session ID: #774-ALPHA</span>
            <span className="flex items-center gap-1.5">
              Status: 
              <span className="inline-flex items-center gap-1 text-green-500 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                SYNCED
              </span>
            </span>
          </div>
          <div className="italic font-serif normal-case tracking-normal text-slate-500 text-center sm:text-right">
            &ldquo;{currentQuote}&rdquo;
          </div>
        </footer>

      </div>

      {/* Persistent Toasts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            id="toast-notification"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-cyan-500/30 bg-[#05070A]/95 p-4 shadow-xl shadow-cyan-500/10 max-w-sm no-print"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Telemetry Updated</p>
              <p className="text-xs text-slate-400 mt-0.5">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

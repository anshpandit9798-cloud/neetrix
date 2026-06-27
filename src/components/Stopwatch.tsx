import React from "react";
import { Play, Pause, Square } from "lucide-react";
import { motion } from "motion/react";

interface StopwatchProps {
  studySeconds: number;
  setStudySeconds: (updater: number | ((prev: number) => number)) => void;
  totalHours: string;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  disabled?: boolean;
}

export default function Stopwatch({
  studySeconds,
  setStudySeconds,
  totalHours,
  isRunning,
  setIsRunning,
  disabled = false,
}: StopwatchProps) {
  const formatTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const startTimer = () => {
    if (!disabled) setIsRunning(true);
  };
  const pauseTimer = () => {
    if (!disabled) setIsRunning(false);
  };
  const stopTimer = () => {
    if (!disabled) {
      setIsRunning(false);
      setStudySeconds(0);
    }
  };

  return (
    <motion.div
      id="stopwatch-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-radial-gradient from-cyan-500/10 to-transparent pointer-events-none" />

      <p className="text-[10px] uppercase text-cyan-400 mb-2 font-bold tracking-widest flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full bg-cyan-400 ${isRunning ? 'animate-ping' : ''}`} />
        Active Study Session
      </p>

      <div className="text-4xl sm:text-5xl font-mono font-black text-white mb-4 tabular-nums drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] select-none">
        {formatTime(studySeconds)}
      </div>

      <div className="flex gap-2 w-full z-10">
        {!isRunning ? (
          <button
            id="btn-timer-start"
            onClick={startTimer}
            disabled={disabled}
            className="flex-1 bg-cyan-500 text-black py-2.5 rounded-lg font-bold text-xs uppercase hover:bg-cyan-400 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Play className="h-3 w-3 fill-current" />
            Resume
          </button>
        ) : (
          <button
            id="btn-timer-pause"
            onClick={pauseTimer}
            disabled={disabled}
            className="flex-1 bg-amber-500 text-black py-2.5 rounded-lg font-bold text-xs uppercase hover:bg-amber-400 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Pause className="h-3 w-3 fill-current" />
            Pause
          </button>
        )}

        <button
          id="btn-timer-stop"
          onClick={stopTimer}
          disabled={disabled || studySeconds === 0}
          className="px-4 bg-slate-800 text-white py-2.5 rounded-lg font-bold text-xs uppercase border border-white/10 hover:bg-slate-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center gap-1"
        >
          <Square className="h-3 w-3 fill-current" />
          Reset
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 w-full text-center flex justify-between items-center px-2">
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Today's Total</p>
        <p className="text-sm font-mono text-white font-bold">
          <span id="hours">{totalHours}</span> <span className="text-[10px] text-slate-500">HRS</span>
        </p>
      </div>
    </motion.div>
  );
}

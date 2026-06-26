import React from "react";
import { 
  Sun, 
  BarChart2, 
  ShieldCheck, 
  BookOpen, 
  Moon, 
  PenTool, 
  Dumbbell
} from "lucide-react";
import { motion } from "motion/react";
import { NeetData } from "../types";

interface DashboardCardsProps {
  data: NeetData;
  onChange: <K extends keyof NeetData>(key: K, value: NeetData[K]) => void;
}

// Reusable Custom Circular LED Checkbox component
interface LEDCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  sublabel?: string;
}

function LEDCheckbox({ id, checked, onChange, label, sublabel }: LEDCheckboxProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group p-1 select-none">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only" // Screen-reader only, keyboard accessible
      />
      <div 
        className={`mt-0.5 w-4.5 h-4.5 rounded-full border transition-all duration-300 flex items-center justify-center shrink-0 ${
          checked 
            ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_8px_rgba(6,182,212,0.3)]" 
            : "border-white/20 group-hover:border-white/40"
        }`}
      >
        {checked && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_6px_#22d3ee]"
          />
        )}
      </div>
      <div>
        <span className={`text-xs font-medium transition-colors ${checked ? "text-slate-200" : "text-slate-400 group-hover:text-slate-200"}`}>
          {label}
        </span>
        {sublabel && (
          <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </label>
  );
}

export function MorningSelfStudy({ data, onChange }: DashboardCardsProps) {
  return (
    <motion.div
      id="morning-study-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="relative bg-slate-900/50 border border-white/5 rounded-2xl p-5 overflow-hidden flex flex-col justify-between"
    >
      {/* Sun icon glowing in the background */}
      <div className="absolute -top-3 -right-3 p-4 opacity-5 text-amber-500 pointer-events-none">
        <Sun className="h-16 w-16 stroke-[1.5]" />
      </div>

      <div>
        <h4 className="text-cyan-400 font-display font-bold text-xs uppercase tracking-tighter mb-4 flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 font-mono">01 •</span> Morning Core Focus
        </h4>

        <div className="space-y-3.5">
          {/* Wake Up */}
          <LEDCheckbox 
            id="chk-morning-wake"
            checked={data.wakeUpOnTime}
            onChange={(val) => onChange("wakeUpOnTime", val)}
            label="Wake up on time (5:00 AM)"
          />

          {/* Biology NCERT */}
          <LEDCheckbox 
            id="chk-morning-bio-ncert"
            checked={data.bioNcertReading}
            onChange={(val) => onChange("bioNcertReading", val)}
            label="Biology NCERT Reading"
          />

          {/* Physics Concept + Numericals */}
          <div className="pl-7 py-1">
            <div className="flex items-center gap-2">
              <input
                id="phyNum"
                type="number"
                min="0"
                value={data.physicsQuestions}
                onChange={(e) => onChange("physicsQuestions", parseInt(e.target.value) || 0)}
                className="w-16 rounded-lg border border-white/10 bg-black/40 px-2 py-1 font-mono text-xs text-white text-center focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
              />
              <span className="text-[11px] text-slate-400">Physics MCQ questions solved</span>
            </div>
          </div>

          {/* Chemistry Focus checkboxes */}
          <div className="pl-7 pt-1 border-t border-white/5 space-y-2">
            <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold">Chemistry Core Topic</span>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              <LEDCheckbox 
                id="chk-chem-organic"
                checked={data.chemOrganic}
                onChange={(val) => onChange("chemOrganic", val)}
                label="Organic"
              />
              <LEDCheckbox 
                id="chk-chem-physical"
                checked={data.chemPhysical}
                onChange={(val) => onChange("chemPhysical", val)}
                label="Physical"
              />
              <LEDCheckbox 
                id="chk-chem-inorganic"
                checked={data.chemInorganic}
                onChange={(val) => onChange("chemInorganic", val)}
                label="Inorganic"
              />
            </div>
          </div>

          {/* Revision Done */}
          <div className="pt-2 border-t border-white/5">
            <LEDCheckbox 
              id="chk-morning-revision"
              checked={data.morningRevisionDone}
              onChange={(val) => onChange("morningRevisionDone", val)}
              label="Morning Session Revision Done"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function DailyPractice({ data, onChange }: DashboardCardsProps) {
  // Targets standard for NEET aspirants
  const bioTarget = 100;
  const phyTarget = 30;
  const chemTarget = 50;

  const bioPct = Math.min(Math.round((data.bioMCQ / bioTarget) * 100), 100);
  const phyPct = Math.min(Math.round((data.phyMCQ / phyTarget) * 100), 100);
  const chemPct = Math.min(Math.round((data.chemMCQ / chemTarget) * 100), 100);

  return (
    <motion.div
      id="daily-practice-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="relative bg-slate-900/50 border border-white/5 rounded-2xl p-5 overflow-hidden flex flex-col justify-between"
    >
      <div>
        <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 flex items-center gap-1.5">
          <BarChart2 className="h-3.5 w-3.5 text-cyan-400" />
          MCQ Sprint Tracker
        </h3>

        <div className="space-y-5">
          {/* Biology MCQ */}
          <div>
            <div className="flex justify-between items-center text-[10px] mb-1.5 font-mono uppercase">
              <span className="text-cyan-400 font-bold">Biology MCQs</span>
              <div className="flex items-center gap-2">
                <input
                  id="bioMCQ"
                  type="number"
                  min="0"
                  value={data.bioMCQ}
                  onChange={(e) => onChange("bioMCQ", parseInt(e.target.value) || 0)}
                  className="w-12 bg-black/40 text-white font-mono text-[11px] text-center rounded border border-white/10 py-0.5 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
                />
                <span className="text-slate-500">/ {bioTarget}</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${bioPct}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-cyan-500" 
              />
            </div>
          </div>

          {/* Physics MCQ */}
          <div>
            <div className="flex justify-between items-center text-[10px] mb-1.5 font-mono uppercase">
              <span className="text-blue-400 font-bold">Physics MCQs</span>
              <div className="flex items-center gap-2">
                <input
                  id="phyMCQ"
                  type="number"
                  min="0"
                  value={data.phyMCQ}
                  onChange={(e) => onChange("phyMCQ", parseInt(e.target.value) || 0)}
                  className="w-12 bg-black/40 text-white font-mono text-[11px] text-center rounded border border-white/10 py-0.5 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all"
                />
                <span className="text-slate-500">/ {phyTarget}</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${phyPct}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-blue-500" 
              />
            </div>
          </div>

          {/* Chemistry MCQ */}
          <div>
            <div className="flex justify-between items-center text-[10px] mb-1.5 font-mono uppercase">
              <span className="text-purple-400 font-bold">Chemistry MCQs</span>
              <div className="flex items-center gap-2">
                <input
                  id="chemMCQ"
                  type="number"
                  min="0"
                  value={data.chemMCQ}
                  onChange={(e) => onChange("chemMCQ", parseInt(e.target.value) || 0)}
                  className="w-12 bg-black/40 text-white font-mono text-[11px] text-center rounded border border-white/10 py-0.5 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-all"
                />
                <span className="text-slate-500">/ {chemTarget}</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${chemPct}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-purple-500" 
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function DisciplineTracker({ data, onChange }: DashboardCardsProps) {
  return (
    <motion.div
      id="discipline-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="relative bg-slate-900/50 border border-white/5 rounded-2xl p-5 overflow-hidden flex flex-col justify-between"
    >
      <div>
        <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
          <div className="w-1 h-3 bg-orange-500" /> Discipline Log
        </h3>

        <div className="space-y-3.5">
          {/* Sleep */}
          <LEDCheckbox 
            id="chk-discipline-sleep"
            checked={data.sleepChecked}
            onChange={(val) => onChange("sleepChecked", val)}
            label="7–8 Hours Sleep"
            sublabel="Required for deep long-term memory consolidation"
          />

          {/* No Social Media */}
          <LEDCheckbox 
            id="chk-discipline-social"
            checked={data.noSocialMedia}
            onChange={(val) => onChange("noSocialMedia", val)}
            label="No Social Media Distractions"
            sublabel="Zero scrolling to maintain attention span & focus"
          />
        </div>
      </div>
    </motion.div>
  );
}

export function ClassTracker({ data, onChange }: DashboardCardsProps) {
  return (
    <motion.div
      id="class-tracker-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="relative bg-slate-900/50 border border-white/5 rounded-2xl p-5 overflow-hidden flex flex-col justify-between"
    >
      {/* BookOpen icon glowing in the background */}
      <div className="absolute -top-3 -right-3 p-4 opacity-5 text-violet-500 pointer-events-none">
        <BookOpen className="h-16 w-16 stroke-[1.5]" />
      </div>

      <div>
        <h4 className="text-cyan-400 font-display font-bold text-xs uppercase tracking-tighter mb-4 flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 font-mono">02 •</span> Institute & Lectures
        </h4>

        <div className="space-y-3">
          <LEDCheckbox 
            id="chk-class-attended"
            checked={data.classAttended}
            onChange={(val) => onChange("classAttended", val)}
            label="Main Lectures Attended"
          />

          <LEDCheckbox 
            id="chk-class-notes"
            checked={data.notesMade}
            onChange={(val) => onChange("notesMade", val)}
            label="Module Notes Completed"
          />

          <LEDCheckbox 
            id="chk-class-doubts"
            checked={data.doubtsMarked}
            onChange={(val) => onChange("doubtsMarked", val)}
            label="Active Doubt Resolution asking"
          />

          <LEDCheckbox 
            id="chk-class-attention"
            checked={data.attentionMaintained}
            onChange={(val) => onChange("attentionMaintained", val)}
            label="Attention Spans Maintained"
          />
        </div>
      </div>
    </motion.div>
  );
}

export function NightRevision({ data, onChange }: DashboardCardsProps) {
  return (
    <motion.div
      id="night-revision-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="relative bg-slate-900/50 border border-white/5 rounded-2xl p-5 overflow-hidden flex flex-col justify-between"
    >
      {/* Moon icon glowing in the background */}
      <div className="absolute -top-3 -right-3 p-4 opacity-5 text-blue-500 pointer-events-none">
        <Moon className="h-16 w-16 stroke-[1.5]" />
      </div>

      <div>
        <h4 className="text-cyan-400 font-display font-bold text-xs uppercase tracking-tighter mb-4 flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 font-mono">03 •</span> Consolidation Phase
        </h4>

        <div className="space-y-3">
          <LEDCheckbox 
            id="chk-night-class-rev"
            checked={data.classRevisionDone}
            onChange={(val) => onChange("classRevisionDone", val)}
            label="Daily Class Notes Revision"
          />

          <LEDCheckbox 
            id="chk-night-morning-rev"
            checked={data.morningTopicsRevised}
            onChange={(val) => onChange("morningTopicsRevised", val)}
            label="Morning Topics Active Recall"
          />

          <LEDCheckbox 
            id="chk-night-error-updated"
            checked={data.errorNotebookUpdated}
            onChange={(val) => onChange("errorNotebookUpdated", val)}
            label="Daily Error Log Updated"
          />

          <LEDCheckbox 
            id="chk-night-light-mcq"
            checked={data.lightMcqsDone}
            onChange={(val) => onChange("lightMcqsDone", val)}
            label="Light Night Review MCQs Done"
          />
        </div>
      </div>
    </motion.div>
  );
}

interface ErrorNotebookProps {
  errors: string;
  setErrors: (val: string) => void;
}

export function ErrorNotebook({ errors, setErrors }: ErrorNotebookProps) {
  return (
    <motion.div
      id="error-notebook-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 flex flex-col h-full min-h-[220px]"
    >
      <h3 className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-1.5">
        <PenTool className="h-3.5 w-3.5 text-red-400 animate-pulse" />
        Critical Error Log
      </h3>
      
      <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-3 text-[11px] font-mono text-slate-400 overflow-hidden relative flex flex-col focus-within:border-cyan-500/40 focus-within:ring-1 focus-within:ring-cyan-500/10 transition-all duration-300">
        <textarea
          id="errors"
          value={errors}
          onChange={(e) => setErrors(e.target.value)}
          placeholder="• Write incorrect questions here...&#10;• Calculate errors in projectile motion Q.12&#10;• Forgot nomenclature rule for ethers"
          className="flex-1 w-full bg-transparent text-slate-300 placeholder-slate-600 focus:outline-none resize-none font-mono text-[11px] leading-relaxed overflow-y-auto"
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 pointer-events-none">
          <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">diagnostics</span>
          <div className="w-1.5 h-3 bg-cyan-500 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}

interface MonthlySectionProps {
  mockCount: number;
  analysisDone: boolean;
  weakTopics: string;
  onChange: <K extends keyof NeetData>(key: K, value: NeetData[K]) => void;
}

export function MonthlySection({ mockCount, analysisDone, weakTopics, onChange }: MonthlySectionProps) {
  return (
    <motion.div
      id="monthlySection"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 flex flex-col gap-4 shadow-xl shadow-cyan-500/5"
    >
      <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
        <Dumbbell className="h-4 w-4 text-amber-400 animate-bounce" />
        📆 Monthly Add-on
      </h3>

      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1.5">
            Mock Test Attempted:
          </label>
          <input
            id="mockCount"
            type="number"
            min="0"
            value={mockCount || ""}
            onChange={(e) => onChange("mockCount", parseInt(e.target.value) || 0)}
            placeholder="0"
            className="w-full bg-black/40 border border-white/5 focus:border-cyan-500/40 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/10 transition-all"
          />
        </div>

        <div className="py-1">
          <LEDCheckbox
            id="analysisDone"
            checked={analysisDone}
            onChange={(val) => onChange("analysisDone", val)}
            label="Mock Analysis Done"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1.5">
            Weak Topics:
          </label>
          <textarea
            id="weakTopics"
            rows={3}
            value={weakTopics}
            onChange={(e) => onChange("weakTopics", e.target.value)}
            placeholder="List your weak concepts here..."
            className="w-full bg-black/40 border border-white/5 focus:border-cyan-500/40 rounded-xl p-3 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/10 transition-all resize-none"
          />
        </div>
      </div>
    </motion.div>
  );
}

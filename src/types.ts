export interface NeetData {
  // Timer state
  studySeconds: number;
  totalHours: string; // From the timer or computed

  // Morning self study
  wakeUpOnTime: boolean;
  bioNcertReading: boolean;
  physicsQuestions: number;
  chemOrganic: boolean;
  chemPhysical: boolean;
  chemInorganic: boolean;
  morningRevisionDone: boolean;

  // Daily Practice
  bioMCQ: number;
  phyMCQ: number;
  chemMCQ: number;

  // Discipline Tracker
  sleepChecked: boolean;
  noSocialMedia: boolean;

  // Class Tracker
  classAttended: boolean;
  notesMade: boolean;
  doubtsMarked: boolean;
  attentionMaintained: boolean;

  // Night Revision
  classRevisionDone: boolean;
  morningTopicsRevised: boolean;
  errorNotebookUpdated: boolean;
  lightMcqsDone: boolean;

  // Error Notebook
  errors: string;

  // Streak counter
  streak?: number;

  // Timestamp of the save
  lastSavedAt?: string;

  // Lock system
  locked?: boolean;

  // Monthly fields
  mockCount?: number;
  analysisDone?: boolean;
  weakTopics?: string;
}

import React, { useState } from 'react';
import {
  ShieldCheck,
  Download,
  Upload,
  Trash2,
  X,
  AlertTriangle,
  FileJson,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import type { UserProfileInput } from './OnboardingModal.tsx';
import type { JournalEntry } from './JournalExplorer.tsx';

interface DataSovereigntyModalProps {
  currentProfile: UserProfileInput;
  onRestoreData: (profile: UserProfileInput, journalEntries: JournalEntry[]) => void;
  onHardReset: () => void;
  onClose: () => void;
}

const JOURNAL_STORAGE_KEY = 'astro_journal_entries_v1';
const PROFILES_STORAGE_KEY = 'astro_saved_profiles_v1';

export const DataSovereigntyModal: React.FC<DataSovereigntyModalProps> = ({
  currentProfile,
  onRestoreData,
  onHardReset,
  onClose,
}) => {
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // 1. Export All to JSON
  const handleExport = () => {
    try {
      let savedProfiles: any[] = [];
      let journalEntries: any[] = [];

      try {
        const rawProfiles = localStorage.getItem(PROFILES_STORAGE_KEY);
        if (rawProfiles) savedProfiles = JSON.parse(rawProfiles);
      } catch (e) {
        console.warn('Could not read saved profiles', e);
      }

      try {
        const rawJournal = localStorage.getItem(JOURNAL_STORAGE_KEY);
        if (rawJournal) journalEntries = JSON.parse(rawJournal);
      } catch (e) {
        console.warn('Could not read journal entries', e);
      }

      const backupData = {
        app: 'MyAstro',
        version: 1,
        exportedAt: new Date().toISOString(),
        currentProfile,
        savedProfiles,
        journalEntries,
        storageSummary: {
          journalCount: journalEntries.length,
          profileCount: savedProfiles.length,
        },
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateTag = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `myastro_backup_${dateTag}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // 2. Import JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || parsed.app !== 'MyAstro') {
          setImportStatus('Invalid backup file: missing MyAstro signature.');
          return;
        }

        const restoredProfile: UserProfileInput = parsed.currentProfile || currentProfile;
        const restoredJournal: JournalEntry[] = Array.isArray(parsed.journalEntries)
          ? parsed.journalEntries
          : [];

        if (Array.isArray(parsed.savedProfiles)) {
          localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(parsed.savedProfiles));
        }

        localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(restoredJournal));

        onRestoreData(restoredProfile, restoredJournal);
        setImportStatus(`Successfully restored ${restoredJournal.length} entries & profiles.`);
      } catch (err: any) {
        setImportStatus(`Failed to parse JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // 3. Hard Reset
  const handleConfirmReset = () => {
    if (resetConfirmation.trim().toUpperCase() === 'RESET') {
      try {
        localStorage.removeItem(JOURNAL_STORAGE_KEY);
        localStorage.removeItem(PROFILES_STORAGE_KEY);
        localStorage.clear();
      } catch (e) {
        console.error('Clear failed', e);
      }
      onHardReset();
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 8, 22, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '540px',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          padding: '24px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal/10 text-teal border border-teal/20">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif">Data Sovereignty & Local Vault</h2>
            <p className="text-xs text-text-muted mt-0.5">
              100% Client-Side. No telemetry, no cloud sync, complete local control.
            </p>
          </div>
        </div>

        {/* Action 1: Export */}
        <div className="p-4 rounded-xl border border-border/60 bg-card-bg/40 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold text-sm flex items-center gap-2">
                <Download className="w-4 h-4 text-teal" />
                Export Local Backup (JSON)
              </div>
              <p className="text-xs text-text-muted mt-1">
                Save an unencrypted, offline snapshot of all saved birth profiles and journal reflections to your device.
              </p>
            </div>
            <button
              onClick={handleExport}
              className="btn btn-outline text-xs flex items-center gap-1.5 py-1.5 px-3 shrink-0"
            >
              <FileJson className="w-4 h-4 text-teal" />
              Download JSON
            </button>
          </div>
        </div>

        {/* Action 2: Import */}
        <div className="p-4 rounded-xl border border-border/60 bg-card-bg/40 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-gold" />
                Restore from Backup (JSON)
              </div>
              <p className="text-xs text-text-muted mt-1">
                Import and merge previously exported profiles and astrological journal entries.
              </p>
            </div>
            <label className="btn btn-outline text-xs flex items-center gap-1.5 py-1.5 px-3 shrink-0 cursor-pointer">
              <Upload className="w-4 h-4 text-gold" />
              Import File
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {importStatus && (
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}
        </div>

        {/* Action 3: Hard Reset */}
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold text-sm text-red-400 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" />
                Hard Reset & Wipe All Records
              </div>
              <p className="text-xs text-text-muted mt-1">
                Permanently wipes all local SQLite tables, saved profiles, and cached ephemeris states from this device.
              </p>
            </div>
            {!showConfirmReset && (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="btn btn-outline border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs py-1.5 px-3 shrink-0"
              >
                Reset App
              </button>
            )}
          </div>

          {showConfirmReset && (
            <div className="pt-3 border-t border-red-500/20 space-y-3">
              <div className="text-xs text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                This action is irreversible. Type <strong>RESET</strong> below to confirm permanent wipe.
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={resetConfirmation}
                  onChange={(e) => setResetConfirmation(e.target.value)}
                  placeholder="Type RESET"
                  className="input text-xs flex-1 font-mono uppercase"
                />
                <button
                  onClick={handleConfirmReset}
                  disabled={resetConfirmation.trim().toUpperCase() !== 'RESET'}
                  className="btn bg-red-600 hover:bg-red-500 text-white text-xs px-4 disabled:opacity-40"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="btn btn-outline text-xs px-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Privacy Assurance Badge */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <ShieldCheck className="w-4 h-4 text-teal" />
          <span>Zero network transmission. Your birth charts remain strictly on this hardware.</span>
        </div>
      </div>
    </div>
  );
};

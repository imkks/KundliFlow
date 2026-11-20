import React, { useState, useMemo } from 'react';
import {
  Bot,
  Copy,
  Check,
  Download,
  X,
  FileCode,
  FileText,
  Sparkles,
  HelpCircle,
  Cpu,
} from 'lucide-react';
import {
  generateLlmDossier,
  type LlmDossierInput,
} from '@astro/engine';

interface LlmDossierModalProps {
  input: LlmDossierInput;
  onClose: () => void;
}

export const LlmDossierModal: React.FC<LlmDossierModalProps> = ({ input, onClose }) => {
  const [activeFormat, setActiveFormat] = useState<'markdown' | 'json'>('markdown');
  const [copied, setCopied] = useState(false);

  const dossier = useMemo(() => {
    return generateLlmDossier(input);
  }, [input]);

  const activeContent = activeFormat === 'markdown'
    ? dossier.markdownPrompt
    : JSON.stringify(dossier.structuredJson, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  const handleDownload = () => {
    const extension = activeFormat === 'markdown' ? 'md' : 'json';
    const mimeType = activeFormat === 'markdown' ? 'text/markdown' : 'application/json';
    const blob = new Blob([activeContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (input.userName || 'native').toLowerCase().replace(/\s+/g, '_');
    link.href = url;
    link.download = `${safeName}_astro_dossier.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          maxWidth: '920px',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-4 bg-card-bg/95">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal/10 text-teal border border-teal/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif">LLM AI Context Dossier</h2>
                <span className="badge badge-teal text-[11px] font-mono">
                  ~{dossier.tokenEstimate.toLocaleString()} tokens
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Pre-computed ground-truth Vedic astrological facts for Claude, Gemini, ChatGPT, or local LLMs.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-card-bg/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Format Bar */}
        <div className="px-5 py-3 border-b border-border/50 bg-card-bg/40 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFormat('markdown')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeFormat === 'markdown'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-card-bg/60 text-text-muted hover:text-text'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Prompt Format (Markdown)
            </button>
            <button
              onClick={() => setActiveFormat('json')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeFormat === 'json'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-card-bg/60 text-text-muted hover:text-text'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Raw Data (JSON)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="btn btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Prompt'}
            </button>
            <button
              onClick={handleDownload}
              className="btn btn-outline text-xs flex items-center gap-1.5 py-1.5 px-3"
            >
              <Download className="w-3.5 h-3.5" />
              Download .{activeFormat === 'markdown' ? 'md' : 'json'}
            </button>
          </div>
        </div>

        {/* Informative Guidance Banner */}
        <div className="px-5 py-2.5 bg-teal/5 border-b border-teal/20 text-xs text-text-muted flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-teal shrink-0 mt-0.5" />
          <span>
            <strong>LLMs excel at synthesis, not trigonometry:</strong> LLMs often hallucinate degrees or dasha dates if asked to calculate a chart from scratch. Pasting this pre-computed dossier provides the model with 100% verified astrological ground-truth, enabling rich and nuanced psychological, career, and life readings.
          </span>
        </div>

        {/* Text Area / Code Viewer */}
        <div className="p-4 flex-1 overflow-y-auto font-mono text-xs leading-relaxed bg-black/40 text-text">
          <pre className="whitespace-pre-wrap select-all font-mono">
            {activeContent}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-border bg-card-bg text-right text-xs text-text-muted">
          Ready to paste into ChatGPT, Claude 3.5 Sonnet, Gemini 1.5 Pro, or DeepSeek
        </div>
      </div>
    </div>
  );
};

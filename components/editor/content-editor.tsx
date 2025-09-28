'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  History,
  HelpCircle,
  Save,
  ChevronDown,
  BookOpen,
  Target,
  Eye,
  RotateCcw
} from 'lucide-react';

type SaveState = 'idle' | 'saving' | 'saved';

interface SectionConfig {
  title: string;
  placeholder: string;
  guidance: string;
  wordTarget?: number;
  emptyGuidance?: string;
  rubric?: string;
}

interface Version {
  id: string;
  timestamp: Date;
  content: string;
  preview: string;
}

interface ContentEditorProps {
  activeSection: string;
  paper: any;
  onUpdate: (paper: any) => void; // kept for compatibility
  onAiResult: (type: string, data: any) => void;
  onSaveStatusChange?: (status: SaveState) => void;
  onAddCitation?: () => void;
}

/** ---- Section presets (same content as you had, trimmed for brevity) ---- */
const sectionContent: Record<string, SectionConfig> = {
  abstract: {
    title: 'Abstract',
    placeholder: 'Write a concise summary of your research (150–250 words)…',
    guidance:
      'Include: purpose, methods, key findings, and conclusions. Keep it under 250 words.',
    wordTarget: 250,
    emptyGuidance:
      'Start with your research purpose, then briefly describe methods, key findings, and conclusions.',
    rubric:
      'A good abstract includes: (1) Clear purpose/question, (2) Method, (3) Key results, (4) Conclusions/implications.'
  },
  'literature-review': {
    title: 'Literature Review',
    placeholder: 'Review and synthesize relevant literature…',
    guidance:
      'Organize by themes, chronologically, or methodologically. Show gaps your research will fill.',
    wordTarget: 1500,
    emptyGuidance:
      'Synthesize existing research by themes, identify patterns, and highlight gaps your study addresses.',
    rubric:
      'Critically analyze sources, identify patterns and contradictions, and clearly establish the research gap.'
  },
  // … keep your other sections (introduction, methods, etc.)
};

export function ContentEditor({
  activeSection,
  paper,
  onUpdate,
  onAiResult,
  onSaveStatusChange,
  onAddCitation
}: ContentEditorProps) {
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveState>('idle');
  const [versions, setVersions] = useState<Version[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null);
  const [showRubric, setShowRubric] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedText, setSelectedText] = useState('');

  const section = sectionContent[activeSection] ?? {
    title: 'Section',
    placeholder: 'Start writing…',
    guidance: 'Write your content here.',
    wordTarget: 500
  };

  /** Utilities */
  const isInsideEditor = (node: Node | null) =>
    !!node && !!editorRef.current && editorRef.current.contains(node);

  const formatTimestamp = (date: Date) =>
    date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  /** ---- Selection capture to restore caret for citation insert ---- */
  useEffect(() => {
    function saveSelection() {
      const sel = window.getSelection && window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (isInsideEditor(range.startContainer)) savedRangeRef.current = range.cloneRange();
    }

    const ed = editorRef.current;
    if (!ed) return;

    ed.addEventListener('keyup', saveSelection);
    ed.addEventListener('mouseup', saveSelection);
    ed.addEventListener('input', saveSelection);

    const onSelChange = () => {
      if (document.activeElement === ed) saveSelection();
    };
    document.addEventListener('selectionchange', onSelChange);

    return () => {
      ed.removeEventListener('keyup', saveSelection);
      ed.removeEventListener('mouseup', saveSelection);
      ed.removeEventListener('input', saveSelection);
      document.removeEventListener('selectionchange', onSelChange);
    };
  }, []);

  /** Focus from parent */
  useEffect(() => {
    const focusHandler = () => editorRef.current?.focus();
    window.addEventListener('editor-focus', focusHandler as any);
    return () => window.removeEventListener('editor-focus', focusHandler as any);
  }, []);

  /** Insert citation event */
  useEffect(() => {
    const handler = (e: any) => {
      const inline = e?.detail?.inline;
      if (!inline || !editorRef.current) return;

      const sel = window.getSelection?.();
      if (savedRangeRef.current && sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }

      const sel2 = window.getSelection?.();
      if (sel2 && sel2.rangeCount > 0 && isInsideEditor(sel2.getRangeAt(0).startContainer)) {
        const range = sel2.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(` ${inline} `));
        sel2.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartAfter(editorRef.current.lastChild as Node);
        newRange.collapse(true);
        sel2.addRange(newRange);
      } else {
        editorRef.current.innerText += ` ${inline}`;
      }

      editorRef.current.focus();
      const sel3 = window.getSelection?.();
      if (sel3 && sel3.rangeCount > 0) savedRangeRef.current = sel3.getRangeAt(0).cloneRange();

      editorRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    };

    window.addEventListener('editor-insert-citation', handler as any);
    return () => window.removeEventListener('editor-insert-citation', handler as any);
  }, []);

  /** Load content & versions for section */
  useEffect(() => {
    if (!paper?.id || !activeSection) return;

    const key = `paper_${paper.id}_section_${activeSection}`;
    const vkey = `paper_${paper.id}_section_${activeSection}_versions`;
    const savedContent = localStorage.getItem(key) ?? '';

    setContent(savedContent);
    setWordCount(savedContent.trim() ? savedContent.trim().split(/\s+/).length : 0);
    if (editorRef.current) editorRef.current.textContent = savedContent;

    const savedVersions = localStorage.getItem(vkey);
    setVersions(
      savedVersions
        ? JSON.parse(savedVersions).map((v: any) => ({ ...v, timestamp: new Date(v.timestamp) }))
        : []
    );
  }, [paper?.id, activeSection]);

  /** Save draft (debounced) */
  const saveDraft = useCallback(
    (sectionId: string, text: string) => {
      if (!paper?.id) return;

      setSaveStatus('saving');
      onSaveStatusChange?.('saving');

      setTimeout(() => {
        const key = `paper_${paper.id}_section_${sectionId}`;
        const vkey = `paper_${paper.id}_section_${sectionId}_versions`;
        localStorage.setItem(key, text);

        if (text.trim().length > 10) {
          const newVersion: Version = {
            id: Date.now().toString(),
            timestamp: new Date(),
            content: text,
            preview: text.trim().slice(0, 60) + (text.trim().length > 60 ? '…' : '')
          };
          const updated = [newVersion, ...versions].slice(0, 10);
          setVersions(updated);
          localStorage.setItem(vkey, JSON.stringify(updated));
        }

        setSaveStatus('saved');
        onSaveStatusChange?.('saved');
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle');
          onSaveStatusChange?.('idle');
        }, 1500);
      }, 250);
    },
    [paper?.id, versions, onSaveStatusChange]
  );

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent || '';
    setContent(newText);
    setWordCount(newText.trim() ? newText.trim().split(/\s+/).length : 0);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveDraft(activeSection, newText), 600);
  };

  const handleManualSave = useCallback(() => {
    const text = editorRef.current?.textContent || content || '';
    saveDraft(activeSection, text);
    toast.success('Saved');
  }, [activeSection, content, saveDraft]);

  /** Keybinding: Ctrl/Cmd+S */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleManualSave]);

  /** Selection text (for suggest citations) */
  const handleTextSelection = () => {
    const sel = window.getSelection();
    setSelectedText(sel?.toString().trim() || '');
  };

  /** Simple rich text via execCommand (kept as-is) */
  const applyCmd = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  /** ---- UI ---- */
  return (
    <div className="h-full flex flex-col">
      {/* Section header (compact) */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                {section.title}
              </h2>
              <DropdownMenu open={showVersions} onOpenChange={setShowVersions}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <History className="w-4 h-4 mr-2" />
                    Versions ({versions.length})
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80">
                  {versions.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 dark:text-slate-400">
                      No versions yet
                    </div>
                  ) : (
                    versions.map(v => (
                      <div
                        key={v.id}
                        className="p-3 border-b last:border-0 border-slate-100 dark:border-slate-700"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              {formatTimestamp(v.timestamp)}
                            </div>
                            <div className="text-sm text-slate-700 dark:text-slate-300 truncate">
                              {v.preview}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setPreviewVersion(v)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                if (!editorRef.current) return;
                                editorRef.current.textContent = v.content;
                                setContent(v.content);
                                setWordCount(v.content.trim().split(/\s+/).length);
                                saveDraft(activeSection, v.content);
                                toast.success('Version restored');
                              }}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setShowRubric(true)}
                    >
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Writing guidelines</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Guidance line (smaller text) */}
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              {section.guidance}{' '}
              {(section.wordTarget ?? 0) > 0 && (
                <span className="text-slate-400 dark:text-slate-500">
                  • Target ~{section.wordTarget} words
                </span>
              )}
            </p>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  Evidence
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('open-add-source'))}>
                  Add sources…
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (!selectedText) return toast.error('Select text first');
                    window.dispatchEvent(
                      new CustomEvent('request-ai', { detail: { task: 'suggest_citations' } })
                    );
                  }}
                >
                  Suggest citations for selection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  Write/Polish
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('request-ai', { detail: { task: 'critique' } }))}>
                  AI Feedback
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('request-ai', { detail: { task: 'rewrite' } }))}>
                  Rewrite
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('request-ai', { detail: { task: 'proofread' } }))}>
                  Proofread
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('request-ai', { detail: { task: 'shorten', wordTarget: 150 } }))}>
                  Shorten → 150
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('request-ai', { detail: { task: 'expand', wordTarget: 300 } }))}>
                  Expand → 300
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" className="h-8" onClick={handleManualSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={onAddCitation}>
              <BookOpen className="w-4 h-4 mr-2" />
              Add Citation
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar inside the editor area — small & tidy */}
      <div className="editor-toolbar flex items-center border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <button className="btn-icon" onClick={() => applyCmd('bold')} aria-label="Bold">
          <Bold className="lucide" />
        </button>
        <button className="btn-icon" onClick={() => applyCmd('italic')} aria-label="Italic">
          <Italic className="lucide" />
        </button>
        <button className="btn-icon" onClick={() => applyCmd('underline')} aria-label="Underline">
          <Underline className="lucide" />
        </button>

        <div className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />

        <button className="btn-icon" onClick={() => applyCmd('justifyLeft')} aria-label="Align Left">
          <AlignLeft className="lucide" />
        </button>
        <button className="btn-icon" onClick={() => applyCmd('justifyCenter')} aria-label="Align Center">
          <AlignCenter className="lucide" />
        </button>
        <button className="btn-icon" onClick={() => applyCmd('justifyRight')} aria-label="Align Right">
          <AlignRight className="lucide" />
        </button>

        <div className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />

        <button className="btn-icon" onClick={() => applyCmd('insertUnorderedList')} aria-label="Bulleted list">
          <List className="lucide" />
        </button>
        <button className="btn-icon" onClick={() => applyCmd('insertOrderedList')} aria-label="Numbered list">
          <ListOrdered className="lucide" />
        </button>
        <button className="btn-icon" onClick={() => applyCmd('formatBlock', 'blockquote')} aria-label="Quote">
          <Quote className="lucide" />
        </button>

        <div className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />

        <button
          className="btn-icon"
          onClick={() => applyCmd('createLink', window.prompt('Enter URL:') || '')}
          aria-label="Insert link"
        >
          <LinkIcon className="lucide" />
        </button>
      </div>

      {/* Editable area */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* gentle hint when empty */}
          {wordCount === 0 && section.emptyGuidance && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200 flex gap-2">
              <Target className="w-4 h-4 mt-0.5" />
              <div>{section.emptyGuidance}</div>
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable
            onInput={handleContentChange}
            onMouseUp={handleTextSelection}
            onKeyUp={handleTextSelection}
            className="min-h-[420px] p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 focus:outline-none leading-[1.7]"
            style={{ fontSize: '15px' }}
            data-placeholder={section.placeholder}
          />
        </div>
      </div>

      {/* Version Preview Modal */}
      <Dialog open={!!previewVersion} onOpenChange={() => setPreviewVersion(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Version Preview</DialogTitle>
            <DialogDescription>
              {previewVersion && `Saved on ${formatTimestamp(previewVersion.timestamp)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
              {previewVersion?.content || ''}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewVersion(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (!previewVersion || !editorRef.current) return;
                editorRef.current.textContent = previewVersion.content;
                setContent(previewVersion.content);
                setWordCount(previewVersion.content.trim().split(/\s+/).length);
                saveDraft(activeSection, previewVersion.content);
                setPreviewVersion(null);
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restore This Version
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rubric Modal */}
      <Dialog open={showRubric} onOpenChange={setShowRubric}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Writing Guidelines: {section.title}
            </DialogTitle>
            <DialogDescription>Best practices and structure</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {section.rubric && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                {section.rubric}
              </div>
            )}
            {(section.wordTarget ?? 0) > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                Aim for approximately {section.wordTarget} words for this section.
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowRubric(false)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

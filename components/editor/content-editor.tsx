'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote, Link as LinkIcon,
  ChevronDown, History, Eye, RotateCcw, HelpCircle,
  Save as SaveIcon, Target, BookOpen, Search, PenTool
} from 'lucide-react';

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
  onUpdate: (paper: any) => void;
  onAiResult: (type: string, data: any) => void;
  onSaveStatusChange?: (status: 'idle' | 'saving' | 'saved') => void;
  onAddCitation?: () => void;
}

const sectionContent: Record<string, SectionConfig> = {
  abstract: {
    title: 'Abstract',
    placeholder: 'Write a concise summary of your research (150-250 words)...',
    guidance: 'Include: purpose, methods, key findings, and conclusions. Keep it under 250 words.',
    wordTarget: 250,
    emptyGuidance: 'Start with your research purpose, then briefly describe methods, key findings, and conclusions.',
    rubric: 'A good abstract includes: (1) purpose/question, (2) brief methods, (3) key findings, (4) conclusions/implications.'
  },
  introduction: {
    title: 'Introduction',
    placeholder: 'Introduce your research topic and establish its significance...',
    guidance: 'Start broad, then narrow to your specific research question. Include background, problem, and objectives.',
    wordTarget: 800,
    emptyGuidance: 'Begin broad, narrow to specific problem, state objectives/research questions.',
    rubric: 'Context → Gap → Objectives → Questions/Hypotheses → Brief approach.'
  },
  'intro-background': {
    title: 'Background',
    placeholder: 'Provide context and background information for your research...',
    guidance: 'Establish the broader context of your research area.',
    wordTarget: 400,
    emptyGuidance: 'Provide essential context and background readers need.',
    rubric: 'Key concepts, past work, state-of-the-art overview.'
  },
  'intro-problem': {
    title: 'Problem Statement',
    placeholder: 'Clearly articulate the problem your research addresses...',
    guidance: 'Define the specific issue or gap your research will address.',
    wordTarget: 300,
    emptyGuidance: 'State the specific gap or problem and why it matters.',
    rubric: 'Be specific, consequential, and scoped.'
  },
  'intro-objectives': {
    title: 'Research Objectives',
    placeholder: 'State your research objectives and hypotheses...',
    guidance: 'List clear, measurable objectives.',
    wordTarget: 200,
    emptyGuidance: 'List 3–5 clear, measurable objectives.',
    rubric: 'SMART objectives.'
  },
  'literature-review': {
    title: 'Literature Review',
    placeholder: 'Review and synthesize relevant literature...',
    guidance: 'Organize by themes/chronology/method. Show gaps.',
    wordTarget: 1500,
    emptyGuidance: 'Synthesize by themes, identify patterns & gaps.',
    rubric: 'Themes → Patterns/contradictions → Gap you’ll fill.'
  },
  methodology: {
    title: 'Methodology',
    placeholder: 'Describe your research methods and approach...',
    guidance: 'Design, participants, procedures, analysis.',
    wordTarget: 1000,
    emptyGuidance: 'Design, sample, instruments, procedures, analysis.',
    rubric: 'Enough detail for replication.'
  },
  results: {
    title: 'Results',
    placeholder: 'Present your findings objectively...',
    guidance: 'Report results, not interpretation.',
    wordTarget: 800,
    emptyGuidance: 'Tables/figures/statistics; objective reporting.',
    rubric: 'Organize by RQs/hypotheses.'
  },
  discussion: {
    title: 'Discussion',
    placeholder: 'Interpret your results and discuss their implications...',
    guidance: 'Interpret, compare with literature, implications.',
    wordTarget: 1200,
    emptyGuidance: 'Interpretation, comparison, implications, limits, future work.',
    rubric: 'Tell the story of what results mean.'
  },
  conclusion: {
    title: 'Conclusion',
    placeholder: 'Summarize your research and its contributions...',
    guidance: 'Summarize main findings, contributions, future work.',
    wordTarget: 400,
    emptyGuidance: 'Concise wrap up, contributions, next steps.',
    rubric: 'No new claims; crisp summary.'
  },
  references: {
    title: 'References',
    placeholder: 'Your references will appear here automatically...',
    guidance: 'References are generated from your sources.',
    wordTarget: 0,
    emptyGuidance: 'References will be generated from the citation manager.',
    rubric: 'Consistent style; every in-text has a ref.'
  }
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
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiTask, setAiTask] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [versions, setVersions] = useState<Version[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [showRubric, setShowRubric] = useState(false);

  const section = sectionContent[activeSection] ?? {
    title: 'Section',
    placeholder: 'Start writing...',
    guidance: 'Write your content here.',
    wordTarget: 500,
    emptyGuidance: 'Start writing your content here.',
    rubric: 'Write clear, well-structured content.'
  };

  /* ---------- caret save/restore so inline citations go where expected ---------- */
  function isInsideEditor(node: Node | null) {
    if (!node || !editorRef.current) return false;
    return editorRef.current.contains(node);
  }

  useEffect(() => {
    function saveSelection() {
      const sel = window.getSelection?.();
      if (sel && sel.rangeCount > 0) {
        const r = sel.getRangeAt(0);
        if (isInsideEditor(r.startContainer)) {
          savedRangeRef.current = r.cloneRange();
        }
      }
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

  useEffect(() => {
    const focusHandler = () => editorRef.current?.focus();
    window.addEventListener('editor-focus', focusHandler as any);
    return () => window.removeEventListener('editor-focus', focusHandler as any);
  }, []);

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
        if (editorRef.current.lastChild) {
          newRange.setStartAfter(editorRef.current.lastChild);
          newRange.collapse(true);
          sel2.addRange(newRange);
        }
      } else {
        editorRef.current.innerText += ` ${inline}`;
      }

      editorRef.current.focus();
      const sel3 = window.getSelection?.();
      if (sel3 && sel3.rangeCount > 0) {
        savedRangeRef.current = sel3.getRangeAt(0).cloneRange();
      }
      const event = new Event('input', { bubbles: true });
      editorRef.current?.dispatchEvent(event);
    };
    window.addEventListener('editor-insert-citation', handler as any);
    return () => window.removeEventListener('editor-insert-citation', handler as any);
  }, []);

  /* ---------- load/save per-section ---------- */
  useEffect(() => {
    if (!paper?.id || !activeSection) return;

    const savedContent = localStorage.getItem(`paper_${paper.id}_section_${activeSection}`);
    const text = savedContent ?? '';
    setContent(text);
    if (editorRef.current) {
      editorRef.current.textContent = text;
    }
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);

    const savedVersions = localStorage.getItem(`paper_${paper.id}_section_${activeSection}_versions`);
    if (savedVersions) {
      const parsed = JSON.parse(savedVersions).map((v: any) => ({ ...v, timestamp: new Date(v.timestamp) })) as Version[];
      setVersions(parsed);
    } else {
      setVersions([]);
    }
  }, [paper?.id, activeSection]);

  const saveDraft = useCallback((sectionId: string, text: string) => {
    if (!paper?.id) return;

    setSaveStatus('saving');
    onSaveStatusChange?.('saving');

    setTimeout(() => {
      localStorage.setItem(`paper_${paper.id}_section_${sectionId}`, text);

      if (text.trim().length > 10) {
        const newVersion: Version = {
          id: Date.now().toString(),
          timestamp: new Date(),
          content: text,
          preview: text.trim().slice(0, 60) + (text.trim().length > 60 ? '…' : '')
        };
        const updated = [newVersion, ...(versions ?? [])].slice(0, 10);
        setVersions(updated);
        localStorage.setItem(
          `paper_${paper.id}_section_${sectionId}_versions`,
          JSON.stringify(updated)
        );
      }

      setSaveStatus('saved');
      onSaveStatusChange?.('saved');
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
        onSaveStatusChange?.('idle');
      }, 1500);
    }, 300);
  }, [paper?.id, versions, onSaveStatusChange]);

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent || '';
    setContent(newText);
    setWordCount(newText.trim() ? newText.trim().split(/\s+/).length : 0);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft(activeSection, newText);
    }, 800);
  };

  const handleRestoreVersion = (v: Version) => {
    if (!editorRef.current) return;
    editorRef.current.textContent = v.content;
    setContent(v.content);
    setWordCount(v.content.trim() ? v.content.trim().split(/\s+/).length : 0);
    saveDraft(activeSection, v.content);
    setShowVersions(false);
    setPreviewVersion(null);
    toast.success('Version restored');
  };

  const handleTextSelection = () => {
    const s = window.getSelection?.();
    setSelectedText(s?.toString().trim() || '');
  };

  const handleManualSave = useCallback(() => {
    const text = editorRef.current?.textContent || content || '';
    saveDraft(activeSection, text);
    toast.success('Changes saved');
  }, [activeSection, content, saveDraft]);

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

  /* ---------- AI actions ---------- */
  const getCurrentSectionText = () => editorRef.current?.textContent || content || '';

  const handleAiAction = async (task: string, wordTarget?: number) => {
    const sectionText = getCurrentSectionText();

    if (!sectionText.trim() && !['rqs', 'hypotheses', 'contributions', 'suggest_citations'].includes(task)) {
      toast.error('Please write some content first.');
      return;
    }

    setIsAiLoading(true);
    setAiTask(task);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task,
          sectionText,
          wordTarget,
          field: paper?.topic || 'research',
          notes: paper?.description || ''
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI request failed');

      if (
        ['rewrite', 'proofread', 'shorten', 'expand', 'bullets_to_paragraph', 'paragraph_to_bullets'].includes(task) &&
        data.revised
      ) {
        if (editorRef.current) {
          editorRef.current.textContent = data.revised;
          setContent(data.revised);
          setWordCount(data.revised.trim().split(/\s+/).length);
          toast.success(`Content ${task} complete`);
        }
      } else {
        onAiResult(task, data);
        toast.success('AI analysis finished');
      }
    } catch (err) {
      console.error(err);
      toast.error('AI action failed. Please try again.');
    } finally {
      setIsAiLoading(false);
      setAiTask(null);
    }
  };

  /* ---------- Formatting toolbar ---------- */
  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const formatTimestamp = (d: Date) =>
    d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  /* ================================= RENDER ================================= */

  return (
    <div className="h-full flex flex-col">
      {/* Section title + actions (already sticky in your layout at 64px). Keep as-is. */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-16 z-20">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center flex-wrap gap-3">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{section.title}</h2>

              {/* Word count */}
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <span className="font-medium">{wordCount}</span>
                {(section.wordTarget ?? 0) > 0 && (
                  <span className="text-slate-400 dark:text-slate-500">/{section.wordTarget}</span>
                )}
                <span className="ml-1 text-slate-400 dark:text-slate-500">words</span>
              </div>

              {/* Versions */}
              <DropdownMenu open={showVersions} onOpenChange={setShowVersions}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={versions.length === 0}>
                    <History className="w-4 h-4 mr-2" />
                    Versions ({versions.length})
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80">
                  {versions.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 dark:text-slate-400">No versions yet</div>
                  ) : (
                    versions.map((v) => (
                      <div key={v.id} className="p-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              {formatTimestamp(v.timestamp)}
                            </div>
                            <div className="text-sm text-slate-700 dark:text-slate-300 truncate">{v.preview}</div>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setPreviewVersion(v)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleRestoreVersion(v)}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Help */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setShowRubric(true)}
                    >
                      <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Writing guidelines</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{section.guidance}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-600 dark:text-slate-300 hidden md:block">
              {saveStatus === 'saving' && <span className="text-blue-600 dark:text-blue-400">Saving…</span>}
              {saveStatus === 'saved' && <span className="text-emerald-600 dark:text-emerald-400">Saved</span>}
            </div>

            {/* Ideate */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isAiLoading}>
                  <Search className="w-4 h-4 mr-2" />
                  Evidence
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAiAction('suggest_citations')}>Suggest Citations</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAiAction('synthesize_sources')}>Synthesize 3–5 Sources</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAiAction('spot_gaps')}>Spot Gaps/Contradictions</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isAiLoading}>
                  <PenTool className="w-4 h-4 mr-2" />
                  Write/Polish
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAiAction('critique')}>AI Feedback</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAiAction('rewrite')}>Rewrite</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAiAction('proofread')}>Proofread</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAiAction('shorten', 150)}>Shorten to 150 words</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAiAction('expand', 300)}>Expand to 300 words</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAiAction('bullets_to_paragraph')}>Bullets → Paragraph</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAiAction('paragraph_to_bullets')}>Paragraph → Bullets</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={handleManualSave}>
              <SaveIcon className="w-4 h-4 mr-2" />
              Save
            </Button>

            <Button variant="outline" size="sm" onClick={onAddCitation}>
              <BookOpen className="w-4 h-4 mr-2" />
              Add Citation
            </Button>
          </div>
        </div>

        {isAiLoading && (
          <div className="mt-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
              Processing {aiTask}…
            </div>
          </div>
        )}
      </div>

      {/* ===== Sticky Formatting Toolbar (uses CSS var offset) ===== */}
      <div
        className="px-4 sm:px-6 py-2 border-b border-slate-200 dark:border-slate-700
                   bg-slate-50 dark:bg-slate-800/50 sticky z-30"
        style={{ top: 'var(--editor-sticky-offset)' }}
      >
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <Button variant="ghost" size="sm" onClick={() => exec('bold')}>
            <Bold className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => exec('italic')}>
            <Italic className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => exec('underline')}>
            <Underline className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-2 hidden sm:block" />

          <Button variant="ghost" size="sm" onClick={() => exec('justifyLeft')}>
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => exec('justifyCenter')}>
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => exec('justifyRight')}>
            <AlignRight className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-2 hidden sm:block" />

          <Button variant="ghost" size="sm" onClick={() => exec('insertUnorderedList')}>
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => exec('insertOrderedList')}>
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => exec('formatBlock', 'blockquote')}>
            <Quote className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-2 hidden sm:block" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = window.prompt('Enter URL:') || '';
              if (url) exec('createLink', url);
            }}
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ===== Editor Area ===== */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full">
          {wordCount === 0 && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Getting Started with {section.title}
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">{section.emptyGuidance}</p>
                </div>
              </div>
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable
            className="min-h-[500px] p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm
                       border border-slate-200 dark:border-slate-700 focus:outline-none
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 leading-[1.75]"
            onInput={handleContentChange}
            onMouseUp={handleTextSelection}
            onKeyUp={handleTextSelection}
            style={{ fontSize: '16px', lineHeight: '1.75', color: 'inherit' }}
            data-placeholder={section.placeholder}
          />

          {/* Tips row */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center mb-2">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h4 className="font-medium text-slate-900 dark:text-white">Writing Tip</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Use clear, concise language. Each paragraph should focus on one idea.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div className="flex items-center mb-2">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-2" />
                <h4 className="font-medium text-slate-900 dark:text-white">Citation Reminder</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Support your arguments with credible sources. Add citations as you write.
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center mb-2">
                <RotateCcw className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                <h4 className="font-medium text-slate-900 dark:text-white">Auto-Save</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Your work auto-saves. Use Ctrl/Cmd-S anytime to save on demand.
              </p>
              {selectedText && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/ai', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          task: 'suggest_citations',
                          sectionText: selectedText,
                          field: paper?.topic || 'research'
                        })
                      });
                      const data = await response.json();
                      if (!response.ok) throw new Error(data.error || 'Failed');
                      onAiResult('suggest_citations', data);
                      toast.success(`Found ${data.citations?.length || 0} suggestions`);
                    } catch {
                      toast.error('Failed to suggest citations for selection');
                    }
                  }}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Suggest Citations for Selection
                </Button>
              )}
            </div>
          </div>
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
            <Button variant="outline" onClick={() => setPreviewVersion(null)}>Close</Button>
            <Button onClick={() => previewVersion && handleRestoreVersion(previewVersion)}>
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
            <DialogTitle className="flex items-center">
              <HelpCircle className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Writing Guidelines: {section.title}
            </DialogTitle>
            <DialogDescription>Best practices & structure</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h4 className="font-medium text-slate-900 dark:text-white mb-2">Structure & Content</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{section.rubric}</p>
            </div>
            {(section.wordTarget ?? 0) > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Target Length</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Aim for approximately {section.wordTarget} words.
                </p>
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

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
  ChevronDown, History, Eye, RotateCcw,
  HelpCircle, Target, Save as SaveIcon, Search, PenTool, BookOpen
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

/* -------- Section copy (unchanged) -------- */
const sectionContent: Record<string, SectionConfig> = {
  abstract: {
    title: 'Abstract',
    placeholder: 'Write a concise summary of your research (150-250 words)...',
    guidance: 'Include: purpose, methods, key findings, and conclusions. Keep it under 250 words.',
    wordTarget: 250,
    emptyGuidance: 'Start with your research purpose, then briefly describe methods, key findings, and conclusions.',
    rubric: 'A good abstract includes: (1) Clear research purpose/question, (2) Brief methodology, (3) Key findings/results, (4) Main conclusions/implications. Keep it concise and self-contained.'
  },
  introduction: {
    title: 'Introduction',
    placeholder: 'Introduce your research topic and establish its significance...',
    guidance: 'Start broad, then narrow to your specific research question. Include background, problem statement, and objectives.',
    wordTarget: 800,
    emptyGuidance: 'Begin with broad context, narrow to your specific problem, state objectives and research questions.',
    rubric: 'Structure: (1) Broad context and importance, (2) Specific problem/gap, (3) Research objectives, (4) Research questions/hypotheses, (5) Brief overview of approach.'
  },
  'intro-background': {
    title: 'Background',
    placeholder: 'Provide context and background information for your research...',
    guidance: 'Establish the broader context of your research area.',
    wordTarget: 400,
    emptyGuidance: 'Provide essential context and background that readers need to understand your research.',
    rubric: 'Cover key concepts, historical context, and current state of knowledge in your research area.'
  },
  'intro-problem': {
    title: 'Problem Statement',
    placeholder: 'Clearly articulate the problem your research addresses...',
    guidance: 'Define the specific issue or gap your research will address.',
    wordTarget: 300,
    emptyGuidance: 'Clearly define the specific problem, gap, or question your research addresses.',
    rubric: 'Be specific about what problem exists, why it matters, and what gap your research fills.'
  },
  'intro-objectives': {
    title: 'Research Objectives',
    placeholder: 'State your research objectives and hypotheses...',
    guidance: 'List clear, measurable objectives for your study.',
    wordTarget: 200,
    emptyGuidance: 'List 3-5 clear, measurable objectives that your research aims to achieve.',
    rubric: 'Objectives should be specific, measurable, achievable, relevant, and time-bound (SMART).'
  },
  'literature-review': {
    title: 'Literature Review',
    placeholder: 'Review and synthesize relevant literature...',
    guidance: 'Organize by themes, chronologically, or methodologically. Show gaps your research will fill.',
    wordTarget: 1500,
    emptyGuidance: 'Synthesize existing research by themes, identify patterns, and highlight gaps your study addresses.',
    rubric: 'Organize by themes or chronology. Critically analyze sources, identify patterns and contradictions, and clearly establish the gap your research fills.'
  },
  methodology: {
    title: 'Methodology',
    placeholder: 'Describe your research methods and approach...',
    guidance: 'Be detailed enough for replication. Include design, participants, procedures, and analysis methods.',
    wordTarget: 1000,
    emptyGuidance: 'Specify research design, participants/sample, data collection procedures, and analysis methods.',
    rubric: 'Include: (1) Research design and rationale, (2) Participants/sample, (3) Materials/instruments, (4) Procedures, (5) Data analysis plan. Be detailed enough for replication.'
  },
  results: {
    title: 'Results',
    placeholder: 'Present your findings objectively...',
    guidance: 'Report results without interpretation. Use tables, figures, and statistical analysis.',
    wordTarget: 800,
    emptyGuidance: 'Present findings objectively with tables, figures, and statistical results. No interpretation here.',
    rubric: 'Report findings objectively without interpretation. Use clear tables/figures, report statistical tests, and organize by research questions.'
  },
  discussion: {
    title: 'Discussion',
    placeholder: 'Interpret your results and discuss their implications...',
    guidance: 'Explain what your results mean, compare with existing literature, and discuss implications.',
    wordTarget: 1200,
    emptyGuidance: 'Interpret results, compare with existing literature, discuss implications and limitations.',
    rubric: 'Structure: (1) Interpretation of key findings, (2) Comparison with existing literature, (3) Implications for theory/practice, (4) Limitations, (5) Future research directions.'
  },
  conclusion: {
    title: 'Conclusion',
    placeholder: 'Summarize your research and its contributions...',
    guidance: 'Summarize key findings, contributions to knowledge, and suggestions for future research.',
    wordTarget: 400,
    emptyGuidance: 'Summarize key findings, state contributions to knowledge, and suggest future research directions.',
    rubric: 'Concisely summarize main findings, highlight contributions to knowledge, and suggest specific directions for future research.'
  },
  references: {
    title: 'References',
    placeholder: 'Your references will appear here automatically...',
    guidance: 'References are generated from your sources. Use proper citation format.',
    wordTarget: 0,
    emptyGuidance: 'References will be automatically generated from your citation manager.',
    rubric: 'Follow consistent citation style (APA, MLA, etc.). Ensure all in-text citations have corresponding references.'
  }
};

export function ContentEditor({
  activeSection, paper, onUpdate, onAiResult, onSaveStatusChange, onAddCitation
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

  const section = sectionContent[activeSection] || {
    title: 'Section',
    placeholder: 'Start writing...',
    guidance: 'Write your content here.',
    wordTarget: 500,
    emptyGuidance: 'Start writing your content here.',
    rubric: 'Write clear, well-structured content for this section.'
  };

  /* ---------- caret save/restore + citation insert (unchanged logic) ---------- */
  const isInsideEditor = (node: Node | null) =>
    !!node && !!editorRef.current && editorRef.current.contains(node);

  useEffect(() => {
    function saveSelection() {
      const sel = window.getSelection?.();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (isInsideEditor(range.startContainer)) {
          savedRangeRef.current = range.cloneRange();
        }
      }
    }
    const ed = editorRef.current;
    if (!ed) return;
    ed.addEventListener('keyup', saveSelection);
    ed.addEventListener('mouseup', saveSelection);
    ed.addEventListener('input', saveSelection);
    const onSelChange = () => { if (document.activeElement === ed) saveSelection(); };
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
        const nr = document.createRange();
        if (editorRef.current.lastChild) {
          nr.setStartAfter(editorRef.current.lastChild);
          nr.collapse(true);
          sel2.addRange(nr);
        }
      } else {
        editorRef.current.innerText += ` ${inline}`;
      }

      editorRef.current.focus();
      const sel3 = window.getSelection?.();
      if (sel3 && sel3.rangeCount > 0) {
        savedRangeRef.current = sel3.getRangeAt(0).cloneRange();
      }
      const evt = new Event('input', { bubbles: true });
      editorRef.current?.dispatchEvent(evt);
    };
    window.addEventListener('editor-insert-citation', handler as any);
    return () => window.removeEventListener('editor-insert-citation', handler as any);
  }, []);

  /* ---------- load content & versions ---------- */
  useEffect(() => {
    if (!paper?.id || !activeSection) return;
    const savedContent = localStorage.getItem(`paper_${paper.id}_section_${activeSection}`) || '';
    setContent(savedContent);
    editorRef.current && (editorRef.current.textContent = savedContent);
    setWordCount(savedContent.trim() ? savedContent.trim().split(/\s+/).length : 0);

    const savedVersions = localStorage.getItem(`paper_${paper.id}_section_${activeSection}_versions`);
    if (savedVersions) {
      const parsed = JSON.parse(savedVersions).map((v: any) => ({ ...v, timestamp: new Date(v.timestamp) }));
      setVersions(parsed);
    } else {
      setVersions([]);
    }
  }, [paper?.id, activeSection]);

  /* ---------- saving ---------- */
  const saveDraft = useCallback((sectionId: string, text: string) => {
    if (!paper?.id) return;
    setSaveStatus('saving'); onSaveStatusChange?.('saving');

    setTimeout(() => {
      localStorage.setItem(`paper_${paper.id}_section_${sectionId}`, text);

      if (text.trim().length > 10) {
        const newVersion: Version = {
          id: Date.now().toString(),
          timestamp: new Date(),
          content: text,
          preview: text.trim().slice(0, 60) + (text.trim().length > 60 ? '...' : '')
        };
        const next = [newVersion, ...versions].slice(0, 10);
        setVersions(next);
        localStorage.setItem(`paper_${paper.id}_section_${sectionId}_versions`, JSON.stringify(next));
      }

      setSaveStatus('saved'); onSaveStatusChange?.('saved');
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle'); onSaveStatusChange?.('idle');
      }, 1500);
    }, 250);
  }, [paper?.id, versions, onSaveStatusChange]);

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || '';
    setContent(text);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveDraft(activeSection, text), 600);
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

  const handleManualSave = useCallback(() => {
    const text = editorRef.current?.textContent || content || '';
    saveDraft(activeSection, text);
    toast.success('Changes saved');
  }, [activeSection, content, saveDraft]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleManualSave(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleManualSave]);

  const setSelectedFromWindow = () => {
    const sel = window.getSelection(); setSelectedText(sel?.toString().trim() || '');
  };

  /* ---------- AI actions (unchanged) ---------- */
  const getCurrentSectionText = () => editorRef.current?.textContent || content || '';
  const handleAiAction = async (task: string, wordTarget?: number) => {
    const sectionText = getCurrentSectionText();
    const canRunWithoutText = ['rqs', 'hypotheses', 'contributions', 'suggest_citations'].includes(task);
    if (!sectionText.trim() && !canRunWithoutText) {
      toast.error('Please write some content first.'); return;
    }
    setIsAiLoading(true); setAiTask(task);
    try{
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          task, sectionText, wordTarget,
          field: paper?.topic || 'research',
          notes: paper?.description || ''
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI request failed');

      if (['rewrite','proofread','shorten','expand','bullets_to_paragraph','paragraph_to_bullets'].includes(task) && data.revised){
        if (editorRef.current){
          editorRef.current.textContent = data.revised;
          setContent(data.revised);
          setWordCount(data.revised.trim().split(/\s+/).length);
          toast.success('Content updated');
        }
      } else {
        onAiResult(task, data);
        toast.success('AI results ready');
      }
    }catch(err){
      console.error(err); toast.error('AI action failed.');
    }finally{
      setIsAiLoading(false); setAiTask(null);
    }
  };

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const formatTimestamp = (d: Date) =>
    d.toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });

  /* ---------- Render ---------- */
  return (
    <div className="h-full flex flex-col text-[0.95rem]">
      {/* Section header (compact) */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-16 z-30">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white truncate">{section.title}</h2>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-medium">{wordCount}</span>
                {(section.wordTarget ?? 0) > 0 && <span className="text-slate-400 dark:text-slate-500">/{section.wordTarget}</span>}
                <span className="ml-1 text-slate-400 dark:text-slate-500">words</span>
              </div>

              {/* Versions */}
              <DropdownMenu open={showVersions} onOpenChange={setShowVersions}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-8 px-2 text-xs">
                    <History className="w-4 h-4 mr-1" />
                    Versions ({versions.length})
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80">
                  {versions.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 dark:text-slate-400">No versions yet</div>
                  ) : versions.map(v => (
                    <div key={v.id} className="p-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{formatTimestamp(v.timestamp)}</div>
                          <div className="text-sm text-slate-700 dark:text-slate-300 truncate">{v.preview}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setPreviewVersion(v)}>
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleRestoreVersion(v)}>
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Help */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Writing guidelines for {section.title}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <p className="text-[0.9rem] text-slate-600 dark:text-slate-300 mt-1">
              {section.guidance}
            </p>
          </div>

          {/* Right: AI menus + Save + Add Citation (compact) */}
          <div className="flex items-center gap-2">
            {/* Evidence */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-8 px-2 text-xs">
                  <Search className="w-4 h-4 mr-1" />
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

            {/* Write/Polish */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-8 px-2 text-xs">
                  <PenTool className="w-4 h-4 mr-1" />
                  Write/Polish
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAiAction('critique')}>AI Feedback</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAiAction('rewrite')}>Rewrite</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAiAction('proofread')}>Proofread</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAiAction('shorten', 150)}>Shorten to 150</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAiAction('expand', 300)}>Expand to 300</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAiAction('bullets_to_paragraph')}>Bullets → Paragraph</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAiAction('paragraph_to_bullets')}>Paragraph → Bullets</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" className="h-8 px-2 text-xs" onClick={handleManualSave}>
              <SaveIcon className="w-4 h-4 mr-1" /> Save
            </Button>

            <Button variant="outline" className="h-8 px-2 text-xs" onClick={onAddCitation}>
              <BookOpen className="w-4 h-4 mr-1" /> Add Citation
            </Button>
          </div>
        </div>

        {isAiLoading && (
          <div className="mt-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <div className="flex items-center text-xs text-blue-700 dark:text-blue-300">
              <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </div>
          </div>
        )}
      </div>

      {/* Toolbar (compact, sticky) */}
      <div className="editor-toolbar sticky top-[calc(4rem+1px)] z-20 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center">
          <Button variant="ghost" className="btn-compact" onClick={() => exec('bold')}>
            <Bold />
          </Button>
          <Button variant="ghost" className="btn-compact" onClick={() => exec('italic')}>
            <Italic />
          </Button>
          <Button variant="ghost" className="btn-compact" onClick={() => exec('underline')}>
            <Underline />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-2" />

          <Button variant="ghost" className="btn-compact" onClick={() => exec('justifyLeft')}>
            <AlignLeft />
          </Button>
          <Button variant="ghost" className="btn-compact" onClick={() => exec('justifyCenter')}>
            <AlignCenter />
          </Button>
          <Button variant="ghost" className="btn-compact" onClick={() => exec('justifyRight')}>
            <AlignRight />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-2" />

          <Button variant="ghost" className="btn-compact" onClick={() => exec('insertUnorderedList')}>
            <List />
          </Button>
          <Button variant="ghost" className="btn-compact" onClick={() => exec('insertOrderedList')}>
            <ListOrdered />
          </Button>
          <Button variant="ghost" className="btn-compact" onClick={() => exec('formatBlock', 'blockquote')}>
            <Quote />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-2" />

          <Button
            variant="ghost"
            className="btn-compact"
            onClick={() => exec('createLink', prompt('Enter URL:') || '')}
          >
            <LinkIcon />
          </Button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto w-full">
          {/* Empty guidance */}
          {wordCount === 0 && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Getting Started with {section.title}</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">{section.emptyGuidance}</p>
                </div>
              </div>
            </div>
          )}

          {/* ContentEditable */}
          <div
            ref={editorRef}
            contentEditable
            className="editor-area editor-content-padding min-h-[420px] p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onInput={handleContentChange}
            onMouseUp={setSelectedFromWindow}
            onKeyUp={setSelectedFromWindow}
            data-placeholder={section.placeholder}
          />

          {/* Tips row – compact */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-[0.9rem]">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <div className="font-medium mb-1 text-slate-900 dark:text-white">Writing Tip</div>
              <p className="text-slate-600 dark:text-slate-300">Use clear, concise language. Each paragraph should focus on one idea.</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded">
              <div className="font-medium mb-1 text-slate-900 dark:text-white">Citation Reminder</div>
              <p className="text-slate-600 dark:text-slate-300">Support your arguments with credible sources. Add citations as you write.</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
              <div className="font-medium mb-1 text-slate-900 dark:text-white">Auto-Save</div>
              <p className="text-slate-600 dark:text-slate-300">Your work auto-saves. Press <kbd>Ctrl/Cmd+S</kbd> anytime.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Version Preview */}
      <Dialog open={!!previewVersion} onOpenChange={() => setPreviewVersion(null)}>
        <DialogContent className="sm:max-w-[680px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Version Preview</DialogTitle>
            <DialogDescription>
              {previewVersion && `Saved on ${formatTimestamp(previewVersion.timestamp)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800 rounded">
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
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <HelpCircle className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Writing Guidelines: {section.title}
            </DialogTitle>
            <DialogDescription>Best practices and structure</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
              <h4 className="font-medium text-slate-900 dark:text-white mb-1">Structure & Content</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{section.rubric}</p>
            </div>
            {(section.wordTarget ?? 0) > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Target Length</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Aim for approximately {section.wordTarget} words for this section.
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

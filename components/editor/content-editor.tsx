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

/* --- types & section config (unchanged) --- */
interface SectionConfig { title: string; placeholder: string; guidance: string; wordTarget?: number; emptyGuidance?: string; rubric?: string; }
interface Version { id: string; timestamp: Date; content: string; preview: string; }
interface ContentEditorProps {
  activeSection: string; paper: any; onUpdate: (paper: any) => void;
  onAiResult: (type: string, data: any) => void;
  onSaveStatusChange?: (status: 'idle'|'saving'|'saved') => void;
  onAddCitation?: () => void;
}

const sectionContent: Record<string, SectionConfig> = {
  abstract: {
    title: 'Abstract',
    placeholder: 'Write a concise summary of your research (150-250 words)...',
    guidance: 'Include: purpose, methods, key findings, and conclusions. Keep it under 250 words.',
    wordTarget: 250,
    emptyGuidance: 'Start with your research purpose, then briefly describe methods, key findings, and conclusions.',
    rubric: 'A good abstract includes: (1) Clear research purpose/question, (2) Brief methodology, (3) Key findings/results, (4) Main conclusions/implications.'
  },
  /* … keep your other sections … */
  introduction: { title:'Introduction', placeholder:'', guidance:'Start broad, then narrow…', wordTarget:800, emptyGuidance:'', rubric:'' },
  'intro-background': { title:'Background', placeholder:'', guidance:'', wordTarget:400, emptyGuidance:'', rubric:'' },
  'intro-problem': { title:'Problem Statement', placeholder:'', guidance:'', wordTarget:300, emptyGuidance:'', rubric:'' },
  'intro-objectives': { title:'Research Objectives', placeholder:'', guidance:'', wordTarget:200, emptyGuidance:'', rubric:'' },
  'literature-review': { title:'Literature Review', placeholder:'', guidance:'Organize by themes…', wordTarget:1500, emptyGuidance:'', rubric:'' },
  methodology: { title:'Methodology', placeholder:'', guidance:'', wordTarget:1000, emptyGuidance:'', rubric:'' },
  results: { title:'Results', placeholder:'', guidance:'', wordTarget:800, emptyGuidance:'', rubric:'' },
  discussion: { title:'Discussion', placeholder:'', guidance:'', wordTarget:1200, emptyGuidance:'', rubric:'' },
  conclusion: { title:'Conclusion', placeholder:'', guidance:'', wordTarget:400, emptyGuidance:'', rubric:'' },
  references: { title:'References', placeholder:'', guidance:'', wordTarget:0, emptyGuidance:'', rubric:'' }
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

  const section = sectionContent[activeSection] || {
    title: 'Section', placeholder: 'Start writing…', guidance: 'Write your content here.'
  };

  /* --- selection & citation insertion (unchanged) --- */
  const isInsideEditor = (node: Node | null) => !!node && !!editorRef.current && editorRef.current.contains(node);
  useEffect(() => {
    function saveSelection() {
      const sel = window.getSelection?.();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (isInsideEditor(range.startContainer)) savedRangeRef.current = range.cloneRange();
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
    const handler = (e: any) => {
      const inline = e?.detail?.inline;
      if (!inline || !editorRef.current) return;
      const sel = window.getSelection?.();
      if (savedRangeRef.current && sel) { sel.removeAllRanges(); sel.addRange(savedRangeRef.current); }
      const sel2 = window.getSelection?.();
      if (sel2 && sel2.rangeCount > 0 && isInsideEditor(sel2.getRangeAt(0).startContainer)) {
        const range = sel2.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(` ${inline} `));
      } else {
        editorRef.current.innerText += ` ${inline}`;
      }
      const evt = new Event('input', { bubbles: true });
      editorRef.current?.dispatchEvent(evt);
      editorRef.current?.focus();
    };
    window.addEventListener('editor-insert-citation', handler as any);
    return () => window.removeEventListener('editor-insert-citation', handler as any);
  }, []);

  /* --- load/save (unchanged) --- */
  useEffect(() => {
    if (!paper?.id || !activeSection) return;
    const saved = localStorage.getItem(`paper_${paper.id}_section_${activeSection}`) || '';
    setContent(saved);
    if (editorRef.current) editorRef.current.textContent = saved;
    setWordCount(saved.trim() ? saved.trim().split(/\s+/).length : 0);

    const v = localStorage.getItem(`paper_${paper.id}_section_${activeSection}_versions`);
    setVersions(v ? JSON.parse(v).map((x: any) => ({ ...x, timestamp: new Date(x.timestamp) })) : []);
  }, [paper?.id, activeSection]);

  const saveDraft = useCallback((sectionId: string, text: string) => {
    if (!paper?.id) return;
    setSaveStatus('saving'); onSaveStatusChange?.('saving');
    setTimeout(() => {
      localStorage.setItem(`paper_${paper.id}_section_${sectionId}`, text);
      if (text.trim().length > 10) {
        const newVersion: Version = {
          id: Date.now().toString(), timestamp: new Date(),
          content: text, preview: text.trim().slice(0, 60) + (text.trim().length > 60 ? '…' : '')
        };
        const next = [newVersion, ...versions].slice(0, 10);
        setVersions(next);
        localStorage.setItem(`paper_${paper.id}_section_${sectionId}_versions`, JSON.stringify(next));
      }
      setSaveStatus('saved'); onSaveStatusChange?.('saved');
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = setTimeout(() => { setSaveStatus('idle'); onSaveStatusChange?.('idle'); }, 1500);
    }, 250);
  }, [paper?.id, versions, onSaveStatusChange]);

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || '';
    setContent(text);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveDraft(activeSection, text), 600);
  };

  const format = (cmd: string, value?: string) => { document.execCommand(cmd, false, value); editorRef.current?.focus(); };

  /* --- AI trigger (unchanged mechanics) --- */
  const getText = () => editorRef.current?.textContent || content || '';
  const handleAiAction = async (task: string, wordTarget?: number) => {
    const sectionText = getText();
    const canRunWithout = ['rqs','hypotheses','contributions','suggest_citations'].includes(task);
    if (!sectionText.trim() && !canRunWithout) { toast.error('Please write some content first.'); return; }
    setIsAiLoading(true); 
    try {
      const res = await fetch('/api/ai', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ task, sectionText, wordTarget, field: paper?.topic || 'research', notes: paper?.description || '' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI request failed');
      if (['rewrite','proofread','shorten','expand','bullets_to_paragraph','paragraph_to_bullets'].includes(task) && data.revised) {
        if (editorRef.current) {
          editorRef.current.textContent = data.revised;
          setContent(data.revised);
          setWordCount(data.revised.trim().split(/\s+/).length);
          toast.success('Content updated');
        }
      } else {
        onAiResult(task, data);
        toast.success('AI results ready');
      }
    } catch (e) {
      toast.error('AI action failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const sectionCfg = section;

  return (
    <div className="px-4 sm:px-6 py-4">
      <div className="max-w-4xl mx-auto">
        {/* section header (NOT sticky, full center width) */}
        <div className="mb-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{sectionCfg.title}</h2>
              <p className="text-[0.9rem] text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                {sectionCfg.guidance}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Evidence */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-8 px-2 text-xs">
                    <Search className="w-4 h-4 mr-1" /> Evidence <ChevronDown className="w-3 h-3 ml-1" />
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
                    <PenTool className="w-4 h-4 mr-1" /> Write/Polish <ChevronDown className="w-3 h-3 ml-1" />
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

              <Button variant="outline" className="h-8 px-2 text-xs" onClick={() => {
                const text = editorRef.current?.textContent || content || '';
                saveDraft(activeSection, text);
                toast.success('Changes saved');
              }}>
                <SaveIcon className="w-4 h-4 mr-1" /> Save
              </Button>

              <Button variant="outline" className="h-8 px-2 text-xs" onClick={onAddCitation}>
                <BookOpen className="w-4 h-4 mr-1" /> Add Citation
              </Button>
            </div>
          </div>

          {/* counts/help row */}
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3">
            <span><span className="font-medium">{wordCount}</span>{(sectionCfg.wordTarget ?? 0) > 0 && <>/{sectionCfg.wordTarget}</>} words</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className="h-7 w-7 p-0">
                    <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Writing guidelines for {sectionCfg.title}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* STICKY TOOLBAR (sticks to the top of the editor column, not the app header) */}
        <div className="sticky top-0 z-20 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur border-y border-slate-200 dark:border-slate-700">
          <div className="max-w-4xl mx-auto px-3">
            <div className="flex items-center">
              <Button variant="ghost" className="btn-compact" onClick={() => format('bold')}><Bold /></Button>
              <Button variant="ghost" className="btn-compact" onClick={() => format('italic')}><Italic /></Button>
              <Button variant="ghost" className="btn-compact" onClick={() => format('underline')}><Underline /></Button>

              <Separator orientation="vertical" className="h-6 mx-2" />

              <Button variant="ghost" className="btn-compact" onClick={() => format('justifyLeft')}><AlignLeft /></Button>
              <Button variant="ghost" className="btn-compact" onClick={() => format('justifyCenter')}><AlignCenter /></Button>
              <Button variant="ghost" className="btn-compact" onClick={() => format('justifyRight')}><AlignRight /></Button>

              <Separator orientation="vertical" className="h-6 mx-2" />

              <Button variant="ghost" className="btn-compact" onClick={() => format('insertUnorderedList')}><List /></Button>
              <Button variant="ghost" className="btn-compact" onClick={() => format('insertOrderedList')}><ListOrdered /></Button>
              <Button variant="ghost" className="btn-compact" onClick={() => format('formatBlock','blockquote')}><Quote /></Button>

              <Separator orientation="vertical" className="h-6 mx-2" />

              <Button variant="ghost" className="btn-compact" onClick={() => format('createLink', prompt('Enter URL:') || '')}>
                <LinkIcon />
              </Button>
            </div>
          </div>
        </div>

        {/* guidance tip when empty */}
        {wordCount === 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Getting Started with {sectionCfg.title}
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">{sectionCfg.emptyGuidance}</p>
              </div>
            </div>
          </div>
        )}

        {/* EDITOR BODY */}
        <div
          ref={editorRef}
          contentEditable
          className="min-h-[420px] mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 leading-[1.7]"
          data-placeholder={sectionCfg.placeholder}
          onInput={handleContentChange}
        />

        {/* small spacing at bottom so last line isn't jammed against viewport bottom */}
        <div className="h-10" />
      </div>

      {/* dialogs (versions/rubric) unchanged — remove here for brevity if you want */}
      <Dialog open={!!previewVersion} onOpenChange={() => setPreviewVersion(null)}>
        <DialogContent className="sm:max-w-[680px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Version Preview</DialogTitle>
            <DialogDescription>
              {previewVersion && `Saved on ${previewVersion.timestamp.toLocaleString()}`}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800 rounded">
            <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
              {previewVersion?.content || ''}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewVersion(null)}>Close</Button>
            <Button onClick={() => previewVersion && (editorRef.current!.textContent = previewVersion.content)}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Restore This Version
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* placeholder styling */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

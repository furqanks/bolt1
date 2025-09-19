'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import {
  ArrowLeft,
  Save,
  Download,
  Share,
  Settings as SettingsIcon,
  FileText,
  Brain,
} from 'lucide-react';

import { OutlinePanel } from './outline-panel';
import { ContentEditor } from './content-editor';
import { CitationManager } from './citation-manager';
import { AiPanel } from './ai-panel';

interface Paper {
  id: string;
  title: string;
  topic: string;
  type: string;
  createdAt: string;
  lastModified: string;
  progress: number;
  dueDate?: string;
  wordCount: number;
  content: any;
}

interface PaperEditorProps {
  paperId: string;
}

export function PaperEditor({ paperId }: PaperEditorProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [paper, setPaper] = useState<Paper | null>(null);
  const [activeSection, setActiveSection] = useState('abstract');
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'write' | 'sources' | 'settings'>('write');
  const [globalSaveStatus, setGlobalSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // AI side-panel state
  const [aiPanelCollapsedMobile, setAiPanelCollapsedMobile] = useState(false); // (kept for future mobile use)
  const [aiResults, setAiResults] = useState<{ [key: string]: any }>({});
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentAiTask, setCurrentAiTask] = useState<string | null>(null);

  // NEW: desktop collapsible sidebars
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // --- wiring: add reference entry from sources tab into References section (localStorage)
  useEffect(() => {
    const handler = (e: any) => {
      const entry = e?.detail?.entry;
      if (!entry || !paper?.id) return;

      const referencesKey = `paper_${paper.id}_section_references`;
      const currentContent = localStorage.getItem(referencesKey) || '';
      const separator = currentContent.trim() ? '\n\n' : '';
      const updated = currentContent + separator + entry;
      localStorage.setItem(referencesKey, updated);

      setActiveTab('write');
    };
    window.addEventListener('add-reference-entry', handler as any);
    return () => window.removeEventListener('add-reference-entry', handler as any);
  }, [paper?.id]);

  // --- wiring: inline citation insertion (switch to write, focus, insert)
  useEffect(() => {
    const handler = (e: any) => {
      const inline = e?.detail?.inline;
      if (!inline) return;

      setActiveTab('write');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('editor-focus'));
        window.dispatchEvent(new CustomEvent('editor-insert-citation', { detail: { inline } }));
      }, 80);
    };
    window.addEventListener('request-insert-citation', handler as any);
    return () => window.removeEventListener('request-insert-citation', handler as any);
  }, []);

  // --- load paper from localStorage
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const saved = localStorage.getItem('researchflow_papers');
    if (saved) {
      const papers: Paper[] = JSON.parse(saved);
      const found = papers.find((p) => p.id === paperId);
      if (found) {
        setPaper(found);
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push('/dashboard');
    }
    setIsLoading(false);
  }, [user, paperId, router]);

  const handleAiResult = (task: string, data: any) => {
    setAiResults((prev) => ({ ...prev, [task]: data }));
  };
  const handleAiAction = async (task: string, wordTarget?: number) => {
    setIsAiLoading(true);
    setCurrentAiTask(task);
    // The actual work happens inside ContentEditor via /api/ai calls.
  };
  const handleSaveStatusChange = (status: 'idle' | 'saving' | 'saved') => {
    setGlobalSaveStatus(status);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg animate-pulse mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading your paper...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Paper not found</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">The paper you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-white truncate max-w-xs">
                    {paper.title}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Badge variant="secondary" className="text-xs">
                      {paper.type}
                    </Badge>
                    {globalSaveStatus === 'saving' && (
                      <span className="text-blue-600 dark:text-blue-400">Saving...</span>
                    )}
                    {globalSaveStatus === 'saved' && (
                      <span className="text-emerald-600 dark:text-emerald-400">All changes saved</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Brain className="w-4 h-4 mr-2" />
                AI Feedback
              </Button>
              <Button variant="ghost" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="ghost" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="sm">
                <SettingsIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* DESKTOP LAYOUT: collapsible left & right panels via CSS vars */}
      <div
        className="h-[calc(100vh-64px)] px-2 sm:px-4 lg:px-6"
        style={
          {
            // @ts-ignore custom CSS vars
            '--left': leftCollapsed ? '0px' : '280px',
            '--right': rightCollapsed ? '0px' : '340px',
          } as React.CSSProperties
        }
      >
        <div className="h-full grid gap-x-3 lg:gap-x-4 lg:[grid-template-columns:var(--left)_1fr_var(--right)]">
          {/* LEFT: Outline (desktop) */}
          <aside
            className={`
              relative hidden lg:block min-w-0 transition-[width,opacity] duration-200
              ${leftCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
            `}
          >
            <div className="h-full overflow-y-auto bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 rounded-md">
              <OutlinePanel activeSection={activeSection} onSectionChange={setActiveSection} />
            </div>

            {/* Collapse handle on right edge */}
            <button
              type="button"
              onClick={() => setLeftCollapsed(true)}
              className={`
                absolute -right-3 top-1/2 -translate-y-1/2 hidden lg:flex
                h-8 w-6 items-center justify-center rounded-md
                bg-white/90 dark:bg-slate-800/90 shadow border
                border-slate-200 dark:border-slate-700
                ${leftCollapsed ? 'pointer-events-none opacity-0' : ''}
              `}
              title="Collapse outline"
              aria-label="Collapse outline"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4">
                <path d="M12.5 5l-5 5 5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </aside>

          {/* LEFT expand handle (when collapsed) */}
          {leftCollapsed && (
            <button
              type="button"
              onClick={() => setLeftCollapsed(false)}
              className="hidden lg:flex items-center justify-center w-3 -ml-3 pr-1 hover:w-5 transition-all duration-150"
              title="Expand outline"
              aria-label="Expand outline"
            >
              <div className="h-12 w-2 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <svg viewBox="0 0 20 20" className="h-3 w-3 text-slate-500">
                  <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>
          )}

          {/* CENTER: Editor + tabs */}
          <main className="min-w-0 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="min-h-0 flex-1 flex flex-col">
              <div className="border-b border-slate-200 dark:border-slate-700 px-2 sm:px-4">
                <TabsList className="w-full max-w-md grid grid-cols-3">
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="sources">Sources</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="write" className="min-h-0 flex-1 mt-0 overflow-hidden">
                <ContentEditor
                  activeSection={activeSection}
                  paper={paper}
                  onUpdate={() => {}}
                  onAiResult={handleAiResult}
                  onSaveStatusChange={handleSaveStatusChange}
                  onAddCitation={() => {
                    setActiveTab('sources');
                    window.dispatchEvent(new CustomEvent('open-add-source'));
                  }}
                />
              </TabsContent>

              <TabsContent value="sources" className="min-h-0 flex-1 mt-0 overflow-hidden">
                <div className="h-full overflow-y-auto bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                  <CitationManager paperId={paperId} />
                </div>
              </TabsContent>

              <TabsContent value="settings" className="min-h-0 flex-1 mt-0 overflow-hidden">
                <div className="h-full overflow-y-auto p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                  <div className="max-w-2xl">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Paper Settings</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Paper Title</label>
                        <Input value={paper.title} onChange={(e) => setPaper({ ...paper, title: e.target.value })} className="max-w-md" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Research Topic</label>
                        <Input value={paper.topic} onChange={(e) => setPaper({ ...paper, topic: e.target.value })} className="max-w-md" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Due Date</label>
                        <Input type="date" value={paper.dueDate || ''} onChange={(e) => setPaper({ ...paper, dueDate: e.target.value })} className="max-w-md" />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </main>

          {/* RIGHT: AI Panel (desktop) */}
          <aside
            className={`
              relative hidden lg:block min-w-0 transition-[width,opacity] duration-200
              ${rightCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
            `}
          >
            <div className="h-full bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 rounded-md overflow-hidden">
              <AiPanel
                isCollapsed={false}
                onToggle={() => {}}
                aiResults={aiResults}
                onAiAction={handleAiAction}
                isLoading={isAiLoading}
                currentTask={currentAiTask}
              />
            </div>

            {/* Collapse handle on left edge */}
            <button
              type="button"
              onClick={() => setRightCollapsed(true)}
              className={`
                absolute -left-3 top-1/2 -translate-y-1/2 hidden lg:flex
                h-8 w-6 items-center justify-center rounded-md
                bg-white/90 dark:bg-slate-800/90 shadow border
                border-slate-200 dark:border-slate-700
                ${rightCollapsed ? 'pointer-events-none opacity-0' : ''}
              `}
              title="Collapse AI panel"
              aria-label="Collapse AI panel"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4">
                <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </aside>

          {/* RIGHT expand handle (when collapsed) */}
          {rightCollapsed && (
            <button
              type="button"
              onClick={() => setRightCollapsed(false)}
              className="hidden lg:flex items-center justify-center w-3 -mr-3 pl-1 hover:w-5 transition-all duration-150"
              title="Expand AI panel"
              aria-label="Expand AI panel"
            >
              <div className="h-12 w-2 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <svg viewBox="0 0 20 20" className="h-3 w-3 text-slate-500">
                  <path d="M12.5 5l-5 5 5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

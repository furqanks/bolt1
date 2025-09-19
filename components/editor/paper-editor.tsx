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
  Settings,
  FileText,
  Brain,
  Menu,
} from 'lucide-react';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

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
  const [globalSaveStatus, setGlobalSaveStatus] =
    useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeTab, setActiveTab] =
    useState<'write' | 'sources' | 'settings'>('write');

  // right panel (unchanged)
  const [aiPanelCollapsed, setAiPanelCollapsed] = useState(false);
  const [aiResults, setAiResults] = useState<{ [key: string]: any }>({});
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentAiTask, setCurrentAiTask] = useState<string | null>(null);

  // NEW: outline drawer open state (mobile & tablet)
  const [outlineOpen, setOutlineOpen] = useState(false);

  // listen for "add reference entry" (unchanged logic)
  useEffect(() => {
    const handler = (e: any) => {
      const entry = e?.detail?.entry;
      if (!entry) return;

      if (paper?.id) {
        const referencesKey = `paper_${paper.id}_section_references`;
        const currentContent = localStorage.getItem(referencesKey) || '';
        const separator = currentContent.trim() ? '\n\n' : '';
        const updatedContent = currentContent + separator + entry;
        localStorage.setItem(referencesKey, updatedContent);
      }

      setActiveTab('write');
    };
    window.addEventListener('add-reference-entry', handler as any);
    return () =>
      window.removeEventListener('add-reference-entry', handler as any);
  }, [paper?.id]);

  // needed for inline citation insertion (unchanged)
  useEffect(() => {
    const handler = (e: any) => {
      const inline = e?.detail?.inline;
      if (!inline) return;
      setActiveTab('write');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('editor-focus'));
        window.dispatchEvent(
          new CustomEvent('editor-insert-citation', { detail: { inline } }),
        );
      }, 80);
    };
    window.addEventListener('request-insert-citation', handler as any);
    return () =>
      window.removeEventListener('request-insert-citation', handler as any);
  }, []);

  // load paper (unchanged)
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const savedPapers = localStorage.getItem('researchflow_papers');
    if (savedPapers) {
      const papers = JSON.parse(savedPapers);
      const currentPaper = papers.find((p: Paper) => p.id === paperId);
      if (currentPaper) {
        setPaper(currentPaper);
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push('/dashboard');
    }
  }, [user, paperId, router]);

  const handleAiResult = (task: string, data: any) => {
    setAiResults((prev) => ({ ...prev, [task]: data }));
  };
  const handleAiAction = async (task: string, wordTarget?: number) => {
    setIsAiLoading(true);
    setCurrentAiTask(task);
    // actual AI handling occurs inside ContentEditor via /api/ai
  };
  const handleSaveStatusChange = (status: 'idle' | 'saving' | 'saved') => {
    setGlobalSaveStatus(status);
  };

  if (!paper) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Paper not found
          </h2>
          <Button onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* back */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="hidden sm:inline-flex"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>

              {/* NEW: open outline drawer on small screens */}
              <Sheet open={outlineOpen} onOpenChange={setOutlineOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden"
                    aria-label="Open outline"
                  >
                    <Menu className="w-4 h-4 mr-2" />
                    Outline
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[85vw] sm:w-[420px]">
                  <SheetHeader className="px-4 py-3 border-b">
                    <SheetTitle>Paper Outline</SheetTitle>
                  </SheetHeader>
                  <div className="h-[calc(100vh-56px)] overflow-y-auto">
                    <OutlinePanel
                      activeSection={activeSection}
                      onSectionChange={(s) => {
                        setActiveSection(s);
                        setOutlineOpen(false); // close after selecting
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* title + status */}
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate max-w-[50vw] sm:max-w-none">
                    {paper.title}
                  </h1>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    <Badge variant="secondary" className="text-[10px] sm:text-xs">
                      {paper.type}
                    </Badge>
                    {globalSaveStatus === 'saving' && (
                      <span className="text-blue-600 dark:text-blue-400">
                        Saving…
                      </span>
                    )}
                    {globalSaveStatus === 'saved' && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        All changes saved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                <Brain className="w-4 h-4 mr-2" />
                AI Feedback
              </Button>
              <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN GRID: desktop has 3 columns; mobile collapses to 1 + drawers */}
      <div className="h-[calc(100vh-64px)] grid gap-x-3 sm:gap-x-4 lg:gap-x-6 px-2 sm:px-4 lg:px-6 lg:[grid-template-columns:280px_1fr_340px]">
        {/* LEFT: outline (desktop only; mobile uses Sheet above) */}
        <aside className="hidden lg:block min-w-0">
          <div className="h-full overflow-y-auto bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 rounded-md">
            <OutlinePanel
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
          </div>
        </aside>

        {/* CENTER: tabs + editor; proper scrolling setup */}
        <main className="min-w-0 flex flex-col overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            className="min-h-0 flex-1 flex flex-col"
          >
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
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                    Paper Settings
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Paper Title
                      </label>
                      <Input
                        value={paper.title}
                        onChange={(e) => setPaper({ ...paper, title: e.target.value })}
                        className="max-w-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Research Topic
                      </label>
                      <Input
                        value={paper.topic}
                        onChange={(e) => setPaper({ ...paper, topic: e.target.value })}
                        className="max-w-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Due Date
                      </label>
                      <Input
                        type="date"
                        value={paper.dueDate || ''}
                        onChange={(e) => setPaper({ ...paper, dueDate: e.target.value })}
                        className="max-w-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* RIGHT: AI panel (desktop only by default) */}
        <aside className="hidden lg:block min-w-0">
          <div className="h-full bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 rounded-md overflow-hidden">
            <AiPanel
              isCollapsed={aiPanelCollapsed}
              onToggle={() => setAiPanelCollapsed(!aiPanelCollapsed)}
              aiResults={aiResults}
              onAiAction={handleAiAction}
              isLoading={isAiLoading}
              currentTask={currentAiTask}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

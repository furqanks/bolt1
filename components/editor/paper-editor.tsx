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
  Settings as Cog,
  FileText,
  Brain,
  ChevronLeft,
  ChevronRight,
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
  const [activeTab, setActiveTab] = useState<'write' | 'sources' | 'settings'>('write');

  const [globalSaveStatus, setGlobalSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [isLoading, setIsLoading] = useState(true);

  // NEW: collapse states
  const [isOutlineCollapsed, setIsOutlineCollapsed] = useState(false);
  const [isAiPanelCollapsed, setIsAiPanelCollapsed] = useState(false);

  // for AI panel passthrough
  const [aiResults, setAiResults] = useState<{ [key: string]: any }>({});
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentAiTask, setCurrentAiTask] = useState<string | null>(null);

  // ---- bootstrap & persistence ----
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const savedPapers = localStorage.getItem('researchflow_papers');
    if (savedPapers) {
      const papers = JSON.parse(savedPapers);
      const currentPaper = papers.find((p: Paper) => p.id === paperId);
      if (currentPaper) setPaper(currentPaper);
      else router.push('/dashboard');
    } else {
      router.push('/dashboard');
    }

    setIsLoading(false);
  }, [user, paperId, router]);

  // ---- cross-tab “insert reference entry” -> References section ----
  useEffect(() => {
    const handler = (e: any) => {
      const entry = e?.detail?.entry;
      if (!entry || !paper?.id) return;

      const referencesKey = `paper_${paper.id}_section_references`;
      const currentContent = localStorage.getItem(referencesKey) || '';
      const sep = currentContent.trim() ? '\n\n' : '';
      localStorage.setItem(referencesKey, currentContent + sep + entry);

      setActiveTab('write');
    };
    window.addEventListener('add-reference-entry', handler as any);
    return () => window.removeEventListener('add-reference-entry', handler as any);
  }, [paper?.id]);

  // ---- cross-tab inline citation insertion ----
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

  const handleAiResult = (task: string, data: any) =>
    setAiResults((prev) => ({ ...prev, [task]: data }));

  const handleAiAction = async (task: string, wordTarget?: number) => {
    setIsAiLoading(true);
    setCurrentAiTask(task);
    // actual work is done inside ContentEditor via /api/ai;
    // this function is here to satisfy AiPanel props shape when needed
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
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Paper not found
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            The paper you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top App Bar */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>

              <div className="border-l border-slate-200 dark:border-slate-700 h-6" />

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
                <Cog className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main 3-pane layout */}
      <div className="relative flex h-[calc(100vh-64px)] overflow-hidden">
        {/* LEFT: Outline (collapsible) */}
        <div
          className={[
            'bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700',
            'overflow-y-auto transition-all duration-300',
            isOutlineCollapsed ? 'w-0' : 'w-80',
          ].join(' ')}
        >
          {!isOutlineCollapsed && (
            <OutlinePanel activeSection={activeSection} onSectionChange={setActiveSection} />
          )}
        </div>

        {/* Toggle button for Outline */}
        <button
          aria-label={isOutlineCollapsed ? 'Expand outline' : 'Collapse outline'}
          onClick={() => setIsOutlineCollapsed((v) => !v)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30
                     bg-slate-200/90 hover:bg-slate-300 dark:bg-slate-700/90 dark:hover:bg-slate-600
                     border border-slate-300 dark:border-slate-600 rounded-r px-1 py-1"
        >
          {isOutlineCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* CENTER: Editor area */}
        <div className="flex-1 min-w-0 flex flex-col">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="sources">Sources</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="write" className="flex-1 mt-0 min-h-0">
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

            <TabsContent value="sources" className="flex-1 mt-0 min-h-0">
              <CitationManager paperId={paperId} />
            </TabsContent>

            <TabsContent value="settings" className="flex-1 mt-0 p-6 overflow-y-auto">
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
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT: AI panel (collapsible) */}
        {isAiPanelCollapsed ? (
          <button
            aria-label="Expand AI Assistant"
            onClick={() => setIsAiPanelCollapsed(false)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30
                       bg-slate-200/90 hover:bg-slate-300 dark:bg-slate-700/90 dark:hover:bg-slate-600
                       border border-slate-300 dark:border-slate-600 rounded-l px-1 py-1"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-80 transition-all duration-300 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <AiPanel
              isCollapsed={false}
              onToggle={() => setIsAiPanelCollapsed(true)}
              aiResults={aiResults}
              onAiAction={handleAiAction}
              isLoading={isAiLoading}
              currentTask={currentAiTask}
            />
          </div>
        )}
      </div>
    </div>
  );
}

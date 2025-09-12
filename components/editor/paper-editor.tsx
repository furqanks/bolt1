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
  const [globalSaveStatus, setGlobalSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [aiPanelCollapsed, setAiPanelCollapsed] = useState(false);
  const [aiResults, setAiResults] = useState<{ [key: string]: any }>({});
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentAiTask, setCurrentAiTask] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'write' | 'sources' | 'settings'>('write');

  // Add reference entries to References section (localStorage demo)
  useEffect(() => {
    const handler = (e: any) => {
      const entry = e?.detail?.entry;
      if (!entry || !paper?.id) return;
      const key = `paper_${paper.id}_section_references`;
      const prev = localStorage.getItem(key) || '';
      const sep = prev.trim() ? '\n\n' : '';
      localStorage.setItem(key, prev + sep + entry);
      setActiveTab('write');
    };
    window.addEventListener('add-reference-entry', handler as any);
    return () => window.removeEventListener('add-reference-entry', handler as any);
  }, [paper?.id]);

  // Inline citation insertion bridge
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

  // Load local papers (demo)
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const saved = localStorage.getItem('researchflow_papers');
    if (saved) {
      const list = JSON.parse(saved);
      const current = list.find((p: Paper) => p.id === paperId);
      if (current) setPaper(current);
      else router.push('/dashboard');
    } else {
      router.push('/dashboard');
    }
    setIsLoading(false);
  }, [user, paperId, router]);

  const handleAiResult = (task: string, data: any) => {
    setAiResults(prev => ({ ...prev, [task]: data }));
  };

  const handleAiAction = async (task: string, wordTarget?: number) => {
    setIsAiLoading(true);
    setCurrentAiTask(task);
    // actual AI handled in ContentEditor
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
            <div className="flex flex-wrap items-center gap-4 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>

              <div className="border-l border-slate-200 dark:border-slate-700 h-6" />

              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="min-w-0">
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                    {paper.title}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Badge variant="secondary" className="text-xs">{paper.type}</Badge>
                    {globalSaveStatus === 'saving' && <span className="text-blue-600 dark:text-blue-400">Saving...</span>}
                    {globalSaveStatus === 'saved' && <span className="text-emerald-600 dark:text-emerald-400">All changes saved</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main area: stack on small screens, row on lg+ */}
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar - Outline */}
        <div className="hidden lg:block w-80 shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto min-w-[18rem] max-w-[20rem]">
          <OutlinePanel activeSection={activeSection} onSectionChange={setActiveSection} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            className="flex-1 flex flex-col h-full"
          >
            {/* Mobile Outline Panel */}
            <div className="lg:hidden border-b border-slate-200 dark:border-slate-700 p-4">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-slate-900 dark:text-white">Paper Outline</span>
                  <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4 max-h-60 overflow-y-auto">
                  <OutlinePanel activeSection={activeSection} onSectionChange={setActiveSection} />
                </div>
              </details>
            </div>

            <div className="border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-2">
              <TabsList className="grid w-full max-w-sm grid-cols-3">
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="sources">Sources</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="write" className="flex-1 min-h-0 overflow-y-auto mt-0">
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

            <TabsContent value="sources" className="flex-1 min-h-0 overflow-y-auto mt-0">
              <CitationManager paperId={paperId} />
            </TabsContent>

            <TabsContent value="settings" className="flex-1 min-h-0 overflow-y-auto mt-0">
              <div className="max-w-2xl w-full mx-auto p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Paper Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Paper Title</label>
                    <Input
                      value={paper.title}
                      onChange={(e) => setPaper({ ...paper, title: e.target.value })}
                      className="max-w-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Research Topic</label>
                    <Input
                      value={paper.topic}
                      onChange={(e) => setPaper({ ...paper, topic: e.target.value })}
                      className="max-w-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Due Date</label>
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

        {/* AI Panel - Hidden on mobile, visible on desktop */}
        <div className="hidden xl:flex">
          <AiPanel
            isCollapsed={aiPanelCollapsed}
            onToggle={() => setAiPanelCollapsed(!aiPanelCollapsed)}
            aiResults={aiResults}
            onAiAction={handleAiAction}
            isLoading={isAiLoading}
            currentTask={currentAiTask}
          />
        </div>
      </div>

      {/* Mobile AI Panel - Bottom Sheet */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-50">
        <details className="group bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg">
          <summary className="flex items-center justify-between p-4 cursor-pointer">
            <div className="flex items-center">
              <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
              <span className="font-medium text-slate-900 dark:text-white">AI Assistant</span>
            </div>
            <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="max-h-80 overflow-y-auto border-t border-slate-200 dark:border-slate-700">
            <AiPanel
              isCollapsed={false}
              onToggle={() => {}}
              aiResults={aiResults}
              onAiAction={handleAiAction}
              isLoading={isAiLoading}
              currentTask={currentAiTask}
            />
          </div>
        </details>
      </div>
    </div>
  );
}

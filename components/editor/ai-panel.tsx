'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Search,
  PenTool,
  ChevronDown,
  Plus,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Target,
  BookOpen,
} from 'lucide-react';

interface AiPanelProps {
  isCollapsed: boolean;            // still accepted for compatibility
  onToggle: () => void;
  aiResults: { [key: string]: any };
  onAiAction: (task: string, wordTarget?: number) => void;
  isLoading: boolean;
  currentTask: string | null;
}

export function AiPanel({
  isCollapsed,
  onToggle,
  aiResults,
  onAiAction,
  isLoading,
  currentTask,
}: AiPanelProps) {
  const [activeTab, setActiveTab] = useState<'actions' | 'suggestions' | 'references'>('actions');

  // If you still want the super-thin collapsed bar in some places:
  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-12 w-12 p-0 border-b border-slate-200 dark:border-slate-700"
          aria-label="Expand AI Assistant"
          title="Expand AI Assistant"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 flex items-center justify-center">
          <div className="writing-mode-vertical text-xs text-slate-500 dark:text-slate-400 font-medium">
            AI
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-w-0 flex flex-col overflow-hidden bg-white dark:bg-slate-800">
      {/* Fixed header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <h3 className="font-semibold text-slate-900 dark:text-white">AI Assistant</h3>
        <Button variant="ghost" size="sm" onClick={onToggle} aria-label="Collapse AI Assistant">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs container must be min-h-0 + flex-1 so children can scroll */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="flex-1 min-h-0 flex flex-col"
      >
        <div className="px-4 pt-3 pb-1 shrink-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="suggestions">Results</TabsTrigger>
            <TabsTrigger value="references">References</TabsTrigger>
          </TabsList>
        </div>

        {/* Each tab body becomes the scroll area */}
        <TabsContent
          value="actions"
          className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 mt-0"
        >
          {/* IDEATE */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <Lightbulb className="w-4 h-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                Ideate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => onAiAction('rqs')}
                disabled={isLoading}
              >
                Generate Research Questions
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => onAiAction('hypotheses')}
                disabled={isLoading}
              >
                Refine Hypotheses
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => onAiAction('contributions')}
                disabled={isLoading}
              >
                Outline Contributions
              </Button>
            </CardContent>
          </Card>

          {/* EVIDENCE */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <Search className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                Evidence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => onAiAction('suggest_citations')}
                disabled={isLoading}
              >
                Suggest Citations
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => onAiAction('synthesize_sources')}
                disabled={isLoading}
              >
                Synthesize 3–5 Sources
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => onAiAction('spot_gaps')}
                disabled={isLoading}
              >
                Spot Gaps/Contradictions
              </Button>
            </CardContent>
          </Card>

          {/* WRITE / POLISH */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <PenTool className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                Write/Polish
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => onAiAction('critique')}
                disabled={isLoading}
              >
                AI Feedback
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => onAiAction('rewrite')}
                disabled={isLoading}
              >
                Rewrite
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => onAiAction('proofread')}
                disabled={isLoading}
              >
                Proofread
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAiAction('shorten', 150)}
                  disabled={isLoading}
                >
                  Shorten → 150
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAiAction('expand', 300)}
                  disabled={isLoading}
                >
                  Expand → 300
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAiAction('bullets_to_paragraph')}
                  disabled={isLoading}
                >
                  Bullets → Paragraph
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAiAction('paragraph_to_bullets')}
                  disabled={isLoading}
                >
                  Paragraph → Bullets
                </Button>
              </div>
            </CardContent>
          </Card>

          {isLoading && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                Processing {currentTask}...
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="suggestions"
          className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 mt-0"
        >
          {Object.keys(aiResults).length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                AI results will appear here after running actions
              </p>
            </div>
          ) : (
            Object.entries(aiResults).map(([task, data]) => (
              <Card key={task}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm capitalize flex items-center justify-between">
                    {task.replace(/_/g, ' ')}
                    <Badge variant="secondary" className="text-xs">
                      {new Date().toLocaleTimeString()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {task === 'critique' && data.feedback && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center mb-1">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                          <span className="font-medium text-emerald-700 dark:text-emerald-300">
                            Strengths
                          </span>
                        </div>
                        <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                          {data.feedback.strengths.map((item: string, i: number) => (
                            <li key={i} className="text-xs">• {item}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div className="flex items-center mb-1">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                          <span className="font-medium text-yellow-700 dark:text-yellow-300">
                            Areas for Improvement
                          </span>
                        </div>
                        <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                          {data.feedback.weaknesses.map((item: string, i: number) => (
                            <li key={i} className="text-xs">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {(task === 'rqs' || task === 'hypotheses' || task === 'contributions') &&
                    data.suggestions && (
                      <ul className="space-y-2">
                        {data.suggestions.map((item: string, i: number) => (
                          <li
                            key={i}
                            className="text-xs text-slate-600 dark:text-slate-300 p-2 bg-slate-50 dark:bg-slate-700 rounded"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}

                  {task === 'spot_gaps' && data.gaps && (
                    <ul className="space-y-2">
                      {data.gaps.map((item: string, i: number) => (
                        <li
                          key={i}
                          className="text-xs text-slate-600 dark:text-slate-300 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {task === 'synthesize_sources' && data.synthesis && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line p-3 bg-slate-50 dark:bg-slate-700 rounded">
                      {data.synthesis}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent
          value="references"
          className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 mt-0"
        >
          {aiResults.suggest_citations?.citations ? (
            <div className="space-y-3">
              {aiResults.suggest_citations.citations.map((citation: any, i: number) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                        {citation.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {citation.authors.join(', ')} ({citation.year})
                      </p>
                      {citation.journal && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                          {citation.journal}
                        </p>
                      )}
                      {citation.relevance && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                          {citation.relevance}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-2">
                        <Button size="sm" variant="outline" className="text-xs h-7">
                          <Plus className="w-3 h-3 mr-1" />
                          Add to Sources
                        </Button>
                        {(citation.url || citation.doi) && (
                          <Button size="sm" variant="ghost" className="text-xs h-7" asChild>
                            <a
                              href={citation.url || `https://doi.org/${citation.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Suggested citations will appear here
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => onAiAction('suggest_citations')}
                disabled={isLoading}
              >
                Get Citation Suggestions
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

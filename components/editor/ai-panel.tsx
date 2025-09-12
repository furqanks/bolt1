'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  BookOpen
} from 'lucide-react';

interface AiPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  aiResults: { [key: string]: any };
  onAiAction: (task: string, wordTarget?: number) => void;
  isLoading: boolean;
  currentTask: string | null;
}

export function AiPanel({ isCollapsed, onToggle, aiResults, onAiAction, isLoading, currentTask }: AiPanelProps) {
  const [activeTab, setActiveTab] = useState('actions');

  if (isCollapsed) {
    return (
      <div className="w-12 shrink-0 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col max-h-[calc(100vh-64px)] overflow-y-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-12 w-12 p-0 border-b border-slate-200 dark:border-slate-700"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 flex items-center justify-center">
          <div className="writing-mode-vertical text-sm text-slate-500 dark:text-slate-400 font-medium">
            AI Assistant
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        w-64 sm:w-72 max-w-xs shrink-0
        bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700
        flex flex-col
        max-h-[calc(100vh-64px)] overflow-y-auto
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-white">AI Assistant</h3>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 m-4 mb-0">
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="suggestions">Results</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
        </TabsList>

        {/* Actions */}
        <TabsContent value="actions" className="flex-1 min-h-0 p-4 space-y-4 mt-4 overflow-y-auto">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Lightbulb className="w-4 h-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                Ideate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onAiAction('rqs')} disabled={isLoading}>
                Generate Research Questions
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onAiAction('hypotheses')} disabled={isLoading}>
                Refine Hypotheses
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onAiAction('contributions')} disabled={isLoading}>
                Outline Contributions
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Search className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                Evidence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onAiAction('suggest_citations')} disabled={isLoading}>
                Suggest Citations
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onAiAction('synthesize_sources')} disabled={isLoading}>
                Synthesize 3–5 Sources
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onAiAction('spot_gaps')} disabled={isLoading}>
                Spot Gaps/Contradictions
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <PenTool className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                Write/Polish
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onAiAction('critique')} disabled={isLoading}>
                AI Feedback
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onAiAction('rewrite')} disabled={isLoading}>
                Rewrite
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => onAiAction('proofread')} disabled={isLoading}>
                Proofread
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between" disabled={isLoading}>
                    Length Adjustments
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onAiAction('shorten', 100)}>Shorten to 100 words</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAiAction('shorten', 150)}>Shorten to 150 words</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAiAction('expand', 250)}>Expand to 250 words</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAiAction('expand', 400)}>Expand to 400 words</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between" disabled={isLoading}>
                    Format Conversion
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onAiAction('bullets_to_paragraph')}>Bullets → Paragraph</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAiAction('paragraph_to_bullets')}>Paragraph → Bullets</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

        {/* Results */}
        <TabsContent value="suggestions" className="flex-1 min-h-0 p-4 space-y-4 mt-4 overflow-y-auto">
          {Object.keys(aiResults).length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">AI results will appear here after running actions</p>
            </div>
          ) : (
            Object.entries(aiResults).map(([task, data]) => (
              <Card key={task}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm capitalize flex items-center justify-between">
                    {task.replace(/_/g, ' ')}
                    <Badge variant="secondary" className="text-xs">{new Date().toLocaleTimeString()}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {task === 'critique' && data.feedback && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center mb-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                          <span className="font-medium text-emerald-700 dark:text-emerald-300">Strengths</span>
                        </div>
                        <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                          {data.feedback.strengths.map((item: string, i: number) => <li key={i} className="text-xs">• {item}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                          <span className="font-medium text-yellow-700 dark:text-yellow-300">Areas for Improvement</span>
                        </div>
                        <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                          {data.feedback.weaknesses.map((item: string, i: number) => <li key={i} className="text-xs">• {item}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}

                  {(task === 'rqs' || task === 'hypotheses' || task === 'contributions') && data.suggestions && (
                    <ul className="space-y-2">
                      {data.suggestions.map((item: string, i: number) => (
                        <li key={i} className="text-xs text-slate-600 dark:text-slate-300 p-2 bg-slate-50 dark:bg-slate-700 rounded">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {task === 'spot_gaps' && data.gaps && (
                    <ul className="space-y-2">
                      {data.gaps.map((item: string, i: number) => (
                        <li key={i} className="text-xs text-slate-600 dark:text-slate-300 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
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

        {/* References */}
        <TabsContent value="references" className="flex-1 min-h-0 p-4 space-y-4 mt-4 overflow-y-auto">
          {aiResults.suggest_citations?.citations ? (
            <div className="space-y-3">
              {aiResults.suggest_citations.citations.map((citation: any, i: number) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white">{citation.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{citation.authors.join(', ')} ({citation.year})</p>
                      {citation.journal && <p className="text-xs text-slate-500 dark:text-slate-400 italic">{citation.journal}</p>}
                      {citation.relevance && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                          {citation.relevance}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 pt-2">
                        <Button size="sm" variant="outline" className="text-xs h-7">
                          <Plus className="w-3 h-3 mr-1" />
                          Add to Sources
                        </Button>
                        {(citation.url || citation.doi) && (
                          <Button size="sm" variant="ghost" className="text-xs h-7" asChild>
                            <a href={citation.url || `https://doi.org/${citation.doi}`} target="_blank" rel="noopener noreferrer">
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
              <p className="text-sm text-slate-500 dark:text-slate-400">Suggested citations will appear here</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => onAiAction('suggest_citations')} disabled={isLoading}>
                Get Citation Suggestions
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

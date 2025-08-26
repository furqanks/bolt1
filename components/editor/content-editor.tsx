'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
  Link,
  Brain,
  Lightbulb,
  Search,
  PenTool,
  ChevronDown,
  BookOpen,
  Target,
  Clock,
  History,
  Eye,
  RotateCcw,
  HelpCircle,
  Save
} from 'lucide-react';

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
}

const sectionContent: { [key: string]: { title: string; placeholder: string; guidance: string } } = {
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

export function ContentEditor({ activeSection, paper, onUpdate, onAiResult, onSaveStatusChange }: ContentEditorProps) {
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiTask, setAiTask] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [versions, setVersions] = useState<Version[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
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

  // Load content and versions on section change
  useEffect(() => {
    if (!paper?.id || !activeSection) return;
    
    // Load content
    const savedContent = localStorage.getItem(`paper_${paper.id}_section_${activeSection}`);
    if (savedContent) {
      setContent(savedContent);
      if (editorRef.current) {
        editorRef.current.textContent = savedContent;
      }
      setWordCount(savedContent.trim() ? savedContent.trim().split(/\s+/).length : 0);
    } else {
      setContent('');
      if (editorRef.current) {
        editorRef.current.textContent = '';
      }
      setWordCount(0);
    }
    
    // Load versions
    const savedVersions = localStorage.getItem(`paper_${paper.id}_section_${activeSection}_versions`);
    if (savedVersions) {
      const parsedVersions = JSON.parse(savedVersions).map((v: any) => ({
        ...v,
        timestamp: new Date(v.timestamp)
      }));
      setVersions(parsedVersions);
    } else {
      setVersions([]);
    }
  }, [paper?.id, activeSection]);

  const saveDraft = useCallback((sectionId: string, content: string) => {
    if (!paper?.id) return;
    
    setSaveStatus('saving');
    onSaveStatusChange?.('saving');
    
    // Simulate save delay
    setTimeout(() => {
      // Save content
      localStorage.setItem(`paper_${paper.id}_section_${sectionId}`, content);
      
      // Create version snapshot if content is substantial
      if (content.trim().length > 10) {
        const newVersion: Version = {
          id: Date.now().toString(),
          timestamp: new Date(),
          content,
          preview: content.trim().slice(0, 60) + (content.trim().length > 60 ? '...' : '')
        };
        
        const updatedVersions = [newVersion, ...versions].slice(0, 10); // Keep only 10 versions
        setVersions(updatedVersions);
        localStorage.setItem(`paper_${paper.id}_section_${sectionId}_versions`, JSON.stringify(updatedVersions));
      }
      
      setSaveStatus('saved');
      onSaveStatusChange?.('saved');
      
      // Clear status after 2 seconds
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      statusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
        onSaveStatusChange?.('idle');
      }, 2000);
    }, 300);
  }, [paper?.id, versions, onSaveStatusChange]);

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || '';
    setContent(newContent);
    setWordCount(newContent.trim() ? newContent.trim().split(/\s+/).length : 0);
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft(activeSection, newContent);
    }, 1000);
  };

  const handleRestoreVersion = (version: Version) => {
    if (editorRef.current) {
      editorRef.current.textContent = version.content;
      setContent(version.content);
      setWordCount(version.content.trim() ? version.content.trim().split(/\s+/).length : 0);
      saveDraft(activeSection, version.content);
      setShowVersions(false);
      setPreviewVersion(null);
      toast.success('Version restored successfully');
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selected = selection?.toString().trim() || '';
    setSelectedText(selected);
  };

  const handleManualSave = useCallback(() => {
    const currentContent = editorRef.current?.textContent || content || '';
    saveDraft(activeSection, currentContent);
    toast.success('Changes saved manually');
  }, [activeSection, content, saveDraft]);

  // Keyboard shortcut for manual save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave]);

  const handleSuggestCitationsForSelection = async () => {
    if (!selectedText) {
      toast.error('Please select some text first');
      return;
    }
    
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          task: 'suggest_citations', 
          sectionText: selectedText,
          field: paper?.topic || 'research'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to suggest citations');
      }

      // Send results to AI panel
      onAiResult('suggest_citations', data);
      toast.success(`Found ${data.citations?.length || 0} citation suggestions for selected text`);
    } catch (error) {
      console.error('Citation suggestion failed:', error);
      toast.error('Failed to suggest citations. Please try again.');
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCurrentSectionText = () => {
    return editorRef.current?.textContent || content || '';
  };

  const handleAiAction = async (task: string, wordTarget?: number) => {
    const sectionText = getCurrentSectionText();
    
    if (!sectionText.trim() && !['rqs', 'hypotheses', 'contributions', 'suggest_citations'].includes(task)) {
      toast.error('Please write some content first before using AI features.');
      return;
    }

    setIsAiLoading(true);
    setAiTask(task);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          task, 
          sectionText, 
          wordTarget,
          field: paper?.topic || 'research',
          notes: paper?.description || ''
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI request failed');
      }

      // Handle content replacement tasks
      if (['rewrite', 'proofread', 'shorten', 'expand', 'bullets_to_paragraph', 'paragraph_to_bullets'].includes(task) && data.revised) {
        if (editorRef.current) {
          editorRef.current.textContent = data.revised;
          setContent(data.revised);
          setWordCount(data.revised.trim().split(/\s+/).length);
          toast.success(`Content ${task} completed successfully`);
        }
      } else {
        // Send results to AI panel
        onAiResult(task, data);
        toast.success('AI analysis completed');
      }
    } catch (error) {
      console.error('AI action failed:', error);
      toast.error(`AI action failed. Please try again.`);
    } finally {
      setIsAiLoading(false);
      setAiTask(null);
    }
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Section Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-16 z-30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{section.title}</h2>
              
              {/* Word Count */}
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <span className="font-medium">{wordCount}</span>
                {section.wordTarget > 0 && (
                  <span className="text-slate-400 dark:text-slate-500">/{section.wordTarget}</span>
                )}
                <span className="ml-1 text-slate-400 dark:text-slate-500">words</span>
              </div>
              
              {/* Versions Dropdown */}
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
                    <div className="p-3 text-sm text-slate-500 dark:text-slate-400">
                      No versions saved yet
                    </div>
                  ) : (
                    versions.map((version) => (
                      <div key={version.id} className="p-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              {formatTimestamp(version.timestamp)}
                            </div>
                            <div className="text-sm text-slate-700 dark:text-slate-300 truncate">
                              {version.preview}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setPreviewVersion(version)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleRestoreVersion(version)}
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
              
              {/* Help Icon */}
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
                  <TooltipContent>
                    <p>Writing guidelines for {section.title}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{section.guidance}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Save Status */}
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {saveStatus === 'saving' && (
                <span className="text-blue-600 dark:text-blue-400">Saving...</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-emerald-600 dark:text-emerald-400">All changes saved</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2 border-r border-slate-200 dark:border-slate-700 pr-4">
              {/* Ideate Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isAiLoading}>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Ideate
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleAiAction('rqs')}>
                    Generate Research Questions
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAiAction('hypotheses')}>
                    Refine Hypotheses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAiAction('contributions')}>
                    Outline Contributions
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Evidence Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isAiLoading}>
                    <Search className="w-4 h-4 mr-2" />
                    Evidence
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleAiAction('suggest_citations')}>
                    Suggest Citations
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAiAction('synthesize_sources')}>
                    Synthesize 3–5 Sources
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAiAction('spot_gaps')}>
                    Spot Gaps/Contradictions
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Write/Polish Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isAiLoading}>
                    <PenTool className="w-4 h-4 mr-2" />
                    Write/Polish
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleAiAction('critique')}>
                    AI Feedback
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAiAction('rewrite')}>
                    Rewrite
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAiAction('proofread')}>
                    Proofread
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAiAction('shorten', 150)}>
                    Shorten to 150 words
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAiAction('expand', 300)}>
                    Expand to 300 words
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAiAction('bullets_to_paragraph')}>
                    Convert Bullets → Paragraph
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAiAction('paragraph_to_bullets')}>
                    Convert Paragraph → Bullets
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <Button variant="outline" size="sm" onClick={handleManualSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            
            <Button variant="outline" size="sm">
              <BookOpen className="w-4 h-4 mr-2" />
              Add Citation
            </Button>
          </div>
        </div>
        
        {isAiLoading && (
          <div className="px-6 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              AI is {aiTask === 'rqs' ? 'generating research questions' : 
                     aiTask === 'hypotheses' ? 'refining hypotheses' :
                     aiTask === 'contributions' ? 'outlining contributions' :
                     aiTask === 'suggest_citations' ? 'suggesting citations' :
                     aiTask === 'synthesize_sources' ? 'synthesizing sources' :
                     aiTask === 'spot_gaps' ? 'identifying gaps' :
                     aiTask === 'critique' ? 'analyzing content' :
                     aiTask === 'rewrite' ? 'rewriting content' :
                     aiTask === 'proofread' ? 'proofreading content' :
                     aiTask === 'shorten' ? 'shortening content' :
                     aiTask === 'expand' ? 'expanding content' :
                     'processing your request'}...
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 sticky top-32 z-20">
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" onClick={() => formatText('bold')}>
            <Bold className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => formatText('italic')}>
            <Italic className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => formatText('underline')}>
            <Underline className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <Button variant="ghost" size="sm" onClick={() => formatText('justifyLeft')}>
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => formatText('justifyCenter')}>
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => formatText('justifyRight')}>
            <AlignRight className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <Button variant="ghost" size="sm" onClick={() => formatText('insertUnorderedList')}>
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => formatText('insertOrderedList')}>
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => formatText('formatBlock', 'blockquote')}>
            <Quote className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <Button variant="ghost" size="sm" onClick={() => formatText('createLink', prompt('Enter URL:') || '')}>
            <Link className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-[820px] mx-auto">
          {/* Empty State Guidance */}
          {wordCount === 0 && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Getting Started with {section.title}
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {section.emptyGuidance}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Content Area */}
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[500px] p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 leading-[1.75]"
            onInput={handleContentChange}
            onMouseUp={handleTextSelection}
            onKeyUp={handleTextSelection}
            style={{
              fontSize: '16px',
              lineHeight: '1.75',
              color: 'inherit'
            }}
            data-placeholder={section.placeholder}
          >
            {/* Placeholder styling handled by CSS */}
          </div>

          {/* Writing Tips */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center mb-2">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h4 className="font-medium text-slate-900 dark:text-white">Writing Tip</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Use clear, concise language. Each paragraph should focus on one main idea.
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
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                <h4 className="font-medium text-slate-900 dark:text-white">Auto-Save</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Your work is automatically saved. Last saved 2 minutes ago.
              </p>
              
              {selectedText && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSuggestCitationsForSelection}
                  className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
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
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setPreviewVersion(null)}>
              Close
            </Button>
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
            <DialogDescription>
              Best practices and structure for this section
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h4 className="font-medium text-slate-900 dark:text-white mb-2">Structure & Content</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {section.rubric}
              </p>
            </div>
            
            {section.wordTarget > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Target Length</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Aim for approximately {section.wordTarget} words for this section.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => setShowRubric(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        [contenteditable] {
          outline: none;
        }
        
        [contenteditable] blockquote {
          border-left: 4px solid #3b82f6;
          margin: 1rem 0;
          padding-left: 1rem;
          font-style: italic;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          margin: 1rem 0;
          padding-left: 2rem;
        }
        
        [contenteditable] li {
          margin: 0.5rem 0;
        }
        
        [contenteditable] h1, [contenteditable] h2, [contenteditable] h3 {
          font-weight: bold;
          margin: 1.5rem 0 1rem 0;
        }
        
        [contenteditable] h1 {
          font-size: 1.5rem;
        }
        
        [contenteditable] h2 {
          font-size: 1.25rem;
        }
        
        [contenteditable] h3 {
          font-size: 1.125rem;
        }
        
        [contenteditable] p {
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
}
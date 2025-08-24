'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
  Clock
} from 'lucide-react';

interface ContentEditorProps {
  activeSection: string;
  paper: any;
  onUpdate: (paper: any) => void;
  onAiResult: (type: string, data: any) => void;
}

const sectionContent: { [key: string]: { title: string; placeholder: string; guidance: string } } = {
  abstract: {
    title: 'Abstract',
    placeholder: 'Write a concise summary of your research (150-250 words)...',
    guidance: 'Include: purpose, methods, key findings, and conclusions. Keep it under 250 words.'
  },
  introduction: {
    title: 'Introduction',
    placeholder: 'Introduce your research topic and establish its significance...',
    guidance: 'Start broad, then narrow to your specific research question. Include background, problem statement, and objectives.'
  },
  'intro-background': {
    title: 'Background',
    placeholder: 'Provide context and background information for your research...',
    guidance: 'Establish the broader context of your research area.'
  },
  'intro-problem': {
    title: 'Problem Statement',
    placeholder: 'Clearly articulate the problem your research addresses...',
    guidance: 'Define the specific issue or gap your research will address.'
  },
  'intro-objectives': {
    title: 'Research Objectives',
    placeholder: 'State your research objectives and hypotheses...',
    guidance: 'List clear, measurable objectives for your study.'
  },
  'literature-review': {
    title: 'Literature Review',
    placeholder: 'Review and synthesize relevant literature...',
    guidance: 'Organize by themes, chronologically, or methodologically. Show gaps your research will fill.'
  },
  methodology: {
    title: 'Methodology',
    placeholder: 'Describe your research methods and approach...',
    guidance: 'Be detailed enough for replication. Include design, participants, procedures, and analysis methods.'
  },
  results: {
    title: 'Results',
    placeholder: 'Present your findings objectively...',
    guidance: 'Report results without interpretation. Use tables, figures, and statistical analysis.'
  },
  discussion: {
    title: 'Discussion',
    placeholder: 'Interpret your results and discuss their implications...',
    guidance: 'Explain what your results mean, compare with existing literature, and discuss implications.'
  },
  conclusion: {
    title: 'Conclusion',
    placeholder: 'Summarize your research and its contributions...',
    guidance: 'Summarize key findings, contributions to knowledge, and suggestions for future research.'
  },
  references: {
    title: 'References',
    placeholder: 'Your references will appear here automatically...',
    guidance: 'References are generated from your sources. Use proper citation format.'
  }
};

export function ContentEditor({ activeSection, paper, onUpdate, onAiResult }: ContentEditorProps) {
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiTask, setAiTask] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const section = sectionContent[activeSection] || {
    title: 'Section',
    placeholder: 'Start writing...',
    guidance: 'Write your content here.'
  };

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || '';
    setContent(newContent);
    setWordCount(newContent.trim() ? newContent.trim().split(/\s+/).length : 0);
    
    // Trigger autosave through parent component
    if (onUpdate && paper) {
      onUpdate({
        ...paper,
        content: {
          ...paper.content,
          [activeSection]: newContent
        }
      });
    }
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
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{section.title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{section.guidance}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium">{wordCount}</span> words
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
      <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
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
        <div className="max-w-4xl mx-auto">
          {/* Content Area */}
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[500px] p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onInput={handleContentChange}
            style={{
              fontSize: '16px',
              lineHeight: '1.6',
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
            </div>
          </div>
        </div>
      </div>

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
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
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

const sectionContent: Record<string, SectionConfig> = {
  abstract: {
    title: 'Abstract',
    placeholder: 'Write a concise summary of your research (150-250 words)...',
    guidance: 'Include: purpose, methods, key findings, and conclusions. Keep it under 250 words.',
    wordTarget: 250,
    emptyGuidance: 'Start with your research purpose, then briefly describe methods, key findings, and conclusions.',
    rubric: 'A good abstract includes: (1) Clear research purpose/question, (2) Brief methodology, (3) Key findings/results, (4) Main conclusions/implications.'
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
    rubric: 'Include: (1) Research design and rationale, (2) Participants/sample, (3) Materials/instruments, (4) Procedures, (5) Data analysis plan.'
  },
  results: {
    title: 'Results',
    placeholder: 'Present your findings objectively...',
    guidance: 'Report results without interpretation. Use tables, figures, and statistical analysis.',
    wordTarget: 800,
    emptyGuidance: 'Present findings objectively with tables, figures, and statistical results. No interpretation here.',
    rubric: 'Report findings objectively. Use clear tables/figures, report statistical tests, and organize by research questions.'
  },
  discussion: {
    title: 'Discussion',
    placeholder: 'Interpret your results and discuss their implications...',
    guidance: 'Explain what your results mean, compare with existing literature, and discuss implications.',
    wordTarget: 1200,
    emptyGuidance: 'Interpret results, compare with existing literature, discuss implications and limitations.',
    rubric: 'Structure: (1) Interpretation of key findings, (2) Comparison with existing literature, (3) Implications, (4) Limitations, (5) Future research directions.'
  },
  conclusion: {
    title: 'Conclusion',
    placeholder: 'Summarize your research and its contributions...',
    guidance: 'Summarize key findings, contributions to knowledge, and suggestions for future research.',
    wordTarget: 400,
    emptyGuidance: 'Summarize key findings, state contributions, and suggest future research directions.',
    rubric: 'Concisely summarize findings, highlight contributions, and suggest specific directions for future research.'
  },
  references: {
    title: 'References',
    placeholder: 'Your references will appear here automatically...',
    guidance: 'References are generated from your sources. Use proper citation format.',
    wordTarget: 0,
    emptyGuidance: 'References will be automatically generated.',
    rubric: 'Follow consistent citation style. Ensure all in-text citations have corresponding references.'
  }
};

export function ContentEditor({ activeSection, paper, onUpdate, onAiResult, onSaveStatusChange, onAddCitation }: ContentEditorProps) {
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [versions, setVersions] = useState<Version[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const section = sectionContent[activeSection] || {
    title: 'Section',
    placeholder: 'Start writing...',
    guidance: 'Write your content here.',
    wordTarget: 500,
    emptyGuidance: 'Start writing your content here.',
    rubric: 'Write clear, well-structured content for this section.'
  };

  const saveDraft = useCallback((sectionId: string, newContent: string) => {
    if (!paper?.id) return;
    setSaveStatus('saving');
    onSaveStatusChange?.('saving');
    setTimeout(() => {
      localStorage.setItem(`paper_${paper.id}_section_${sectionId}`, newContent);
      setSaveStatus('saved');
      onSaveStatusChange?.('saved');
    }, 300);
  }, [paper?.id, onSaveStatusChange]);

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || '';
    setContent(newContent);
    setWordCount(newContent.trim() ? newContent.trim().split(/\s+/).length : 0);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft(activeSection, newContent);
    }, 1000);
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
          <h2 className="text-xl font-semibold">{section.title}</h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm">{wordCount}/{section.wordTarget} words</div>
            <Button variant="outline" size="sm" onClick={() => saveDraft(activeSection, content)}>
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
            <Button variant="outline" size="sm" onClick={onAddCitation}>
              <BookOpen className="w-4 h-4 mr-2" /> Add Citation
            </Button>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{section.guidance}</p>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-2 border-b border-slate-200 bg-slate-50 sticky top-32 z-20">
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
        <div className="max-w-3xl mx-auto w-full">
          {wordCount === 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <Target className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Getting Started with {section.title}</h4>
                  <p className="text-sm">{section.emptyGuidance}</p>
                </div>
              </div>
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[500px] p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onInput={handleContentChange}
            style={{ fontSize: '16px', lineHeight: '1.75' }}
            data-placeholder={section.placeholder}
          />
        </div>
      </div>
    </div>
  );
}

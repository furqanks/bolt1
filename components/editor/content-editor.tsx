'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
  BookOpen,
  Target,
  Clock
} from 'lucide-react';

interface ContentEditorProps {
  activeSection: string;
  paper: any;
  onUpdate: (paper: any) => void;
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

export function ContentEditor({ activeSection, paper, onUpdate }: ContentEditorProps) {
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
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
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Brain className="w-4 h-4 mr-2" />
                AI Feedback
              </Button>
              
              <Button variant="outline" size="sm">
                <BookOpen className="w-4 h-4 mr-2" />
                Add Citation
              </Button>
            </div>
          </div>
        </div>
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
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  GripVertical,
  Circle,
  CheckCircle2,
  Clock,
  Target
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  status: 'not-started' | 'in-progress' | 'complete';
  wordCount: number;
  children?: Section[];
}

interface OutlinePanelProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

const defaultOutline: Section[] = [
  {
    id: 'abstract',
    title: 'Abstract',
    status: 'in-progress',
    wordCount: 150,
    children: []
  },
  {
    id: 'introduction',
    title: 'Introduction',
    status: 'in-progress',
    wordCount: 850,
    children: [
      { id: 'intro-background', title: 'Background', status: 'complete', wordCount: 400 },
      { id: 'intro-problem', title: 'Problem Statement', status: 'complete', wordCount: 300 },
      { id: 'intro-objectives', title: 'Research Objectives', status: 'in-progress', wordCount: 150 }
    ]
  },
  {
    id: 'literature-review',
    title: 'Literature Review',
    status: 'not-started',
    wordCount: 0,
    children: [
      { id: 'lit-theoretical', title: 'Theoretical Framework', status: 'not-started', wordCount: 0 },
      { id: 'lit-previous', title: 'Previous Studies', status: 'not-started', wordCount: 0 },
      { id: 'lit-gaps', title: 'Research Gaps', status: 'not-started', wordCount: 0 }
    ]
  },
  {
    id: 'methodology',
    title: 'Methodology',
    status: 'not-started',
    wordCount: 0,
    children: [
      { id: 'method-design', title: 'Research Design', status: 'not-started', wordCount: 0 },
      { id: 'method-participants', title: 'Participants', status: 'not-started', wordCount: 0 },
      { id: 'method-procedure', title: 'Procedure', status: 'not-started', wordCount: 0 },
      { id: 'method-analysis', title: 'Data Analysis', status: 'not-started', wordCount: 0 }
    ]
  },
  {
    id: 'results',
    title: 'Results',
    status: 'not-started',
    wordCount: 0,
    children: []
  },
  {
    id: 'discussion',
    title: 'Discussion',
    status: 'not-started',
    wordCount: 0,
    children: [
      { id: 'discussion-interpretation', title: 'Interpretation', status: 'not-started', wordCount: 0 },
      { id: 'discussion-implications', title: 'Implications', status: 'not-started', wordCount: 0 },
      { id: 'discussion-limitations', title: 'Limitations', status: 'not-started', wordCount: 0 }
    ]
  },
  {
    id: 'conclusion',
    title: 'Conclusion',
    status: 'not-started',
    wordCount: 0,
    children: []
  },
  {
    id: 'references',
    title: 'References',
    status: 'not-started',
    wordCount: 0,
    children: []
  }
];

export function OutlinePanel({ activeSection, onSectionChange }: OutlinePanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['introduction']));
  const [outline, setOutline] = useState<Section[]>(defaultOutline);

  const toggleExpanded = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getStatusIcon = (status: Section['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Circle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: Section['status'], isActive: boolean) => {
    if (isActive) {
      return 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-l-4 border-blue-500';
    }
    
    switch (status) {
      case 'complete':
        return 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20';
      case 'in-progress':
        return 'hover:bg-blue-50 dark:hover:bg-blue-900/20';
      default:
        return 'hover:bg-slate-50 dark:hover:bg-slate-700';
    }
  };

  const renderSection = (section: Section, level: number = 0) => {
    const isActive = section.id === activeSection;
    const hasChildren = section.children && section.children.length > 0;
    const isExpanded = expandedSections.has(section.id);

    return (
      <div key={section.id}>
        <div
          className={`
            flex items-center py-2 px-3 cursor-pointer group transition-colors
            ${getStatusColor(section.status, isActive)}
            ${level > 0 ? 'ml-6' : ''}
          `}
          onClick={() => onSectionChange(section.id)}
        >
          <div className="flex items-center flex-1 min-w-0">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(section.id);
                }}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded mr-1"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            )}
            
            {!hasChildren && <div className="w-5" />}
            
            <div className="mr-2">
              {getStatusIcon(section.status)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium truncate ${
                  isActive ? 'text-blue-900 dark:text-blue-100' : 'text-slate-900 dark:text-slate-100'
                }`}>
                  {section.title}
                </span>
                {section.wordCount > 0 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                    {section.wordCount}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-3 h-3 text-slate-400" />
          </div>
        </div>
        
        {hasChildren && isExpanded && section.children && (
          <div>
            {section.children.map(child => renderSection(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const totalWords = outline.reduce((total, section) => {
    const sectionWords = section.wordCount + (section.children?.reduce((childTotal, child) => childTotal + child.wordCount, 0) || 0);
    return total + sectionWords;
  }, 0);

  const completedSections = outline.filter(section => section.status === 'complete').length;
  const totalSections = outline.length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">Paper Outline</h3>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Progress Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-300">Progress</span>
            <span className="font-medium text-slate-900 dark:text-white">
              {completedSections}/{totalSections} sections
            </span>
          </div>
          
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(completedSections / totalSections) * 100}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
            <span>Total words: {totalWords.toLocaleString()}</span>
            <Badge variant="secondary" className="text-xs">
              Target: 8,000
            </Badge>
          </div>
        </div>
      </div>

      {/* Outline Tree */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {outline.map(section => renderSection(section))}
        </div>
        
        {/* Add Section Button */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        </div>
      </div>
    </div>
  );
}
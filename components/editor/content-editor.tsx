'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { OutlinePanel } from '@/components/editor/outline-panel';
import { AiPanel } from '@/components/editor/ai-panel';

import {
  Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote, Link,
  Menu, ChevronDown,
  PanelsLeft, PanelsRight
} from 'lucide-react';

/** Optional props kept to stay compatible with paper-editor.tsx */
interface ContentEditorProps {
  activeSection?: string;
  paper?: any;
  onUpdate?: (paper: any) => void;
  onAiResult?: (task: string, data: any) => void;
  onSaveStatusChange?: (status: 'idle' | 'saving' | 'saved') => void;
  onAddCitation?: () => void;
}

export function ContentEditor(props: ContentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState('');

  /** simple formatting using contentEditable */
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    setContent(e.currentTarget.textContent || '');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Section Header */}
      <div className="px-4 md:px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-16 z-30">
        <h2 className="text-lg md:text-xl font-semibold">Abstract</h2>
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300">
          Include: purpose, methods, key findings, and conclusions. Keep it under 250 words.
        </p>
      </div>

      {/* Toolbar (desktop + mobile) */}
      <div
        className="px-3 md:px-6 py-2 border-b border-slate-200 dark:border-slate-700
                   bg-slate-50 dark:bg-slate-800/50
                   sticky top-[112px] z-40"
      >
        {/* Desktop toolbar */}
        <div className="hidden md:flex items-center flex-wrap gap-1">
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

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = prompt('Enter URL:') || '';
              if (url) formatText('createLink', url);
            }}
          >
            <Link className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile toolbar */}
        <div className="md:hidden flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span className="inline-flex items-center">
                  <Menu className="w-4 h-4 mr-2" />
                  Formatting
                </span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => formatText('bold')}>
                <Bold className="w-4 h-4 mr-2" /> Bold
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => formatText('italic')}>
                <Italic className="w-4 h-4 mr-2" /> Italic
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => formatText('underline')}>
                <Underline className="w-4 h-4 mr-2" /> Underline
              </DropdownMenuItem>
              <Separator className="my-1" />
              <DropdownMenuItem onClick={() => formatText('justifyLeft')}>
                <AlignLeft className="w-4 h-4 mr-2" /> Align Left
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => formatText('justifyCenter')}>
                <AlignCenter className="w-4 h-4 mr-2" /> Align Center
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => formatText('justifyRight')}>
                <AlignRight className="w-4 h-4 mr-2" /> Align Right
              </DropdownMenuItem>
              <Separator className="my-1" />
              <DropdownMenuItem onClick={() => formatText('insertUnorderedList')}>
                <List className="w-4 h-4 mr-2" /> Bulleted List
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => formatText('insertOrderedList')}>
                <ListOrdered className="w-4 h-4 mr-2" /> Numbered List
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => formatText('formatBlock', 'blockquote')}>
                <Quote className="w-4 h-4 mr-2" /> Blockquote
              </DropdownMenuItem>
              <Separator className="my-1" />
              <DropdownMenuItem
                onClick={() => {
                  const url = prompt('Enter URL:') || '';
                  if (url) formatText('createLink', url);
                }}
              >
                <Link className="w-4 h-4 mr-2" /> Insert Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[400px] p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
          onInput={handleContentChange}
          style={{ fontSize: '16px', lineHeight: '1.75' }}
          data-placeholder="Write here…"
        />
      </div>

      {/* —— MOBILE DRAWERS —— */}
      {/* Left: Outline */}
      <div className="md:hidden fixed left-3 bottom-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" size="sm" className="shadow">
              <PanelsLeft className="w-4 h-4 mr-2" />
              Outline
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[90vw] sm:w-[420px]">
            <SheetHeader className="px-4 py-3 border-b">
              <SheetTitle>Paper Outline</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100vh-56px)] overflow-y-auto">
              {/* Your existing outline component */}
              <OutlinePanel
                activeSection={props.activeSection || 'abstract'}
                onSectionChange={() => {}}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Right: AI Assistant */}
      <div className="md:hidden fixed right-3 bottom-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" size="sm" className="shadow">
              <PanelsRight className="w-4 h-4 mr-2" />
              AI Assistant
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-[90vw] sm:w-[420px]">
            <SheetHeader className="px-4 py-3 border-b">
              <SheetTitle>AI Assistant</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100vh-56px)] overflow-y-auto">
              {/* Your existing AI panel component */}
              <AiPanel
                isCollapsed={false}
                onToggle={() => {}}
                aiResults={{}}
                onAiAction={() => {}}
                isLoading={false}
                currentTask={null}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Placeholder styles for contentEditable placeholder */}
      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

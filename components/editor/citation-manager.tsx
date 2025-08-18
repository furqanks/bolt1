'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  BookOpen, 
  ExternalLink, 
  Copy, 
  Edit, 
  Trash2,
  Download,
  Filter
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Source {
  id: string;
  type: 'book' | 'journal' | 'website' | 'conference' | 'thesis' | 'other';
  title: string;
  author: string;
  year: string;
  publisher?: string;
  journal?: string;
  volume?: string;
  pages?: string;
  url?: string;
  doi?: string;
  notes?: string;
  citationKey: string;
}

interface CitationManagerProps {
  paperId: string;
}

export function CitationManager({ paperId }: CitationManagerProps) {
  const [sources, setSources] = useState<Source[]>([
    {
      id: '1',
      type: 'journal',
      title: 'The Impact of AI on Educational Outcomes',
      author: 'Smith, J. & Johnson, M.',
      year: '2023',
      journal: 'Journal of Educational Technology',
      volume: '45',
      pages: '123-145',
      doi: '10.1016/j.edutech.2023.123456',
      citationKey: 'smith2023impact',
      notes: 'Key study on AI effectiveness in classroom settings'
    },
    {
      id: '2',
      type: 'book',
      title: 'Modern Educational Approaches',
      author: 'Brown, A.',
      year: '2022',
      publisher: 'Academic Press',
      citationKey: 'brown2022modern',
      notes: 'Comprehensive overview of contemporary teaching methods'
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [citationFormat, setCitationFormat] = useState('apa');
  const [showAddSource, setShowAddSource] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [doiInput, setDoiInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [newSource, setNewSource] = useState<Partial<Source>>({
    type: 'journal',
    title: '',
    author: '',
    year: '',
    publisher: '',
    journal: '',
    volume: '',
    pages: '',
    url: '',
    doi: '',
    notes: ''
  });

  const formatCitation = (source: Source, format: 'apa' | 'mla' = 'apa') => {
    if (format === 'apa') {
      switch (source.type) {
        case 'journal':
          return `${source.author} (${source.year}). ${source.title}. *${source.journal}*, *${source.volume}*, ${source.pages}. ${source.doi ? `https://doi.org/${source.doi}` : ''}`.trim();
        case 'book':
          return `${source.author} (${source.year}). *${source.title}*. ${source.publisher}.`;
        case 'website':
          return `${source.author} (${source.year}). ${source.title}. Retrieved from ${source.url}`;
        default:
          return `${source.author} (${source.year}). ${source.title}.`;
      }
    } else {
      // MLA format
      switch (source.type) {
        case 'journal':
          return `${source.author} "${source.title}." *${source.journal}*, vol. ${source.volume}, ${source.year}, pp. ${source.pages}.`;
        case 'book':
          return `${source.author} *${source.title}*. ${source.publisher}, ${source.year}.`;
        case 'website':
          return `${source.author} "${source.title}." *Web*, ${source.year}, ${source.url}.`;
        default:
          return `${source.author} "${source.title}." ${source.year}.`;
      }
    }
  };

  const handleAddSource = () => {
    if (!newSource.title || !newSource.author || !newSource.year) return;

    const source: Source = {
      id: Date.now().toString(),
      citationKey: `${newSource.author?.toLowerCase().split(',')[0].trim()}${newSource.year}${newSource.title?.toLowerCase().split(' ')[0]}`,
      ...newSource as Source
    };

    setSources([source, ...sources]);
    setNewSource({
      type: 'journal',
      title: '',
      author: '',
      year: '',
      publisher: '',
      journal: '',
      volume: '',
      pages: '',
      url: '',
      doi: '',
      notes: ''
    });
    setShowAddSource(false);
  };

  const handleDeleteSource = (id: string) => {
    setSources(sources.filter(s => s.id !== id));
  };

  const handleCopyCitation = (source: Source) => {
    navigator.clipboard.writeText(formatCitation(source, citationFormat as 'apa' | 'mla'));
  };

  const handleDoiImport = async () => {
    if (!doiInput.trim()) {
      toast.error('Please enter a DOI');
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch('/api/citations/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doi: doiInput.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resolve DOI');
      }

      // Pre-fill the add source form with metadata
      const { metadata } = data;
      setNewSource({
        type: metadata.type || 'journal',
        title: metadata.title || '',
        author: Array.isArray(metadata.authors) ? metadata.authors.join(', ') : metadata.authors || '',
        year: metadata.year || '',
        journal: metadata.journal || '',
        volume: metadata.volume || '',
        pages: metadata.pages || '',
        url: metadata.url || '',
        doi: metadata.doi || doiInput.trim(),
        publisher: metadata.publisher || '',
        notes: `Imported from DOI: ${doiInput.trim()}`
      });

      setDoiInput('');
      setShowAddSource(true);
      toast.success('DOI resolved successfully! Review and save the source.');
    } catch (error) {
      console.error('DOI import failed:', error);
      toast.error('Failed to resolve DOI. Please check the DOI and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const filteredSources = sources.filter(source => {
    const matchesSearch = source.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         source.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || source.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTypeIcon = (type: Source['type']) => {
    switch (type) {
      case 'journal':
        return '📄';
      case 'book':
        return '📚';
      case 'website':
        return '🌐';
      case 'conference':
        return '🎤';
      case 'thesis':
        return '🎓';
      default:
        return '📝';
    }
  };

  const getTypeColor = (type: Source['type']) => {
    switch (type) {
      case 'journal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'book':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'website':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'conference':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'thesis':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sources & Citations</h2>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Manage your research sources and generate citations
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Select value={citationFormat} onValueChange={setCitationFormat}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apa">APA Style</SelectItem>
              <SelectItem value="mla">MLA Style</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showAddSource} onOpenChange={setShowAddSource}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Source
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Source</DialogTitle>
                <DialogDescription>
                  Enter the details for your new source. All fields marked with * are required.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="source-type">Source Type *</Label>
                    <Select value={newSource.type} onValueChange={(value) => setNewSource({...newSource, type: value as Source['type']})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="journal">Journal Article</SelectItem>
                        <SelectItem value="book">Book</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="conference">Conference Paper</SelectItem>
                        <SelectItem value="thesis">Thesis/Dissertation</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="year">Year *</Label>
                    <Input
                      id="year"
                      type="number"
                      value={newSource.year}
                      onChange={(e) => setNewSource({...newSource, year: e.target.value})}
                      placeholder="2023"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newSource.title}
                    onChange={(e) => setNewSource({...newSource, title: e.target.value})}
                    placeholder="Enter the title..."
                  />
                </div>

                <div>
                  <Label htmlFor="author">Author(s) *</Label>
                  <Input
                    id="author"
                    value={newSource.author}
                    onChange={(e) => setNewSource({...newSource, author: e.target.value})}
                    placeholder="Last, F. M. & Last, F. M."
                  />
                </div>

                {newSource.type === 'journal' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="journal">Journal Name</Label>
                      <Input
                        id="journal"
                        value={newSource.journal}
                        onChange={(e) => setNewSource({...newSource, journal: e.target.value})}
                        placeholder="Journal name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="volume">Volume</Label>
                      <Input
                        id="volume"
                        value={newSource.volume}
                        onChange={(e) => setNewSource({...newSource, volume: e.target.value})}
                        placeholder="45"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pages">Pages</Label>
                      <Input
                        id="pages"
                        value={newSource.pages}
                        onChange={(e) => setNewSource({...newSource, pages: e.target.value})}
                        placeholder="123-145"
                      />
                    </div>
                  </div>
                )}

                {newSource.type === 'book' && (
                  <div>
                    <Label htmlFor="publisher">Publisher</Label>
                    <Input
                      id="publisher"
                      value={newSource.publisher}
                      onChange={(e) => setNewSource({...newSource, publisher: e.target.value})}
                      placeholder="Publisher name"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      type="url"
                      value={newSource.url}
                      onChange={(e) => setNewSource({...newSource, url: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="doi">DOI</Label>
                    <Input
                      id="doi"
                      value={newSource.doi}
                      onChange={(e) => setNewSource({...newSource, doi: e.target.value})}
                      placeholder="10.1016/..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newSource.notes}
                    onChange={(e) => setNewSource({...newSource, notes: e.target.value})}
                    placeholder="Personal notes about this source..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddSource(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleAddSource}>
                  Add Source
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* DOI Import */}
      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Quick Import</h3>
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <Input
              placeholder="Enter DOI (e.g., 10.1016/j.example.2023.123456)"
              value={doiInput}
              onChange={(e) => setDoiInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleDoiImport()}
            />
          </div>
          <Button 
            onClick={handleDoiImport}
            disabled={isImporting || !doiInput.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isImporting ? 'Importing...' : 'Import by DOI'}
          </Button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Import citation metadata automatically using a DOI
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search sources by title or author..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="journal">Journal</SelectItem>
            <SelectItem value="book">Book</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="conference">Conference</SelectItem>
            <SelectItem value="thesis">Thesis</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Bibliography
        </Button>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto">
        {filteredSources.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              {searchTerm ? 'No sources found' : 'No sources yet'}
            </h4>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Add your first source to get started with citations'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowAddSource(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Source
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSources.map((source) => (
              <Card key={source.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getTypeIcon(source.type)}</span>
                        <Badge variant="secondary" className={getTypeColor(source.type)}>
                          {source.type}
                        </Badge>
                        <Badge variant="outline" className="font-mono text-xs">
                          {source.citationKey}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg text-slate-900 dark:text-white mb-1">
                        {source.title}
                      </CardTitle>
                      <CardDescription>
                        {source.author} ({source.year})
                        {source.journal && ` • ${source.journal}`}
                        {source.publisher && ` • ${source.publisher}`}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {source.url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={source.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleCopyCitation(source)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteSource(source.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {citationFormat.toUpperCase()} Citation:
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => handleCopyCitation(source)}>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {formatCitation(source, citationFormat as 'apa' | 'mla')}
                    </p>
                  </div>
                  
                  {source.notes && (
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes:</span>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{source.notes}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-4">
                    <Button size="sm" variant="outline">
                      Insert Citation
                    </Button>
                    <Button size="sm" variant="outline">
                      Add to Paper
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
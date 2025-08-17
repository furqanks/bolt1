'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useTheme } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  LogOut, 
  Settings, 
  User,
  Calendar,
  Clock,
  Target,
  BookOpen,
  Brain,
  Moon,
  Sun
} from 'lucide-react';
import { CreatePaperModal } from './create-paper-modal';

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
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Load papers from localStorage
    const savedPapers = localStorage.getItem('researchflow_papers');
    if (savedPapers) {
      setPapers(JSON.parse(savedPapers));
    } else {
      // Set sample papers for demo
      const samplePapers: Paper[] = [
        {
          id: '1',
          title: 'The Impact of AI on Modern Education Systems',
          topic: 'Educational Technology',
          type: 'Research Paper',
          createdAt: '2024-01-15',
          lastModified: '2024-01-20',
          progress: 65,
          dueDate: '2024-02-15',
          wordCount: 3500
        },
        {
          id: '2',
          title: 'Climate Change Adaptation Strategies',
          topic: 'Environmental Science',
          type: 'Literature Review',
          createdAt: '2024-01-10',
          lastModified: '2024-01-18',
          progress: 30,
          dueDate: '2024-03-01',
          wordCount: 1200
        }
      ];
      setPapers(samplePapers);
      localStorage.setItem('researchflow_papers', JSON.stringify(samplePapers));
    }
    
    setIsLoading(false);
  }, [user, router]);

  const handleCreatePaper = (paperData: any) => {
    const newPaper: Paper = {
      id: Date.now().toString(),
      title: paperData.title,
      topic: paperData.topic,
      type: paperData.type,
      createdAt: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      progress: 0,
      dueDate: paperData.dueDate,
      wordCount: 0
    };

    const updatedPapers = [newPaper, ...papers];
    setPapers(updatedPapers);
    localStorage.setItem('researchflow_papers', JSON.stringify(updatedPapers));
    setShowCreateModal(false);
  };

  const filteredPapers = papers.filter(paper =>
    paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress < 25) return 'bg-red-500';
    if (progress < 50) return 'bg-yellow-500';
    if (progress < 75) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg animate-pulse mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">ResearchFlow</h1>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome back, {user?.name}! 👋
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Continue working on your research papers or start a new one.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{papers.length}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Total Papers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {papers.filter(p => p.progress >= 100).length}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {papers.filter(p => p.progress > 0 && p.progress < 100).length}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Brain className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">7/10</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">AI Reviews Left</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Papers Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Your Research Papers</h3>
              <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Paper
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search papers..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Papers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPapers.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    {searchTerm ? 'No papers found' : 'No papers yet'}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    {searchTerm ? 'Try adjusting your search terms' : 'Create your first research paper to get started'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Paper
                    </Button>
                  )}
                </div>
              ) : (
                filteredPapers.map((paper) => (
                  <Card key={paper.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => router.push(`/editor/${paper.id}`)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                            {paper.title}
                          </CardTitle>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{paper.topic}</p>
                        </div>
                        <Badge variant="secondary" className="ml-2 shrink-0">{paper.type}</Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-300">Progress</span>
                            <span className="font-medium text-slate-900 dark:text-white">{paper.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getProgressColor(paper.progress)}`}
                              style={{ width: `${paper.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Meta Information */}
                        <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-300">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>Created {formatDate(paper.createdAt)}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>Modified {formatDate(paper.lastModified)}</span>
                          </div>
                        </div>

                        {paper.dueDate && (
                          <div className="flex items-center text-sm text-orange-600 dark:text-orange-400">
                            <Target className="w-4 h-4 mr-1" />
                            <span>Due {formatDate(paper.dueDate)}</span>
                          </div>
                        )}

                        <div className="text-sm text-slate-600 dark:text-slate-300">
                          {paper.wordCount.toLocaleString()} words
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-slate-900 dark:text-white">Edited "AI Education Impact"</p>
                    <p className="text-slate-500 text-xs">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <div>
                    <p className="text-slate-900 dark:text-white">Created new paper</p>
                    <p className="text-slate-500 text-xs">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="text-slate-900 dark:text-white">AI feedback received</p>
                    <p className="text-slate-500 text-xs">2 days ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Prompt */}
            <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <CardContent className="p-6">
                <div className="text-center">
                  <Brain className="w-10 h-10 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Unlock AI Features</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    Get unlimited AI feedback, advanced citations, and premium templates.
                  </p>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 w-full">
                    Upgrade to Premium
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Paper Modal */}
      <CreatePaperModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePaper}
      />
    </div>
  );
}
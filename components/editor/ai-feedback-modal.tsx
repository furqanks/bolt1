'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  Target, 
  BookOpen,
  Zap,
  Crown,
  ArrowRight
} from 'lucide-react';

interface AiFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: string;
}

export function AiFeedbackModal({ isOpen, onClose, section }: AiFeedbackModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [usageCount, setUsageCount] = useState(3);
  const maxUsage = 10;

  const handleGenerateFeedback = async () => {
    if (usageCount >= maxUsage) return;
    
    setIsGenerating(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    setUsageCount(prev => prev + 1);
  };

  const mockFeedback = [
    {
      type: 'strength',
      icon: CheckCircle,
      title: 'Clear Topic Introduction',
      description: 'Your opening paragraph effectively introduces the research topic and establishes context.',
      color: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      type: 'improvement',
      icon: AlertTriangle,
      title: 'Strengthen Your Thesis',
      description: 'Consider making your thesis statement more specific and arguable. Current version is too broad.',
      color: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      type: 'suggestion',
      icon: Target,
      title: 'Add Supporting Evidence',
      description: 'Include more recent studies to support your claims. Consider adding 2-3 citations from 2022-2023.',
      color: 'text-blue-600 dark:text-blue-400'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
            AI Feedback for {section.charAt(0).toUpperCase() + section.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Get intelligent suggestions to improve your writing quality and academic rigor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Usage Tracker */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium">Monthly Usage</span>
                </div>
                <Badge variant={usageCount >= maxUsage ? "destructive" : "secondary"}>
                  {usageCount}/{maxUsage} reviews used
                </Badge>
              </div>
              <Progress value={(usageCount / maxUsage) * 100} className="h-2" />
              {usageCount >= maxUsage && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  You've reached your monthly limit. Upgrade to get unlimited AI reviews.
                </p>
              )}
            </CardContent>
          </Card>

          {usageCount < maxUsage ? (
            <>
              {!isGenerating && usageCount < maxUsage && (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Ready to Analyze Your Content
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
                    Our AI will review your {section} section and provide specific feedback on clarity, 
                    structure, and academic quality.
                  </p>
                  <Button onClick={handleGenerateFeedback} className="bg-purple-600 hover:bg-purple-700">
                    <Brain className="w-4 h-4 mr-2" />
                    Get AI Feedback
                  </Button>
                </div>
              )}

              {isGenerating && (
                <div className="text-center py-8">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg animate-pulse mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Analyzing Your Content...
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Our AI is reviewing your writing for clarity, structure, and academic rigor.
                  </p>
                  <Progress value={75} className="w-48 mx-auto mt-4" />
                </div>
              )}

              {!isGenerating && usageCount > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Feedback Results
                    </h3>
                    <Badge variant="secondary">Generated just now</Badge>
                  </div>

                  {mockFeedback.map((feedback, index) => {
                    const IconComponent = feedback.icon;
                    return (
                      <Card key={index}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800`}>
                              <IconComponent className={`w-4 h-4 ${feedback.color}`} />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base">{feedback.title}</CardTitle>
                              <CardDescription className="mt-1">
                                {feedback.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}

                  <Card className="bg-slate-50 dark:bg-slate-800">
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <BookOpen className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        <span className="text-sm font-medium">Overall Score</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <Progress value={78} className="h-2" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">78/100</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                        Good foundation with room for improvement in specificity and evidence.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          ) : (
            /* Upgrade Prompt */
            <Card className="border-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Crown className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Unlock Unlimited AI Reviews
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-6">
                    You've used all your free AI reviews this month. Upgrade to Premium for unlimited 
                    feedback, advanced writing insights, and more powerful features.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Unlimited AI feedback</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Advanced writing analytics</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Plagiarism detection</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Priority support</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Premium
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                      Maybe Later
                    </Button>
                  </div>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                    7-day free trial • Cancel anytime • $9/month
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
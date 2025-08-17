'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Brain, 
  BookOpen, 
  Users, 
  Check, 
  Star, 
  ArrowRight,
  PenTool,
  Search,
  Target
} from 'lucide-react';
import { useTheme } from '@/app/providers';

export function LandingPage() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">ResearchFlow</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-blue-600 dark:text-slate-300 transition-colors">Features</a>
              <a href="#pricing" className="text-slate-600 hover:text-blue-600 dark:text-slate-300 transition-colors">Pricing</a>
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-blue-600 hover:bg-blue-700">Start Free Trial</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
            ✨ AI-Powered Research Assistant
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
            Write Better Research Papers with 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600"> AI-Powered Assistance</span>
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Streamline your academic writing with structured outlines, intelligent feedback, and comprehensive citation management. 
            Perfect for students, researchers, and academics.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg">
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 py-3 text-lg">
              Watch Demo
            </Button>
          </div>
          
          <div className="mt-8 text-sm text-slate-500 dark:text-slate-400">
            No credit card required • 7-day free trial • Cancel anytime
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white dark:bg-slate-800">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Everything you need to excel in academic writing
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              From first draft to final submission, ResearchFlow provides the tools and guidance you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Structured Outlines</CardTitle>
                <CardDescription>
                  Pre-built academic templates with customizable sections, progress tracking, and drag-and-drop organization.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle>AI-Powered Feedback</CardTitle>
                <CardDescription>
                  Get intelligent suggestions for improving clarity, argument strength, and academic writing style.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Citation Management</CardTitle>
                <CardDescription>
                  Organize sources, generate citations in APA/MLA format, and maintain a comprehensive bibliography.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <PenTool className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle>Rich Text Editor</CardTitle>
                <CardDescription>
                  Professional writing environment with formatting tools, word count tracking, and auto-save functionality.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <CardTitle>Research Organization</CardTitle>
                <CardDescription>
                  Keep track of multiple papers, search through your work, and manage deadlines with ease.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle>Progress Tracking</CardTitle>
                <CardDescription>
                  Visual progress indicators, section completion status, and productivity insights to stay motivated.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Start free, upgrade when you need more advanced features.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <Card className="relative border-2 border-blue-200 dark:border-blue-800">
              <CardHeader className="text-center">
                <Badge className="bg-blue-600 text-white mb-4 w-fit mx-auto">Most Popular</Badge>
                <CardTitle className="text-2xl">Premium Plan</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">$9</span>
                  <span className="text-slate-500 dark:text-slate-400">/month</span>
                </div>
                <CardDescription>Everything you need for academic success</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
                    <span>Unlimited research papers</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
                    <span>AI-powered feedback & suggestions</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
                    <span>Advanced citation management</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
                    <span>Export to PDF & Word</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
                    <span>Priority customer support</span>
                  </li>
                </ul>
                
                <Link href="/signup">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Start 7-Day Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-white dark:bg-slate-800">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Trusted by students worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  "ResearchFlow transformed my thesis writing process. The structured outlines and AI feedback saved me countless hours."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    S
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Sarah Chen</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">PhD Student, MIT</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  "The citation management feature is incredible. No more manual formatting - it just works perfectly every time."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    M
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Marcus Johnson</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Graduate Student, Stanford</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  "As a professor, I recommend ResearchFlow to all my students. It helps them write better, more organized papers."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    E
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Dr. Emily Rodriguez</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Professor, Harvard University</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">ResearchFlow</span>
            </div>
            
            <div className="text-slate-400 text-sm">
              © 2025 ResearchFlow. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
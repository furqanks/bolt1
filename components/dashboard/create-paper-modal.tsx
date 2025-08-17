'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CreatePaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function CreatePaperModal({ isOpen, onClose, onSubmit }: CreatePaperModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    type: '',
    dueDate: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ title: '', topic: '', type: '', dueDate: '', description: '' });
  };

  const handleClose = () => {
    setFormData({ title: '', topic: '', type: '', dueDate: '', description: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Research Paper</DialogTitle>
          <DialogDescription>
            Set up your research paper with the basic information. You can always modify these details later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Paper Title *</Label>
              <Input
                id="title"
                placeholder="Enter your paper title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Research Topic/Subject *</Label>
              <Input
                id="topic"
                placeholder="e.g., Educational Technology, Environmental Science..."
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Paper Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select paper type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="research-paper">Research Paper</SelectItem>
                  <SelectItem value="literature-review">Literature Review</SelectItem>
                  <SelectItem value="thesis-chapter">Thesis Chapter</SelectItem>
                  <SelectItem value="case-study">Case Study</SelectItem>
                  <SelectItem value="conference-paper">Conference Paper</SelectItem>
                  <SelectItem value="journal-article">Journal Article</SelectItem>
                  <SelectItem value="dissertation">Dissertation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Brief Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe your research focus, objectives, or key questions..."
                className="resize-none"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.title || !formData.topic || !formData.type}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Paper
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
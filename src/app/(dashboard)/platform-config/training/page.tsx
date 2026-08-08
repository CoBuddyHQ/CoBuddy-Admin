'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useTraining } from '@/modules/platform-config/training/hooks/useTraining';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, PlayCircle } from 'lucide-react';
import { getLocalizedText } from '@/lib/i18n/getLocalizedText';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function TrainingPage() {
  const { lessons, quizStats, isLoading, updateStatus, deleteLesson, createLesson } = useTraining();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    titleEn: '',
    category: 'SAFETY' as any,
    contentEn: ''
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createLesson({
      title: { en: formData.titleEn },
      content: { en: formData.contentEn },
      category: formData.category
    });
    setOpen(false);
    setFormData({ titleEn: '', category: 'SAFETY', contentEn: '' });
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training & Content Management"
        description="Manage onboarding materials, safety quizzes, and best practice guidelines for companions."
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Quiz Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{quizStats?.totalQuestions}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Passing requirement: {quizStats?.passCriteriaPercentage}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Certified Companions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{quizStats?.activeCompanionsPassed.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Have passed the active safety quiz
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{lessons.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {lessons.filter(l => l.status === 'PUBLISHED').length} Published
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Training Modules</CardTitle>
              <CardDescription>Create and manage video or text-based training lessons.</CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button size="sm">Create New Lesson</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Training Lesson</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Title (English)</Label>
                    <Input required value={formData.titleEn} onChange={e => setFormData({ ...formData, titleEn: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v: any) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAFETY">Safety</SelectItem>
                        <SelectItem value="BEST_PRACTICES">Best Practices</SelectItem>
                        <SelectItem value="GUIDELINES">Guidelines</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Content/Description (English)</Label>
                    <Textarea required value={formData.contentEn} onChange={e => setFormData({ ...formData, contentEn: e.target.value })} />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="submit">Create Draft</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lesson Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Completions</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{getLocalizedText(lesson.title)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{lesson.category}</Badge>
                  </TableCell>
                  <TableCell>{lesson.completionCount.toLocaleString()}</TableCell>
                  <TableCell>{lesson.lastUpdated}</TableCell>
                  <TableCell>
                    <Badge variant={lesson.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                      {lesson.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" title="Edit Content">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={lesson.status === 'PUBLISHED' ? "secondary" : "default"}
                        size="sm"
                        onClick={() => updateStatus({ id: lesson.id, status: lesson.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' })}
                      >
                        {lesson.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteLesson(lesson.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

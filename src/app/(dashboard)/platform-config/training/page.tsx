'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useTraining } from '@/modules/platform-config/training/hooks/useTraining';
import { useMasterData } from '@/modules/system/master-data/hooks/useMasterData';
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
import { EmptyState } from '@/components/ui/empty-state';
import { AppLanguage } from '@/modules/system/master-data/types';

function getMissingLanguages(nameObj: Record<string, string>, appLanguages: AppLanguage[]) {
  const activeLangs = appLanguages.filter(l => l.active);
  return activeLangs.filter(l => !nameObj[l.code]).map(l => l.name);
}

export default function TrainingPage() {
  const { lessons, quizStats, isLoading, updateStatus, deleteLesson, createLesson } = useTraining();
  const { appLanguages } = useMasterData();
  const activeLangs = appLanguages?.filter(l => l.active) || [];

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    titles: {} as Record<string, string>,
    contents: {} as Record<string, string>,
    category: 'SAFETY' as any
  });
  
  const [editLesson, setEditLesson] = useState<any>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.titles['en'] && formData.contents['en']) {
      createLesson({
        title: formData.titles,
        content: formData.contents,
        category: formData.category
      });
      setOpen(false);
      setFormData({ titles: {}, contents: {}, category: 'SAFETY' });
    }
  };

  const handleEditTranslations = (lesson: any) => {
    setFormData({
      titles: { ...lesson.title },
      contents: { ...lesson.content },
      category: lesson.category
    });
    setEditLesson(lesson);
    setOpen(true);
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
            <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) { setEditLesson(null); setFormData({ titles: {}, contents: {}, category: 'SAFETY' }); } }}>
              <Button size="sm" onClick={() => setOpen(true)}>Create New Lesson</Button>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editLesson ? 'Edit Training Lesson' : 'Create Training Lesson'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 pt-4">
                  <div className="space-y-4 border p-4 rounded-md">
                    <h4 className="text-sm font-medium">Titles</h4>
                    {activeLangs.map(lang => (
                      <div key={lang.code} className="space-y-2">
                        <Label>Title ({lang.name}){lang.code === 'en' ? ' *' : ''}</Label>
                        <Input required={lang.code === 'en'} value={formData.titles[lang.code] || ''} onChange={e => setFormData({ ...formData, titles: { ...formData.titles, [lang.code]: e.target.value } })} />
                      </div>
                    ))}
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
                  
                  <div className="space-y-4 border p-4 rounded-md">
                    <h4 className="text-sm font-medium">Content / Descriptions</h4>
                    {activeLangs.map(lang => (
                      <div key={lang.code} className="space-y-2">
                        <Label>Content ({lang.name}){lang.code === 'en' ? ' *' : ''}</Label>
                        <Textarea required={lang.code === 'en'} value={formData.contents[lang.code] || ''} onChange={e => setFormData({ ...formData, contents: { ...formData.contents, [lang.code]: e.target.value } })} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="submit">{editLesson ? 'Save Changes' : 'Create Draft'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {lessons.length === 0 ? (
            <EmptyState title="No lessons found" description="Create a new training lesson to get started." />
          ) : (
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
                {lessons.map((lesson) => {
                  const missing = getMissingLanguages(lesson.title, appLanguages || []);
                  return (
                    <TableRow key={lesson.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <PlayCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{getLocalizedText(lesson.title, 'en')}</span>
                          </div>
                          {missing.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive" className="text-[10px]">Missing: {missing.join(', ')}</Badge>
                              <Button variant="link" size="sm" className="h-4 p-0 text-[10px]" onClick={() => handleEditTranslations(lesson)}>Edit Translations</Button>
                            </div>
                          )}
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
                          <Button variant="outline" size="sm" title="Edit Content" onClick={() => handleEditTranslations(lesson)}>
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
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

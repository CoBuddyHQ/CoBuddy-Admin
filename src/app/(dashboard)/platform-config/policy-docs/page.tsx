'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { usePolicyDocs } from '@/modules/platform-config/policy-docs/hooks/usePolicyDocs';
import { useMasterData } from '@/modules/system/master-data/hooks/useMasterData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, CheckCircle, Edit } from 'lucide-react';
import { getLocalizedText } from '@/lib/i18n/getLocalizedText';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import { AppLanguage } from '@/modules/system/master-data/types';

function getMissingLanguages(nameObj: Record<string, string>, appLanguages: AppLanguage[]) {
  const activeLangs = appLanguages.filter(l => l.active);
  return activeLangs.filter(l => !nameObj[l.code]).map(l => l.name);
}

export default function PolicyDocsPage() {
  const { policies, consentLogs, settings, isLoading, updateStatus, updateSettings, isUpdatingSettings, createDocument } = usePolicyDocs();
  const { appLanguages } = useMasterData();
  const activeLangs = appLanguages?.filter(l => l.active) || [];
  
  const [formData, setFormData] = useState<any>(null);
  
  const [open, setOpen] = useState(false);
  const [docForm, setDocForm] = useState({
    titles: {} as Record<string, string>,
    contents: {} as Record<string, string>,
    type: 'TERMS_OF_SERVICE' as any
  });
  const [editDoc, setEditDoc] = useState<any>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  if (isLoading || (settings && !formData)) return <div className="p-6">Loading...</div>;

  const handleSubmitSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) updateSettings(formData);
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (docForm.titles['en'] && docForm.contents['en']) {
      createDocument({
        title: docForm.titles,
        content: docForm.contents,
        type: docForm.type
      });
      setOpen(false);
      setDocForm({ titles: {}, contents: {}, type: 'TERMS_OF_SERVICE' });
    }
  };

  const handleEditTranslations = (doc: any) => {
    setDocForm({
      titles: { ...doc.title },
      contents: { ...doc.content },
      type: doc.type
    });
    setEditDoc(doc);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Policy & Legal Documents"
        description="Manage T&C, Privacy Policies, track user consent logs, and global legal settings."
      />

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="documents">Documents & Consents</TabsTrigger>
          <TabsTrigger value="settings">Legal Links & Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Active Documents</CardTitle>
                  <CardDescription>Draft and publish legal platform documents.</CardDescription>
                </div>
                <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) { setEditDoc(null); setDocForm({ titles: {}, contents: {}, type: 'TERMS_OF_SERVICE' }); } }}>
                  <Button size="sm" onClick={() => setOpen(true)}>Create New Document</Button>
                  <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editDoc ? 'Edit Document' : 'Create Document'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateDocument} className="space-y-4 pt-4">
                      <div className="space-y-4 border p-4 rounded-md">
                        <h4 className="text-sm font-medium">Titles</h4>
                        {activeLangs.map(lang => (
                          <div key={lang.code} className="space-y-2">
                            <Label>Title ({lang.name}){lang.code === 'en' ? ' *' : ''}</Label>
                            <Input required={lang.code === 'en'} value={docForm.titles[lang.code] || ''} onChange={e => setDocForm({ ...docForm, titles: { ...docForm.titles, [lang.code]: e.target.value } })} />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <Label>Document Type</Label>
                        <Select value={docForm.type} onValueChange={(v: any) => setDocForm({ ...docForm, type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TERMS_OF_SERVICE">Terms of Service</SelectItem>
                            <SelectItem value="PRIVACY_POLICY">Privacy Policy</SelectItem>
                            <SelectItem value="COMMUNITY_GUIDELINES">Community Guidelines</SelectItem>
                            <SelectItem value="REFUND_POLICY">Refund Policy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-4 border p-4 rounded-md">
                        <h4 className="text-sm font-medium">Content</h4>
                        {activeLangs.map(lang => (
                          <div key={lang.code} className="space-y-2">
                            <Label>Content ({lang.name}){lang.code === 'en' ? ' *' : ''}</Label>
                            <Textarea required={lang.code === 'en'} value={docForm.contents[lang.code] || ''} onChange={e => setDocForm({ ...docForm, contents: { ...docForm.contents, [lang.code]: e.target.value } })} />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button type="submit">{editDoc ? 'Save Changes' : 'Create Draft'}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {policies.length === 0 ? (
                <EmptyState title="No documents found" description="Create a new document to get started." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Consents Logged</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.map((policy) => {
                      const missing = getMissingLanguages(policy.title, appLanguages || []);
                      return (
                        <TableRow key={policy.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{policy.type.replace(/_/g, ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span>{getLocalizedText(policy.title, 'en')}</span>
                              {missing.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <Badge variant="destructive" className="text-[10px]">Missing: {missing.join(', ')}</Badge>
                                  <Button variant="link" size="sm" className="h-4 p-0 text-[10px]" onClick={() => handleEditTranslations(policy)}>Edit Translations</Button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{policy.version}</Badge>
                          </TableCell>
                          <TableCell>{policy.lastUpdated}</TableCell>
                          <TableCell>{policy.consentCount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={
                              policy.publishStatus === 'PUBLISHED' ? 'default' : 
                              policy.publishStatus === 'ARCHIVED' ? 'secondary' : 'outline'
                            }>
                              {policy.publishStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" title="Edit Content" onClick={() => handleEditTranslations(policy)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              {policy.publishStatus === 'DRAFT' && (
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => updateStatus({ id: policy.id, status: 'PUBLISHED' })}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" /> Publish
                                </Button>
                              )}
                              {policy.publishStatus === 'PUBLISHED' && (
                                <Button 
                                  variant="secondary" 
                                  size="sm"
                                  onClick={() => updateStatus({ id: policy.id, status: 'ARCHIVED' })}
                                >
                                  Archive
                                </Button>
                              )}
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

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Consent Audit Trail</CardTitle>
                  <CardDescription>Immutable log of user policy acceptances.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  import('@/lib/exportCsv').then(m => m.exportToCsv(consentLogs, `policy-docs-consent-logs-${new Date().toISOString().split('T')[0]}.csv`));
                }}>
                  <Download className="h-4 w-4 mr-1" /> Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {consentLogs.length === 0 ? (
                <EmptyState title="No logs found" description="No consent logs are available." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Log ID</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consentLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">{log.id}</TableCell>
                        <TableCell className="font-mono text-xs">{log.userId}</TableCell>
                        <TableCell>{log.documentType.replace(/_/g, ' ')}</TableCell>
                        <TableCell><Badge variant="outline">{log.documentVersion}</Badge></TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{log.ipAddress}</TableCell>
                        <TableCell className="text-sm">{new Date(log.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Legal Settings & Contacts</CardTitle>
              <CardDescription>Global legal and support contact details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitSettings} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input type="email" value={formData?.contactEmail || ''} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Phone</Label>
                    <Input type="tel" value={formData?.supportPhone || ''} onChange={e => setFormData({ ...formData, supportPhone: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Terms URL</Label>
                  <Input type="url" value={formData?.termsUrl || ''} onChange={e => setFormData({ ...formData, termsUrl: e.target.value })} required />
                </div>

                <div className="space-y-2">
                  <Label>Privacy URL</Label>
                  <Input type="url" value={formData?.privacyUrl || ''} onChange={e => setFormData({ ...formData, privacyUrl: e.target.value })} required />
                </div>

                <Button type="submit" disabled={isUpdatingSettings} className="w-full mt-4">
                  {isUpdatingSettings ? 'Saving...' : 'Save Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

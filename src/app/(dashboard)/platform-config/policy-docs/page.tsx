'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { usePolicyDocs } from '@/modules/platform-config/policy-docs/hooks/usePolicyDocs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, CheckCircle } from 'lucide-react';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PolicyDocsPage() {
  const { policies, consentLogs, settings, isLoading, updateStatus, updateSettings, isUpdatingSettings } = usePolicyDocs();
  const [formData, setFormData] = useState<any>(null);

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
                <Button size="sm">Create New Document</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Consents Logged</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{policy.type.replace(/_/g, ' ')}</span>
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Consent Audit Trail</CardTitle>
                  <CardDescription>Immutable log of user policy acceptances.</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" /> Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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

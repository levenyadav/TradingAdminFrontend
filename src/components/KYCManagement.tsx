import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Textarea } from './ui/textarea';
import { Search, Download, FileText, Image, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { getAllKYCApplications, getKYCDetails, approveKYC, rejectKYC, requestKYCChanges } from '../lib/api';
import { config } from '../lib/config';
import type { KYCApplication, KYCDetails, APIResponse } from '../lib/types';
import { Skeleton } from './ui/skeleton';
import { toast } from 'sonner@2.0.3';
import { Label } from './ui/label';

export function KYCManagement() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [applications, setApplications] = useState<KYCApplication[]>([]);
  const [selectedKYC, setSelectedKYC] = useState<KYCDetails | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchApplications = async () => {
    try {
      setError(null);
      const params: any = { limit: 50 };
      if (activeTab !== 'all') params.status = activeTab;
      if (searchQuery) params.search = searchQuery;

      const response: APIResponse<any> = await getAllKYCApplications(params);
      setApplications(response.data.applications || []);
      setPagination(response.data.metadata?.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load KYC applications');
      console.error('KYC error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKYCDetail = async (kycId: string) => {
    try {
      const response: APIResponse<KYCDetails> = await getKYCDetails(kycId);
      setSelectedKYC(response.data);
    } catch (err: any) {
      toast.error('Failed to load KYC details');
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchApplications();
  }, [activeTab]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchApplications();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleApprove = async () => {
    if (!selectedKYC) return;
    try {
      setActionLoading(true);
      await approveKYC(selectedKYC.kycId, reviewNotes);
      toast.success('KYC application approved');
      setSelectedKYC(null);
      setReviewNotes('');
      fetchApplications();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedKYC || !reviewNotes) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      setActionLoading(true);
      await rejectKYC(selectedKYC.kycId, reviewNotes);
      toast.success('KYC application rejected');
      setSelectedKYC(null);
      setReviewNotes('');
      fetchApplications();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedKYC || !reviewNotes) {
      toast.error('Please provide a reason for requesting changes');
      return;
    }
    try {
      setActionLoading(true);
      await requestKYCChanges(selectedKYC.kycId, reviewNotes);
      toast.success('Change request sent to user');
      setSelectedKYC(null);
      setReviewNotes('');
      fetchApplications();
    } catch (err: any) {
      toast.error(err.message || 'Failed to request changes');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: string; icon: any; label: string }> = {
      pending: { variant: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, label: 'Pending' },
      approved: { variant: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Approved' },
      verified: { variant: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Verified' },
      rejected: { variant: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Rejected' },
      pending_review: { variant: 'bg-blue-100 text-blue-700 border-blue-200', icon: AlertCircle, label: 'Resubmitted' },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.variant} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTabCount = (status: string) => {
    if (status === 'all') return applications.length;
    return applications.filter(app => app.status === status).length;
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    return `${config.apiUrl.replace('/api', '')}/${path}`;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    const isConnectionError = error.includes('Cannot connect') || error.includes('backend');
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Alert variant={isConnectionError ? undefined : "destructive"} className={isConnectionError ? "border-blue-500 bg-blue-50" : ""}>
          <AlertCircle className={`h-4 w-4 ${isConnectionError ? 'text-blue-600' : ''}`} />
          <AlertDescription className={isConnectionError ? "text-blue-800" : ""}>
            <p className="mb-2">{error}</p>
            <div className="flex gap-2 mt-4">
              <Button onClick={fetchApplications} size="sm">Retry</Button>
              {isConnectionError && (
                <Button variant="outline" size="sm" onClick={() => window.open('/SETUP.md', '_blank')}>
                  Setup Guide
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-gray-900">KYC Management</h1>
          <p className="text-gray-500 mt-1">Review and manage user identity verification</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-yellow-50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-gray-500 text-sm">Pending Review</div>
                <div className="text-gray-900">{applications.filter(a => a.status === 'pending').length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-gray-500 text-sm">Approved</div>
                <div className="text-gray-900">{applications.filter(a => a.status === 'approved' || a.status === 'verified').length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-red-50 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-gray-500 text-sm">Rejected</div>
                <div className="text-gray-900">{applications.filter(a => a.status === 'rejected').length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-gray-500 text-sm">Resubmitted</div>
                <div className="text-gray-900">{applications.filter(a => a.status === 'pending_review').length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by user name, email, or KYC ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KYC Applications */}
      <Card>
        <CardHeader>
          <CardTitle>KYC Applications</CardTitle>
          <CardDescription>Review and process identity verification requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({applications.filter(a => a.status === 'pending').length})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({applications.filter(a => a.status === 'approved' || a.status === 'verified').length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({applications.filter(a => a.status === 'rejected').length})</TabsTrigger>
              <TabsTrigger value="pending_review">Resubmitted ({applications.filter(a => a.status === 'pending_review').length})</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>KYC ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                          No KYC applications found
                        </TableCell>
                      </TableRow>
                    ) : (
                      applications.map((application) => (
                        <TableRow 
                          key={application.id} 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => {
                            setSelectedKYC(application);
                            fetchKYCDetail(application.kycId);
                          }}
                        >
                          <TableCell>{application.kycId}</TableCell>
                          <TableCell>{application.userId?.fullName || 'N/A'}</TableCell>
                          <TableCell>{application.userId?.email || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{application.verificationLevel}</Badge>
                          </TableCell>
                          <TableCell>{new Date(application.submittedAt).toLocaleDateString()}</TableCell>
                          <TableCell>{getStatusBadge(application.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedKYC(application);
                                fetchKYCDetail(application.kycId);
                              }}
                            >
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* KYC Detail Sheet */}
      <Sheet open={!!selectedKYC} onOpenChange={(open) => !open && setSelectedKYC(null)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          {selectedKYC && (
            <>
              <SheetHeader>
                <SheetTitle>KYC Application Review</SheetTitle>
                <SheetDescription>{selectedKYC.kycId} - {selectedKYC.userId?.fullName}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* User Summary */}
                <Alert>
                  <AlertDescription>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">User Name</div>
                        <div className="text-gray-900">{selectedKYC.userId?.fullName}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="text-gray-900">{selectedKYC.userId?.email}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Verification Level</div>
                        <Badge variant="outline">{selectedKYC.verificationLevel}</Badge>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Status</div>
                        <div className="mt-1">{getStatusBadge(selectedKYC.status)}</div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Document Preview */}
                <div>
                  <h3 className="text-gray-900 mb-4">Submitted Documents</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {selectedKYC.documents?.documentFront && (
                      <div className="border rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-gray-900">Document Front</div>
                            <div className="text-sm text-gray-500">{selectedKYC.documents.documentFront.originalName}</div>
                          </div>
                        </div>
                        <div className="bg-gray-100 rounded-lg overflow-hidden">
                          <img 
                            src={getImageUrl(selectedKYC.documents.documentFront.path)}
                            alt="Document Front"
                            className="w-full h-auto"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = '<div class="h-48 flex items-center justify-center"><p class="text-sm text-gray-500">Image not available</p></div>';
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {selectedKYC.documents?.documentBack && (
                      <div className="border rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-gray-900">Document Back</div>
                            <div className="text-sm text-gray-500">{selectedKYC.documents.documentBack.originalName}</div>
                          </div>
                        </div>
                        <div className="bg-gray-100 rounded-lg overflow-hidden">
                          <img 
                            src={getImageUrl(selectedKYC.documents.documentBack.path)}
                            alt="Document Back"
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    )}
                    
                    {selectedKYC.documents?.selfie && (
                      <div className="border rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-gray-900">Selfie</div>
                            <div className="text-sm text-gray-500">{selectedKYC.documents.selfie.originalName}</div>
                          </div>
                        </div>
                        <div className="bg-gray-100 rounded-lg overflow-hidden">
                          <img 
                            src={getImageUrl(selectedKYC.documents.selfie.path)}
                            alt="Selfie"
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Details */}
                <div>
                  <h3 className="text-gray-900 mb-4">Application Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">KYC ID</span>
                      <span className="text-gray-900">{selectedKYC.kycId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Submission Date</span>
                      <span className="text-gray-900">{new Date(selectedKYC.submittedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Modified</span>
                      <span className="text-gray-900">{new Date(selectedKYC.lastModifiedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expires At</span>
                      <span className="text-gray-900">{new Date(selectedKYC.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Previous Notes */}
                {selectedKYC.rejectionReasons?.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="text-sm text-gray-500 mb-1">Previous Notes</div>
                      <ul className="list-disc list-inside text-gray-900">
                        {selectedKYC.rejectionReasons.map((reason: string, i: number) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Review Notes */}
                <div>
                  <Label className="text-sm text-gray-900 mb-2 block">Reviewer Notes</Label>
                  <Textarea
                    placeholder="Add comments or reasons for your decision..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Action Buttons */}
                {selectedKYC.status === 'pending' || selectedKYC.status === 'pending_review' ? (
                  <div className="space-y-2 pt-4 border-t">
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={actionLoading}>
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Approve Application
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleRequestChanges} disabled={actionLoading}>
                      Request Changes
                    </Button>
                    <Button variant="outline" className="w-full text-red-600" onClick={handleReject} disabled={actionLoading}>
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                      Reject Application
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4 border-t">
                    <Alert>
                      <AlertDescription>
                        This application has already been {selectedKYC.status}.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

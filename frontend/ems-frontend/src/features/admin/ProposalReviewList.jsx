import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from './adminApi';

// UI Components from Design System
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ChevronRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  FileText
} from 'lucide-react';

function ProposalReviewList() {
  const navigate = useNavigate();

  // Preserved logic from your original file
  const { data: proposals, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'proposals'],
    queryFn: adminApi.getPendingProposals
  });

  // Professional Loading State (Matches Administrator Portal)
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <Loader2 className="animate-spin text-primary h-12 w-12" />
      <p className="text-muted-foreground font-medium">Fetching review queue...</p>
    </div>
  );

  // Professional Error State
  if (isError) return (
    <div className="container mx-auto p-6">
      <Card className="border-destructive bg-destructive/5">
        <CardHeader className="flex flex-row items-center gap-4">
          <AlertCircle className="text-danger h-8 w-8" />
          <div>
            <CardTitle className="text-danger">
              {error?.response?.status === 403 ? 'Access Denied' : 'System Error'}
            </CardTitle>
            <CardDescription>
              {error?.response?.status === 403
                ? 'Access Denied: Admin privileges required.'
                : 'Failed to load proposals for review. Please check your admin permissions.'}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-8">
      {/* Design Truth: Administrator Portal Header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Review Event Proposals</h1>
          <p className="text-muted-foreground font-medium">Review and approve university event requests.</p>
        </div>
        <Badge variant="outline" className="px-3 py-1 border-primary/20 text-primary bg-primary/10">
          {proposals?.length || 0} Pending Requests
        </Badge>
      </div>

      <main className="max-w-6xl mx-auto">
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="p-0">
            {proposals?.length === 0 ? (
              // Empty State from ReviewProposals.tsx
              <Card className="text-center py-20 rounded-3xl border-2 border-dashed border-slate-200 shadow-none">
                <CardContent>
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success opacity-50" />
                  <p className="text-slate-900 font-bold text-lg">No pending proposals</p>
                  <p className="text-muted-foreground text-sm">All proposals have been reviewed and cleared.</p>
                </CardContent>
              </Card>
            ) : (
              // Card Grid from Design Truth
              <div className="grid gap-4 md:grid-cols-2">
                {proposals?.map((proposal) => (
                  <Card 
                    key={proposal.proposalID}
                    className="border-2 hover:border-primary transition-all group relative overflow-hidden bg-white"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="secondary" className="mb-2 text-[10px] font-bold uppercase tracking-wider">
                            {proposal.organizationType}
                          </Badge>
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            {proposal.title}
                          </CardTitle>
                        </div>
                        <div className="bg-slate-100 p-2 rounded-full text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                          <FileText size={18} />
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {proposal.description || "No description provided for this proposal."}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar size={14} className="text-primary" />
                          <span>{proposal.proposedDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock size={14} className="text-primary" />
                          <span>{proposal.startTime || 'TBD'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin size={14} className="text-primary" />
                          <span className="truncate">{proposal.venue}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users size={14} className="text-primary" />
                          <span>Cap: {proposal.capacity}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Button 
                          className="flex-1 bg-primary hover:bg-primary/90"
                          onClick={() => navigate(`/admin/proposals/${proposal.proposalID}`)}
                        >
                          <ChevronRight className="h-4 w-4 mr-2" />
                          Review Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default ProposalReviewList;

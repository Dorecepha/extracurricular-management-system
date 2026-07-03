import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from './adminApi';
import {
  ArrowLeft, CheckCircle, XCircle, Loader2, AlertTriangle,
  Users, Link2, Image, FileText, Clock, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { safeParseUser } from '../../lib/safeParse';

const STATUS_STYLES = {
  SUBMITTED: 'bg-blue-100 text-blue-700',
  LATE_SUBMITTED: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  NOT_SUBMITTED: 'bg-slate-100 text-slate-500',
};

const STATUS_LABELS = {
  SUBMITTED: 'Submitted',
  LATE_SUBMITTED: 'Late Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NOT_SUBMITTED: 'Not Submitted',
};

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    return format(new Date(value), 'dd/MM/yyyy HH:mm');
  } catch {
    return value;
  }
};

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold text-slate-800 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function AdminReportDetail() {
  const { reportID } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = safeParseUser();
  const [isRejectModalOpen, setRejectModalOpen] = useState(false);
  const [reason, setReason] = useState('');

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['admin-report', reportID],
    queryFn: () => adminApi.getReportById(reportID),
  });

  const approveMutation = useMutation({
    mutationFn: () => adminApi.approveReport(reportID, user?.userID),
    onSuccess: (res) => {
      alert(res.message || 'Report approved!');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      navigate('/admin/reports');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => adminApi.rejectReport(reportID, reason, user?.userID),
    onSuccess: (res) => {
      alert(res.message || 'Report rejected.');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      navigate('/admin/reports');
    },
  });

  if (isLoading) {
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin text-[#1f5f89]" size={48} />
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="p-20 text-center text-red-500">
        <p className="font-bold">Report details unavailable.</p>
      </div>
    );
  }

  const canAct = report.status === 'SUBMITTED' || report.status === 'LATE_SUBMITTED';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <button
        onClick={() => navigate('/admin/reports')}
        className="flex items-center gap-2 text-slate-400 hover:text-[#1f5f89] transition-all font-bold uppercase text-xs tracking-widest mb-6"
      >
        <ArrowLeft size={16} /> Back to Report Reviews
      </button>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1f5f89] p-10 text-white">
          <div className="flex justify-between items-start gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {report.eventType === 'YOUTH_UNION' ? 'Youth Union' : 'Student Association'}
                </span>
                {report.isLate && (
                  <span className="bg-amber-400/30 border border-amber-300/40 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <AlertTriangle size={10} /> Late Submission
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black leading-tight">
                Post-Event Report <span className="text-blue-200">#{report.reportID}</span>
              </h1>
              <p className="text-blue-100/80 font-medium">
                Event ID <span className="text-white font-bold">#{report.eventID}</span>
                {report.affiliatedOrg && <span> · {report.affiliatedOrg}</span>}
              </p>
            </div>
            <div className="bg-black/10 p-4 rounded-2xl border border-white/10 text-center min-w-[140px] flex-shrink-0">
              <p className="text-[10px] font-black uppercase text-blue-200 mb-2">Status</p>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[report.status] || 'bg-white/20 text-white'}`}>
                {STATUS_LABELS[report.status] || report.status}
              </span>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-10">
          {/* Submitter Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Users size={16} className="text-[#1f5f89]" /> Submitter Information
            </h3>
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-1">
              <InfoRow label="Name" value={report.submitterName} />
              <InfoRow label="Role" value={report.submitterRole} />
              <InfoRow label="Email" value={report.submitterEmail} />
              <InfoRow label="Submitted At" value={formatDateTime(report.submittedAt)} />
              <InfoRow label="Deadline" value={formatDateTime(report.deadlineAt)} />
            </div>
          </section>

          {/* Attendance Stats */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Users size={16} className="text-[#1f5f89]" /> Attendance
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Organizers', value: report.organizerCount },
                { label: 'Attendees', value: report.attendeeCount },
                { label: 'Walk-ins', value: report.walkInCount },
                { label: 'Feedback', value: report.feedbackCount },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-center">
                  <p className="text-2xl font-black text-slate-900">{value ?? '—'}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">{label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Budget */}
          {report.totalBudget != null && (
            <section className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <DollarSign size={16} className="text-[#1f5f89]" /> Budget
              </h3>
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <p className="text-2xl font-black text-slate-900">
                  {Number(report.totalBudget).toLocaleString()} VND
                </p>
              </div>
            </section>
          )}

          {/* Links */}
          {(report.iuyouthArticleURL || report.socialMediaURL || report.driveLink) && (
            <section className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Link2 size={16} className="text-[#1f5f89]" /> Links
              </h3>
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-1">
                <InfoRow label="IUYouth Article" value={report.iuyouthArticleURL} />
                <InfoRow label="Social Media" value={report.socialMediaURL} />
                <InfoRow label="Drive Link" value={report.driveLink} />
              </div>
            </section>
          )}

          {/* Photos */}
          {report.photos && report.photos.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Image size={16} className="text-[#1f5f89]" /> Photos ({report.photos.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {report.photos.map((photo) => (
                  <div key={photo.photoID} className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs text-slate-500 font-medium truncate">
                    {photo.label || `Photo ${photo.orderIndex + 1}`}
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{photo.fileID}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Walk-in Attendees */}
          {report.walkInAttendees && report.walkInAttendees.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <FileText size={16} className="text-[#1f5f89]" /> Walk-in Attendees ({report.walkInAttendees.length})
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">Student ID</th>
                      <th className="px-4 py-3 text-left">Full Name</th>
                      <th className="px-4 py-3 text-left">Class</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {report.walkInAttendees.map((a) => (
                      <tr key={a.recordID} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs">{a.studentID}</td>
                        <td className="px-4 py-3 font-medium">{a.fullName}</td>
                        <td className="px-4 py-3 text-slate-500">{a.className || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Rejection info */}
          {report.rejectionReason && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-sm text-rose-700 space-y-1">
              <p className="font-bold">Rejection Reason</p>
              <p>{report.rejectionReason}</p>
            </div>
          )}

          {/* Actions */}
          {canAct && (
            <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row gap-4">
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-5 rounded-2xl font-semibold tracking-wide flex items-center justify-center gap-3 transition shadow-lg shadow-green-900/10 disabled:opacity-50"
              >
                <CheckCircle size={20} /> Approve Report
              </button>
              <button
                onClick={() => setRejectModalOpen(true)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-semibold tracking-wide flex items-center justify-center gap-3 transition shadow-lg shadow-red-900/10 disabled:opacity-50"
              >
                <XCircle size={20} /> Reject Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-slate-900 uppercase mb-2 text-center">Rejection Reason</h2>
            <p className="text-slate-500 font-medium mb-6 text-center text-sm px-4">
              This feedback will be sent to the event organizer.
            </p>
            <textarea
              className="w-full border-2 border-slate-100 rounded-3xl p-5 focus:border-red-500 outline-none transition h-32 font-medium text-sm"
              placeholder="Provide a specific reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="flex-1 font-bold text-slate-400 text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={() => { setRejectModalOpen(false); rejectMutation.mutate(); }}
                disabled={!reason || rejectMutation.isPending}
                className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-semibold uppercase tracking-widest text-xs disabled:opacity-50 shadow-lg shadow-red-900/10"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReportDetail;

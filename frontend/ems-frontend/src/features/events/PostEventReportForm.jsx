import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import {
  ArrowLeft, CheckCircle, Clock, AlertTriangle,
  Upload, FileText, Loader2, XCircle
} from 'lucide-react';
import { reportApi } from './reportApi';
import { eventApi } from './api';

const STATUS_CONFIG = {
  NOT_SUBMITTED: { label: 'Awaiting Submission', color: 'bg-amber-100 text-amber-700' },
  SUBMITTED: { label: 'Under Review', color: 'bg-blue-100 text-blue-700' },
  LATE_SUBMITTED: { label: 'Submitted (Late)', color: 'bg-orange-100 text-orange-700' },
  APPROVED: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Rejected', color: 'bg-rose-100 text-rose-700' },
  CERT_TEMPLATE_PENDING: { label: 'Cert Template Ready', color: 'bg-purple-100 text-purple-700' },
  CERT_EXPORT_READY: { label: 'Cert Export Ready', color: 'bg-teal-100 text-teal-700' },
};

function FieldGroup({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="ems-label">{label}</label>
      {children}
    </div>
  );
}

function PostEventReportForm() {
  const { eventID } = useParams();
  const navigate = useNavigate();

  const [fields, setFields] = useState({
    submitterName: '',
    submitterRole: '',
    organizerCount: '',
    attendeeCount: '',
    walkInCount: '',
    feedbackCount: '',
    totalBudget: '',
    iuyouthArticleURL: '',
    socialMediaURL: '',
    driveLink: '',
  });
  const [photos, setPhotos] = useState([]);
  const [attendanceExcel, setAttendanceExcel] = useState(null);
  const [feedbackFile, setFeedbackFile] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventID],
    queryFn: () => eventApi.getEventById(eventID),
  });

  const { data: report, isLoading: reportLoading, refetch: refetchReport } = useQuery({
    queryKey: ['report', eventID],
    queryFn: () => reportApi.getReport(eventID),
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      photos.forEach((f) => formData.append('photos', f));
      if (attendanceExcel) formData.append('attendanceExcel', attendanceExcel);
      if (feedbackFile) formData.append('feedbackFile', feedbackFile);
      Object.entries(fields).forEach(([k, v]) => { if (v !== '') formData.append(k, v); });
      return reportApi.submitReport(eventID, formData);
    },
    onSuccess: () => {
      setSubmitError(null);
      refetchReport();
    },
    onError: (err) => {
      setSubmitError(err.message || 'Submission failed. Please check all fields.');
    },
  });

  if (eventLoading || reportLoading) {
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const orgType = event?.organizationType || report?.eventType || 'YOUTH_UNION';
  const requiredPhotos = orgType === 'YOUTH_UNION' ? 5 : 10;
  const deadlineAt = report?.deadlineAt ? parseISO(report.deadlineAt) : null;
  const isOverdue = deadlineAt && new Date() > deadlineAt;
  const statusCfg = STATUS_CONFIG[report?.status] || STATUS_CONFIG.NOT_SUBMITTED;

  // — Already submitted / resolved state —
  if (report && report.status !== 'NOT_SUBMITTED') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => navigate('/managed-events')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-700 transition font-bold uppercase text-xs tracking-widest">
          <ArrowLeft size={16} /> Back to Managed Events
        </button>

        <div className="ems-card p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="ems-label">Post-Event Report</p>
              <h1 className="text-2xl font-bold text-slate-900">{event?.title || `Event #${eventID}`}</h1>
            </div>
            <span className={`ems-badge ${statusCfg.color}`}>{statusCfg.label}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="ems-label">Submitted</p>
              <p className="font-semibold text-slate-800">
                {report.submittedAt ? format(parseISO(report.submittedAt), 'dd/MM/yyyy HH:mm') : '—'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="ems-label">Deadline</p>
              <p className={`font-semibold ${report.isLate ? 'text-rose-600' : 'text-slate-800'}`}>
                {deadlineAt ? format(deadlineAt, 'dd/MM/yyyy') : '—'}
                {report.isLate && <span className="ml-2 text-xs text-rose-500">(Late)</span>}
              </p>
            </div>
          </div>

          {report.status === 'REJECTED' && report.rejectionReason && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
              <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">Rejection Reason</p>
              <p className="text-sm text-rose-800">{report.rejectionReason}</p>
            </div>
          )}

          {report.status === 'APPROVED' && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="text-emerald-600 shrink-0" size={20} />
              <p className="text-sm text-emerald-800 font-medium">
                Report approved on {report.approvedAt ? format(parseISO(report.approvedAt), 'dd/MM/yyyy') : '—'}.
              </p>
            </div>
          )}

          {report.status === 'CERT_TEMPLATE_PENDING' && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <p className="text-sm text-purple-800 font-medium">
                Certificate template is ready. Please check your email or contact admin for download instructions.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // — Submission form —
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <button onClick={() => navigate('/managed-events')}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-700 transition font-bold uppercase text-xs tracking-widest">
        <ArrowLeft size={16} /> Back to Managed Events
      </button>

      {/* Header */}
      <div className="ems-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="ems-label">Post-Event Report</p>
            <h1 className="text-2xl font-bold text-slate-900">{event?.title || `Event #${eventID}`}</h1>
            <p className="text-sm text-slate-500 mt-1">{orgType.replace('_', ' ')} · {requiredPhotos} photos required</p>
          </div>
          {deadlineAt && (
            <div className={`text-right shrink-0 ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
              <div className="flex items-center gap-1 justify-end text-xs font-bold uppercase tracking-wider mb-1">
                <Clock size={12} /> Deadline
              </div>
              <p className="text-sm font-semibold">{format(deadlineAt, 'dd/MM/yyyy')}</p>
              <p className="text-xs mt-0.5">
                {isOverdue
                  ? 'Overdue — report will be marked late'
                  : `${formatDistanceToNow(deadlineAt)} remaining`}
              </p>
            </div>
          )}
        </div>
        {isOverdue && (
          <div className="mt-4 flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 text-sm">
            <AlertTriangle size={16} className="shrink-0" />
            Deadline has passed. Your submission will be marked as late.
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(); }} className="space-y-5">

        {/* Submitter info */}
        <div className="ems-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Submitter Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Full Name">
              <input className="ems-input" placeholder="e.g. Nguyen Van A" value={fields.submitterName}
                onChange={(e) => setFields(f => ({ ...f, submitterName: e.target.value }))} />
            </FieldGroup>
            <FieldGroup label="Role / Position">
              <input className="ems-input" placeholder="e.g. President" value={fields.submitterRole}
                onChange={(e) => setFields(f => ({ ...f, submitterRole: e.target.value }))} />
            </FieldGroup>
          </div>
        </div>

        {/* Attendance numbers */}
        <div className="ems-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Attendance & Budget</h2>
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Organizer Count">
              <input type="number" min="0" className="ems-input" placeholder="0" value={fields.organizerCount}
                onChange={(e) => setFields(f => ({ ...f, organizerCount: e.target.value }))} />
            </FieldGroup>
            <FieldGroup label="Total Attendees">
              <input type="number" min="0" className="ems-input" placeholder="0" value={fields.attendeeCount}
                onChange={(e) => setFields(f => ({ ...f, attendeeCount: e.target.value }))} />
            </FieldGroup>
            <FieldGroup label="Walk-in Attendees">
              <input type="number" min="0" className="ems-input" placeholder="0" value={fields.walkInCount}
                onChange={(e) => setFields(f => ({ ...f, walkInCount: e.target.value }))} />
            </FieldGroup>
            <FieldGroup label="Feedback Responses">
              <input type="number" min="0" className="ems-input" placeholder="0" value={fields.feedbackCount}
                onChange={(e) => setFields(f => ({ ...f, feedbackCount: e.target.value }))} />
            </FieldGroup>
            <FieldGroup label="Total Budget (VND)">
              <input type="number" min="0" className="ems-input" placeholder="0" value={fields.totalBudget}
                onChange={(e) => setFields(f => ({ ...f, totalBudget: e.target.value }))} />
            </FieldGroup>
          </div>
        </div>

        {/* Online presence */}
        <div className="ems-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Online Presence</h2>
          <FieldGroup label="IU Youth Article URL">
            <input className="ems-input" placeholder="https://iuyouth.edu.vn/..." value={fields.iuyouthArticleURL}
              onChange={(e) => setFields(f => ({ ...f, iuyouthArticleURL: e.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Social Media Post URL">
            <input className="ems-input" placeholder="https://facebook.com/..." value={fields.socialMediaURL}
              onChange={(e) => setFields(f => ({ ...f, socialMediaURL: e.target.value }))} />
          </FieldGroup>
          <FieldGroup label="Drive / Photo Album Link">
            <input className="ems-input" placeholder="https://drive.google.com/..." value={fields.driveLink}
              onChange={(e) => setFields(f => ({ ...f, driveLink: e.target.value }))} />
          </FieldGroup>
        </div>

        {/* File uploads */}
        <div className="ems-card p-6 space-y-5">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Documents & Photos</h2>

          {/* Photos */}
          <FieldGroup label={`Event Photos (exactly ${requiredPhotos} required)`}>
            <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition
              ${photos.length === requiredPhotos
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-slate-200 bg-slate-50 hover:border-blue-300'}`}>
              <Upload size={18} className="text-slate-400 shrink-0" />
              <span className="text-sm text-slate-600">
                {photos.length > 0
                  ? `${photos.length} / ${requiredPhotos} photos selected`
                  : `Select ${requiredPhotos} photos`}
              </span>
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => setPhotos(Array.from(e.target.files))} />
            </label>
            {photos.length > 0 && photos.length !== requiredPhotos && (
              <p className="text-xs text-amber-600 font-semibold mt-1">
                Need exactly {requiredPhotos}, currently {photos.length} selected.
              </p>
            )}
          </FieldGroup>

          {/* Attendance Excel */}
          <FieldGroup label="Attendance Sheet (Excel, optional)">
            <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-blue-300 cursor-pointer transition">
              <FileText size={18} className="text-slate-400 shrink-0" />
              <span className="text-sm text-slate-600">
                {attendanceExcel ? attendanceExcel.name : 'Select .xlsx file'}
              </span>
              <input type="file" accept=".xlsx,.xls" className="hidden"
                onChange={(e) => setAttendanceExcel(e.target.files[0] || null)} />
            </label>
          </FieldGroup>

          {/* Feedback file */}
          <FieldGroup label="Feedback Survey File (optional)">
            <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-blue-300 cursor-pointer transition">
              <FileText size={18} className="text-slate-400 shrink-0" />
              <span className="text-sm text-slate-600">
                {feedbackFile ? feedbackFile.name : 'Select file'}
              </span>
              <input type="file" className="hidden"
                onChange={(e) => setFeedbackFile(e.target.files[0] || null)} />
            </label>
          </FieldGroup>
        </div>

        {submitError && (
          <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-xl p-4">
            <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700">{submitError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitMutation.isPending}
          className="ems-btn-primary w-full py-4 text-base"
        >
          {submitMutation.isPending
            ? <><Loader2 size={18} className="animate-spin" /> Submitting…</>
            : <><CheckCircle size={18} /> Submit Post-Event Report</>}
        </button>
      </form>
    </div>
  );
}

export default PostEventReportForm;

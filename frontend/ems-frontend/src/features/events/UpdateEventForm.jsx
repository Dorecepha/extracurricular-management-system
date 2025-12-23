import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { eventApi } from './api';
import { updateApi } from './updateApi';
import { Send, ArrowLeft, Loader2, AlertCircle, FileUp, X, Clock, MapPin, Users, Calendar } from 'lucide-react';

function UpdateEventForm() {
  const { eventID } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCancelAction = searchParams.get('action') === 'cancel';
  const [error, setError] = useState('');
  const [fileList, setFileList] = useState([]);

  const { data: event, isLoading } = useQuery({
    queryKey: ['events', eventID],
    queryFn: () => eventApi.getEventById(eventID)
  });

  const [formData, setFormData] = useState({
    updatedTitle: '',
    updatedDescription: '',
    updatedDate: '',
    updatedStartTime: '',
    updatedEndTime: '',
    updatedVenue: '',
    updatedCapacity: 0,
    updatedStatus: isCancelAction ? 'CANCELLED' : null,
    updateReason: ''
  });

  useEffect(() => {
    if (event) {
      setFormData({
        updatedTitle: event.title,
        updatedDescription: event.description,
        updatedDate: event.eventDate,
        updatedStartTime: event.startTime,
        updatedEndTime: event.endTime,
        updatedVenue: event.venue,
        updatedCapacity: event.capacity,
        updatedStatus: isCancelAction ? 'CANCELLED' : null,
        updateReason: ''
      });
    }
  }, [event, isCancelAction]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFiles = selectedFiles.map(file => ({ name: file.name, raw: file }));
    setFileList((prev) => [...prev, ...newFiles]);
  };

  const mutation = useMutation({
    mutationFn: (data) => updateApi.submitUpdateRequest(eventID, data),
    onSuccess: () => {
      alert(isCancelAction ? "Cancellation request sent to Admin." : "Modification request sent to Admin.");
      navigate('/managed-events');
    },
    onError: (err) => setError(err.message)
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...formData,
      updatedStatus: isCancelAction ? 'CANCELLED' : formData.updatedStatus,
      updatedCapacity: formData.updatedCapacity === '' || formData.updatedCapacity === null ? null : Number(formData.updatedCapacity)
    };
    const data = new FormData();
    data.append('update', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    fileList.forEach(f => data.append('files', f.raw));
    mutation.mutate(data);
  };

  const removeFile = (idx) => {
    setFileList((prev) => prev.filter((_, i) => i !== idx));
  };

  if (isLoading) return (
    <div className="ems-page">
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-[var(--primary)]" size={48} />
      </div>
    </div>
  );

  return (
    <div className="ems-page">
      <button
        onClick={() => navigate(-1)}
        className="ems-btn-ghost w-fit"
      >
        <ArrowLeft size={16}/> Back
      </button>

      <div className="ems-card max-w-5xl mx-auto">
        <div className={`${isCancelAction ? 'bg-rose-600' : 'bg-amber-500'} text-white px-8 py-6`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
            {isCancelAction ? 'Cancellation request' : 'Modification request'}
          </p>
          <h2 className="text-2xl font-bold mt-2 tracking-tight">{isCancelAction ? 'Cancel Live Event' : 'Modify Live Event'}</h2>
          <p className="text-white/80 text-sm">{event?.title}</p>
        </div>

        <form className="p-8 space-y-8" onSubmit={handleSubmit}>
          {error && <div className="bg-rose-50 p-4 rounded-xl text-rose-700 font-semibold text-sm flex gap-2 border border-rose-200"><AlertCircle size={18}/> {error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="ems-label">New Event Title</label>
              <input required disabled={isCancelAction} className="ems-input disabled:bg-slate-50 disabled:text-[var(--text-muted)]" value={formData.updatedTitle || ''} onChange={e => setFormData({...formData, updatedTitle: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="ems-label flex items-center gap-1"><Calendar size={14}/> New Date</label>
              <input type="date" disabled={isCancelAction} className="ems-input disabled:bg-slate-50 disabled:text-[var(--text-muted)]" value={formData.updatedDate || ''} onChange={e => setFormData({...formData, updatedDate: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="ems-label flex items-center gap-1"><MapPin size={14}/> New Venue</label>
              <input disabled={isCancelAction} className="ems-input disabled:bg-slate-50 disabled:text-[var(--text-muted)]" value={formData.updatedVenue || ''} onChange={e => setFormData({...formData, updatedVenue: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="ems-label flex items-center gap-1"><Clock size={14}/> Start Time</label>
              <input type="time" disabled={isCancelAction} className="ems-input disabled:bg-slate-50 disabled:text-[var(--text-muted)]" value={formData.updatedStartTime || ''} onChange={e => setFormData({...formData, updatedStartTime: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="ems-label flex items-center gap-1"><Clock size={14}/> End Time</label>
              <input type="time" disabled={isCancelAction} className="ems-input disabled:bg-slate-50 disabled:text-[var(--text-muted)]" value={formData.updatedEndTime || ''} onChange={e => setFormData({...formData, updatedEndTime: e.target.value})} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="ems-label flex items-center gap-1"><Users size={14}/> Adjusted Capacity</label>
              <input type="number" disabled={isCancelAction} className="ems-input disabled:bg-slate-50 disabled:text-[var(--text-muted)]" value={formData.updatedCapacity ?? ''} onChange={e => setFormData({...formData, updatedCapacity: e.target.value === '' ? '' : Number(e.target.value)})} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="ems-label">Reason for {isCancelAction ? 'Cancellation' : 'Modification'}</label>
            <textarea required className="ems-input min-h-[120px]" rows="3" value={formData.updateReason || ''} onChange={e => setFormData({...formData, updateReason: e.target.value})} />
          </div>

          {!isCancelAction && (
            <div className="space-y-3">
              <label className="ems-label flex items-center gap-1"><FileUp size={14}/> New Paperwork (Optional)</label>
              <div className="relative border-2 border-dashed border-[var(--border)] rounded-2xl p-6 text-center hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/60 transition-all cursor-pointer">
                <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Upload revised plan</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {fileList.map((f, i) => (
                  <div key={i} className="bg-[var(--primary)] text-white px-3 py-1 rounded-lg text-[11px] flex items-center gap-2 shadow-sm">
                    {f.name}
                    <button type="button" onClick={() => removeFile(i)} className="text-white/80 hover:text-rose-200"><X size={12}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={mutation.isPending} className={`ems-btn w-full py-3 text-base ${isCancelAction ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-amber-500 text-slate-900 hover:bg-amber-600'}`}>
             <Send size={20} /> {isCancelAction ? 'Submit Cancellation' : 'Submit Changes for Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
export default UpdateEventForm;

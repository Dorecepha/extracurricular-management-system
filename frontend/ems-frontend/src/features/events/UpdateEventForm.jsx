import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { eventApi } from './api';
import { updateApi } from './updateApi';
import { Send, ArrowLeft, Loader2, AlertCircle, Info, FileUp, X, Clock, MapPin, Users, Calendar } from 'lucide-react';

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

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-[#1f5f89]" size={48} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 font-bold uppercase text-xs tracking-widest"><ArrowLeft size={16}/> Back</button>
      <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
        <div className={`p-8 text-white ${isCancelAction ? 'bg-red-600' : 'bg-amber-600'}`}>
          <h2 className="text-2xl font-black uppercase">{isCancelAction ? 'Cancel Live Event' : 'Modify Live Event'}</h2>
          <p className="text-white/80 text-sm">{isCancelAction ? 'Requesting cancellation for' : 'Editing'}: {event?.title}</p>
        </div>

        <form className="p-10 space-y-8" onSubmit={handleSubmit}>
          {error && <div className="bg-red-50 p-4 rounded-2xl text-red-600 font-bold text-sm flex gap-2"><AlertCircle/> {error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">New Event Title</label>
              <input required disabled={isCancelAction} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold" value={formData.updatedTitle || ''} onChange={e => setFormData({...formData, updatedTitle: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Calendar size={12}/> New Date</label>
              <input type="date" disabled={isCancelAction} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold" value={formData.updatedDate || ''} onChange={e => setFormData({...formData, updatedDate: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><MapPin size={12}/> New Venue</label>
              <input disabled={isCancelAction} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold" value={formData.updatedVenue || ''} onChange={e => setFormData({...formData, updatedVenue: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Clock size={12}/> Start Time</label>
              <input type="time" disabled={isCancelAction} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold" value={formData.updatedStartTime || ''} onChange={e => setFormData({...formData, updatedStartTime: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Clock size={12}/> End Time</label>
              <input type="time" disabled={isCancelAction} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold" value={formData.updatedEndTime || ''} onChange={e => setFormData({...formData, updatedEndTime: e.target.value})} />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Users size={12}/> Adjusted Capacity</label>
              <input type="number" disabled={isCancelAction} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold" value={formData.updatedCapacity ?? ''} onChange={e => setFormData({...formData, updatedCapacity: e.target.value === '' ? '' : Number(e.target.value)})} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase">Reason for {isCancelAction ? 'Cancellation' : 'Modification'}</label>
            <textarea required className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-medium" rows="3" value={formData.updateReason || ''} onChange={e => setFormData({...formData, updateReason: e.target.value})} />
          </div>

          {!isCancelAction && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><FileUp size={12}/> New Paperwork (Optional)</label>
              <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 cursor-pointer">
                <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                <p className="text-[10px] font-black text-slate-400">UPLOAD REVISED PLAN</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {fileList.map((f, i) => (
                  <div key={i} className="bg-slate-800 text-white px-3 py-1 rounded-lg text-[10px] flex items-center gap-2">
                    {f.name}
                    <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-300"><X size={12}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={mutation.isPending} className={`w-full ${isCancelAction ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'} text-white py-5 rounded-3xl font-black transition-all flex items-center justify-center gap-3`}>
             <Send size={20} /> {isCancelAction ? 'Submit Cancellation' : 'Submit Changes for Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
export default UpdateEventForm;

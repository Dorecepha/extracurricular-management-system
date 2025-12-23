import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { eventApi } from './api';
import { format } from 'date-fns';
import {
  Send,
  CheckCircle2,
  FileUp,
  AlertCircle,
  X,
  Calendar,
  MapPin,
  Clock,
  Users
} from 'lucide-react';

function CreateProposalForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fileList, setFileList] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    proposedDate: '',
    startTime: '',
    endTime: '',
    venue: '',
    capacity: 50,
    organizationType: 'YOUTH_UNION'
  });

  const mutation = useMutation({
    mutationFn: (data) => eventApi.createProposal(data),
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(err.message || "Submission failed. Please check all fields.")
  });

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const MAX_SIZE = 5 * 1024 * 1024;

    const validFiles = selectedFiles.filter(file => {
      if (file.size > MAX_SIZE) {
        alert(`${file.name} is too large (Max 5MB)`);
        return false;
      }
      return true;
    });

    const newFiles = validFiles.map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(2) + " KB",
      raw: file
    }));

    setFileList((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    const filteredList = fileList.filter((_, i) => i !== index);
    setFileList(filteredList);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (formData.endTime <= formData.startTime) {
      setError("End time must be after start time.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosenDate = formData.proposedDate ? new Date(formData.proposedDate) : null;
    if (!chosenDate || chosenDate < today) {
      setError("Proposed date must be today or in the future.");
      return;
    }

    const toHms = (value) => (value?.length === 5 ? `${value}:00` : value);

    const payload = {
      ...formData,
      startTime: toHms(formData.startTime),
      endTime: toHms(formData.endTime),
      capacity: Number(formData.capacity)
    };

    const data = new FormData();
    data.append('proposal', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    fileList.forEach((file) => {
      data.append('files', file.raw);
    });

    mutation.mutate(data);
  };

  if (submitted) return (
    <div className="ems-page">
      <div className="ems-card max-w-4xl mx-auto text-center p-12">
        <div className="w-20 h-20 bg-[var(--primary-light)] text-[var(--primary)] rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="ems-heading text-3xl mb-2">Proposal Submitted</h2>
        <p className="text-[var(--text-muted)] font-medium">Your application has been queued for Administrator review.</p>
        <button 
          onClick={() => { setSubmitted(false); setFileList([]); }}
          className="ems-btn-ghost mt-6 mx-auto block"
        >
          Submit Another Proposal
        </button>
      </div>
    </div>
  );

  return (
    <div className="ems-page">
      <div className="ems-card max-w-4xl mx-auto">
        <div className="bg-[var(--primary)] text-white px-8 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">Organizer workflow</p>
          <h2 className="text-2xl font-bold tracking-tight mt-2">Submit Event Proposal</h2>
          <p className="text-white/80 text-sm">Target: Administrator Review Queue</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-700 font-semibold text-sm">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="ems-label">Event Title</label>
              <input 
                required
                maxLength={200}
                className="ems-input"
                placeholder="Enter proposal title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="ems-label">Description</label>
              <textarea 
                rows="4"
                className="ems-input min-h-[140px]"
                placeholder="Describe the purpose and activities of the event"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="ems-label flex items-center gap-2">
                <MapPin size={14}/> Venue (location)
              </label>
              <input 
                required
                className="ems-input"
                placeholder="e.g., Auditorium A2"
                value={formData.venue}
                onChange={(e) => setFormData({...formData, venue: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="ems-label">Organization Type</label>
              <select 
                className="ems-input"
                value={formData.organizationType}
                onChange={(e) => setFormData({...formData, organizationType: e.target.value})}
              >
                <option value="YOUTH_UNION">Youth Union</option>
                <option value="STUDENT_ASSOCIATION">Student Association</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="ems-label flex items-center gap-2">
                <Calendar size={14}/> Proposed Date
              </label>
              <input 
                type="date"
                required
                className="ems-input text-slate-700"
                value={formData.proposedDate}
                onChange={(e) => setFormData({...formData, proposedDate: e.target.value})}
              />
              {formData.proposedDate && (
                <p className="text-[11px] text-[var(--text-muted)] font-medium">
                  Selected: {format(new Date(formData.proposedDate), 'dd/MM/yyyy')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="ems-label flex items-center gap-2">
                <Users size={14}/> Max Capacity
              </label>
              <input 
                type="number"
                min={1}
                required
                className="ems-input"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="ems-label flex items-center gap-2">
                <Clock size={14}/> Start Time
              </label>
              <input 
                type="time"
                required
                className="ems-input"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="ems-label flex items-center gap-2">
                <Clock size={14}/> End Time
              </label>
              <input 
                type="time"
                required
                className="ems-input"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="ems-label flex items-center gap-2">
              <FileUp size={14}/> Support Paperwork (PDF, DOCX)
            </label>
            <div className="relative border-2 border-dashed border-[var(--border)] rounded-2xl p-6 text-center hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/60 transition-all cursor-pointer">
              <input 
                type="file" 
                multiple 
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                onChange={handleFileChange} 
              />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-tight">Attach event plan or venue approval</p>
                <p className="text-[10px] text-[var(--text-muted)] font-medium">Files are logged in the proposal metadata</p>
              </div>
            </div>

            {fileList.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {fileList.map((file, index) => (
                  <div key={index} className="bg-[var(--primary)] text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-[11px] font-semibold shadow-sm">
                    <span className="max-w-[140px] truncate">{file.name}</span>
                    <span className="text-white/70">{file.size}</span>
                    <button type="button" onClick={() => removeFile(index)} className="text-white/80 hover:text-rose-200 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={mutation.isPending}
              className="ems-btn-primary w-full py-3 text-base"
            >
              {mutation.isPending ? (
                "Processing..."
              ) : (
                <><Send size={18}/> Submit Proposal</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProposalForm;

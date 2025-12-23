import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { eventApi } from './api';
import { 
  Send, 
  CheckCircle2, 
  FileUp, 
  AlertCircle, 
  Info, 
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
    organizationType: 'YOUTH_UNION',
    attachmentsJson: '[]' 
  });

  const mutation = useMutation({
    mutationFn: (data) => eventApi.createProposal(data),
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(err.message || "Submission failed. Please check all fields.")
  });

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFiles = await Promise.all(selectedFiles.map(async (file) => ({
      name: file.name,
      size: (file.size / 1024).toFixed(2) + " KB",
      type: file.type,
      dataUrl: await readFileAsDataUrl(file)
    })));

    const updatedList = [...fileList, ...newFiles];
    setFileList(updatedList);
    setFormData({
      ...formData,
      attachmentsJson: JSON.stringify(updatedList)
    });
  };

  const removeFile = (index) => {
    const filteredList = fileList.filter((_, i) => i !== index);
    setFileList(filteredList);
    setFormData({
      ...formData,
      attachmentsJson: JSON.stringify(filteredList)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (formData.endTime <= formData.startTime) {
      setError("End time must be after start time.");
      return;
    }

    mutation.mutate(formData);
  };

  if (submitted) return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden text-center py-20 px-10">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={40} />
      </div>
      <h2 className="text-3xl font-black text-slate-900 mb-2">PROPOSAL SUBMITTED</h2>
      <p className="text-slate-500 font-medium mb-8">Your application has been queued for Administrator review.</p>
      <button 
        onClick={() => { setSubmitted(false); setFileList([]); }}
        className="text-[#1f5f89] font-black uppercase tracking-widest text-sm hover:underline"
      >
        Submit Another Proposal
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-10">
      <div className="bg-[#1f5f89] p-8 text-white">
        <h2 className="text-2xl font-black uppercase tracking-tight">Submit Event Proposal</h2>
        <p className="text-blue-100/80 text-sm font-medium">Target: Administrator Review Queue</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600 font-bold text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-1">
            <label className="text-sm font-bold text-slate-700">Event Title</label>
            <input 
              required
              maxLength={200}
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 focus:ring-2 focus:ring-[#1f5f89]/20 transition outline-none font-medium" 
              placeholder="Enter proposal title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-sm font-bold text-slate-700">Description</label>
            <textarea 
              rows="3"
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 focus:ring-2 focus:ring-[#1f5f89]/20 transition outline-none font-medium" 
              placeholder="Describe the purpose and activities of the event"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <MapPin size={14}/> Venue (location)
            </label>
            <input 
              required
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 focus:ring-2 focus:ring-[#1f5f89]/20 transition outline-none font-medium" 
              placeholder="e.g., Auditorium A2"
              value={formData.venue}
              onChange={(e) => setFormData({...formData, venue: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Organization Type</label>
            <select 
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 outline-none font-medium appearance-none"
              value={formData.organizationType}
              onChange={(e) => setFormData({...formData, organizationType: e.target.value})}
            >
              <option value="YOUTH_UNION">Youth Union</option>
              <option value="STUDENT_ASSOCIATION">Student Association</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Calendar size={14}/> Proposed Date
            </label>
            <input 
              type="date"
              required
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 outline-none font-medium text-slate-600" 
              value={formData.proposedDate}
              onChange={(e) => setFormData({...formData, proposedDate: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Users size={14}/> Max Capacity
            </label>
            <input 
              type="number"
              min={1}
              required
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 outline-none font-medium" 
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Clock size={14}/> Start Time
            </label>
            <input 
              type="time"
              required
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 outline-none font-medium" 
              value={formData.startTime}
              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Clock size={14}/> End Time
            </label>
            <input 
              type="time"
              required
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 outline-none font-medium" 
              value={formData.endTime}
              onChange={(e) => setFormData({...formData, endTime: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <FileUp size={14}/> Support Paperwork (PDF, DOCX)
          </label>
          <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-[#1f5f89] hover:bg-blue-50/30 transition-all group cursor-pointer">
            <input 
              type="file" 
              multiple 
              className="absolute inset-0 opacity-0 cursor-pointer z-10" 
              onChange={handleFileChange} 
            />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Click to attach event plan or venue approval</p>
              <p className="text-[10px] text-slate-400 font-medium">Files are logged in the proposal metadata</p>
            </div>
          </div>

          {fileList.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {fileList.map((file, index) => (
                <div key={index} className="bg-slate-800 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-bold shadow-sm">
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button type="button" onClick={() => removeFile(index)} className="text-slate-400 hover:text-red-400 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-6">
          <button 
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-[#1f5f89] text-white py-4 rounded-2xl font-black tracking-wide hover:bg-[#164565] disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#1f5f89]/20"
          >
            {mutation.isPending ? (
              "PROCESSING..."
            ) : (
              <><Send size={18}/> SUBMIT PROPOSAL</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateProposalForm;

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventApi } from './api';
import { Send, MapPin, Clock, Users, FileText } from 'lucide-react';

// SCHEMAS matching ProposalRequest DTO types
const proposalSchema = z.object({
  title: z.string().min(5, "Title is too short"),
  description: z.string().min(20, "Description requires more detail"),
  location: z.string().min(1, "Venue/Location is required"),
  proposedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  startTime: z.string(),
  endTime: z.string(),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  organizationType: z.string().min(1, "Organization type is required"),
});

function ProposalForm() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      organizationType: 'STUDENT_ORG',
      capacity: 50
    }
  });

  const mutation = useMutation({
    mutationFn: eventApi.createProposal,
    onSuccess: (res) => {
      alert(res.message || "Proposal submitted successfully!");
      reset();
      queryClient.invalidateQueries(['events']);
    },
    onError: (err) => {
      alert(`Submission Error: ${err.message}`);
    }
  });

  const onSubmit = (data) => {
    // TRANSFORM: HTML time inputs give HH:mm, Backend DTO LocalTime needs HH:mm:ss
    const formattedPayload = {
      ...data,
      startTime: data.startTime.length === 5 ? `${data.startTime}:00` : data.startTime,
      endTime: data.endTime.length === 5 ? `${data.endTime}:00` : data.endTime,
      attachmentsJson: "{}" // Defaulting as requested by DTO
    };
    
    mutation.mutate(formattedPayload);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-[#1f5f89] p-8 text-white">
        <h2 className="text-2xl font-black">Submit Event Proposal</h2>
        <p className="text-blue-100/80 text-sm">Target: Administrator Review Queue</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-sm font-bold text-slate-700">Event Title</label>
            <input 
              {...register('title')} 
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 focus:ring-2 focus:ring-[#1f5f89]/20 transition outline-none" 
              placeholder="Enter proposal title"
            />
            {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-sm font-bold text-slate-700">Description</label>
            <textarea 
              {...register('description')} 
              rows="3"
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 focus:ring-2 focus:ring-[#1f5f89]/20 transition outline-none" 
            />
            {errors.description && <p className="text-xs text-red-500 font-medium">{errors.description.message}</p>}
          </div>

          {/* Location (Venue) */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <MapPin size={14}/> Venue (location)
            </label>
            <input 
              {...register('location')} 
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 focus:ring-2 focus:ring-[#1f5f89]/20 transition outline-none" 
            />
            {errors.location && <p className="text-xs text-red-500 font-medium">{errors.location.message}</p>}
          </div>

          {/* Organization Type */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Organization Type</label>
            <select 
              {...register('organizationType')}
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 outline-none"
            >
              <option value="STUDENT_ORG">Student Organization</option>
              <option value="FACULTY">Faculty</option>
              <option value="EXTERNAL">External Partner</option>
            </select>
          </div>

          {/* Proposed Date */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Clock size={14}/> Proposed Date
            </label>
            <input 
              type="date"
              {...register('proposedDate')} 
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 outline-none" 
            />
            {errors.proposedDate && <p className="text-xs text-red-500 font-medium">{errors.proposedDate.message}</p>}
          </div>

          {/* Capacity */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Users size={14}/> Max Capacity
            </label>
            <input 
              type="number"
              {...register('capacity')} 
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 outline-none" 
            />
            {errors.capacity && <p className="text-xs text-red-500 font-medium">{errors.capacity.message}</p>}
          </div>

          {/* Start Time */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Start Time</label>
            <input 
              type="time"
              {...register('startTime')} 
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 outline-none" 
            />
          </div>

          {/* End Time */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">End Time</label>
            <input 
              type="time"
              {...register('endTime')} 
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 outline-none" 
            />
          </div>
        </div>

        <div className="pt-6">
          <button 
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-[#1f5f89] text-white py-4 rounded-2xl font-black tracking-wide hover:bg-[#164565] disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#1f5f89]/20"
          >
            {mutation.isPending ? "SUBMITTING..." : <><Send size={18}/> SUBMIT PROPOSAL</>}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProposalForm;
import React from 'react';
import { Calendar, MapPin, Tag } from 'lucide-react';

const EventCard = ({ event }) => {
  // Use eventID (DNA requirement) and venue (Entity field)
  const { eventID, title, eventDate, venue, organizationType } = event;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="h-1.5 w-full bg-[#1f5f89]" />
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black px-2 py-0.5 rounded uppercase">
            Approved
          </span>
          <span className="text-slate-400 text-[10px] font-mono">#{eventID}</span>
        </div>
        
        <h3 className="font-bold text-slate-900 leading-tight mb-4">{title}</h3>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar size={14} className="text-[#1f5f89]" />
            {new Date(eventDate).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin size={14} className="text-[#1f5f89]" />
            {venue}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Tag size={14} className="text-[#1f5f89]" />
            {organizationType}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;

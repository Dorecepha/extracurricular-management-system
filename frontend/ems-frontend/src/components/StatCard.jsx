import React from 'react';

function StatCard({ value, label, icon: Icon, color = 'blue', onClick, trend }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    cyan: 'bg-cyan-50 text-cyan-600'
  };

  const CardWrapper = onClick ? 'button' : 'div';
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all active:scale-95'
    : '';

  return (
    <CardWrapper
      onClick={onClick}
      className={`ems-card p-6 ${interactiveClasses}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl ${colorClasses[color]}`}>
            {Icon && <Icon size={24} />}
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 font-medium uppercase mt-1">{label}</p>
            {trend && (
              <p className="text-xs text-emerald-600 font-semibold mt-1">{trend}</p>
            )}
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}

export default StatCard;

import React from 'react';

function CapacityBar({ current, total, showLabel = true }) {
  if (total === 0 || total === null || total === undefined) {
    return null;
  }

  const percentage = Math.min((current / total) * 100, 100);

  // Determine color based on fill rate
  let fillClass = 'ems-capacity-fill low';
  if (percentage >= 70) {
    fillClass = 'ems-capacity-fill high';
  } else if (percentage >= 30) {
    fillClass = 'ems-capacity-fill medium';
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-slate-700">
            {current} / {total} registered
          </span>
          <span className="text-xs font-bold text-slate-500">
            {Math.round(percentage)}% full
          </span>
        </div>
      )}
      <div className="ems-capacity-bar">
        <div
          className={fillClass}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default CapacityBar;

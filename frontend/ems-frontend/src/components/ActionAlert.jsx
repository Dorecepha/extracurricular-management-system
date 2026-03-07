import React from 'react';
import { AlertCircle, Info, AlertTriangle, CheckCircle, X } from 'lucide-react';

function ActionAlert({ type = 'info', title, description, actions, onDismiss }) {
  const typeConfig = {
    warning: {
      icon: AlertTriangle,
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-200',
      textClass: 'text-amber-700',
      iconClass: 'text-amber-600'
    },
    error: {
      icon: AlertCircle,
      bgClass: 'bg-rose-50',
      borderClass: 'border-rose-200',
      textClass: 'text-rose-700',
      iconClass: 'text-rose-600'
    },
    info: {
      icon: Info,
      bgClass: 'bg-blue-50',
      borderClass: 'border-blue-200',
      textClass: 'text-blue-700',
      iconClass: 'text-blue-600'
    },
    success: {
      icon: CheckCircle,
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
      textClass: 'text-emerald-700',
      iconClass: 'text-emerald-600'
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={`ems-card p-4 border ${config.bgClass} ${config.borderClass}`}
    >
      <div className="flex items-start gap-3">
        <Icon size={20} className={config.iconClass} />
        <div className="flex-1">
          <h4 className={`font-bold text-sm ${config.textClass} mb-1`}>
            {title}
          </h4>
          {description && (
            <p className={`text-sm ${config.textClass} opacity-90`}>
              {description}
            </p>
          )}
          {actions && actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                    action.primary
                      ? `${config.textClass} bg-white hover:bg-slate-50`
                      : `${config.textClass} underline hover:no-underline`
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${config.textClass} hover:opacity-70 transition`}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default ActionAlert;

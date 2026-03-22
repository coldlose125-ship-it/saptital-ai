import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, User } from 'lucide-react';

interface Alert {
  id: string;
  type: 'call' | 'device';
  message: string;
  time: Date;
}

export interface AlertBarHandle {
  addAlert: (type: 'call' | 'device', message: string) => void;
}

export function AlertBar() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const dismiss = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  return (
    <AnimatePresence>
      {alerts.map(alert => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, y: -40, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3 }}
          className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold ${
            alert.type === 'call'
              ? 'bg-blue-600 text-white'
              : 'bg-amber-500 text-white'
          }`}
        >
          {alert.type === 'call'
            ? <User className="w-4 h-4 shrink-0" />
            : <Volume2 className="w-4 h-4 shrink-0 animate-pulse" />
          }
          <span className="flex-1">
            {alert.type === 'call' ? '📢' : '🔔'} {alert.message}
          </span>
          <span className="text-xs opacity-75 font-normal">
            {alert.time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button onClick={() => dismiss(alert.id)} className="ml-1 opacity-75 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

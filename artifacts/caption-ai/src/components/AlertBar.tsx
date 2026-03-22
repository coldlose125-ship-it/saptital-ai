import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Volume2, User } from 'lucide-react';

interface Alert {
  id: string;
  type: 'call' | 'device';
  message: string;
  time: Date;
}

export function AlertBar() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const addAlert = useCallback((type: 'call' | 'device', message: string) => {
    const newAlert: Alert = { id: crypto.randomUUID(), type, message, time: new Date() };
    setAlerts(prev => [newAlert, ...prev].slice(0, 3));
    // Auto-dismiss after 8s
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
    }, 8000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  return (
    <div className="w-full">
      {/* Active alerts */}
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

      {/* Test buttons (demo) */}
      <div className="flex items-center gap-2 px-4 py-2 bg-primary/8 border-b border-border text-xs">
        <Bell className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-muted-foreground font-medium mr-1">환경음 알림 테스트:</span>
        <button
          onClick={() => addAlert('call', '간호사가 환자 이름을 부르고 있습니다')}
          className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md font-semibold transition-colors"
        >
          👩‍⚕️ 간호사 호출
        </button>
        <button
          onClick={() => addAlert('device', '의료기기 알람이 울리고 있습니다')}
          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-md font-semibold transition-colors"
        >
          🔔 기기 알람
        </button>
      </div>
    </div>
  );
}

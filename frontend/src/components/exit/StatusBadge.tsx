// src/components/exit/StatusBadge.tsx
// One small badge that says where a student stands against his deadline.

import { ExitLog } from './exitTypes';
import { formatMinutes } from './exitTime';

export default function StatusBadge({ log, now }: { log: ExitLog; now: Date }) {
    if (log.status === 'RETURNED') {
        if (log.is_late) {
            return <span className="badge bg-danger">{formatMinutes(log.late_minutes)} geç döndü</span>;
        }
        return <span className="badge bg-success">{log.expected_return_time ? 'Zamanında' : 'Döndü'}</span>;
    }

    // still out
    if (!log.expected_return_time) {
        return <span className="badge bg-secondary">Süre sınırı yok</span>;
    }
    const diffMin = (new Date(log.expected_return_time).getTime() - now.getTime()) / 60000;
    if (diffMin < 0) {
        return <span className="badge bg-danger">{formatMinutes(-diffMin)} geçti</span>;
    }
    return (
        <span className={`badge ${diffMin <= 30 ? 'bg-warning text-dark' : 'bg-success'}`}>
            Kalan {formatMinutes(diffMin)}
        </span>
    );
}

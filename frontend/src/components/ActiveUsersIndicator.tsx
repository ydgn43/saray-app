import React from 'react';
import { ActiveUser } from '../websocket/usePresence';
import './ActiveUsersIndicator.css';

interface ActiveUsersIndicatorProps {
    activeUsers: ActiveUser[];
    userCount: number;
}

export const ActiveUsersIndicator: React.FC<ActiveUsersIndicatorProps> = ({ activeUsers, userCount }) => {
    // Get initials from username
    const getInitials = (username: string) => {
        const parts = username.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return username.substring(0, 2).toUpperCase();
    };

    // Generate consistent color based on username
    const getAvatarColor = (username: string) => {
        const colors = [
            '#3B82F6', // blue
            '#10B981', // green
            '#F59E0B', // amber
            '#EF4444', // red
            '#8B5CF6', // purple
            '#EC4899', // pink
            '#14B8A6', // teal
            '#F97316', // orange
        ];
        const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    if (userCount === 0) {
        return null;
    }

    // Show up to 5 avatars, then "+N more"
    const displayUsers = activeUsers.slice(0, 5);
    const remainingCount = userCount - displayUsers.length;

    return (
        <div className="active-users-indicator">
            <div className="active-users-avatars">
                {displayUsers.map((user) => (
                    <div
                        key={user.userid}
                        className="user-avatar"
                        style={{ backgroundColor: getAvatarColor(user.username) }}
                        title={`${user.username} (${user.role})`}
                    >
                        {getInitials(user.username)}
                    </div>
                ))}
                {remainingCount > 0 && (
                    <div className="user-avatar remaining-count" title={`+${remainingCount} more`}>
                        +{remainingCount}
                    </div>
                )}
            </div>
            <div className="active-users-text">
                <span className="online-badge">●</span>
                <span className="user-count">{userCount} {userCount === 1 ? 'kullanıcı' : 'kullanıcı'}</span>
            </div>
        </div>
    );
};

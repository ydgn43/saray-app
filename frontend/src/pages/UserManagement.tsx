// src/pages/UserManagement.tsx
import React, { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';

type User = {
    accountid: number;
    username: string;
    role_name: string;
};

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authFetch('http://localhost:3001/user')
            .then(res => res.json())
            .then(data => setUsers(data))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <h4>Kullanıcılar</h4>
            {loading ? <div>Yükleniyor...</div> : (
                <table className="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Kullanıcı Adı</th>
                            <th>Rol</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u, i) => (
                            <tr key={u.accountid}>
                                <td>{i + 1}</td>
                                <td>{u.username}</td>
                                <td>{u.role_name}</td>
                                {/* Add buttons for edit/delete if needed */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default UserManagement;

import React, { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';
import config from '../config';
import { toast } from 'react-toastify';

type User = {
    accountid: number;
    username: string;
    role_name: string;
};

const emptyUser: Omit<User, "accountid"> & { password?: string } = {
    username: "",
    role_name: "hoca",
    password: "",
};

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<"add" | "edit" | null>(null);
    const [currentUser, setCurrentUser] = useState<Partial<User & { password?: string }>>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [showResetCodeModal, setShowResetCodeModal] = useState(false);
    const [resetCodeData, setResetCodeData] = useState<{ username: string; code: string } | null>(null);

    // Fetch users
    const loadUsers = async () => {
        setLoading(true);
        const res = await authFetch(`${config.API_BASE_URL}/user`);
        const data = await res.json();
        setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // Start editing
    const startEdit = (user: User) => {
        setCurrentUser(user);
        setModal("edit");
        setError("");
    };

    // Start adding
    const startAdd = () => {
        setCurrentUser({ ...emptyUser });
        setModal("add");
        setError("");
    };

    // Handle add/edit submit
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            const { accountid, username, role_name, password } = currentUser;

            if (!username || !role_name || (modal === "add" && !password)) {
                setError("Kullanıcı adı, rol ve (eklerken) şifre gereklidir.");
                setSaving(false);
                return;
            }

            if (modal === "add") {
                // Add user
                const res = await authFetch(`${config.API_BASE_URL}/user`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, role_name, password }),
                });
                if (!res.ok) throw new Error(await res.text());
            } else if (modal === "edit" && accountid) {
                // Edit user
                const res = await authFetch(`${config.API_BASE_URL}/user/${accountid}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, role_name, password }),
                });
            }
            setModal(null);
            setCurrentUser({});
            loadUsers();

            // Refresh page to show updated user list
            setTimeout(() => window.location.reload(), 1000);
        } catch (err: any) {
            setError(err.message || "Hata oluştu.");
        } finally {
            setSaving(false);
        }
    };

    // Handle delete
    const handleDelete = async (user: User) => {
        if (!window.confirm(`Kullanıcıyı silmek istediğinize emin misiniz? (${user.username})`)) return;
        setSaving(true);
        try {
            const res = await authFetch(`${config.API_BASE_URL}/user/${user.accountid}`, { method: "DELETE" });
            if (!res.ok) throw new Error(await res.text());
            loadUsers();

            // Refresh page to update user list
            setTimeout(() => window.location.reload(), 1000);
        } catch (err: any) {
            setError(err.message || "Hata oluştu.");
        } finally {
            setSaving(false);
        }
    };

    // Modal close
    const closeModal = () => {
        setModal(null);
        setCurrentUser({});
        setError("");
    };

    // Generate password reset code
    const handleGenerateResetCode = async (user: User) => {
        setSaving(true);
        try {
            const res = await authFetch(`${config.API_BASE_URL}/auth/admin/generate-reset-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Kod oluşturulamadı');
            }

            const data = await res.json();
            setResetCodeData({
                username: user.username,
                code: data.resetToken
            });
            setShowResetCodeModal(true);
            toast.success('Şifre sıfırlama kodu oluşturuldu!');
        } catch (err: any) {
            toast.error(err.message || 'Kod oluşturulamadı');
        } finally {
            setSaving(false);
        }
    };

    // Copy reset code to clipboard
    const handleCopyResetCode = () => {
        if (resetCodeData) {
            navigator.clipboard.writeText(resetCodeData.code);
            toast.success('Kod kopyalandı!');
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Kullanıcılar</h4>
                <button className="btn btn-primary" onClick={startAdd}>Yeni Kullanıcı</button>
            </div>
            {loading ? <div>Yükleniyor...</div> : (
                <table className="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Kullanıcı Adı</th>
                            <th>Rol</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u, i) => (
                            <tr key={u.accountid}>
                                <td>{i + 1}</td>
                                <td>{u.username}</td>
                                <td>{u.role_name}</td>
                                <td>
                                    <button className="btn btn-sm btn-warning me-2" onClick={() => startEdit(u)}>Düzenle</button>
                                    <button className="btn btn-sm btn-danger me-2" onClick={() => handleDelete(u)}>Sil</button>
                                    <button className="btn btn-sm btn-info" onClick={() => handleGenerateResetCode(u)} disabled={saving}>
                                        🔑 Şifre Kodu
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {/* Modal for Add/Edit */}
            {(modal === "add" || modal === "edit") && (
                <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,0.2)" }} tabIndex={-1}>
                    <div className="modal-dialog">
                        <form className="modal-content" onSubmit={handleSave}>
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {modal === "add" ? "Yeni Kullanıcı Ekle" : "Kullanıcıyı Düzenle"}
                                </h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                {error && <div className="alert alert-danger">{error}</div>}
                                <div className="mb-3">
                                    <label className="form-label">Kullanıcı Adı</label>
                                    <input className="form-control"
                                        value={currentUser.username ?? ""}
                                        onChange={e => setCurrentUser({ ...currentUser, username: e.target.value })}
                                        disabled={saving}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Rol</label>
                                    <select
                                        className="form-select"
                                        value={currentUser.role_name ?? "hoca"}
                                        onChange={e => setCurrentUser({ ...currentUser, role_name: e.target.value })}
                                        disabled={saving}
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="hoca">Hoca</option>
                                        <option value="yoklamaci">Yoklamacı</option>
                                        <option value="talebe">Talebe</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">
                                        {modal === "edit" ? "Şifreyi Değiştir (Opsiyonel)" : "Şifre"}
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={currentUser.password ?? ""}
                                        onChange={e => setCurrentUser({ ...currentUser, password: e.target.value })}
                                        placeholder={modal === "edit" ? "Boş bırakılırsa şifre değişmez" : ""}
                                        disabled={saving}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={saving}>
                                    İptal
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Code Modal */}
            {showResetCodeModal && resetCodeData && (
                <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">🔑 Şifre Sıfırlama Kodu</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowResetCodeModal(false)}></button>
                            </div>
                            <div className="modal-body text-center">
                                <p className="mb-3">
                                    <strong>{resetCodeData.username}</strong> için şifre sıfırlama kodu:
                                </p>
                                <div
                                    style={{
                                        padding: '20px',
                                        background: '#f8f9fa',
                                        borderRadius: '8px',
                                        fontSize: '32px',
                                        fontWeight: '700',
                                        letterSpacing: '4px',
                                        color: '#1e40af',
                                        fontFamily: 'monospace',
                                        marginBottom: '20px',
                                        border: '2px solid #3b82f6'
                                    }}
                                >
                                    {resetCodeData.code}
                                </div>
                                <button
                                    className="btn btn-primary mb-3"
                                    onClick={handleCopyResetCode}
                                >
                                    📋 Kodu Kopyala
                                </button>
                                <div className="alert alert-info">
                                    <small>
                                        ℹ️ Bu kodu kullanıcıyla paylaşın. Kod 24 saat geçerlidir.
                                        <br />
                                        Kullanıcı bu kodu şifre sıfırlama sayfasında kullanabilir.
                                    </small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowResetCodeModal(false)}>
                                    Kapat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
};

export default UserManagement;



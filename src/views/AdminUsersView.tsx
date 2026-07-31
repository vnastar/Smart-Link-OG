import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { User, UserRole, UserStatus } from '../types.js';
import { Users, Search, KeyRound, Shield, Ban, CheckCircle2, Trash2, Edit3, Save, X, AlertTriangle } from 'lucide-react';

export const AdminUsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Editing User Limit / Role modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [editLimit, setEditLimit] = useState(3);
  const [editStatus, setEditStatus] = useState<UserStatus>('active');
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleResetPassword = async (user: User) => {
    const newPwd = prompt(`Nhập mật khẩu mới cho user "${user.username}":`, '123456');
    if (!newPwd) return;

    try {
      const msg = await api.resetUserPassword(user.id, newPwd);
      alert(`${msg}. Người dùng sẽ bị buộc đổi mật khẩu ở lần đăng nhập tiếp theo.`);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Reset mật khẩu thất bại');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (confirm(`Bạn có chắc muốn xóa vĩnh viễn tài khoản "${user.username}" và toàn bộ link của họ?`)) {
      try {
        await api.deleteAdminUser(user.id);
        loadUsers();
      } catch (err: any) {
        alert(err.message || 'Xóa tài khoản thất bại');
      }
    }
  };

  const startEditUser = (u: User) => {
    setEditingUser(u);
    setEditRole(u.role);
    setEditLimit(u.daily_limit);
    setEditStatus(u.status);
  };

  const saveEditUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      await api.updateAdminUser(editingUser.id, {
        role: editRole,
        daily_limit: editLimit,
        status: editStatus
      });
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật user');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Quản Lý Người Dùng (User Management)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý tài khoản, thay đổi quyền Admin/User, chỉnh sửa Daily Limit và Reset Mật khẩu
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo username hoặc email..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Đang tải danh sách user...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">Không tìm thấy người dùng</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3 font-semibold">Username / Email</th>
                  <th className="p-3 font-semibold">Vai trò (Role)</th>
                  <th className="p-3 font-semibold">Daily Limit</th>
                  <th className="p-3 font-semibold">Trạng thái</th>
                  <th className="p-3 font-semibold">Force Change Pwd</th>
                  <th className="p-3 font-semibold text-right">Thao tác Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{u.username}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                    </td>

                    <td className="p-3">
                      {u.role === 'admin' ? (
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase">
                          Admin
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-mono px-2 py-0.5 rounded uppercase">
                          User
                        </span>
                      )}
                    </td>

                    <td className="p-3 font-mono font-bold text-indigo-600">
                      {u.daily_limit} link/ngày
                    </td>

                    <td className="p-3">
                      {u.status === 'active' ? (
                        <span className="text-emerald-700 flex items-center gap-1 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Hoạt động
                        </span>
                      ) : (
                        <span className="text-red-700 flex items-center gap-1 font-semibold text-[11px]">
                          <Ban className="w-3.5 h-3.5 text-red-600" /> Bị khóa
                        </span>
                      )}
                    </td>

                    <td className="p-3 font-mono text-[11px]">
                      {u.must_change_password ? (
                        <span className="text-amber-700 font-semibold">TRUE (Bắt buộc)</span>
                      ) : (
                        <span className="text-slate-400">FALSE</span>
                      )}
                    </td>

                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => startEditUser(u)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium inline-flex items-center gap-1 border border-slate-200"
                        title="Chỉnh sửa quyền & limit"
                      >
                        <Edit3 className="w-3 h-3 text-amber-600" /> Sửa User
                      </button>

                      <button
                        onClick={() => handleResetPassword(u)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium inline-flex items-center gap-1 border border-slate-200"
                        title="Reset mật khẩu"
                      >
                        <KeyRound className="w-3 h-3 text-indigo-600" /> Reset Pwd
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-md"
                        title="Xóa user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl relative text-slate-800">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Chỉnh Sửa Tài Khoản: {editingUser.username}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Phân Quyền Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="user">User (Thành viên)</option>
                  <option value="admin">Admin (Quản trị viên)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Giới Hạn Tạo Link Trong Ngày (Daily Limit)
                </label>
                <input
                  type="number"
                  min="1"
                  max="99999"
                  value={editLimit}
                  onChange={(e) => setEditLimit(parseInt(e.target.value, 10))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Trạng Thái Tài Khoản
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">Active (Hoạt động)</option>
                  <option value="blocked">Blocked (Bị khóa)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveEditUser}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

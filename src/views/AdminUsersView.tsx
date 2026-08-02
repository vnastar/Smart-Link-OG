import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { User, UserRole, UserStatus } from '../types.js';
import { Users, Search, KeyRound, Shield, Ban, CheckCircle2, Trash2, Edit3, Save, X, UserPlus, Lock, Mail, UserCheck, Clock } from 'lucide-react';

export const AdminUsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create User modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [newLimit, setNewLimit] = useState(10);
  const [newStatus, setNewStatus] = useState<UserStatus>('active');
  const [newMustChangePwd, setNewMustChangePwd] = useState(true);
  const [creating, setCreating] = useState(false);

  // Editing User Limit / Role / Expiration modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [editLimit, setEditLimit] = useState(3);
  const [editStatus, setEditStatus] = useState<UserStatus>('active');
  const [editDefaultExpDays, setEditDefaultExpDays] = useState<number | ''>('');
  const [editAllowUnlimited, setEditAllowUnlimited] = useState<'default' | 'allow' | 'disallow'>('default');
  const [editMaxExpDays, setEditMaxExpDays] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  // Create User modal link expiration state
  const [newDefaultExpDays, setNewDefaultExpDays] = useState<number | ''>('');
  const [newAllowUnlimited, setNewAllowUnlimited] = useState<'default' | 'allow' | 'disallow'>('default');
  const [newMaxExpDays, setNewMaxExpDays] = useState<number | ''>('');

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
    setEditDefaultExpDays(u.default_expiration_days ?? '');
    setEditAllowUnlimited(
      u.allow_unlimited_expiration === undefined || u.allow_unlimited_expiration === null
        ? 'default'
        : u.allow_unlimited_expiration
        ? 'allow'
        : 'disallow'
    );
    setEditMaxExpDays(u.max_expiration_days ?? '');
  };

  const saveEditUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      await api.updateAdminUser(editingUser.id, {
        role: editRole,
        daily_limit: editLimit,
        status: editStatus,
        default_expiration_days: editDefaultExpDays === '' ? null : Number(editDefaultExpDays),
        allow_unlimited_expiration: editAllowUnlimited === 'default' ? null : editAllowUnlimited === 'allow',
        max_expiration_days: editMaxExpDays === '' ? null : Number(editMaxExpDays)
      });
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật user');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      alert('Vui lòng điền đầy đủ Tên đăng nhập, Email và Mật khẩu');
      return;
    }

    setCreating(true);
    try {
      const res = await api.createAdminUser({
        username: newUsername.trim(),
        email: newEmail.trim(),
        password: newPassword.trim(),
        role: newRole,
        daily_limit: newLimit,
        status: newStatus,
        must_change_password: newMustChangePwd,
        default_expiration_days: newDefaultExpDays === '' ? null : Number(newDefaultExpDays),
        allow_unlimited_expiration: newAllowUnlimited === 'default' ? null : newAllowUnlimited === 'allow',
        max_expiration_days: newMaxExpDays === '' ? null : Number(newMaxExpDays)
      });

      alert(res.message || 'Tạo người dùng thành công!');
      setShowCreateModal(false);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      setNewLimit(10);
      setNewStatus('active');
      setNewMustChangePwd(true);
      setNewDefaultExpDays('');
      setNewAllowUnlimited('default');
      setNewMaxExpDays('');
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Tạo tài khoản người dùng thất bại');
    } finally {
      setCreating(false);
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
            Tạo user mới, quản lý tài khoản, thay đổi quyền Admin/User, chỉnh sửa Daily Limit và Reset Mật khẩu
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tạo User Mới</span>
        </button>
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
                  <th className="p-3 font-semibold">Chính Sách Hết Hạn</th>
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

                    <td className="p-3 text-[11px]">
                      {u.default_expiration_days || u.allow_unlimited_expiration !== undefined && u.allow_unlimited_expiration !== null || u.max_expiration_days ? (
                        <div className="space-y-0.5">
                          {u.default_expiration_days ? (
                            <span className="inline-block bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-medium text-[10px] mr-1">
                              Mặc định: {u.default_expiration_days} ngày
                            </span>
                          ) : null}
                          {u.allow_unlimited_expiration === false ? (
                            <span className="inline-block bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-mono font-medium text-[10px] mr-1">
                              Bắt buộc hết hạn
                            </span>
                          ) : u.allow_unlimited_expiration === true ? (
                            <span className="inline-block bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono font-medium text-[10px] mr-1">
                              Cho phép vĩnh viễn
                            </span>
                          ) : null}
                          {u.max_expiration_days ? (
                            <span className="inline-block bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono font-medium text-[10px]">
                              Max: {u.max_expiration_days} ngày
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Theo hệ thống</span>
                      )}
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

              {/* Per-User Link Expiration Settings */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Cấu Hình Thời Gian Hết Hạn Link Cho User Này</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Thời Hạn Mặc Định (ngày)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Mặc định theo Hệ Thống"
                      value={editDefaultExpDays}
                      onChange={(e) => setEditDefaultExpDays(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Để trống = Theo cài đặt hệ thống</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Thời Hạn Tối Đa (ngày)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Mặc định theo Hệ Thống"
                      value={editMaxExpDays}
                      onChange={(e) => setEditMaxExpDays(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Để trống = Theo cài đặt hệ thống</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Cho Phép Tạo Link Vĩnh Viễn (Không Hết Hạn)
                  </label>
                  <select
                    value={editAllowUnlimited}
                    onChange={(e) => setEditAllowUnlimited(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="default">-- Mặc Định Theo Hệ Thống --</option>
                    <option value="allow">Cho phép Vĩnh Viễn</option>
                    <option value="disallow">Bắt buộc phải có ngày Hết Hạn</option>
                  </select>
                </div>
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
      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-800">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg text-slate-900 mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Tạo Tài Khoản Người Dùng Mới
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Nhập đầy đủ thông tin để cấp tài khoản mới cho nhân viên hoặc người dùng
            </p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Tên Đăng Nhập <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="vd: nguyenvana"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="vd: user@example.com"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Mật Khẩu Ban Đầu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mật khẩu khởi tạo..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Phân Quyền (Role)
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="user">User (Thành viên)</option>
                    <option value="admin">Admin (Quản trị)</option>
                  </select>
                </div>

                {/* Limit */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Daily Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99999"
                    value={newLimit}
                    onChange={(e) => setNewLimit(parseInt(e.target.value, 10) || 10)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Trạng Thái
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as UserStatus)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Active (Hoạt động)</option>
                    <option value="blocked">Blocked (Khóa)</option>
                  </select>
                </div>
              </div>

              {/* Per-User Link Expiration Settings */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Chính Sách Thời Gian Hết Hạn Link Tùy Chỉnh (Tùy chọn)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Thời Hạn Mặc Định (ngày)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Theo Hệ Thống"
                      value={newDefaultExpDays}
                      onChange={(e) => setNewDefaultExpDays(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Để trống = Theo hệ thống</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Thời Hạn Tối Đa (ngày)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Theo Hệ Thống"
                      value={newMaxExpDays}
                      onChange={(e) => setNewMaxExpDays(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Để trống = Theo hệ thống</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Cho Phép Link Vĩnh Viễn (Không Hết Hạn)
                  </label>
                  <select
                    value={newAllowUnlimited}
                    onChange={(e) => setNewAllowUnlimited(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="default">-- Mặc Định Theo Hệ Thống --</option>
                    <option value="allow">Cho phép Vĩnh Viễn</option>
                    <option value="disallow">Bắt buộc phải cài ngày Hết Hạn</option>
                  </select>
                </div>
              </div>

              {/* Force password change toggle */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newMustChangePwd}
                    onChange={(e) => setNewMustChangePwd(e.target.checked)}
                    className="accent-indigo-600 w-4 h-4 cursor-pointer rounded"
                  />
                  <div>
                    <span className="font-semibold block">Bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên</span>
                    <span className="text-[11px] text-slate-500 block">
                      Yêu cầu người dùng tự đổi mật khẩu mới ngay khi đăng nhập
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{creating ? 'Đang khởi tạo...' : 'Tạo Tài Khoản'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

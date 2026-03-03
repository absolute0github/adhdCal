import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, ShieldBan, ShieldCheck, KeyRound, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUsers, suspendUser, unsuspendUser, resetUserPassword } from '../services/adminService';

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      const data = await getUsers();
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async () => {
    if (!confirmAction) return;

    const { type, userId, email } = confirmAction;
    setConfirmAction(null);
    setActionMessage(null);

    try {
      if (type === 'suspend') {
        await suspendUser(userId);
        setActionMessage({ type: 'success', text: `${email} has been suspended` });
      } else if (type === 'unsuspend') {
        await unsuspendUser(userId);
        setActionMessage({ type: 'success', text: `${email} has been unsuspended` });
      } else if (type === 'reset-password') {
        await resetUserPassword(userId);
        setActionMessage({ type: 'success', text: `Password reset email sent to ${email}` });
      }
      await fetchUsers();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.error || err.response?.data?.message || 'Action failed'
      });
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.email?.toLowerCase().includes(q) ||
           u.displayName?.toLowerCase().includes(q);
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/app"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-sm text-gray-500">{total} registered user{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}
      {actionMessage && (
        <div className={`border rounded-lg p-3 text-sm ${
          actionMessage.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by email or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className={user.suspendedAt ? 'bg-red-50/50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-500">
                          {(user.displayName || user.email)?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{user.displayName || '-'}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      user.subscriptionTier === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.subscriptionTier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {user.activeTaskCount} active / {user.totalTaskCount} total
                  </td>
                  <td className="px-4 py-3">
                    {user.suspendedAt ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {user.role !== 'admin' && (
                        user.suspendedAt ? (
                          <button
                            onClick={() => setConfirmAction({ type: 'unsuspend', userId: user.id, email: user.email })}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                            title="Unsuspend user"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmAction({ type: 'suspend', userId: user.id, email: user.email })}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            title="Suspend user"
                          >
                            <ShieldBan className="w-3.5 h-3.5" />
                            Suspend
                          </button>
                        )
                      )}
                      <button
                        onClick={() => setConfirmAction({ type: 'reset-password', userId: user.id, email: user.email })}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        title="Send password reset email"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Reset Password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredUsers.map(user => (
            <div key={user.id} className={`p-4 space-y-3 ${user.suspendedAt ? 'bg-red-50/50' : ''}`}>
              <div className="flex items-center gap-3">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-500">
                    {(user.displayName || user.email)?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">{user.displayName || '-'}</div>
                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                </div>
                {user.suspendedAt ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Suspended</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Active</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className={`inline-flex items-center px-2 py-0.5 rounded font-medium ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                }`}>{user.role}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded font-medium ${
                  user.subscriptionTier === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                }`}>{user.subscriptionTier}</span>
                <span>{user.activeTaskCount}/{user.totalTaskCount} tasks</span>
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                {user.role !== 'admin' && (
                  user.suspendedAt ? (
                    <button
                      onClick={() => setConfirmAction({ type: 'unsuspend', userId: user.id, email: user.email })}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Unsuspend
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmAction({ type: 'suspend', userId: user.id, email: user.email })}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <ShieldBan className="w-3.5 h-3.5" />
                      Suspend
                    </button>
                  )
                )}
                <button
                  onClick={() => setConfirmAction({ type: 'reset-password', userId: user.id, email: user.email })}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Reset Password
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'No users match your search.' : 'No users found.'}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {confirmAction.type === 'suspend' && 'Suspend User'}
              {confirmAction.type === 'unsuspend' && 'Unsuspend User'}
              {confirmAction.type === 'reset-password' && 'Reset Password'}
            </h3>
            <p className="text-sm text-gray-600">
              {confirmAction.type === 'suspend' && (
                <>Are you sure you want to suspend <strong>{confirmAction.email}</strong>? They will be unable to access the app.</>
              )}
              {confirmAction.type === 'unsuspend' && (
                <>Are you sure you want to unsuspend <strong>{confirmAction.email}</strong>? They will regain access to the app.</>
              )}
              {confirmAction.type === 'reset-password' && (
                <>This will send a password reset email to <strong>{confirmAction.email}</strong>.</>
              )}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  confirmAction.type === 'suspend'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmAction.type === 'unsuspend'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {confirmAction.type === 'suspend' && 'Suspend'}
                {confirmAction.type === 'unsuspend' && 'Unsuspend'}
                {confirmAction.type === 'reset-password' && 'Send Reset Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

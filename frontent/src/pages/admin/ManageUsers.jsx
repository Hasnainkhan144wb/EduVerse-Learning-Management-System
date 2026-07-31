import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import {
  FiUsers,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiX,
  FiTrash2,
  FiUserCheck,
  FiAlertTriangle,
} from 'react-icons/fi';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending'
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedRole !== 'All') params.role = selectedRole;
      if (searchQuery) params.search = searchQuery;

      const response = await api.get('/admin/users', { params });
      if (response.data && response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin users:', err);
      toast.error('Failed to load user directory');
    } finally {
      setLoading(false);
    }
  }, [selectedRole, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Approve User
  const handleApproveUser = async (userId) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/approve`);
      if (response.data && response.data.success) {
        toast.success('User account approved and activated! 🎉');
        fetchUsers();
        if (selectedUserModal && selectedUserModal._id === userId) {
          setSelectedUserModal((prev) => ({ ...prev, status: 'Active', isApproved: true }));
        }
      }
    } catch (err) {
      toast.error('Failed to approve user account');
    }
  };

  // Handle Reject User
  const handleRejectUser = async (userId) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/reject`);
      if (response.data && response.data.success) {
        toast.success('User registration request rejected.');
        fetchUsers();
        if (selectedUserModal && selectedUserModal._id === userId) {
          setSelectedUserModal((prev) => ({ ...prev, status: 'Rejected', isApproved: false }));
        }
      }
    } catch (err) {
      toast.error('Failed to reject user account');
    }
  };

  // Handle Confirm Delete User
  const handleConfirmDelete = async () => {
    if (!deleteConfirmUser) return;

    try {
      setDeleting(true);
      const response = await api.delete(`/admin/users/${deleteConfirmUser._id}`);
      if (response.data && response.data.success) {
        toast.success('User account deleted successfully.');
        setDeleteConfirmUser(null);
        if (selectedUserModal && selectedUserModal._id === deleteConfirmUser._id) {
          setSelectedUserModal(null);
        }
        fetchUsers();
      }
    } catch (err) {
      console.error('Error deleting user account:', err);
      toast.error(err.response?.data?.message || 'Failed to delete user account.');
    } finally {
      setDeleting(false);
    }
  };

  // Pending users count & filtered users
  const pendingUsersList = users.filter((u) => u.status === 'Pending' || (!u.isApproved && u.role !== 'Admin'));
  const displayedUsers = users.filter((u) => {
    if (activeTab === 'pending') {
      return u.status === 'Pending' || (!u.isApproved && u.role !== 'Admin');
    }
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 font-sans"
    >
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Governance & Account Control
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FiUsers className="text-blue-500" /> Platform User Directory
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review, approve, or permanently remove approved student and instructor accounts.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 border border-slate-800 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            <FiUserCheck className="w-3.5 h-3.5" /> Pending Approvals ({pendingUsersList.length})
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <FiFilter className="text-slate-500" />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Roles</option>
            <option value="Student">Students Only</option>
            <option value="Instructor">Instructors Only</option>
            <option value="Admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* User Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-xs">Loading user records...</p>
          </div>
        ) : displayedUsers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FiUsers className="text-slate-600 text-3xl mx-auto" />
            <p className="text-slate-300 font-bold text-sm">No users matched your query</p>
            <p className="text-slate-500 text-xs">Try clearing search filters or switching tabs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Profile</th>
                  <th className="py-3.5 px-4">Full Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Registration Date</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedUsers.map((user) => {
                  const isPending = user.status === 'Pending' || (!user.isApproved && user.role !== 'Admin');
                  const isRejected = user.status === 'Rejected';
                  const isAdmin = user.role === 'Admin';

                  return (
                    <tr key={user._id} className="hover:bg-slate-800/40 transition">
                      {/* Avatar */}
                      <td className="py-4 px-4">
                        <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30 overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name?.charAt(0) || 'U'
                          )}
                        </div>
                      </td>

                      {/* Full Name */}
                      <td className="py-4 px-4 font-bold text-xs text-white">
                        {user.name}
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4 text-xs text-slate-400">
                        {user.email}
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            user.role === 'Admin'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : user.role === 'Instructor'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Registration Date */}
                      <td className="py-4 px-4 text-xs text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* Current Status */}
                      <td className="py-4 px-4">
                        {isRejected ? (
                          <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-xs font-semibold flex items-center gap-1.5 w-max">
                            <FiXCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        ) : isPending ? (
                          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold flex items-center gap-1.5 w-max">
                            <FiXCircle className="w-3.5 h-3.5" /> Pending Verification
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold flex items-center gap-1.5 w-max">
                            <FiCheckCircle className="w-3.5 h-3.5" /> Active
                          </span>
                        )}
                      </td>

                      {/* Actions: Approve / Reject / View Details / Delete */}
                      <td className="py-4 px-4 text-right space-x-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleApproveUser(user._id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition inline-flex items-center gap-1"
                            >
                              <FiCheckCircle /> Approve
                            </button>
                            <button
                              onClick={() => handleRejectUser(user._id)}
                              className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1 border border-rose-500/30"
                            >
                              <FiXCircle /> Reject
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setSelectedUserModal(user)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition inline-flex items-center gap-1"
                        >
                          <FiEye /> View Details
                        </button>

                        {/* Explicit Danger Red Delete Button for Approved/Pending non-Admin users */}
                        {!isAdmin && (
                          <button
                            onClick={() => setDeleteConfirmUser(user)}
                            className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold rounded-xl transition inline-flex items-center gap-1 shadow-sm"
                            title="Remove User Account"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW PROFILE MODAL */}
      <AnimatePresence>
        {selectedUserModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 font-bold text-base flex items-center justify-center border border-blue-500/30 overflow-hidden">
                    {selectedUserModal.avatar ? (
                      <img src={selectedUserModal.avatar} alt={selectedUserModal.name} className="w-full h-full object-cover" />
                    ) : (
                      selectedUserModal.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {selectedUserModal.name}
                    </h3>
                    <p className="text-xs text-slate-400">{selectedUserModal.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUserModal(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                  <div>
                    <span className="text-slate-500">Account Role</span>
                    <p className="font-bold text-white mt-0.5">{selectedUserModal.role}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Current Status</span>
                    <p className={`font-bold mt-0.5 ${selectedUserModal.status === 'Active' || selectedUserModal.isApproved ? 'text-emerald-400' : selectedUserModal.status === 'Rejected' ? 'text-rose-400' : 'text-amber-400'}`}>
                      {selectedUserModal.status || (selectedUserModal.isApproved ? 'Active' : 'Pending')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Registration Date</span>
                    <p className="font-bold text-white mt-0.5">
                      {new Date(selectedUserModal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Unique User ID</span>
                    <p className="font-mono text-blue-400 mt-0.5 text-[11px]">
                      {selectedUserModal._id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {selectedUserModal.role !== 'Admin' && (
                  <button
                    onClick={() => {
                      setDeleteConfirmUser(selectedUserModal);
                      setSelectedUserModal(null);
                    }}
                    className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold rounded-xl border border-rose-500/30 transition flex items-center gap-1.5"
                  >
                    <FiTrash2 className="w-4 h-4" /> Delete Account
                  </button>
                )}

                <div className="flex justify-end gap-2 ml-auto">
                  {selectedUserModal.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleApproveUser(selectedUserModal._id);
                          setSelectedUserModal(null);
                        }}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition"
                      >
                        Approve User
                      </button>
                      <button
                        onClick={() => {
                          handleRejectUser(selectedUserModal._id);
                          setSelectedUserModal(null);
                        }}
                        className="px-4 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md transition"
                      >
                        Reject User
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedUserModal(null)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE USER MODAL */}
      <AnimatePresence>
        {deleteConfirmUser && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center text-xl font-bold border border-rose-500/20 shrink-0">
                  <FiAlertTriangle />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Delete User Account</h3>
                  <p className="text-xs text-rose-400 font-semibold">Permanent System Action</p>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  Are you sure you want to permanently delete this user account?
                </p>
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <p className="text-white font-bold">{deleteConfirmUser.name}</p>
                  <p className="text-slate-400 text-[11px]">{deleteConfirmUser.email}</p>
                  <p className="text-indigo-400 text-[11px] font-bold">Role: {deleteConfirmUser.role}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmUser(null)}
                  disabled={deleting}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 transition flex items-center gap-2"
                >
                  {deleting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ManageUsers;

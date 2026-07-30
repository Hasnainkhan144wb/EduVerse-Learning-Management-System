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
  FiShield,
} from 'react-icons/fi';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending'
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [editUserModal, setEditUserModal] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedRole !== 'All') params.role = selectedRole;
      if (searchQuery) params.search = searchQuery;

      const response = await api.get('/admin/users', { params });
      if (response.data.success) {
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

  // Handle Approve / Verify User
  const handleApproveUser = async (userId, isApprove = true) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/approve`, {
        isApproved: isApprove,
      });

      if (response.data.success) {
        toast.success(
          isApprove
            ? 'User account verified and approved! 🎓'
            : 'User verification status revoked.'
        );
        fetchUsers();
        if (editUserModal && editUserModal._id === userId) {
          setEditUserModal((prev) => ({ ...prev, isApproved: isApprove }));
        }
      }
    } catch (err) {
      toast.error('Failed to update user approval status');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (user) => {
    if (!user) return;
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.name}"?`)) {
      return;
    }

    try {
      const response = await api.delete(`/admin/users/${user._id}`);
      if (response.data.success) {
        toast.success(`User "${user.name}" deleted successfully`);
        setEditUserModal(null);
        fetchUsers();
      }
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  // Filtered users for pending tab vs all tab
  const displayedUsers = users.filter((u) => {
    if (activeTab === 'pending') {
      return u.role === 'Instructor' && !u.isApproved;
    }
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Governance & User Control
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FiUsers className="text-blue-500" /> Platform User Directory
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage student registrations, verify instructor applications, and configure access roles.
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
            Pending Approvals (
            {users.filter((u) => u.role === 'Instructor' && !u.isApproved).length})
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
                  <th className="py-3.5 px-4">User Info</th>
                  <th className="py-3.5 px-4">Role Badge</th>
                  <th className="py-3.5 px-4">Verification Status</th>
                  <th className="py-3.5 px-4">Date Joined</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedUsers.map((user) => {
                  const isInstructor = user.role === 'Instructor';

                  return (
                    <tr key={user._id} className="hover:bg-slate-800/40 transition">
                      {/* Name & Email */}
                      <td className="py-4 px-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white">{user.name}</p>
                          <p className="text-[11px] text-slate-400">{user.email}</p>
                        </div>
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

                      {/* Verification Status */}
                      <td className="py-4 px-4">
                        {isInstructor ? (
                          user.isApproved ? (
                            <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                              <FiCheckCircle /> Verified Instructor
                            </span>
                          ) : (
                            <span className="text-amber-400 text-xs font-semibold flex items-center gap-1">
                              <FiXCircle /> Pending Verification
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs flex items-center gap-1">
                            <FiCheckCircle className="text-emerald-400" /> Active Account
                          </span>
                        )}
                      </td>

                      {/* Date Joined */}
                      <td className="py-4 px-4 text-xs text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedUserModal(user)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition inline-flex items-center"
                          title="View Details"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setEditUserModal(user)}
                          className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1 border border-blue-500/30"
                        >
                          Edit
                        </button>
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
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 font-bold text-base flex items-center justify-center border border-blue-500/30">
                    {selectedUserModal.name?.charAt(0) || 'U'}
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
                    <span className="text-slate-500">Approval Status</span>
                    <p className="font-bold text-emerald-400 mt-0.5">
                      {selectedUserModal.isApproved ? 'Verified' : 'Pending Verification'}
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

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedUserModal(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT USER MODAL (Approve & Delete Actions) */}
      <AnimatePresence>
        {editUserModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                    {editUserModal.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Edit User Parameters</h3>
                    <p className="text-xs text-slate-400">{editUserModal.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditUserModal(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Full Name:</span>
                    <span className="font-bold text-white">{editUserModal.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Role:</span>
                    <span className="font-bold text-indigo-400">{editUserModal.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span
                      className={`font-bold ${
                        editUserModal.isApproved ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {editUserModal.isApproved ? 'Verified Account' : 'Pending Verification'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Approve / Verify User Button */}
                  <button
                    onClick={() => handleApproveUser(editUserModal._id, !editUserModal.isApproved)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
                      editUserModal.isApproved
                        ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600 hover:text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                    }`}
                  >
                    <FiShield className="w-4 h-4" />
                    {editUserModal.isApproved ? 'Revoke Verification' : 'Approve User Account'}
                  </button>

                  {/* Delete User Button */}
                  <button
                    onClick={() => handleDeleteUser(editUserModal)}
                    className="w-full py-3 px-4 bg-red-600/10 border border-red-500/20 hover:bg-red-600 text-red-400 hover:text-white text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <FiTrash2 className="w-4 h-4" /> Delete User Permanently
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  onClick={() => setEditUserModal(null)}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700 transition"
                >
                  Close Modal
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

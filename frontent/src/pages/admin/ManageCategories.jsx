import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import {
  FiFolder,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiCode,
  FiDatabase,
  FiLayout,
  FiTrendingUp,
  FiTerminal,
  FiCpu,
  FiCheckCircle,
} from 'react-icons/fi';

const iconOptions = [
  { name: 'FiCode', label: 'Coding / Web Dev', icon: FiCode },
  { name: 'FiDatabase', label: 'Data & Cloud', icon: FiDatabase },
  { name: 'FiLayout', label: 'UI / UX Design', icon: FiLayout },
  { name: 'FiTrendingUp', label: 'Business & Finance', icon: FiTrendingUp },
  { name: 'FiTerminal', label: 'Software Engineering', icon: FiTerminal },
  { name: 'FiCpu', label: 'AI & Machine Learning', icon: FiCpu },
];

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('FiCode');
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleNameChange = (val) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(autoSlug);
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setIcon('FiCode');
    setModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setName(category.name || '');
    setSlug(category.slug || '');
    setDescription(category.description || '');
    setIcon(category.icon || 'FiCode');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      setSaving(true);
      if (editingCategory) {
        // Update Category
        const response = await api.put(`/categories/${editingCategory._id}`, {
          name,
          slug,
          description,
          icon,
        });
        if (response.data.success) {
          toast.success('Category updated successfully!');
          setModalOpen(false);
          fetchCategories();
        }
      } else {
        // Create Category
        const response = await api.post('/categories', {
          name,
          slug,
          description,
          icon,
        });
        if (response.data.success) {
          toast.success('Category created successfully!');
          setModalOpen(false);
          fetchCategories();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      const response = await api.delete(`/categories/${categoryId}`);
      if (response.data.success) {
        toast.success('Category removed');
        fetchCategories();
      }
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

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
          <span className="inline-block px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Taxonomy & Structure
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            <FiFolder className="text-purple-500" /> Category Architecture
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Organize courses into structured categories with auto-slug generation.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-900/30 flex items-center gap-2 transition"
        >
          <FiPlus className="w-4 h-4" /> Add New Category
        </button>
      </div>

      {/* Category Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-xs">Loading course categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FiFolder className="text-slate-600 text-4xl mx-auto" />
            <p className="text-slate-300 font-bold text-sm">No Categories Configured</p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
            >
              <FiPlus /> Create First Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <motion.div
                key={cat._id}
                whileHover={{ y: -3 }}
                className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl border border-purple-500/20">
                      <FiFolder />
                    </div>
                    <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-mono font-semibold text-slate-400">
                      /{cat.slug}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{cat.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {cat.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition text-xs font-semibold flex items-center gap-1.5"
                  >
                    <FiEdit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cat._id)}
                    className="p-2 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl transition text-xs"
                    title="Delete Category"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ADD / EDIT CATEGORY MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Category Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Full-Stack Web Development"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Auto-Generated Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    readOnly
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800/60 rounded-xl text-xs text-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief summary of topics covered in this category..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-900/30 flex items-center gap-1.5 transition"
                  >
                    <FiCheckCircle /> {saving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ManageCategories;

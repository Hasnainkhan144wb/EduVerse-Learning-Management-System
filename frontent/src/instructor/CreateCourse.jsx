import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  FiBookOpen,
  FiUploadCloud,
  FiArrowRight,
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiEdit,
} from 'react-icons/fi';

const CreateCourse = () => {
  const navigate = useNavigate();
  const { courseId, id } = useParams();
  const targetCourseId = courseId || id;
  const isEditMode = Boolean(targetCourseId);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(isEditMode);

  // Objectives & Requirements state
  const [objectives, setObjectives] = useState(['']);
  const [requirements, setRequirements] = useState(['']);

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      title: '',
      description: '',
      categoryRef: '',
      price: 0,
      level: 'Beginner',
      language: 'English',
      thumbnail: '',
    },
  });

  // 1. Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (response.data && response.data.success) {
          setCategories(response.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  // 2. Fetch and Pre-fill Existing Course Data (Edit Mode)
  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!targetCourseId) return;
      try {
        setLoadingCourse(true);
        const res = await api.get(`/courses/${targetCourseId}`);
        const course = res.data?.data || res.data?.course || res.data;

        if (course) {
          setValue('title', course.title || '');
          setValue('description', course.description || '');

          // Resolve Category ID
          const catId =
            course.categoryRef?._id ||
            course.categoryRef ||
            course.category?._id ||
            course.category ||
            '';
          setValue('categoryRef', catId);

          setValue('level', course.level || course.skillLevel || 'Beginner');
          setValue('language', course.language || 'English');
          setValue('price', course.price !== undefined ? course.price : 0);
          setValue('thumbnail', course.thumbnail || course.coverImage || '');

          // Resolve Objectives
          let objs = [];
          if (Array.isArray(course.objectives) && course.objectives.length > 0) {
            objs = course.objectives;
          } else if (course.whatYouWillLearn) {
            if (Array.isArray(course.whatYouWillLearn)) {
              objs = course.whatYouWillLearn;
            } else if (typeof course.whatYouWillLearn === 'string') {
              objs = course.whatYouWillLearn
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            }
          }
          if (objs.length > 0) setObjectives(objs);

          // Resolve Requirements
          if (Array.isArray(course.requirements) && course.requirements.length > 0) {
            setRequirements(course.requirements);
          }
        }
      } catch (err) {
        console.error('Error loading course details:', err);
        toast.error('Failed to load course details for editing');
      } finally {
        setLoadingCourse(false);
      }
    };

    if (isEditMode) {
      fetchCourseDetails();
    }
  }, [targetCourseId, isEditMode, setValue]);

  const handleAddObjective = () => setObjectives([...objectives, '']);
  const handleRemoveObjective = (index) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const handleAddRequirement = () => setRequirements([...requirements, '']);
  const handleRemoveRequirement = (index) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const validateForm = (data) => {
    if (!data.title || !data.title.trim()) {
      toast.error('Please enter Course Title!');
      return false;
    }
    if (!data.description || !data.description.trim()) {
      toast.error('Please enter Course Description!');
      return false;
    }
    if (!data.categoryRef) {
      toast.error('Please select a Category!');
      return false;
    }
    if (!data.level) {
      toast.error('Please select Course Level!');
      return false;
    }
    if (data.price === '' || data.price === null || data.price === undefined) {
      toast.error('Please set a Course Price!');
      return false;
    }
    if (!data.thumbnail || !data.thumbnail.trim()) {
      toast.error('Please provide a Thumbnail image URL!');
      return false;
    }
    return true;
  };

  const onSubmit = async (data) => {
    if (!validateForm(data)) return;

    try {
      setLoading(true);
      const filteredObjectives = objectives.filter((obj) => obj.trim() !== '');
      const filteredRequirements = requirements.filter((req) => req.trim() !== '');

      const payload = {
        ...data,
        objectives: filteredObjectives,
        requirements: filteredRequirements,
      };

      if (isEditMode) {
        // Submit Update
        const response = await api.put(`/courses/${targetCourseId}`, payload);
        if (response.data && (response.data.success || response.status === 200)) {
          toast.success('Course details updated successfully! 🎉');
          navigate('/instructor/courses');
        }
      } else {
        // Submit Create
        const response = await api.post('/courses', payload);
        if (response.data && response.data.success) {
          const createdCourse = response.data.data;
          toast.success('Course basic info saved! Now manage curriculum sections & lessons. 🎉');
          navigate(`/instructor/courses/${createdCourse._id}/lessons`);
        }
      }
    } catch (err) {
      console.error('Course save error:', err);
      toast.error(err.response?.data?.message || (isEditMode ? 'Failed to update course' : 'Failed to create course'));
    } finally {
      setLoading(false);
    }
  };

  if (loadingCourse) {
    return (
      <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl mx-auto my-12 text-white">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm font-semibold">Loading course specifications...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            {isEditMode ? 'Instructor Studio • Course Editor' : 'Step 1 of 2 • Course Details'}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
            {isEditMode ? <FiEdit className="text-indigo-400" /> : <FiBookOpen className="text-indigo-400" />}
            {isEditMode ? 'Edit Course Specifications' : 'Create New Course'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isEditMode
              ? 'Update title, description, category, pricing, and objectives for this course.'
              : 'Fill in the essential course information, pricing, and learning objectives.'}
          </p>
        </div>

        <button
          onClick={() => navigate('/instructor/courses')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-2"
        >
          <FiArrowLeft /> Back to Courses
        </button>
      </div>

      {/* Course Info Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl space-y-6"
      >
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
          <FiBookOpen className="text-indigo-400" /> Basic Course Specifications
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Course Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Master Full-Stack Web Development with React & Node.js"
              {...register('title')}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Course Description *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Detailed summary of course topics, goals, and target audience..."
              {...register('description')}
              className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Category *
              </label>
              <select
                required
                {...register('categoryRef')}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Skill Level
              </label>
              <select
                {...register('level')}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Course Price ($ USD)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0 for Free"
                {...register('price')}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Thumbnail Cover Image URL
            </label>
            <div className="relative">
              <FiUploadCloud className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                {...register('thumbnail')}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Dynamic Learning Objectives */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-slate-300">
              What Students Will Learn (Objectives)
            </label>
            {objectives.map((obj, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Objective ${idx + 1}...`}
                  value={obj}
                  onChange={(e) => {
                    const updated = [...objectives];
                    updated[idx] = e.target.value;
                    setObjectives(updated);
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                {objectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveObjective(idx)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddObjective}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
            >
              <FiPlus /> Add Objective
            </button>
          </div>

          {/* Dynamic Requirements */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-slate-300">
              Course Requirements & Prerequisites
            </label>
            {requirements.map((req, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Requirement ${idx + 1}...`}
                  value={req}
                  onChange={(e) => {
                    const updated = [...requirements];
                    updated[idx] = e.target.value;
                    setRequirements(updated);
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                {requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(idx)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddRequirement}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
            >
              <FiPlus /> Add Requirement
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/instructor/courses')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
          >
            {loading
              ? 'Saving Changes...'
              : isEditMode
              ? 'Save Course Changes ✓'
              : 'Save & Manage Curriculum Lessons'} <FiArrowRight />
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateCourse;

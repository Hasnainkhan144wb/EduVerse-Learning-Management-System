import React, { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

const SearchBar = ({ onSearch, placeholder = 'Search courses, skills, topics...', className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleClear = () => {
    setSearchTerm('');
    if (onSearch) onSearch('');
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearch) onSearch(val);
  };

  return (
    <div className={`relative w-full max-w-md mx-auto ${className}`}>
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <FiSearch className="w-4 h-4" />
        </div>

        {/* Search Input */}
        <input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 text-xs md:text-sm text-slate-100 bg-slate-950/80 border border-slate-800 rounded-full focus:outline-none focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 placeholder-slate-500 shadow-sm hover:border-slate-700"
        />

        {/* Clear Button (Visible when typing) */}
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <FiX className="w-4 h-4 bg-slate-800 hover:bg-slate-700 rounded-full p-0.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;

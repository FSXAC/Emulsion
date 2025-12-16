import { useEffect } from 'react';
import Icon from './Icon';
import { useSound } from '../hooks/useSound';

/**
 * SearchHelpModal component
 * 
 * Shows documentation for search syntax with examples
 */
export default function SearchHelpModal({ isOpen, onClose }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const examples = [
    {
      category: 'Simple Search',
      items: [
        { query: 'portra', description: 'Search across film stock, order ID, and notes' },
        { query: 'kodak', description: 'Find all Kodak films' },
      ],
    },
    {
      category: 'Format & Status',
      items: [
        { query: 'format:120', description: 'All 120 format rolls' },
        { query: 'format:35mm', description: 'All 35mm format rolls' },
        { query: 'status:loaded', description: 'Currently loaded rolls' },
        { query: 'status:new', description: 'New, unused rolls' },
        { query: 'status:scanned', description: 'Scanned rolls' },
      ],
    },
    {
      category: 'Ratings & Stars',
      items: [
        { query: 'stars:5', description: 'Only 5-star rolls' },
        { query: 'stars:>=4', description: 'Highly rated rolls (4-5 stars)' },
        { query: 'stars:<=3', description: 'Lower rated rolls (1-3 stars)' },
      ],
    },
    {
      category: 'Chemistry & Development',
      items: [
        { query: 'chemistry:c41', description: 'Rolls developed with C41 chemistry' },
        { query: 'chemistry:bw', description: 'Black & white chemistry' },
        { query: 'push:+1', description: 'Pushed 1 stop' },
        { query: 'pull:-1', description: 'Pulled 1 stop' },
      ],
    },
    {
      category: 'Cost & Orders',
      items: [
        { query: 'cost:>15', description: 'Expensive rolls (over $15)' },
        { query: 'cost:<10', description: 'Budget rolls (under $10)' },
        { query: 'order:42', description: 'All rolls from order #42' },
        { query: 'not_mine:true', description: "Friend's rolls" },
      ],
    },
    {
      category: 'Dates',
      items: [
        { query: 'date:2024', description: 'All rolls from 2024' },
        { query: 'date:2024-12', description: 'Rolls from December 2024' },
        { query: 'date:2024-12-10', description: 'Rolls loaded on specific date' },
      ],
    },
    {
      category: 'Multiple Filters',
      items: [
        { query: 'format:120 status:loaded', description: 'Loaded 120 rolls' },
        { query: 'stock:portra stars:>=4', description: 'Highly rated Portra rolls' },
        { query: 'format:120 not_mine:true', description: "Friend's 120 rolls" },
      ],
    },
  ];

  const operators = [
    { op: ':', desc: 'Equals (or contains for text)' },
    { op: ':>', desc: 'Greater than' },
    { op: ':<', desc: 'Less than' },
    { op: ':>=', desc: 'Greater than or equal' },
    { op: ':<=', desc: 'Less than or equal' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 overflow-y-auto p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto border border-gray-200/50 dark:border-gray-700/50">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/60 px-6 py-4 flex items-start justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Icon name="search" size={24} /> Search Syntax Guide
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Use field-specific syntax to filter your film rolls
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <Icon name="x" size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Operators */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Comparison Operators
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {operators.map((op) => (
                <div
                  key={op.op}
                  className="flex items-baseline gap-2 text-sm"
                >
                  <code className="px-2 py-0.5 bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm text-film-cyan rounded-2xl font-mono shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                    {op.op}
                  </code>
                  <span className="text-gray-600 dark:text-gray-400">{op.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Examples by category */}
          {examples.map((category) => (
            <div key={category.category}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50/60 dark:bg-gray-700/30 backdrop-blur-sm rounded-3xl hover:bg-gray-100/60 dark:hover:bg-gray-700/50 transition-all duration-200 border-0 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  >
                    <code className="px-3 py-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 text-film-cyan rounded-2xl font-mono text-sm flex-shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                      {item.query}
                    </code>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Tips */}
          <div className="bg-blue-50/60 dark:bg-blue-900/10 backdrop-blur-sm border-0 rounded-3xl p-4 shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.15)]">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
              <Icon name="info" size={16} /> Tips & Shortcuts
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li>Combine multiple filters with spaces (AND logic)</li>
              <li>Use quotes for values with spaces: <code className="px-1 bg-blue-100/80 dark:bg-blue-900/50 backdrop-blur-sm rounded text-xs">stock:"Kodak Portra 400"</code></li>
              <li>Search is case-insensitive</li>
              <li><kbd className="px-1.5 py-0.5 bg-blue-100/80 dark:bg-blue-900/50 backdrop-blur-sm border-0 rounded text-xs font-mono shadow-[0_1px_2px_rgba(0,0,0,0.08)]">⌘K</kbd> or <kbd className="px-1.5 py-0.5 bg-blue-100/80 dark:bg-blue-900/50 backdrop-blur-sm border-0 rounded text-xs font-mono shadow-[0_1px_2px_rgba(0,0,0,0.08)]">Ctrl+K</kbd> to focus search</li>
              <li><kbd className="px-1.5 py-0.5 bg-blue-100/80 dark:bg-blue-900/50 backdrop-blur-sm border-0 rounded text-xs font-mono shadow-[0_1px_2px_rgba(0,0,0,0.08)]">Enter</kbd> or click the arrow button to search</li>
              <li><kbd className="px-1.5 py-0.5 bg-blue-100/80 dark:bg-blue-900/50 backdrop-blur-sm border-0 rounded text-xs font-mono shadow-[0_1px_2px_rgba(0,0,0,0.08)]">Esc</kbd> to clear search</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border-t border-gray-200/60 dark:border-gray-700/60 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-film-cyan hover:bg-film-cyan/90 backdrop-blur-sm text-white rounded-3xl font-medium transition-all duration-200 shadow-[0_4px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

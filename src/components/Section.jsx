import { memo } from 'react';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';

const Section = ({ title, children, sectionKey, copyText, isExpanded, onToggle, onCopy, isCopied }) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
    <div 
      className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      onClick={() => onToggle(sectionKey)}
    >
      <div className="flex items-center gap-2">
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      {copyText && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopy(copyText, sectionKey);
          }}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Copy to clipboard"
        >
          {isCopied ? (
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      )}
    </div>
    {isExpanded && (
      <div className="p-4 bg-white dark:bg-gray-900">
        {children}
      </div>
    )}
  </div>
);

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.sectionKey === nextProps.sectionKey &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.isCopied === nextProps.isCopied &&
    prevProps.children === nextProps.children
  );
};

export default memo(Section, areEqual);

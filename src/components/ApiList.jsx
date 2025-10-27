import React, { useCallback, forwardRef, useImperativeHandle, useRef, memo } from 'react';
import { FixedSizeList } from 'react-window';
import ApiListItem from './ApiListItem';

const ApiList = forwardRef(({ apis, selectedApi, onSelectApi, onTest, onCopy, onExport, height = 600 }, ref) => {
  const listRef = useRef(null);

  // Expose scrollToItem method to parent components
  useImperativeHandle(ref, () => ({
    scrollToItem: (index, align = 'center') => {
      if (listRef.current) {
        listRef.current.scrollToItem(index, align);
      }
    }
  }));

  // Row renderer for react-window
  const Row = useCallback(({ index, style }) => {
    const api = apis[index];
    const isSelected = selectedApi?.id === api.id;
    
    return (
      <ApiListItem
        api={api}
        isSelected={isSelected}
        onSelectApi={onSelectApi}
        onTest={onTest}
        onCopy={onCopy}
        onExport={onExport}
        style={style}
      />
    );
  }, [apis, selectedApi, onSelectApi, onTest, onCopy, onExport]);

  // Empty state
  if (apis.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>No APIs found matching your filters</p>
      </div>
    );
  }

  return (
    <div className="pr-2">
      <FixedSizeList
        ref={listRef}
        height={height}
        itemCount={apis.length}
        itemSize={110}
        width="100%"
        overscanCount={5}
        className="ReactVirtualized__List"
      >
        {Row}
      </FixedSizeList>
    </div>
  );
});

ApiList.displayName = 'ApiList';

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.apis === nextProps.apis &&
    prevProps.selectedApi?.id === nextProps.selectedApi?.id &&
    prevProps.onSelectApi === nextProps.onSelectApi &&
    prevProps.onTest === nextProps.onTest &&
    prevProps.onCopy === nextProps.onCopy &&
    prevProps.onExport === nextProps.onExport &&
    prevProps.height === nextProps.height
  );
};

export default memo(ApiList, areEqual);

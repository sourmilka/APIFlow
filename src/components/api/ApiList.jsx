import { forwardRef } from 'react';
import { FixedSizeList } from 'react-window';
import ApiListItem from './ApiListItem';

const ApiList = forwardRef(({ apis, selectedApi, onSelectApi, onCopy, onTest, selectedApis = [], onCheckApi }, ref) => {
  // Row renderer for react-window
  const Row = ({ index, style }) => {
    const api = apis[index];
    return (
      <div style={style} className="px-0 pb-2">
        <ApiListItem
          api={api}
          isSelected={selectedApi?.id === api.id}
          onSelect={onSelectApi}
          onCopy={onCopy}
          onTest={onTest}
          isChecked={selectedApis.includes(api.url)}
          onCheck={onCheckApi}
        />
      </div>
    );
  };

  if (!apis || apis.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No APIs found</p>
          <p className="text-xs mt-1">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {apis.map(api => (
        <ApiListItem
          key={api.id || api.url}
          api={api}
          isSelected={selectedApi?.id === api.id}
          onSelect={onSelectApi}
          onCopy={onCopy}
          onTest={onTest}
          isChecked={selectedApis.includes(api.url)}
          onCheck={onCheckApi}
        />
      ))}
    </div>
  );
});

ApiList.displayName = 'ApiList';

export default ApiList;

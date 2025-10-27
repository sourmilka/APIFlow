import { useState } from 'react';
import { Search, Settings, HelpCircle, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CustomHeaders from '../CustomHeaders_New';
import Logo from '../Logo';

function TopNav({ 
  url, 
  setUrl, 
  loading, 
  onParse,
  onCustomHeadersSave,
  setShowHelp,
  inputRef,
  onNewParse
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading && url.trim()) {
      onParse();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="flex h-12 items-center gap-3 px-4">
        {/* Logo */}
        <div className="flex items-center gap-2 min-w-[140px]">
          <Logo size="small" />
          <button
            onClick={() => onNewParse && onNewParse()}
            className="text-sm font-bold tracking-tight ml-1 hover:underline"
            aria-label="New Parse"
          >
            APIFlow
          </button>
        </div>

        {/* Search Bar - Center */}
        <div className="flex-1 max-w-2xl mx-auto">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Enter website URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="pl-8 h-9"
              />
            </div>
              <Button
                onClick={onParse}
                disabled={loading || !url.trim()}
                className="h-9 px-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing
                  </>
                ) : (
                  'Parse'
                )}
              </Button>
          </div>
        </div>

        {/* Actions - Right */}
        <div className="flex items-center gap-1">
          <CustomHeaders onSave={onCustomHeadersSave} />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHelp(true)}
            className="h-9 w-9"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

export default TopNav;

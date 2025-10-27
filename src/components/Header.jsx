import { useState } from 'react';
import { Code2, Search, Globe, XCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ThemeToggle from './ThemeToggle';
import ExportMenu from './ExportMenu';
import CustomHeaders from './CustomHeaders';
import { useNavigation } from '../contexts/NavigationContext';

function Header({ 
  url, 
  setUrl, 
  loading, 
  onParse, 
  onCancel, 
  onKeyPress, 
  urlInputRef, 
  result, 
  showHelp, 
  setShowHelp, 
  exportMenuRef, 
  customConfig, 
  onCustomHeadersSave 
}) {
  const { activeSection } = useNavigation();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  
  const sectionLabels = {
    overview: 'Overview',
    apis: 'APIs',
    websockets: 'WebSockets',
    history: 'History',
    settings: 'Settings'
  };

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" style={{height: '72px'}}>
      <div className="container mx-auto px-3 md:px-4 max-w-7xl h-full">
        <div className="flex items-center justify-between h-full gap-2 md:gap-4">
          {/* Left Zone - Logo/Branding */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-primary p-2 rounded-lg flex-shrink-0">
              <Code2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xl font-bold text-foreground whitespace-nowrap">
                API Parser Pro
              </h1>
            </div>
          </div>

          {/* Center Zone - Global Search Bar */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 z-10" />
              <Input
                ref={urlInputRef}
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={onKeyPress}
                placeholder="Enter website URL to parse APIs..."
                className="pl-12 h-11"
                disabled={loading}
              />
            </div>
          </div>

          {/* Right Zone - Quick Actions */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </Button>
            <CustomHeaders onSave={onCustomHeadersSave} />
            
            {result?.apis?.length > 0 && (
              <ExportMenu 
                ref={exportMenuRef}
                apis={result.apis} 
                url={result.url} 
              />
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHelp(true)}
              className="hidden md:flex"
              title="Keyboard Shortcuts (Ctrl+/)"
            >
              <HelpCircle className="w-5 h-5" />
            </Button>
            
            <ThemeToggle />
            
            {loading ? (
              <Button
                variant="destructive"
                onClick={onCancel}
                className="gap-2"
              >
                <XCircle className="w-5 h-5" />
                <span className="hidden lg:inline">Cancel</span>
              </Button>
            ) : (
              <Button
                onClick={onParse}
                disabled={loading}
                className="gap-2"
              >
                <Search className="w-5 h-5" />
                <span className="hidden lg:inline">Parse</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
    
    {/* Mobile Search Bar */}
    {showMobileSearch && (
      <div className="md:hidden bg-background border-b px-3 py-3 animate-fadeIn">
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 z-10" />
          <Input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              onKeyPress(e);
              if (e.key === 'Enter') {
                setShowMobileSearch(false);
              }
            }}
            placeholder="Enter website URL to parse APIs..."
            className="pl-10 pr-10"
            disabled={loading}
            autoFocus
          />
          {url && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setUrl('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <Button
            onClick={() => {
              onParse();
              setShowMobileSearch(false);
            }}
            disabled={loading}
            className="flex-1"
          >
            Parse
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowMobileSearch(false)}
          >
            Close
          </Button>
        </div>
      </div>
    )}
    </>
  );
}

export default Header;

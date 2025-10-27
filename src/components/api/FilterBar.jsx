import { useState, useMemo } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

function FilterBar({ onFilterChange, totalApis, filteredCount, apis }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDomains, setSelectedDomains] = useState([]);

  // Extract unique domains
  const domains = useMemo(() => {
    if (!apis) return [];
    const uniqueDomains = new Set();
    apis.forEach(api => {
      try {
        const url = new URL(api.url);
        uniqueDomains.add(url.hostname);
      } catch (e) {}
    });
    return Array.from(uniqueDomains).sort();
  }, [apis]);

  const updateFilters = (updates) => {
    onFilterChange(prev => ({
      ...prev,
      searchTerm: updates.searchTerm ?? prev.searchTerm,
      methods: updates.methods ?? prev.methods,
      status: updates.status ?? prev.status,
      domains: updates.domains ?? prev.domains,
    }));
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    updateFilters({ searchTerm: value });
  };

  const handleMethodToggle = (method) => {
    const newMethods = selectedMethods.includes(method)
      ? selectedMethods.filter(m => m !== method)
      : [...selectedMethods, method];
    setSelectedMethods(newMethods);
    updateFilters({ methods: newMethods });
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    updateFilters({ status: value });
  };

  const handleDomainToggle = (domain) => {
    const newDomains = selectedDomains.includes(domain)
      ? selectedDomains.filter(d => d !== domain)
      : [...selectedDomains, domain];
    setSelectedDomains(newDomains);
    updateFilters({ domains: newDomains });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedMethods([]);
    setStatusFilter('all');
    setSelectedDomains([]);
    updateFilters({ searchTerm: '', methods: [], status: 'all', domains: [] });
  };

  const activeFilterCount = 
    (searchTerm ? 1 : 0) +
    selectedMethods.length +
    (statusFilter !== 'all' ? 1 : 0) +
    selectedDomains.length;

  const getMethodColor = (method) => {
    const colors = {
      GET: 'border-blue-500 text-blue-500 hover:bg-blue-500/10',
      POST: 'border-green-500 text-green-500 hover:bg-green-500/10',
  PUT: 'border-primary-500 text-primary-500 hover:bg-primary-500/10',
      DELETE: 'border-red-500 text-red-500 hover:bg-red-500/10',
      PATCH: 'border-purple-500 text-purple-500 hover:bg-purple-500/10',
    };
    return colors[method] || '';
  };

  return (
    <div className="space-y-3">
      {/* Main Filter Row - Perfect Alignment */}
      <div className="flex items-center gap-2">
        {/* Search - 280px fixed */}
        <div className="relative w-[280px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search APIs..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        {/* Method Filters - Equal width buttons */}
        <div className="flex items-center gap-1">
          {HTTP_METHODS.map(method => (
            <Button
              key={method}
              variant={selectedMethods.includes(method) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleMethodToggle(method)}
              className={`h-9 w-16 px-0 text-xs font-medium ${
                !selectedMethods.includes(method) ? getMethodColor(method) : ''
              }`}
            >
              {method}
            </Button>
          ))}
        </div>

        {/* Status Filter - 130px fixed */}
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="2xx">2xx Success</SelectItem>
            <SelectItem value="3xx">3xx Redirect</SelectItem>
            <SelectItem value="4xx">4xx Error</SelectItem>
            <SelectItem value="5xx">5xx Error</SelectItem>
          </SelectContent>
        </Select>

        {/* Domain Filter */}
        {domains.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                Domain
                {selectedDomains.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs font-medium">
                    {selectedDomains.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-3" align="start">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Filter by Domain</h4>
                <Separator />
                <div className="max-h-[240px] space-y-2 overflow-y-auto">
                  {domains.map(domain => (
                    <div key={domain} className="flex items-center space-x-2">
                      <Checkbox
                        id={`domain-${domain}`}
                        checked={selectedDomains.includes(domain)}
                        onCheckedChange={() => handleDomainToggle(domain)}
                      />
                      <Label
                        htmlFor={`domain-${domain}`}
                        className="text-sm cursor-pointer truncate flex-1"
                      >
                        {domain}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear All
          </Button>
        )}
      </div>

      {/* Status Bar - Perfect Alignment with Filter Row */}
      {(filteredCount !== totalApis || activeFilterCount > 0) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing <span className="font-medium text-foreground">{filteredCount}</span> of{' '}
            <span className="font-medium text-foreground">{totalApis}</span>
          </span>
          {activeFilterCount > 0 && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1.5 flex-wrap">
                {searchTerm && (
                  <Badge variant="secondary" className="h-6 gap-1 px-2">
                    {searchTerm}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-foreground"
                      onClick={() => handleSearchChange('')}
                    />
                  </Badge>
                )}
                {selectedMethods.map(method => (
                  <Badge key={method} variant="secondary" className="h-6 gap-1 px-2">
                    {method}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-foreground"
                      onClick={() => handleMethodToggle(method)}
                    />
                  </Badge>
                ))}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="h-6 gap-1 px-2">
                    {statusFilter}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-foreground"
                      onClick={() => handleStatusChange('all')}
                    />
                  </Badge>
                )}
                {selectedDomains.map(domain => (
                  <Badge key={domain} variant="secondary" className="h-6 gap-1 px-2">
                    {domain}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-foreground"
                      onClick={() => handleDomainToggle(domain)}
                    />
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default FilterBar;

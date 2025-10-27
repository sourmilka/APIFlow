import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
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

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

function FilterBar({ onFilterChange, totalApis, filteredCount, apis }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  const updateFilters = (updates) => {
    onFilterChange(prev => ({
      ...prev,
      searchTerm: updates.searchTerm ?? prev.searchTerm,
      methods: updates.methods ?? prev.methods,
      status: updates.status ?? prev.status,
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

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMethods([]);
    setStatusFilter('all');
    updateFilters({ searchTerm: '', methods: [], status: 'all' });
  };

  const hasActiveFilters = searchTerm || selectedMethods.length > 0 || statusFilter !== 'all';

  return (
    <div className="flex items-center gap-2 mb-3">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search APIs..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8 h-9"
        />
      </div>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="success">Success (2xx)</SelectItem>
          <SelectItem value="error">Error (4xx, 5xx)</SelectItem>
        </SelectContent>
      </Select>

      {/* Methods Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Methods
            {selectedMethods.length > 0 && (
              <Badge variant="default" className="ml-1 h-5 px-1">
                {selectedMethods.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-3" align="end">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">HTTP Methods</Label>
            {HTTP_METHODS.map(method => (
              <div key={method} className="flex items-center space-x-2">
                <Checkbox
                  id={method}
                  checked={selectedMethods.includes(method)}
                  onCheckedChange={() => handleMethodToggle(method)}
                />
                <Label
                  htmlFor={method}
                  className="text-sm font-medium cursor-pointer"
                >
                  {method}
                </Label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9 gap-1"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}

      {/* Results Count */}
      <div className="ml-auto text-sm text-muted-foreground">
        <span className="font-medium">{filteredCount}</span>
        {filteredCount !== totalApis && (
          <span> of {totalApis}</span>
        )} APIs
      </div>
    </div>
  );
}

export default FilterBar;

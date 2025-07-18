import React, { useMemo, useState } from 'react';
import { Search, Check } from 'lucide-react';
import useDebounce from '@hooks/useDebounce'; // Assuming this is available as in the existing code
import cn from '@lib/cn'; // Assuming this is available
import { Box, Button, PopoverContent, Text } from '@ui'; // Assuming these are the custom UI components
import type { Component } from '@types'; // Assuming this is the type for functional components
import type { MultiSelectDropdownContentUIProps } from '@ui/MultiSelectDropdown/MultiSelectDropdownContentUIProps'; // Assuming the existing type

// Extend the existing props with isCreatable
interface HybridDropdownContentProps extends MultiSelectDropdownContentUIProps {
  isCreatable?: boolean;
}

const HybridDropdownContent: Component<HybridDropdownContentProps> = (props) => {
  const {
    options,
    value = [],
    onChange,
    onClose,
    Loader = false,
    isFilterable = true, // Assuming default true for search
    isSelectedAllNeeded = true,
    isSelectedMovedToTop = false,
    isCreatable = true, // Default to true for hybrid
    label, // If needed, but not used in render
  } = props;

  const [selectedOptions, setSelectedOptions] = useState(value);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 1000);

  // Assuming no async onSearch for this example; add useEffect if needed for dynamic options

  const handleSelectAll = () => {
    setSelectedOptions(options);
  };

  const handleClearAll = () => {
    setSelectedOptions([]);
  };

  const handleApplyClick = () => {
    onChange(selectedOptions);
    onClose();
  };

  const filteredOptions = useMemo(() => {
    let nonSearchedOptions = options.filter((item) =>
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.value.toLowerCase().includes(search.toLowerCase())
    );

    const hasExactMatch = options.some(
      (item) => item.label.toLowerCase() === search.toLowerCase()
    );

    if (isCreatable && search.trim() && !hasExactMatch) {
      const creatableOption = {
        label: `Add "${search}"`,
        value: `__creatable__${search}`, // Unique value to avoid conflicts
        isCreatable: true,
        actualValue: search, // Store the actual value to add
      };
      nonSearchedOptions.unshift(creatableOption);
    }

    if (isSelectedMovedToTop) {
      const selected = selectedOptions.filter((s) =>
        nonSearchedOptions.some((o) => o.value === s.value)
      );
      const nonSelected = nonSearchedOptions.filter(
        (item) => !selectedOptions.some((s) => s.value === item.value)
      );
      return [...selected, ...nonSelected];
    }

    return nonSearchedOptions;
  }, [options, search, selectedOptions, isSelectedMovedToTop, isCreatable]);

  return (
    <PopoverContent className="w-full min-w-85 bg-white p-0 shadow-5xl" align="start">
      <div className="flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-black">
        {isFilterable && (
          <Box className="rounded-md p-1.5">
            <Search className="mr-2 shrink-0 text-black/70" size={12} />
            <input
              autoFocus
              tabIndex={-1}
              placeholder="Search"
              className="flex w-full bg-transparent text-sm font-medium leading-4 text-black outline-none placeholder:text-black/60 disabled:cursor-not-allowed disabled:opacity-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Box>
        )}
        <div className="cntl scrollbar max-h-61.25 overflow-y-auto overflow-x-hidden p-0 text-black">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center">
              <Text className="text-sm">No results found</Text>
            </div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = selectedOptions.some((s) => s.value === option.value);
              const handleToggle = () => {
                let newSelected;
                if (isSelected) {
                  newSelected = selectedOptions.filter((s) => s.value !== option.value);
                } else {
                  let toAdd = { label: option.label, value: option.value };
                  if (option.isCreatable) {
                    toAdd = { label: option.actualValue, value: option.actualValue };
                    setSearch(''); // Clear search after adding custom
                  }
                  newSelected = [...selectedOptions, toAdd];
                }
                setSelectedOptions(newSelected);
              };

              return (
                <div
                  key={option.value}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-black/2',
                    isSelected && 'bg-black/2',
                    option.isCreatable && 'italic' // Optional styling for creatable option
                  )}
                  onClick={handleToggle}
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border border-black/20',
                      isSelected && 'bg-primary text-white'
                    )}
                  >
                    {isSelected && <Check size={12} />}
                  </div>
                  <Text className="text-sm">{option.label}</Text>
                </div>
              );
            })
          )}
          {Loader && <div>Loading...</div>} {/* Assuming Loader is a component or placeholder */}
        </div>
        {isSelectedAllNeeded && (
          <Box className="flex h-12 w-full items-center justify-between gap-2 border-t border-t-black/10 px-4 py-3">
            <Button variant="textLink" size="textSM" onClick={handleSelectAll} tabIndex={2}>
              Select All
            </Button>
            <Button variant="textLink" size="textSM" onClick={handleClearAll} tabIndex={3}>
              Clear All
            </Button>
          </Box>
        )}
        <Box className="flex h-12 w-full items-center justify-end gap-2 border-t border-t-black/10 px-4 py-3">
          <Button variant="outline" size="sm" onClick={onClose} tabIndex={4}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleApplyClick} tabIndex={5}>
            Apply
          </Button>
        </Box>
      </div>
    </PopoverContent>
  );
};

export default HybridDropdownContent;




if (variant === dataTableFilterVariants.HYBRID) {
  // Prepare options as before
  const idOptions = /* your options logic */;
  return (
    <HybridDropdownContent
      options={idOptions}
      value={filterArrayValue}
      onChange={(selected) => column.setFilterValue(selected)}
      onClose={onClose}
      isCreatable={true}
      // Pass other props like isFilterable={true}, etc., as needed
    />
  );
}
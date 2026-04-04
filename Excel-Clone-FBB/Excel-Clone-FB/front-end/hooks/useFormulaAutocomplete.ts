import React, { useState, useEffect, useMemo, useCallback } from 'react';

export const FORMULAS = [
  "SUM", "SUMIF", "SUMIFS", "COUNT", "COUNTIF", "COUNTIFS",
  "VLOOKUP", "IF", "IFERROR", "FILTER", "UNIQUE", "SORT",
  "CONCAT", "TEXTJOIN", "SUMPRODUCT", "AVERAGE", "AVERAGEIF", "AND"
];

export const useFormulaAutocomplete = (keyword: string, onSelect: (formula: string) => void, onClose: () => void) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const normalizedKeyword = useMemo(() => {
    return keyword.trim().toUpperCase();
  }, [keyword]);

  const suggestions = useMemo(() => {
    if (!normalizedKeyword) return [];

    // Debug logging
    console.log("Autocomplete - Input Keyword:", keyword);
    console.log("Autocomplete - Normalized:", normalizedKeyword);

    const filtered = FORMULAS.filter(f => f.startsWith(normalizedKeyword));
    console.log("Autocomplete - Suggestions:", filtered);

    return filtered;
  }, [normalizedKeyword, keyword]);

  // Reset selection whenever suggestions change (keyword changed)
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent | KeyboardEvent) => {
    if (suggestions.length === 0) return false;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
      return true;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      return true;
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (suggestions[selectedIndex]) {
        e.preventDefault();
        onSelect(suggestions[selectedIndex]);
        return true;
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return true;
    }
    return false;
  }, [suggestions, selectedIndex, onSelect, onClose]);

  return {
    suggestions,
    selectedIndex,
    handleKeyDown,
    setSelectedIndex
  };
};

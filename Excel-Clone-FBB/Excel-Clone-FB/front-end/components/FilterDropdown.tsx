import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ColumnFilterCondition,
  ColumnFilterConfig,
  FilterDataType,
  FilterOperator,
} from '../types';
import { FILTER_BLANKS_TOKEN } from '../utils/filtering';
import { Icon } from './Icon';
import { CustomFilterModal } from './CustomFilterModal';

interface FilterDropdownProps {
  columnLabel: string;
  headerLabel: string;
  dataType: FilterDataType;
  uniqueValues: string[];
  uniqueColors: string[];      // background colors
  uniqueTextColors: string[];  // font/text colors
  hasBlanks: boolean;
  activeFilter: ColumnFilterConfig | undefined;
  triggerRect: DOMRect | null;
  onClose: () => void;
  onChange: (nextFilter: ColumnFilterConfig | null) => void;
  onSort: (direction: 'asc' | 'desc' | 'color', color?: string, colorType?: 'background' | 'text') => void;
  onClearSort: () => void;
}

const TEXT_OPERATORS: Array<{ value: FilterOperator; label: string }> = [
  { value: 'equals', label: 'Equals' },
  { value: 'doesNotEqual', label: 'Does Not Equal' },
  { value: 'startsWith', label: 'Begins With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'contains', label: 'Contains' },
  { value: 'doesNotContain', label: 'Does Not Contain' },
];

const NUMBER_OPERATORS: Array<{ value: FilterOperator; label: string }> = [
  { value: 'equals', label: 'Equals' },
  { value: 'doesNotEqual', label: 'Does Not Equal' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'greaterThanOrEqual', label: 'Greater Than Or Equal To' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'lessThanOrEqual', label: 'Less Than Or Equal To' },
  { value: 'between', label: 'Between' },
  { value: 'top10', label: 'Top 10' },
  { value: 'aboveAverage', label: 'Above Average' },
  { value: 'belowAverage', label: 'Below Average' },
];

const DATE_OPERATORS: Array<{ value: FilterOperator; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'customRange', label: 'Custom Range' },
];

const getOperators = (dataType: FilterDataType) => {
  if (dataType === 'number') return NUMBER_OPERATORS;
  if (dataType === 'date') return DATE_OPERATORS;
  return TEXT_OPERATORS;
};

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  columnLabel,
  headerLabel,
  dataType,
  uniqueValues,
  uniqueColors,
  uniqueTextColors,
  hasBlanks,
  activeFilter,
  triggerRect,
  onClose,
  onChange,
  onSort,
  onClearSort,
}) => {
  const normalizedUniqueValues = useMemo(
    () => uniqueValues.map((value) => String(value ?? '')),
    [uniqueValues]
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [showSortColorMenu, setShowSortColorMenu] = useState(false);
  const [showFilterColorMenu, setShowFilterColorMenu] = useState(false);
  const [showTypeFilterMenu, setShowTypeFilterMenu] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [modalOperator, setModalOperator] = useState<FilterOperator | null>(null);
  const hasColors = uniqueColors.length > 0 || uniqueTextColors.length > 0;

  const allSelectableValues = useMemo(() => {
    const values = [...normalizedUniqueValues];
    if (hasBlanks) values.push(FILTER_BLANKS_TOKEN);
    return values;
  }, [hasBlanks, normalizedUniqueValues]);

  const allSelectableValueSet = useMemo(
    () => new Set<string>(allSelectableValues),
    [allSelectableValues]
  );

  const [localSelectedValues, setLocalSelectedValues] = useState<Set<string>>(
    new Set(activeFilter?.values ?? allSelectableValues)
  );

  useEffect(() => {
    setLocalSelectedValues(new Set(activeFilter?.values ?? allSelectableValues));
  }, [activeFilter, dataType, allSelectableValues]);

  const filteredUniqueValues = useMemo(() => {
    const query = String(searchTerm ?? '').trim().toLowerCase();
    if (!query) return normalizedUniqueValues;
    return normalizedUniqueValues.filter((value) =>
      String(value ?? '').toLowerCase().includes(query)
    );
  }, [searchTerm, normalizedUniqueValues]);

  const visibleSelectableValues = useMemo(() => {
    const values = [...filteredUniqueValues];
    const normalizedSearchTerm = String(searchTerm ?? '').trim().toLowerCase();
    if (hasBlanks && ('(blanks)'.includes(normalizedSearchTerm) || !normalizedSearchTerm)) {
      values.push(FILTER_BLANKS_TOKEN);
    }
    return values;
  }, [filteredUniqueValues, hasBlanks, searchTerm]);

  const allVisibleSelected =
    visibleSelectableValues.length > 0 &&
    visibleSelectableValues.every((value) => localSelectedValues.has(value));

  const someVisibleSelected =
    visibleSelectableValues.some((value) => localSelectedValues.has(value)) && !allVisibleSelected;

  const toggleSingleValue = (value: string) => {
    setLocalSelectedValues(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const handleSelectAllChange = () => {
    setLocalSelectedValues(prev => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleSelectableValues.forEach(value => next.delete(value));
      } else {
        visibleSelectableValues.forEach(value => next.add(value));
      }
      return next;
    });
  };

  const applyCheckboxChanges = () => {
    const normalizedValues = Array.from(
      new Set(
        Array.from(localSelectedValues)
          .map((value) => String(value ?? ''))
          .filter((value) => allSelectableValueSet.has(value))
      )
    );

    let finalValues: string[] | null = null;
    if (normalizedValues.length === 0) {
      finalValues = [];
    } else if (normalizedValues.length === allSelectableValues.length) {
      finalValues = null;
    } else {
      finalValues = normalizedValues;
    }

    onChange({
      values: finalValues,
      condition: null,
      color: activeFilter?.color,
      textColor: activeFilter?.textColor,
    });
    onClose();
  };

  const clearFilter = () => {
    onChange(null);
    onClearSort();
    onClose();
  };

  if (!triggerRect) return null;

  const sectionTitle =
    dataType === 'number' ? 'Number Filters' : dataType === 'date' ? 'Date Filters' : 'Text Filters';

  return createPortal(
    <div
      data-portal="filter-dropdown"
      className="fixed z-[10000] w-[260px] bg-white border border-gray-300 shadow-xl text-[12px] text-gray-800 font-sans flex flex-col"
      style={{
        top: Math.min(window.innerHeight - 450, triggerRect.bottom + 1),
        left: Math.min(window.innerWidth - 260, Math.max(0, triggerRect.left - 200)),
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="py-1">
        <button className="w-full flex items-center gap-3 px-5 py-[4.5px] hover:bg-[#f3f2f1] text-left transition-colors" onClick={() => { onSort('asc'); onClose(); }}>
          <Icon name="ArrowDownAZ" size={16} className="text-gray-500" />
          <span>Sort A to Z</span>
        </button>
        <button className="w-full flex items-center gap-3 px-5 py-[4.5px] hover:bg-[#f3f2f1] text-left transition-colors" onClick={() => { onSort('desc'); onClose(); }}>
          <Icon name="ArrowDownZA" size={16} className="text-gray-500" />
          <span>Sort Z to A</span>
        </button>

        <div
          className="relative"
          onMouseEnter={() => setShowSortColorMenu(true)}
          onMouseLeave={() => setShowSortColorMenu(false)}
        >
          <button className={`w-full flex items-center justify-between px-5 py-[4.5px] transition-colors ${hasColors ? 'hover:bg-[#f3f2f1]' : 'text-gray-400 cursor-default'}`}>
            <div className="flex items-center gap-3">
              <Icon name="Palette" size={16} className={hasColors ? 'text-gray-500' : 'text-gray-300'} />
              <span>Sort by Color</span>
            </div>
            <Icon name="ChevronRight" size={14} className={hasColors ? 'text-gray-500' : 'text-gray-300'} />
          </button>

          {showSortColorMenu && hasColors && (
            <div className="absolute left-full top-0 z-[10001] w-[200px] bg-white border border-gray-300 shadow-xl py-2">
              {uniqueColors.length > 0 && (
                <>
                  <div className="px-3 pb-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Cell Color</div>
                  {uniqueColors.map((color) => (
                    <button
                      key={`sort-bg-${color}`}
                      className="w-full flex items-center gap-2 px-3 py-[5px] hover:bg-[#f3f2f1] text-left group transition-colors"
                      onClick={() => { onSort('color', color, 'background'); onClose(); }}
                    >
                      <span className="inline-block w-[52px] h-[18px] rounded-sm border border-gray-300 flex-shrink-0 group-hover:border-blue-400" style={{ backgroundColor: color }} />
                    </button>
                  ))}
                </>
              )}
              {uniqueTextColors.length > 0 && (
                <>
                  {uniqueColors.length > 0 && <div className="h-[1px] bg-gray-200 mx-2 my-1" />}
                  <div className="px-3 pb-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Font Color</div>
                  {uniqueTextColors.map((color) => (
                    <button
                      key={`sort-txt-${color}`}
                      className="w-full flex items-center gap-2 px-3 py-[5px] hover:bg-[#f3f2f1] text-left group transition-colors"
                      onClick={() => { onSort('color', color, 'text'); onClose(); }}
                    >
                      <span className="inline-block w-[52px] h-[18px] rounded-sm border border-gray-200 flex-shrink-0 flex items-center justify-center text-[14px] font-bold group-hover:border-blue-400" style={{ color }}>A</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="h-[1px] bg-gray-200 mx-2" />

      <div className="py-1">
        <button
          className={`w-full flex items-center gap-3 px-5 py-[4.5px] transition-colors ${activeFilter ? 'hover:bg-[#f3f2f1]' : 'text-gray-400 cursor-default'}`}
          onClick={activeFilter ? clearFilter : undefined}
        >
          <Icon name="FilterX" size={16} className={activeFilter ? 'text-gray-500' : 'text-gray-400 opacity-50'} />
          <span className="truncate text-left flex-1 text-[11px]">Clear Filter From "{columnLabel}"</span>
        </button>

        <div
          className="relative"
          onMouseEnter={() => setShowFilterColorMenu(true)}
          onMouseLeave={() => setShowFilterColorMenu(false)}
        >
          <button className={`w-full flex items-center justify-between px-5 py-[4.5px] transition-colors ${hasColors ? 'hover:bg-[#f3f2f1]' : 'text-gray-400 cursor-default'}`}>
            <div className="flex items-center gap-3">
              <Icon name="Palette" size={16} className={hasColors ? 'text-gray-500' : 'text-gray-300'} />
              <span>Filter by Color</span>
            </div>
            <Icon name="ChevronRight" size={14} className={hasColors ? 'text-gray-500' : 'text-gray-300'} />
          </button>

          {showFilterColorMenu && hasColors && (
            <div className="absolute left-full top-0 z-[10001] w-[200px] bg-white border border-gray-300 shadow-xl py-2">
              {uniqueColors.length > 0 && (
                <>
                  <div className="px-3 pb-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Cell Color</div>
                  {uniqueColors.map((color) => (
                    <button
                      key={`filt-bg-${color}`}
                      className="w-full flex items-center gap-2 px-3 py-[5px] hover:bg-[#f3f2f1] text-left group transition-colors"
                      onClick={() => { onChange({ values: null, condition: null, color }); onClose(); }}
                    >
                      <span className="inline-block w-[52px] h-[18px] rounded-sm border border-gray-300 flex-shrink-0 group-hover:border-blue-400" style={{ backgroundColor: color }} />
                    </button>
                  ))}
                </>
              )}
              {uniqueTextColors.length > 0 && (
                <>
                  {uniqueColors.length > 0 && <div className="h-[1px] bg-gray-200 mx-2 my-1" />}
                  <div className="px-3 pb-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Font Color</div>
                  {uniqueTextColors.map((color) => (
                    <button
                      key={`filt-txt-${color}`}
                      className="w-full flex items-center gap-2 px-3 py-[5px] hover:bg-[#f3f2f1] text-left group transition-colors"
                      onClick={() => { onChange({ values: null, condition: null, textColor: color }); onClose(); }}
                    >
                      <span className="inline-block w-[52px] h-[18px] rounded-sm border border-gray-300 flex-shrink-0 flex items-center justify-center text-[14px] font-bold group-hover:border-blue-400" style={{ color }}>A</span>
                    </button>
                  ))}
                </>
              )}
              <div className="h-[1px] bg-gray-200 mx-2 my-1" />
              <button
                className="w-full flex items-center gap-2 px-3 py-[5.5px] hover:bg-[#f3f2f1] text-[12px] text-gray-700 transition-colors"
                onClick={() => { onChange(null); onClose(); }}
              >
                No Fill
              </button>
            </div>
          )}
        </div>

        <div
          className="relative"
          onMouseEnter={() => setShowTypeFilterMenu(true)}
          onMouseLeave={() => setShowTypeFilterMenu(false)}
        >
          <button className="w-full flex items-center justify-between px-5 py-[4.5px] hover:bg-[#f3f2f1] text-left transition-colors">
            <div className="flex items-center gap-3">
              <Icon name="Filter" size={16} className="text-gray-500" />
              <span>{sectionTitle}</span>
            </div>
            <Icon name="ChevronRight" size={14} className="text-gray-500" />
          </button>

          {showTypeFilterMenu && (
            <div className="absolute left-full top-[-4px] z-[10001] w-[200px] bg-white border border-gray-300 shadow-xl py-1">
              {getOperators(dataType).map((op) => (
                <button
                  key={op.value}
                  className="w-full px-4 py-1.5 hover:bg-[#f3f2f1] text-[13px] text-left text-gray-700 transition-colors"
                  onClick={() => {
                    setModalOperator(op.value);
                    setShowCustomModal(true);
                    setShowTypeFilterMenu(false);
                  }}
                >
                  {op.label}...
                </button>
              ))}
              <div className="h-[1px] bg-gray-200 my-1 mx-2" />
              <button
                className="w-full px-4 py-1.5 hover:bg-[#f3f2f1] text-[13px] text-left text-gray-700 transition-colors"
                onClick={() => {
                  setModalOperator(null);
                  setShowCustomModal(true);
                  setShowTypeFilterMenu(false);
                }}
              >
                Custom Filter...
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="h-[1px] bg-gray-200 mx-2" />

      <div className="flex flex-col flex-1 overflow-hidden min-h-0">
        <div className="px-3 py-2">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-8 pr-3 py-1 text-[13px] border border-gray-300 outline-none focus:border-blue-500 transition-colors h-[28px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-1 py-1 min-h-[160px] border border-gray-200 mx-3 mb-2 bg-[#fafbfc] checkbox-tree-container">
          <div className="space-y-[1px]">
            <label className="flex items-center gap-2 py-1 px-3 hover:bg-blue-50 cursor-pointer group rounded-sm transition-colors">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 border-gray-300 rounded-sm cursor-pointer"
                checked={allVisibleSelected}
                ref={(el) => (el && (el.indeterminate = someVisibleSelected))}
                onChange={handleSelectAllChange}
              />
              <span className="text-[12px] group-hover:text-blue-700 transition-colors">(Select All)</span>
            </label>

            <div className="ml-5 border-l border-dotted border-gray-300 mt-[-2px]">
              {visibleSelectableValues.map((value) => (
                <label key={value} className="flex items-center gap-2 py-0.5 px-3 hover:bg-blue-50 cursor-pointer group rounded-sm transition-colors relative">
                  <div className="absolute left-0 top-1/2 w-2 border-t border-dotted border-gray-300" />
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 border-gray-300 rounded-sm cursor-pointer"
                    checked={localSelectedValues.has(value)}
                    onChange={() => toggleSingleValue(value)}
                  />
                  <span className="text-[12px] group-hover:text-blue-700 transition-colors truncate">
                    {value === FILTER_BLANKS_TOKEN ? '(Blanks)' : value}
                  </span>
                </label>
              ))}

              {visibleSelectableValues.length === 0 && (
                <div className="px-3 py-2 text-[12px] text-gray-400 italic">No matches found</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-2 p-3 bg-gray-50 border-t border-gray-200 mt-auto">
          <button
            className="px-6 h-[26px] min-w-[70px] bg-white border border-gray-300 shadow-sm text-[12px] hover:bg-gray-50 hover:border-blue-400 active:scale-95 rounded-sm transition-all"
            onClick={applyCheckboxChanges}
          >
            OK
          </button>
          <button
            className="px-6 h-[26px] min-w-[70px] bg-white border border-gray-300 shadow-sm text-[12px] hover:bg-gray-50 hover:border-red-400 active:scale-95 rounded-sm transition-all"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>

      {showCustomModal && (
        <CustomFilterModal
          columnName={columnLabel}
          dataType={dataType}
          initialCondition={modalOperator
            ? { criteria: [{ operator: modalOperator, value: '' }], logicalOperator: 'and' }
            : activeFilter?.condition
          }
          onApply={(condition) => {
            onChange({ values: null, condition, color: activeFilter?.color, textColor: activeFilter?.textColor });
            setShowCustomModal(false);
            onClose();
          }}
          onClose={() => setShowCustomModal(false)}
        />
      )}
    </div>,
    document.body
  );
};

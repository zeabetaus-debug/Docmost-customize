// components/Grid.tsx
import React, { useRef, useState, useEffect, useMemo, memo, useCallback } from 'react';
import { flushSync } from 'react-dom';
import {
  SheetState,
  SheetAction,
  CellId,
  CellData,
  BorderType,
  ColumnFilterConfig,
  FilterSortConfig,
  SheetFilterState,
} from '../types';
import { colIndexToLabel, cellIdToCoords, coordsToCellId, formatValue, getNextCellId, getRangeStr } from '../utils/helpers';
import { FilterDropdown } from './FilterDropdown';
import { Icon } from './Icon';
import {
  applyFilter,
  compareFilterValues,
  getCellDisplayValue,
  getColumnMeta,
} from '../utils/filtering';
import { useFormulaAutocomplete } from '../hooks/useFormulaAutocomplete';
import FormulaAutocomplete from './FormulaAutocomplete';

interface GridProps {
  state: SheetState;
  dispatch: React.Dispatch<SheetAction>;
  activeTool: 'none' | 'draw_border' | 'draw_grid' | 'eraser';
  setTool: (tool: 'none' | 'draw_border' | 'draw_grid' | 'eraser') => void;
  activeLineColor: string;
  activeLineStyle: BorderType;
  copiedRange: { start: CellId; end: CellId } | null;
  onEditingStateChange?: (isEditing: boolean) => void;
  onVisibleWindowChange?: (window: { startRow: number; endRow: number }) => void;
  filterState: SheetFilterState;
  onUpdateColumnFilter: (column: number, filter: ColumnFilterConfig | null) => void;
  onClearColumnFilter: (column: number) => void;
  onSetFilterSort: (sort: FilterSortConfig | null) => void;
}

const DEFAULT_COL_WIDTH = 64;
const DEFAULT_ROW_HEIGHT = 24;
const HEADER_COL_WIDTH = 40;
const HEADER_ROW_HEIGHT = 24;
const OVERSCAN = 2;
const DEFAULT_TOTAL_ROWS = 100000;
const DEFAULT_TOTAL_COLS = 100;

// Custom Cursors (Base64 SVGs)
const CURSOR_PENCIL = `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYuMzIyMyAzLjYzMjI5TDIwLjM2ODggNy42Nzg4NEw3LjU1MDkzIDIwLjM2ODhMMiAyMmwxLjUwMzI5LTUuNTUwOUwxNi4zMjIzIDMuNjMyMjl6IiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMTQuMjQwMiA1LjcxNDM2TDE4LjI4NjcgOS43NjA5MSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=') 0 24, auto`;
const CURSOR_ERASER = `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOC41MDAwMiAyMC41TDIsMTRMMS41LDEzLjVMMTMuNSwxLjVMMjIsMTBMMTQuNSwyMi41TDkuNTAwMDIgMTcuNSIgZmlsbD0id2hpdGUiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTkuNSAxNy41TDkuNTAwMDIgMjEuNUwyMiAyMiIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=') 8 20, auto`;

const getBorderCSS = (type: BorderType | undefined, color: string | undefined, defaultColor: string = '#e5e7eb'): string => {
  if (!type) return `1px solid ${defaultColor}`;
  if (type === 'none') return 'none';

  const borderColor = color || '#000000';

  switch (type) {
    case 'thin': return `1px solid ${borderColor}`;
    case 'medium': return `2px solid ${borderColor}`;
    case 'thick': return `3px solid ${borderColor}`;
    case 'double': return `3px double ${borderColor}`;
    case 'dotted': return `1px dotted ${borderColor}`;
    case 'dashed': return `1px dashed ${borderColor}`;
    case 'long_dashed': return `2px dashed ${borderColor}`;
    case 'dash_dot': return `1px dashed ${borderColor}`;
    case 'dash_dot_dot': return `1px dotted ${borderColor}`;
    default: return `1px solid ${defaultColor}`;
  }
};

const Cell: React.FC<{
  id: CellId;
  data: CellData | undefined;
  isActive: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isEditing: boolean;
  editValue: string;
  style: React.CSSProperties;
  width: number;
  height: number;
  onMouseDown: (e: React.MouseEvent, id: CellId) => void;
  onMouseEnter: (e: React.MouseEvent, id: CellId) => void;
  onMouseUp: (id: CellId) => void;
  onDoubleClick: (id: CellId) => void;
  onChange: (val: string) => void;
  onCommit: (moveSelection?: boolean) => void;
  onCancel: () => void;
  onCursorPositionChange: (pos: number) => void;
}> = ({
  id,
  data,
  isActive,
  isSelected,
  isInRange,
  isEditing,
  editValue,
  style,
  width,
  height,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  onDoubleClick,
  onChange,
  onCommit,
  onCancel,
  onCursorPositionChange
}) => {
  const keyword = isEditing && editValue.startsWith('=') ? editValue.slice(1) : '';
  const { suggestions, selectedIndex, handleKeyDown: handleAutocompleteKeyDown, setSelectedIndex: onAutocompleteMouseEnter } = useFormulaAutocomplete(
    keyword,
    (formula) => {
      const newValue = `=${formula}()`;
      onChange(newValue);
      setTimeout(() => {
        const input = document.querySelector(`[data-editing-cell="${id}"]`) as HTMLInputElement;
        if (input) {
          input.focus();
          const pos = newValue.length - 1;
          input.setSelectionRange(pos, pos);
          onCursorPositionChange(pos);
        }
      }, 0);
    },
    onCancel
  );

  const displayValue = data?.computed !== undefined
    ? formatValue(data.computed, data.style?.format)
    : data?.value || '';

  const align = data?.style?.align || (typeof data?.computed === 'number' ? 'right' : 'left');
  const rotation = data?.style?.textRotation;
  const isRotated = rotation !== undefined && rotation !== 0;
  const wrapText = data?.style?.wrapText || false;

  let justifyContent = 'flex-start';
  let alignItems = 'center';

  if (align === 'center') justifyContent = 'center';
  else if (align === 'right') justifyContent = 'flex-end';

  if (isRotated && !isEditing) {
    justifyContent = 'center';
    alignItems = 'center';
  }

  const containerStyle: React.CSSProperties = {
    ...style,
    width,
    height,
    backgroundColor: data?.style?.backgroundColor,
    borderTop: data?.style?.borderTop ? getBorderCSS(data.style.borderTop, data.style.borderTopColor) : undefined,
    borderRight: getBorderCSS(data?.style?.borderRight, data?.style?.borderRightColor),
    borderBottom: getBorderCSS(data?.style?.borderBottom, data?.style?.borderBottomColor),
    borderLeft: data?.style?.borderLeft ? getBorderCSS(data.style.borderLeft, data.style.borderLeftColor) : undefined,
    overflow: 'hidden',
    whiteSpace: wrapText ? 'normal' : 'nowrap',
    zIndex: isActive ? 30 : (isSelected ? 20 : (data?.style?.borderTop || data?.style?.borderRight || data?.style?.borderBottom || data?.style?.borderLeft ? 10 : 1))
  };

  const cellContentStyle: React.CSSProperties = {
    display: 'flex',
    alignItems,
    justifyContent,
    width: '100%',
    height: '100%',
    padding: '0 4px',
    overflow: 'hidden',
  };

  const contentStyle: React.CSSProperties = {
    fontWeight: data?.style?.bold ? 'bold' : 'normal',
    fontStyle: data?.style?.italic ? 'italic' : 'normal',
    textDecoration: data?.style?.underline ? 'underline' : 'none',
    textDecorationStyle: data?.style?.underline === 'double' ? 'double' : 'solid',
    color: data?.style?.color,
    fontSize: data?.style?.fontSize ? `${data.style.fontSize}pt` : '11pt',
    fontFamily: data?.style?.fontFamily || 'Calibri',
    pointerEvents: 'none',
    display: 'inline-block',
    lineHeight: '1',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: wrapText ? undefined : 'ellipsis',
  };

  if (!isEditing && rotation) {
    if (rotation === 'vertical') {
      contentStyle.writingMode = 'vertical-lr';
      contentStyle.textOrientation = 'upright';
      contentStyle.padding = '1px 0';
      contentStyle.display = 'block';
      contentStyle.lineHeight = 'normal';
      contentStyle.width = 'auto';
    } else if (typeof rotation === 'number' && rotation !== 0) {
      contentStyle.transform = `rotate(${-rotation}deg)`;
      contentStyle.transformOrigin = 'center center';
    }
  }

  let className = "absolute select-none ";

  if (data?.spillParent) {
    className += " bg-blue-50/30";
  }

  if (isSelected && !isActive) className += " bg-blue-100/50";
  else if (isInRange && !isActive) className += " bg-gray-100/30";

  // Handle #SPILL! and #CALC! errors with red text
  const isError = typeof data?.computed === 'string' && (data.computed.startsWith('#'));
  if (isError && data.computed !== 'TRUE' && data.computed !== 'FALSE') {
    contentStyle.color = '#d32f2f'; // Excel-like error color
  }

  if (isEditing) {
    return (
      <div
        className={className}
        style={{
          ...containerStyle,
          padding: 0,
          outline: '2px solid #107c41',
          zIndex: 40,
          backgroundColor: data?.style?.backgroundColor || 'white',
          overflow: 'visible' // Ensure autocomplete dropdown is not clipped
        }}
      >
        <input
          autoFocus
          data-editing-cell={id}
          className="bg-transparent outline-none w-full h-full px-1"
          value={editValue}
          onChange={(e) => {
            onChange(e.target.value);
            onCursorPositionChange(e.target.selectionStart || 0);
          }}
          onSelect={(e) => onCursorPositionChange(e.currentTarget.selectionStart || 0)}
          onClick={(e) => onCursorPositionChange(e.currentTarget.selectionStart || 0)}
          onBlur={() => onCommit(false)}
          onKeyDown={(e) => {
            if (handleAutocompleteKeyDown(e)) {
              return;
            }

            if (e.key === 'Enter') {
              e.preventDefault();
              onCommit(true);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onCancel();
            }
          }}
        />
        {isEditing && (
          <FormulaAutocomplete
            keyword={keyword}
            suggestions={suggestions}
            selectedIndex={selectedIndex}
            onSelect={(formula) => {
              const newValue = `=${formula}()`;
              onChange(newValue);
              setTimeout(() => {
                const input = document.querySelector(`[data-editing-cell="${id}"]`) as HTMLInputElement;
                if (input) {
                  const pos = newValue.length - 1;
                  input.setSelectionRange(pos, pos);
                  onCursorPositionChange(pos);
                }
              }, 0);
            }}
            onMouseEnter={onAutocompleteMouseEnter}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={containerStyle}
      onMouseDown={(e) => onMouseDown(e, id)}
      onMouseEnter={(e) => onMouseEnter(e, id)}
      onMouseUp={() => onMouseUp(id)}
      onDoubleClick={() => onDoubleClick(id)}
    >
      <div
        className={`cell ${align}`}
        style={cellContentStyle}
      >
        <span style={contentStyle}>
          {displayValue}
        </span>
      </div>
    </div>
  );
};

export const Grid: React.FC<GridProps> = ({
  state,
  dispatch,
  activeTool,
  setTool,
  activeLineColor,
  activeLineStyle,
  copiedRange,
  onEditingStateChange,
  onVisibleWindowChange,
  filterState,
  onUpdateColumnFilter,
  onClearColumnFilter,
  onSetFilterSort,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const isDraggingRef = useRef(false);

  const [editingCell, setEditingCell] = useState<CellId | null>(null);
  const [editValue, setEditValue] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const [openFilterColumn, setOpenFilterColumn] = useState<number | null>(null);
  const [filterTriggerRect, setFilterTriggerRect] = useState<DOMRect | null>(null);

  const lastDrawCell = useRef<CellId | null>(null);
  const dragEdgeRef = useRef<'top' | 'bottom' | 'left' | 'right' | null>(null);

  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillEnd, setAutoFillEnd] = useState<CellId | null>(null);

  const [formulaSelection, setFormulaSelection] = useState<{
    start: CellId | null;
    end: CellId | null;
  }>({ start: null, end: null });

  const editingCellRef = useRef(editingCell);
  const editValueRef = useRef(editValue);
  const cursorPosRef = useRef(cursorPos);
  const selectionActiveRef = useRef(state.selection.active);

  const activeToolRef = useRef(activeTool);
  const activeLineColorRef = useRef(activeLineColor);
  const activeLineStyleRef = useRef(activeLineStyle);

  // Formula range selection refs
  const formulaDragStartIdRef = useRef<CellId | null>(null);
  const formulaDragEndIdRef = useRef<CellId | null>(null);
  const formulaBaseValueRef = useRef('');
  const formulaBaseCursorRef = useRef(0);
  const isFormulaDraggingRef = useRef(false);

  useEffect(() => { editingCellRef.current = editingCell; }, [editingCell]);
  useEffect(() => { editValueRef.current = editValue; }, [editValue]);
  useEffect(() => { cursorPosRef.current = cursorPos; }, [cursorPos]);
  useEffect(() => { formulaDragEndIdRef.current = formulaSelection.end; }, [formulaSelection.end]);
  useEffect(() => { selectionActiveRef.current = state.selection.active; }, [state.selection.active]);

  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { activeLineColorRef.current = activeLineColor; }, [activeLineColor]);
  useEffect(() => { activeLineStyleRef.current = activeLineStyle; }, [activeLineStyle]);
  useEffect(() => {
    onEditingStateChange?.(editingCell !== null);
  }, [editingCell, onEditingStateChange]);

  const totalCols = DEFAULT_TOTAL_COLS;

  const filterRange = useMemo(
    () => (filterState.enabled ? filterState.range : null),
    [filterState.enabled, filterState.range]
  );

  const filterColumnMeta = useMemo(() => {
    if (!filterRange) return {};

    const entries = Array.from(
      { length: filterRange.endCol - filterRange.startCol + 1 },
      (_, index) => filterRange.startCol + index
    ).map((column) => [column, getColumnMeta(state.cells, filterRange, column)]);

    return Object.fromEntries(entries);
  }, [filterRange, state.cells]);

  const visibleFilteredRows = useMemo(() => {
    if (!filterRange) return null;

    const visibleRows: number[] = [];
    for (let row = filterRange.startRow; row <= filterRange.endRow; row++) {
      const matches = Object.entries(filterState.columns).every(([columnKey, config]) => {
        const column = Number(columnKey);
        const meta = filterColumnMeta[column];
        if (!meta) return true;

        // Background color filter
        if ((config as ColumnFilterConfig).color) {
          const cell = state.cells[coordsToCellId(column, row)];
          const cellColor = (cell?.style?.backgroundColor ?? '').trim().toLowerCase();
          return cellColor === (config as ColumnFilterConfig).color!.trim().toLowerCase();
        }

        // Text/font color filter
        if ((config as ColumnFilterConfig).textColor) {
          const cell = state.cells[coordsToCellId(column, row)];
          const cellTextColor = (cell?.style?.color ?? '').trim().toLowerCase();
          return cellTextColor === (config as ColumnFilterConfig).textColor!.trim().toLowerCase();
        }

        const value = getCellDisplayValue(state.cells[coordsToCellId(column, row)]);
        return applyFilter(value, config as ColumnFilterConfig, meta);
      });

      if (matches) visibleRows.push(row);
    }

    if (filterState.sort) {
      const meta = filterColumnMeta[filterState.sort.column];
      if (meta) {
        if (filterState.sort.direction === 'color' && filterState.sort.color) {
          const targetColor = filterState.sort.color.trim().toLowerCase();
          const isTextSort = filterState.sort.colorType === 'text';
          visibleRows.sort((leftRow, rightRow) => {
            const leftCell = state.cells[coordsToCellId(filterState.sort!.column, leftRow)];
            const rightCell = state.cells[coordsToCellId(filterState.sort!.column, rightRow)];
            const leftActual = isTextSort
              ? (leftCell?.style?.color ?? '').trim().toLowerCase()
              : (leftCell?.style?.backgroundColor ?? '').trim().toLowerCase();
            const rightActual = isTextSort
              ? (rightCell?.style?.color ?? '').trim().toLowerCase()
              : (rightCell?.style?.backgroundColor ?? '').trim().toLowerCase();
            const leftMatch = leftActual === targetColor;
            const rightMatch = rightActual === targetColor;
            if (leftMatch && !rightMatch) return -1;
            if (!leftMatch && rightMatch) return 1;
            return 0;
          });
        } else {
          visibleRows.sort((leftRow, rightRow) => {
            const leftValue = getCellDisplayValue(state.cells[coordsToCellId(filterState.sort!.column, leftRow)]);
            const rightValue = getCellDisplayValue(state.cells[coordsToCellId(filterState.sort!.column, rightRow)]);
            const comparison = compareFilterValues(leftValue, rightValue, meta.type);
            return filterState.sort!.direction === 'asc' ? comparison : -comparison;
          });
        }
      }
    }

    return visibleRows;
  }, [filterColumnMeta, filterRange, filterState.columns, filterState.sort, state.cells]);

  const hiddenFilteredRows = useMemo(() => {
    if (!filterRange || !visibleFilteredRows) return new Set<number>();
    const hidden = new Set<number>();

    if (filterState.sort) {
      for (let row = filterRange.startRow + visibleFilteredRows.length; row <= filterRange.endRow; row++) {
        hidden.add(row);
      }
      return hidden;
    }

    const visibleSet = new Set(visibleFilteredRows);
    for (let row = filterRange.startRow; row <= filterRange.endRow; row++) {
      if (!visibleSet.has(row)) hidden.add(row);
    }
    return hidden;
  }, [filterRange, filterState.sort, visibleFilteredRows]);

  const displayRowMap = useMemo(() => {
    if (!filterRange || !filterState.sort || !visibleFilteredRows) return null;
    const map = new Map<number, number>();
    visibleFilteredRows.forEach((sourceRow, index) => {
      map.set(filterRange.startRow + index, sourceRow);
    });
    return map;
  }, [filterRange, filterState.sort, visibleFilteredRows]);

  const totalRows = useMemo(() => {
    let maxRow = DEFAULT_TOTAL_ROWS - 1;

    for (const rowKey of Object.keys(state.rowHeights)) {
      const row = Number(rowKey);
      if (Number.isFinite(row) && row > maxRow) maxRow = row;
    }

    const selected = [state.selection.start, state.selection.end, state.selection.active];
    for (const id of selected) {
      if (!id) continue;
      const { row } = cellIdToCoords(id);
      if (row > maxRow) maxRow = row;
    }

    return maxRow + 1 + 200;
  }, [state.rowHeights, state.selection]);

  const getColWidth = (index: number) => {
    const label = colIndexToLabel(index);
    return state.columnWidths[label] || DEFAULT_COL_WIDTH;
  };

  const getRowHeight = (index: number) => {
    if (hiddenFilteredRows.has(index)) return 0;
    return state.rowHeights[index] || DEFAULT_ROW_HEIGHT;
  };

  const colPositions = useMemo(() => {
    const positions: number[] = [0];
    let sum = 0;
    for (let i = 0; i < totalCols; i++) {
      const w = getColWidth(i);
      sum += w;
      positions.push(sum);
    }
    return positions;
  }, [state.columnWidths]);

  const rowOffsetMetrics = useMemo(() => {
    const overrideMap = new Map<number, number>();

    Object.entries(state.rowHeights).forEach(([key, height]) => {
      const row = Number(key);
      if (!Number.isFinite(row) || row < 0) return;
      overrideMap.set(row, Number(height) || DEFAULT_ROW_HEIGHT);
    });

    hiddenFilteredRows.forEach((row) => {
      overrideMap.set(row, 0);
    });

    const overrides = Array.from(overrideMap.entries())
      .map(([row, height]) => ({
        row,
        delta: height - DEFAULT_ROW_HEIGHT,
      }))
      .filter((entry) => Number.isFinite(entry.row) && entry.row >= 0 && entry.delta !== 0)
      .sort((a, b) => a.row - b.row);

    const rows: number[] = [];
    const prefixDelta: number[] = [];
    let runningDelta = 0;

    for (const entry of overrides) {
      rows.push(entry.row);
      runningDelta += entry.delta;
      prefixDelta.push(runningDelta);
    }

    const getDeltaBeforeRow = (row: number) => {
      let low = 0;
      let high = rows.length;

      while (low < high) {
        const mid = (low + high) >> 1;
        if (rows[mid] < row) low = mid + 1;
        else high = mid;
      }

      return low === 0 ? 0 : prefixDelta[low - 1];
    };

    const getRowTop = (row: number) => {
      const safeRow = Math.max(0, row);
      return safeRow * DEFAULT_ROW_HEIGHT + getDeltaBeforeRow(safeRow);
    };

    return { getRowTop };
  }, [hiddenFilteredRows, state.rowHeights]);

  const selectionRange = useMemo(() => {
    if (!state.selection.start || !state.selection.end) return null;
    const start = cellIdToCoords(state.selection.start);
    const end = cellIdToCoords(state.selection.end);
    return {
      minRow: Math.min(start.row, end.row),
      maxRow: Math.max(start.row, end.row),
      minCol: Math.min(start.col, end.col),
      maxCol: Math.max(start.col, end.col),
    };
  }, [state.selection]);

  const selectionRect = useMemo(() => {
    if (!selectionRange) return null;
    const { minCol, maxCol, minRow, maxRow } = selectionRange;
    const left = colPositions[minCol] + HEADER_COL_WIDTH - 1;
    const right = colPositions[maxCol + 1] + HEADER_COL_WIDTH - 1;
    const width = right - left;
    const top = rowOffsetMetrics.getRowTop(minRow) + HEADER_ROW_HEIGHT - 1;
    const bottom = rowOffsetMetrics.getRowTop(maxRow + 1) + HEADER_ROW_HEIGHT - 1;
    const height = bottom - top;
    return { left, top, width, height };
  }, [selectionRange, colPositions, rowOffsetMetrics]);

  const autoFillRect = useMemo(() => {
    if (!isAutoFilling || !selectionRange || !autoFillEnd) return null;
    const start = cellIdToCoords(state.selection.start!);
    const end = cellIdToCoords(autoFillEnd);
    const minCol = Math.min(start.col, end.col, selectionRange.minCol);
    const maxCol = Math.max(start.col, end.col, selectionRange.maxCol);
    const minRow = Math.min(start.row, end.row, selectionRange.minRow);
    const maxRow = Math.max(start.row, end.row, selectionRange.maxRow);

    const left = colPositions[minCol] + HEADER_COL_WIDTH - 1;
    const right = colPositions[maxCol + 1] + HEADER_COL_WIDTH - 1;
    const width = right - left;
    const top = rowOffsetMetrics.getRowTop(minRow) + HEADER_ROW_HEIGHT - 1;
    const bottom = rowOffsetMetrics.getRowTop(maxRow + 1) + HEADER_ROW_HEIGHT - 1;
    const height = bottom - top;
    return { left, top, width, height };
  }, [isAutoFilling, selectionRange, autoFillEnd, state.selection.start, colPositions, rowOffsetMetrics]);

  const formulaSelectionRange = useMemo(() => {
    if (!formulaSelection.start || !formulaSelection.end) return null;
    const start = cellIdToCoords(formulaSelection.start);
    const end = cellIdToCoords(formulaSelection.end);
    return {
      minRow: Math.min(start.row, end.row),
      maxRow: Math.max(start.row, end.row),
      minCol: Math.min(start.col, end.col),
      maxCol: Math.max(start.col, end.col),
    };
  }, [formulaSelection]);

  const formulaSelectionRect = useMemo(() => {
    if (!formulaSelectionRange) return null;
    const { minCol, maxCol, minRow, maxRow } = formulaSelectionRange;
    const left = colPositions[minCol] + HEADER_COL_WIDTH - 1;
    const right = colPositions[maxCol + 1] + HEADER_COL_WIDTH - 1;
    const width = right - left;
    const top = rowOffsetMetrics.getRowTop(minRow) + HEADER_ROW_HEIGHT - 1;
    const bottom = rowOffsetMetrics.getRowTop(maxRow + 1) + HEADER_ROW_HEIGHT - 1;
    const height = bottom - top;
    return { left, top, width, height };
  }, [formulaSelectionRange, colPositions, rowOffsetMetrics]);

  useEffect(() => {
    isDraggingRef.current = false;
    lastDrawCell.current = null;
    dragEdgeRef.current = null;
  }, [activeTool]);

  // ───────────────────────────────────────────────
  //  RESTORE "TYPE TO EDIT" BEHAVIOR
  // ───────────────────────────────────────────────
  // ───────────────────────────────────────────────
  // KEYBOARD CONTROLS (Navigation + Clipboard + Undo/Redo + Type to Edit)
  // ───────────────────────────────────────────────
  // ─────────────────────────────────────────────
  // KEYBOARD SHORTCUTS (FINAL CORRECT VERSION)
  // ─────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {

      // Ignore if typing inside input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const activeId = state.selection.active;
      if (!activeId) return;

      // ───── CTRL / CMD SHORTCUTS ─────
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();

        // ✅ ONLY handle Undo / Redo here
        if (key === 'z') {
          e.preventDefault();
          dispatch({ type: 'UNDO' });
          return;
        }

        if (key === 'y') {
          e.preventDefault();
          dispatch({ type: 'REDO' });
          return;
        }

        // ❌ DO NOT handle c, x, v here
        // Let browser trigger copy / cut / paste events
        return;
      }

      // ───── ARROW NAVIGATION ─────
      const arrowMoves: Record<string, { dx: number; dy: number }> = {
        ArrowUp: { dx: 0, dy: -1 },
        ArrowDown: { dx: 0, dy: 1 },
        ArrowLeft: { dx: -1, dy: 0 },
        ArrowRight: { dx: 1, dy: 0 },
      };

      if (e.key in arrowMoves) {
        e.preventDefault();
        const { dx, dy } = arrowMoves[e.key];
        const nextId = getNextCellId(activeId, dx, dy);

        if (e.shiftKey) {
          dispatch({
            type: 'SELECT_RANGE',
            end: nextId,
            active: nextId,
          });
        } else {
          dispatch({ type: 'SELECT_CELL', id: nextId });
        }
        return;
      }

      // ───── ENTER (Move Down) ─────
      if (e.key === 'Enter') {
        e.preventDefault();
        dispatch({ type: 'SELECT_CELL', id: getNextCellId(activeId, 0, 1) });
        return;
      }

      // ───── DELETE / BACKSPACE ─────
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        dispatch({
          type: 'CLEAR_RANGE',
          start: state.selection.start ?? activeId,
          end: state.selection.end ?? activeId,
        });
        return;
      }

      if (e.key === 'Escape') {
        dispatch({ type: 'CLEAR_CLIPBOARD' });
        return;
      }

      // ───── TYPE TO EDIT ─────
      if (e.key.length === 1 && !e.altKey) {
        const cell = state.cells[activeId];
        if (cell?.spillParent) return; // Prevent editing spilled cells

        e.preventDefault();
        setEditValue(e.key);
        setEditingCell(activeId);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, state.selection.active]);



  // Rest of your existing code (mouse handling, paste, copy, rendering...) remains unchanged

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  let visibleColStart = 0;
  while (visibleColStart < totalCols && colPositions[visibleColStart + 1] < scrollLeft) {
    visibleColStart++;
  }

  let visibleColEnd = visibleColStart;
  const viewportWidth = containerRef.current?.clientWidth || 1000;
  while (visibleColEnd < totalCols && colPositions[visibleColEnd] < scrollLeft + viewportWidth) {
    visibleColEnd++;
  }
  visibleColEnd = Math.min(totalCols, visibleColEnd + OVERSCAN);

  const findFirstVisibleRow = (offset: number) => {
    let low = 0;
    let high = totalRows - 1;
    let result = 0;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const rowBottom = rowOffsetMetrics.getRowTop(mid + 1);
      if (rowBottom < offset) {
        result = mid + 1;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return Math.min(totalRows - 1, Math.max(0, result));
  };

  const findRowAtOrAfterOffset = (offset: number) => {
    let low = 0;
    let high = totalRows;

    while (low < high) {
      const mid = (low + high) >> 1;
      if (rowOffsetMetrics.getRowTop(mid) < offset) low = mid + 1;
      else high = mid;
    }

    return low;
  };

  const viewportHeight = containerRef.current?.clientHeight || 600;
  const maxScrollTop = Math.max(0, rowOffsetMetrics.getRowTop(totalRows) + HEADER_ROW_HEIGHT - viewportHeight);
  const effectiveScrollTop = Math.min(scrollTop, maxScrollTop);

  let visibleRowStart = Math.max(0, findFirstVisibleRow(effectiveScrollTop) - OVERSCAN);
  let visibleRowEnd = findRowAtOrAfterOffset(effectiveScrollTop + viewportHeight);
  visibleRowEnd = Math.min(totalRows, visibleRowEnd + OVERSCAN);

  useEffect(() => {
    if (scrollTop > maxScrollTop) {
      setScrollTop(maxScrollTop);
      if (containerRef.current) containerRef.current.scrollTop = maxScrollTop;
    }
  }, [maxScrollTop, scrollTop]);

  useEffect(() => {
    onVisibleWindowChange?.({
      startRow: visibleRowStart,
      endRow: Math.max(visibleRowStart, visibleRowEnd - 1),
    });
  }, [onVisibleWindowChange, visibleRowEnd, visibleRowStart]);

  useEffect(() => {
    if (openFilterColumn === null) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-portal="filter-dropdown"]')) return;
      if (target.closest('[data-filter-trigger="true"]')) return;
      setOpenFilterColumn(null);
      setFilterTriggerRect(null);
    };

    const handleScrollOrResize = () => {
      setOpenFilterColumn(null);
      setFilterTriggerRect(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [openFilterColumn]);

  useEffect(() => {
    if (!filterState.enabled) {
      setOpenFilterColumn(null);
      setFilterTriggerRect(null);
    }
  }, [filterState.enabled]);

  const handleMouseDown = useCallback((e: React.MouseEvent, id: CellId) => {
    if (e.button !== 0) return;

    // Excel-like formula editing: click cell to insert reference
    const currentEditingCell = editingCellRef.current;
    const currentEditValue = editValueRef.current;
    const currentCursorPos = cursorPosRef.current;

    if (currentEditingCell && currentEditValue.startsWith('=')) {
      e.preventDefault();
      e.stopPropagation();

      const charBefore = currentEditValue.substring(0, currentCursorPos).slice(-1);
      const isOperator = /[+\-*/(,) ]/.test(charBefore) || charBefore === '=';
      const isStart = currentCursorPos === 1 && charBefore === '=';

      if (isOperator || isStart) {
        // Start formula range selection
        isDraggingRef.current = true;
        setFormulaSelection({ start: id, end: id });
        isFormulaDraggingRef.current = true;
        formulaDragStartIdRef.current = id;
        formulaBaseValueRef.current = currentEditValue;
        formulaBaseCursorRef.current = currentCursorPos;

        const newValue = currentEditValue.slice(0, currentCursorPos) + id + currentEditValue.slice(currentCursorPos);
        setEditValue(newValue);
        setCursorPos(currentCursorPos + id.length);
      }
      return;
    }

    isDraggingRef.current = true;
    const currentTool = activeToolRef.current;

    if (currentTool === 'none' || currentTool === 'draw_grid') {
      dispatch({ type: 'SELECT_CELL', id });
    } else {
      lastDrawCell.current = id;
      const target = e.currentTarget as HTMLDivElement;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;
      const threshold = 12;
      const distTop = y;
      const distBottom = h - y;
      const distLeft = x;
      const distRight = w - x;
      const min = Math.min(distTop, distBottom, distLeft, distRight);

      let detectedSide: 'top' | 'bottom' | 'left' | 'right' | null = null;
      if (min < threshold) {
        if (min === distTop) detectedSide = 'top';
        else if (min === distBottom) detectedSide = 'bottom';
        else if (min === distLeft) detectedSide = 'left';
        else if (min === distRight) detectedSide = 'right';
      }
      dragEdgeRef.current = detectedSide;
      if (detectedSide) {
        const isEraser = currentTool === 'eraser';
        const color = activeLineColorRef.current;
        const style = activeLineStyleRef.current;
        dispatch({
          type: 'SET_CELL_BORDER',
          id,
          border: {
            side: detectedSide,
            style: isEraser ? undefined : style,
            color: isEraser ? undefined : color
          }
        });
      }
    }
  }, [dispatch]);

  const handleMouseEnter = useCallback((e: React.MouseEvent, id: CellId) => {
    if (e.buttons !== 1) {
      isDraggingRef.current = false;
      return;
    }
    if (!isDraggingRef.current) return;
    const currentTool = activeToolRef.current;
    if (currentTool === 'none' || currentTool === 'draw_grid') {
      const currentEditingCell = editingCellRef.current;
      const currentEditValue = editValueRef.current;
      if (currentEditingCell && currentEditValue.startsWith('=')) {
        if (isFormulaDraggingRef.current && formulaDragStartIdRef.current) {
          setFormulaSelection(prev => ({ ...prev, end: id }));
        }
        return;
      }
      dispatch({ type: 'SELECT_RANGE', end: id });
    } else {
      if (lastDrawCell.current && lastDrawCell.current !== id) {
        const isEraser = currentTool === 'eraser';
        const color = activeLineColorRef.current;
        const style = activeLineStyleRef.current;
        if (dragEdgeRef.current) {
          dispatch({
            type: 'SET_CELL_BORDER',
            id,
            border: {
              side: dragEdgeRef.current,
              style: isEraser ? undefined : style,
              color: isEraser ? undefined : color
            }
          });
        } else {
          const prev = cellIdToCoords(lastDrawCell.current);
          const curr = cellIdToCoords(id);
          let side: 'top' | 'bottom' | 'left' | 'right' | null = null;
          let target = lastDrawCell.current;
          if (curr.col === prev.col) {
            if (curr.row > prev.row) side = 'bottom';
            else side = 'top';
          } else if (curr.row === prev.row) {
            if (curr.col > prev.col) side = 'right';
            else side = 'left';
          }
          if (side) {
            dispatch({
              type: 'SET_CELL_BORDER',
              id: target,
              border: {
                side,
                style: isEraser ? undefined : style,
                color: isEraser ? undefined : color
              }
            });
          }
        }
        lastDrawCell.current = id;
      }
    }
  }, [dispatch]);

  const handleMouseUp = useCallback((id: CellId) => {
    const currentTool = activeToolRef.current;
    if (currentTool === 'draw_grid' && isDraggingRef.current) {
      dispatch({
        type: 'APPLY_BORDER',
        borderType: 'all',
        color: activeLineColorRef.current,
        styleOverride: activeLineStyleRef.current
      });
    }
  }, [dispatch]);

  useEffect(() => {
    const globalMouseUp = () => {
      if (isFormulaDraggingRef.current && formulaDragStartIdRef.current && formulaDragEndIdRef.current) {
        const rangeStr = getRangeStr(formulaDragStartIdRef.current, formulaDragEndIdRef.current);
        const baseValue = formulaBaseValueRef.current;
        const baseCursor = formulaBaseCursorRef.current;
        const newValue = baseValue.slice(0, baseCursor) + rangeStr + baseValue.slice(baseCursor);
        setEditValue(newValue);
        setCursorPos(baseCursor + rangeStr.length);
      }

      isDraggingRef.current = false;
      isFormulaDraggingRef.current = false;
      lastDrawCell.current = null;
      dragEdgeRef.current = null;
    };
    window.addEventListener('mouseup', globalMouseUp);
    return () => window.removeEventListener('mouseup', globalMouseUp);
  }, []);

  const handleFillHandleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAutoFilling(true);
    setAutoFillEnd(state.selection.end);
  };

  useEffect(() => {
    if (!isAutoFilling) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || !selectionRange) return;

      const x = e.clientX - rect.left + scrollLeft - HEADER_COL_WIDTH;
      const y = e.clientY - rect.top + scrollTop - HEADER_ROW_HEIGHT;

      let col = 0;
      while (col < totalCols && colPositions[col + 1] < x) col++;
      let row = findRowAtOrAfterOffset(y);
      if (row > 0 && rowOffsetMetrics.getRowTop(row) > y) row--;

      // Excel restriction: expand either vertical or horizontal
      const dx = col - selectionRange.maxCol;
      const dy = row - selectionRange.maxRow;

      let targetCol = selectionRange.maxCol;
      let targetRow = selectionRange.maxRow;

      if (Math.abs(dx) > Math.abs(dy)) {
        targetCol = col;
      } else {
        targetRow = row;
      }

      const newEnd = coordsToCellId(targetCol, targetRow);
      if (newEnd !== autoFillEnd) {
        setAutoFillEnd(newEnd);
      }
    };

    const handleMouseUp = () => {
      if (state.selection.start && state.selection.end && autoFillEnd) {
        dispatch({
          type: 'AUTO_FILL',
          sourceRange: { start: state.selection.start, end: state.selection.end },
          targetRange: { start: state.selection.start, end: autoFillEnd }
        });
      }
      setIsAutoFilling(false);
      setAutoFillEnd(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isAutoFilling, autoFillEnd, state.selection, scrollLeft, scrollTop, totalCols, colPositions, rowOffsetMetrics, selectionRange, dispatch]);

  const handleDoubleClick = useCallback((id: CellId) => {
    const currentTool = activeToolRef.current;
    if (currentTool === 'none') {
      const cell = state.cells[id];
      if (cell?.spillParent) return; // Prevent editing spilled cells

      setEditingCell(id);
      setEditValue(cell?.value || '');
    }
  }, [state.cells]);

  const handleEditChange = useCallback((val: string) => { setEditValue(val); }, []);

  const handleCursorPositionChange = useCallback((pos: number) => {
    setCursorPos(pos);
  }, []);

  const handleCommitEditing = useCallback((moveSelection = false) => {
    const cellId = editingCellRef.current;
    const val = editValueRef.current;
    if (cellId) {
      flushSync(() => {
        dispatch({ type: 'SET_CELL', id: cellId, value: val });
      });
      if (moveSelection) {
        const nextId = getNextCellId(cellId, 0, 1);
        flushSync(() => {
          dispatch({ type: 'SELECT_CELL', id: nextId });
        });
      }
    }
    setFormulaSelection({ start: null, end: null });
    setEditingCell(null);
    setEditValue('');
  }, [dispatch]);

  const handleCancelEditing = useCallback(() => {
    setFormulaSelection({ start: null, end: null });
    setEditingCell(null);
    setEditValue('');
  }, []);

  const handleColResizeStart = (e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = getColWidth(colIndex);
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(20, startWidth + diff);
      dispatch({ type: 'RESIZE_COL', col: colIndexToLabel(colIndex), width: newWidth });
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleAutoFit = (colIndex: number) => {
    dispatch({ type: 'AUTO_FIT_COL', col: colIndexToLabel(colIndex) });
  };

  const copiedSelectionRange = useMemo(() => {
    if (!copiedRange) return null;
    const start = cellIdToCoords(copiedRange.start);
    const end = cellIdToCoords(copiedRange.end);
    return {
      minRow: Math.min(start.row, end.row),
      maxRow: Math.max(start.row, end.row),
      minCol: Math.min(start.col, end.col),
      maxCol: Math.max(start.col, end.col),
    };
  }, [copiedRange]);

  const copiedSelectionRect = useMemo(() => {
    if (!copiedSelectionRange) return null;
    const { minCol, maxCol, minRow, maxRow } = copiedSelectionRange;
    const left = colPositions[minCol] + HEADER_COL_WIDTH - 1;
    const right = colPositions[maxCol + 1] + HEADER_COL_WIDTH - 1;
    const width = right - left;
    const top = rowOffsetMetrics.getRowTop(minRow) + HEADER_ROW_HEIGHT - 1;
    const bottom = rowOffsetMetrics.getRowTop(maxRow + 1) + HEADER_ROW_HEIGHT - 1;
    const height = bottom - top;
    return { left, top, width, height };
  }, [copiedSelectionRange, colPositions, rowOffsetMetrics]);

  const cursorStyle = useMemo(() => {
    if (activeTool === 'draw_border') return { cursor: CURSOR_PENCIL };
    if (activeTool === 'eraser') return { cursor: CURSOR_ERASER };
    if (activeTool === 'draw_grid') return { cursor: 'crosshair' };
    return {};
  }, [activeTool]);

  const items = [];
  const activeSortColumn = filterState.sort?.column ?? null;

  const handleFilterTriggerClick = (event: React.MouseEvent<HTMLButtonElement>, column: number) => {
    event.stopPropagation();
    setFilterTriggerRect(event.currentTarget.getBoundingClientRect());
    setOpenFilterColumn((current) => (current === column ? null : column));
  };

  for (let c = visibleColStart; c < visibleColEnd; c++) {
    const colWidth = getColWidth(c);
    const colLeft = colPositions[c];
    const hasActiveFilter = !!filterState.columns[c];
    const isSortedColumn = activeSortColumn === c;

    const columnMeta = filterColumnMeta[c];
    items.push(
      <div
        key={`col-${c}`}
        className={`absolute top-0 border-r border-b border-gray-300 text-gray-700 font-semibold text-xs flex items-center justify-center select-none group ${hasActiveFilter || isSortedColumn ? 'bg-[#e8f3ec]' : 'bg-[#f5f5f5]'
          }`}
        style={{
          left: colLeft + HEADER_COL_WIDTH,
          width: colWidth,
          height: HEADER_ROW_HEIGHT,
        }}
      >
        <span className="truncate px-1">{colIndexToLabel(c)}</span>
        <div
          className="absolute right-0 top-0 h-full w-[4px] cursor-col-resize hover:bg-[#107c41] z-10"
          onMouseDown={(e) => handleColResizeStart(e, c)}
          onDoubleClick={() => handleAutoFit(c)}
        />
      </div>
    );
  }

  for (let r = visibleRowStart; r < visibleRowEnd; r++) {
    const rowHeight = getRowHeight(r);
    if (rowHeight === 0) continue;
    const rowTop = rowOffsetMetrics.getRowTop(r);
    items.push(
      <div
        key={`row-${r}`}
        className="absolute left-0 border-r border-b border-gray-300 bg-[#f5f5f5] text-gray-700 font-semibold text-xs flex items-center justify-center select-none"
        style={{
          top: rowTop + HEADER_ROW_HEIGHT,
          height: rowHeight,
          width: HEADER_COL_WIDTH,
        }}
      >
        {r + 1}
      </div>
    );
  }

  items.push(
    <div
      key="corner"
      className="sticky top-0 left-0 z-50 bg-[#f5f5f5] border-r border-b border-gray-300 w-[40px] h-[24px]"
    />
  );

  for (let r = visibleRowStart; r < visibleRowEnd; r++) {
    const rowHeight = getRowHeight(r);
    if (rowHeight === 0) continue;
    for (let c = visibleColStart; c < visibleColEnd; c++) {
      const sourceRow = displayRowMap?.get(r) ?? r;
      const id = coordsToCellId(c, sourceRow);
      const isActive = id === state.selection.active;
      const isSelected = selectionRange ? (
        sourceRow >= selectionRange.minRow && sourceRow <= selectionRange.maxRow &&
        c >= selectionRange.minCol && c <= selectionRange.maxCol
      ) : false;
      const isEditing = id === editingCell;
      const width = getColWidth(c);
      const height = rowHeight;
      const left = colPositions[c];
      const top = rowOffsetMetrics.getRowTop(r);

      items.push(
        <Cell
          key={id}
          id={id}
          data={state.cells[id]}
          width={width}
          height={height}
          isActive={isActive}
          isSelected={isSelected}
          isInRange={false}
          isEditing={isEditing}
          editValue={isEditing ? editValue : ''}
          style={{
            left: left + HEADER_COL_WIDTH,
            top: top + HEADER_ROW_HEIGHT,
          }}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onChange={handleEditChange}
          onCommit={handleCommitEditing}
          onCancel={handleCancelEditing}
          onCursorPositionChange={handleCursorPositionChange}
        />
      );
    }
  }

  if (filterRange && filterState.enabled) {
    const { headerRow, startCol, endCol } = filterRange;
    const isHeaderVisible = headerRow >= visibleRowStart && headerRow < visibleRowEnd;

    if (isHeaderVisible) {
      const rowTop = rowOffsetMetrics.getRowTop(headerRow);
      const rowHeight = getRowHeight(headerRow);

      for (let c = Math.max(startCol, visibleColStart); c <= Math.min(endCol, visibleColEnd - 1); c++) {
        const colLeft = colPositions[c];
        const colWidth = getColWidth(c);
        const hasActiveFilter = !!filterState.columns[c];
        const isSortedColumn = activeSortColumn === c;
        const columnMeta = filterColumnMeta[c];

        items.push(
          <button
            key={`filter-btn-${c}`}
            data-filter-trigger="true"
            className={`absolute z-[60] flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded ${openFilterColumn === c ? 'bg-gray-200' : 'bg-gray-50 hover:bg-gray-200'} shadow-[0_1px_2px_rgba(0,0,0,0.15)] border border-gray-300`}
            style={{
              left: colLeft + HEADER_COL_WIDTH + colWidth - 20,
              top: rowTop + HEADER_ROW_HEIGHT + (rowHeight / 2),
            }}
            onClick={(event) => handleFilterTriggerClick(event, c)}
            onMouseDown={(e) => e.stopPropagation()}
            title={columnMeta?.headerValue || colIndexToLabel(c)}
          >
            <Icon
              name={hasActiveFilter || isSortedColumn ? 'Funnel' : 'ChevronDown'}
              size={10}
              className={hasActiveFilter || isSortedColumn ? 'text-[#107c41]' : 'text-gray-700'}
            />
          </button>
        );
      }
    }
  }

  const openColumnMeta = openFilterColumn !== null ? filterColumnMeta[openFilterColumn] : undefined;

  return (
    <div
      className={`flex-1 overflow-auto bg-white relative excel-grid-container`}
      style={cursorStyle}
      ref={containerRef}
      onScroll={onScroll}
      tabIndex={0}           // ← important: makes the grid focusable
    >
      <div
        style={{
          width: colPositions[totalCols] + HEADER_COL_WIDTH,
          height: rowOffsetMetrics.getRowTop(totalRows) + HEADER_ROW_HEIGHT,
          position: 'relative'
        }}
      >
        <style>{`
          @keyframes excel-copy-march-horizontal {
            from { background-position: 0 0; }
            to { background-position: 8px 0; }
          }

          @keyframes excel-copy-march-vertical {
            from { background-position: 0 0; }
            to { background-position: 0 8px; }
          }
        `}</style>
        {items}
        {openFilterColumn !== null && openColumnMeta && (
          <FilterDropdown
            columnLabel={openColumnMeta.label}
            headerLabel={openColumnMeta.headerValue}
            dataType={openColumnMeta.type}
            uniqueValues={openColumnMeta.uniqueValues}
            uniqueColors={openColumnMeta.uniqueColors}
            uniqueTextColors={openColumnMeta.uniqueTextColors}
            hasBlanks={openColumnMeta.blankCount > 0}
            activeFilter={filterState.columns[openFilterColumn]}
            triggerRect={filterTriggerRect}
            onClose={() => {
              setOpenFilterColumn(null);
              setFilterTriggerRect(null);
            }}
            onChange={(nextFilter) => {
              if (nextFilter) onUpdateColumnFilter(openFilterColumn, nextFilter);
              else onClearColumnFilter(openFilterColumn);
            }}
            onSort={(direction, color, colorType) => onSetFilterSort({ column: openFilterColumn, direction, color, colorType })}
            onClearSort={() => {
              if (filterState.sort?.column === openFilterColumn) {
                onSetFilterSort(null);
              }
            }}
          />
        )}
        {selectionRect && (
          <div
            className="absolute pointer-events-none z-30 border-2 border-[#107c41]"
            style={{
              left: selectionRect.left,
              top: selectionRect.top,
              width: selectionRect.width,
              height: selectionRect.height
            }}
          >
            <div
              className="absolute w-2 h-2 bg-[#107c41] border border-white -bottom-[5px] -right-[5px] cursor-crosshair pointer-events-auto"
              onMouseDown={handleFillHandleMouseDown}
            />
          </div>
        )}
        {formulaSelectionRect && (
          <div
            className="absolute pointer-events-none z-30"
            style={{
              left: formulaSelectionRect.left,
              top: formulaSelectionRect.top,
              width: formulaSelectionRect.width,
              height: formulaSelectionRect.height,
            }}
          >
            {/* Top border */}
            <div
              className="absolute top-0 left-0 w-full h-[2px]"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #2563eb 0 4px, transparent 4px 8px)',
                animation: 'excel-copy-march-horizontal 0.4s linear infinite',
              }}
            />
            {/* Bottom border */}
            <div
              className="absolute bottom-0 left-0 w-full h-[2px]"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #2563eb 0 4px, transparent 4px 8px)',
                animation: 'excel-copy-march-horizontal 0.4s linear infinite reverse',
              }}
            />
            {/* Left border */}
            <div
              className="absolute top-0 left-0 w-[2px] h-full"
              style={{
                backgroundImage: 'repeating-linear-gradient(180deg, #2563eb 0 4px, transparent 4px 8px)',
                animation: 'excel-copy-march-vertical 0.4s linear infinite',
              }}
            />
            {/* Right border */}
            <div
              className="absolute top-0 right-0 w-[2px] h-full"
              style={{
                backgroundImage: 'repeating-linear-gradient(180deg, #2563eb 0 4px, transparent 4px 8px)',
                animation: 'excel-copy-march-vertical 0.4s linear infinite reverse',
              }}
            />
            <div className="absolute inset-0 bg-blue-500/10" />
          </div>
        )}
        {autoFillRect && (
          <div
            className="absolute pointer-events-none z-50 border-2 border-dashed border-[#107c41] bg-[#107c41]/10"
            style={{
              left: autoFillRect.left,
              top: autoFillRect.top,
              width: autoFillRect.width,
              height: autoFillRect.height
            }}
          />
        )}
        {copiedSelectionRect && (
          <div
            className="absolute pointer-events-none z-40"
            style={{
              left: copiedSelectionRect.left,
              top: copiedSelectionRect.top,
              width: copiedSelectionRect.width,
              height: copiedSelectionRect.height,
            }}
          >
            <div
              className="absolute left-0 top-0 h-[2px] w-full"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #107c41 0 4px, transparent 4px 8px)',
                animation: 'excel-copy-march-horizontal 0.45s linear infinite',
              }}
            />
            <div
              className="absolute bottom-0 left-0 h-[2px] w-full"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #107c41 0 4px, transparent 4px 8px)',
                animation: 'excel-copy-march-horizontal 0.45s linear infinite reverse',
              }}
            />
            <div
              className="absolute left-0 top-0 h-full w-[2px]"
              style={{
                backgroundImage: 'repeating-linear-gradient(180deg, #107c41 0 4px, transparent 4px 8px)',
                animation: 'excel-copy-march-vertical 0.45s linear infinite reverse',
              }}
            />
            <div
              className="absolute right-0 top-0 h-full w-[2px]"
              style={{
                backgroundImage: 'repeating-linear-gradient(180deg, #107c41 0 4px, transparent 4px 8px)',
                animation: 'excel-copy-march-vertical 0.45s linear infinite',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

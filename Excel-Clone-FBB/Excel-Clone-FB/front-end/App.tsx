import React, { useReducer, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Ribbon } from './components/Ribbon';
import { FormulaBar } from './components/FormulaBar';
import { Grid } from './components/Grid';
import { Icon } from './components/Icon';
import { SaveAsModal } from './components/SaveAsModal';
import { OpenModal } from './components/OpenModal';
import { ShareModal } from './components/ShareModal';
import { AddUserModal } from './components/AddUserModal';
import { EditUserModal } from './components/EditUserModal';
import { ShareWorkbookModal } from './components/ShareWorkbookModal';
import { UserManagementView } from './components/UserManagementView';
import { MyProfileView } from './components/MyProfileView';
import {
  AuthSession,
  CreateUserFormData,
  UpdateUserFormData,
  UpdateMyProfileFormData,
  ManagedUser,
  MyProfileData,
  ShareableUser,
  WorkbookListItem,
  SheetState,
  SheetAction,
  WorkbookState,
  WorkbookClipboard,
  ClipboardItem,
  BorderType,
  CellData,
  CellId,
  ColumnFilterConfig,
  FilterSortConfig,
  SheetFilterState,
} from './types';
import { recalculateGrid, applyOffset } from './utils/formulas';
import {
  getRangeCoords,
  coordsToCellId,
  cellIdToCoords,
  getTextWidth,
  formatValue,
  getNextCellId,
  calculateRotatedHeight,
  getAutoRowHeight,
  colLabelToContent,
} from './utils/helpers';

type PersistedCellPayload = {
  row: number;
  column: number;
  value: string;
  styleJson: string | null;
};

type WorksheetCellPatchPayload = {
  name: string;
  cells: PersistedCellPayload[];
};

type VisibleRowWindow = {
  startRow: number;
  endRow: number;
};

type WorksheetWindowResponse = {
  worksheetId: string;
  name: string;
  workbookId: string;
  workbookUpdatedAt: string | null;
  startRow: number;
  endRow: number;
  cells: Array<{
    row: number;
    column: number;
    value: string | null;
    styleJson: string | null;
  }>;
};

type GlobalSheetClipboard = {
  data: ClipboardItem[][] | null;
  type: 'copy' | 'cut' | null;
  sourceWorkbookId: string | null;
  sourceSheet: string | null;
  sourceRange: { sheetId: string; start: CellId; end: CellId } | null;
};

const GLOBAL_CLIPBOARD_STORAGE_KEY = 'excel-clone-global-clipboard';

declare global {
  interface Window {
    sheetClipboard?: GlobalSheetClipboard;
    sheetHasUnsavedChanges?: boolean;
    hasUnsavedChanges?: boolean;
    currentEditingSheet?: string | null;
  }
}

const getDefaultGlobalClipboard = (): GlobalSheetClipboard => ({
  data: null,
  type: null,
  sourceWorkbookId: null,
  sourceSheet: null,
  sourceRange: null,
});

const readGlobalClipboard = (): GlobalSheetClipboard => {
  if (typeof window === 'undefined') {
    return getDefaultGlobalClipboard();
  }

  if (window.sheetClipboard?.data?.length) {
    return window.sheetClipboard;
  }

  try {
    const rawClipboard = window.sessionStorage.getItem(GLOBAL_CLIPBOARD_STORAGE_KEY);
    if (!rawClipboard) {
      return getDefaultGlobalClipboard();
    }

    const parsedClipboard = JSON.parse(rawClipboard) as GlobalSheetClipboard;
    if (!parsedClipboard?.data?.length) {
      return getDefaultGlobalClipboard();
    }

    return parsedClipboard;
  } catch {
    return getDefaultGlobalClipboard();
  }
};

const ensureGlobalClipboard = () => {
  if (!window.sheetClipboard) {
    window.sheetClipboard = readGlobalClipboard();
  }
};

const storeGlobalClipboard = (clipboard: WorkbookClipboard | null) => {
  ensureGlobalClipboard();
  if (!clipboard?.data) {
    window.sheetClipboard = getDefaultGlobalClipboard();
    window.sessionStorage.removeItem(GLOBAL_CLIPBOARD_STORAGE_KEY);
    return;
  }

  window.sheetClipboard = {
    data: clipboard.data,
    type: clipboard.type,
    sourceWorkbookId: clipboard.sourceWorkbookId ?? null,
    sourceSheet: clipboard.sourceRange?.sheetId ?? null,
    sourceRange: clipboard.sourceRange ?? null,
  };
  window.sessionStorage.setItem(GLOBAL_CLIPBOARD_STORAGE_KEY, JSON.stringify(window.sheetClipboard));
};

const getPasteClipboard = (state: WorkbookState): WorkbookClipboard | null => {
  if (state.clipboard?.data?.length) {
    return state.clipboard;
  }

  const globalClipboard = readGlobalClipboard();
  if (!globalClipboard?.data?.length) {
    return null;
  }

  return {
    data: globalClipboard.data,
    type: globalClipboard.type,
    sourceRange: globalClipboard.sourceRange,
    sourceWorkbookId: globalClipboard.sourceWorkbookId,
  };
};

const persistenceChangingActionTypes = new Set<SheetAction['type']>([
  'SET_CELL',
  'PASTE',
  'PASTE_CONTENT',
  'CLEAR_RANGE',
  'UNDO',
  'REDO',
  'UPDATE_STYLE',
  'APPLY_BORDER',
  'SET_CELL_BORDER',
]);

const structuralPersistenceActionTypes = new Set<SheetAction['type']>([
  'ADD_SHEET',
  'DELETE_SHEET',
  'RESET_WORKBOOK',
]);

const LIVE_SYNC_DEBOUNCE_MS = 2500;
const LIVE_REFRESH_INTERVAL_MS = 8000;
const WORKSHEET_WINDOW_PADDING = 100;

const getCellPersistenceSignature = (cell?: CellData) =>
  JSON.stringify({
    value: cell?.value ?? '',
    style: cell?.style ?? null,
  });

const buildPersistedCellPayload = (cellId: CellId, cell?: CellData): PersistedCellPayload => {
  const { col, row } = cellIdToCoords(cellId);
  return {
    row,
    column: col,
    value: normalizeCellValue(cell?.value),
    styleJson: cell?.style ? JSON.stringify(cell.style) : null,
  };
};

const hasPersistedCellContent = (cell?: CellData) =>
  Boolean((cell?.value ?? '') !== '' || cell?.style);

const hasWorkbookCellValueChanges = (prev: WorkbookState, next: WorkbookState): boolean => {
  const sheetIds = new Set([...prev.sheetOrder, ...next.sheetOrder]);

  for (const sheetId of sheetIds) {
    const prevCells = prev.sheets[sheetId]?.cells || {};
    const nextCells = next.sheets[sheetId]?.cells || {};
    const cellIds = new Set([...Object.keys(prevCells), ...Object.keys(nextCells)]);

    for (const cellId of cellIds) {
      const prevValue = prevCells[cellId]?.value ?? '';
      const nextValue = nextCells[cellId]?.value ?? '';
      if (prevValue !== nextValue) {
        return true;
      }
    }
  }

  return false;
};

const createEmptySheet = (): SheetState => ({
  cells: {},
  columnWidths: {},
  rowHeights: {},
  selection: { start: 'A1', end: 'A1', active: 'A1' },
  undoStack: [],
  redoStack: [],
});

const initialWorkbookState: WorkbookState = {
  sheets: { 'Sheet1': createEmptySheet() },
  activeSheetId: 'Sheet1',
  sheetOrder: ['Sheet1'],
  clipboard: null,
};

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const normalizeCellValue = (value: string | null | undefined): string => {
  if (typeof value !== 'string') return '';
  return value.replace(/^\s+/, '');
};

const getAutoFillValue = (sourceValues: string[], targetIndex: number): string => {
  if (sourceValues.length === 0) return '';
  if (sourceValues.length === 1) return sourceValues[0];

  const val1 = sourceValues[0];
  const val2 = sourceValues[1];

  // Number series
  const num1 = parseFloat(val1);
  const num2 = parseFloat(val2);
  if (!isNaN(num1) && !isNaN(num2)) {
    const step = num2 - num1;
    const result = num1 + (targetIndex * step);
    // Format to avoid floating point precision issues if they are integers
    return Number.isInteger(num1) && Number.isInteger(step) ? result.toString() : result.toFixed(2).replace(/\.?0+$/, '');
  }

  // Day series
  const day1Idx = DAYS_OF_WEEK.indexOf(val1.toLowerCase());
  const day2Idx = DAYS_OF_WEEK.indexOf(val2.toLowerCase());
  if (day1Idx !== -1 && day2Idx !== -1) {
    const step = (day2Idx - day1Idx + 14) % 7 || 1;
    const targetDayIdx = (day1Idx + (targetIndex * step) + 70000) % 7; // Large offset to handle negative steps
    const result = DAYS_OF_WEEK[targetDayIdx];
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  // Fallback: Repeat pattern
  return sourceValues[targetIndex % sourceValues.length];
};

const singleSheetReducer = (state: SheetState, action: SheetAction): SheetState => {
  switch (action.type) {
    case 'SELECT_CELL':
      return {
        ...state,
        selection: {
          start: action.id,
          end: action.id,
          active: action.id,
        },
      };

    case 'SELECT_RANGE':
      return {
        ...state,
        selection: {
          ...state.selection,
          end: action.end,
          active: action.active ?? state.selection.active,
        },
      };

    case 'SET_CELL': {
      const prevCells = { ...state.cells };
      const newCells = { ...state.cells };
      const cell = newCells[action.id] || { id: action.id, value: '' };

      newCells[action.id] = { ...cell, value: normalizeCellValue(action.value) };

      const recalculated = recalculateGrid(newCells);
      const { row } = cellIdToCoords(action.id);
      const newHeight = getAutoRowHeight(recalculated, row, state.columnWidths);
      const newRowHeights = { ...state.rowHeights, [row]: newHeight };

      return {
        ...state,
        cells: recalculated,
        rowHeights: newRowHeights,
        undoStack: [
          ...state.undoStack.slice(-20),
          { cells: prevCells, rowHeights: state.rowHeights },
        ],
        redoStack: [],
      };
    }

    case 'UPDATE_STYLE': {
      const { start, end } = state.selection;
      if (!start || !end) return state;

      const { startCol, endCol, startRow, endRow } = getRangeCoords(start, end);
      const newCells = { ...state.cells };
      const newRowHeights = { ...state.rowHeights };

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const id = coordsToCellId(c, r);
          const cell = newCells[id] || { id, value: '' };
          newCells[id] = {
            ...cell,
            style: { ...cell.style, ...action.style },
          };
        }
      }

      if (
        action.style.textRotation !== undefined ||
        action.style.fontSize !== undefined ||
        action.style.fontFamily !== undefined ||
        action.style.wrapText !== undefined
      ) {
        for (let r = startRow; r <= endRow; r++) {
          newRowHeights[r] = getAutoRowHeight(newCells, r, state.columnWidths);
        }
      }

      return {
        ...state,
        cells: newCells,
        rowHeights: newRowHeights,
      };
    }

    case 'APPLY_BORDER': {
      const { start, end } = state.selection;
      if (!start || !end) return state;

      const { startCol, endCol, startRow, endRow } = getRangeCoords(start, end);
      const newCells = { ...state.cells };
      const { borderType, color, styleOverride } = action;

      const setBorder = (
        r: number,
        c: number,
        side: 'Top' | 'Right' | 'Bottom' | 'Left',
        type: BorderType | undefined,
      ) => {
        const id = coordsToCellId(c, r);
        const cell = newCells[id] || { id, value: '' };
        newCells[id] = {
          ...cell,
          style: {
            ...cell.style,
            [`border${side}`]: type,
            [`border${side}Color`]: type ? color : undefined,
          },
        };

        let neighborId = '';
        let neighborSide = '';

        if (side === 'Top' && r > 0) {
          neighborId = coordsToCellId(c, r - 1);
          neighborSide = 'Bottom';
        }
        if (side === 'Bottom') {
          neighborId = coordsToCellId(c, r + 1);
          neighborSide = 'Top';
        }
        if (side === 'Left' && c > 0) {
          neighborId = coordsToCellId(c - 1, r);
          neighborSide = 'Right';
        }
        if (side === 'Right') {
          neighborId = coordsToCellId(c + 1, r);
          neighborSide = 'Left';
        }

        if (neighborId) {
          const nCell = newCells[neighborId] || { id: neighborId, value: '' };
          const neighborType = type === undefined ? undefined : 'none';
          newCells[neighborId] = {
            ...nCell,
            style: {
              ...nCell.style,
              [`border${neighborSide}`]: neighborType,
              [`border${neighborSide}Color`]: undefined,
            },
          };
        }
      };

      const iterate = (fn: (r: number, c: number) => void) => {
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            fn(r, c);
          }
        }
      };

      if (borderType === 'no_border') {
        iterate((r, c) => {
          setBorder(r, c, 'Top', undefined);
          setBorder(r, c, 'Bottom', undefined);
          setBorder(r, c, 'Left', undefined);
          setBorder(r, c, 'Right', undefined);
        });
      } else {
        const allowList = ['top', 'bottom', 'left', 'right', 'all', 'outside', 'thick_outside'];

        if (allowList.includes(borderType)) {
          let activeStyle = styleOverride || 'thin';
          if (activeStyle === 'none') activeStyle = 'thin';

          if (borderType === 'all') {
            iterate((r, c) => {
              setBorder(r, c, 'Top', activeStyle);
              setBorder(r, c, 'Bottom', activeStyle);
              setBorder(r, c, 'Left', activeStyle);
              setBorder(r, c, 'Right', activeStyle);
            });
          } else if (borderType === 'outside' || borderType === 'thick_outside') {
            const style = activeStyle;
            for (let c = startCol; c <= endCol; c++) {
              setBorder(startRow, c, 'Top', style);
              setBorder(endRow, c, 'Bottom', style);
            }
            for (let r = startRow; r <= endRow; r++) {
              setBorder(r, startCol, 'Left', style);
              setBorder(r, endCol, 'Right', style);
            }
          } else if (borderType === 'top') {
            iterate((r, c) => r === startRow && setBorder(r, c, 'Top', activeStyle));
          } else if (borderType === 'bottom') {
            iterate((r, c) => r === endRow && setBorder(r, c, 'Bottom', activeStyle));
          } else if (borderType === 'left') {
            iterate((r, c) => c === startCol && setBorder(r, c, 'Left', activeStyle));
          } else if (borderType === 'right') {
            iterate((r, c) => c === endCol && setBorder(r, c, 'Right', activeStyle));
          }
        } else {
          const thin = 'thin';
          const thick = 'thick';
          const double = 'double';

          if (borderType === 'bottom_double') {
            iterate((r, c) => r === endRow && setBorder(r, c, 'Bottom', double));
          } else if (borderType === 'thick_bottom') {
            iterate((r, c) => r === endRow && setBorder(r, c, 'Bottom', thick));
          } else if (borderType === 'top_bottom') {
            iterate((r, c) => {
              if (r === startRow) setBorder(r, c, 'Top', thin);
              if (r === endRow) setBorder(r, c, 'Bottom', thin);
            });
          } else if (borderType === 'top_thick_bottom') {
            iterate((r, c) => {
              if (r === startRow) setBorder(r, c, 'Top', thin);
              if (r === endRow) setBorder(r, c, 'Bottom', thick);
            });
          } else if (borderType === 'top_double_bottom') {
            iterate((r, c) => {
              if (r === startRow) setBorder(r, c, 'Top', thin);
              if (r === endRow) setBorder(r, c, 'Bottom', double);
            });
          }
        }
      }

      return {
        ...state,
        cells: newCells,
      };
    }

    case 'SET_CELL_BORDER': {
      const { id, border } = action;
      const newCells = { ...state.cells };
      const cell = newCells[id] || { id, value: '' };
      const side = border.side.charAt(0).toUpperCase() + border.side.slice(1);

      newCells[id] = {
        ...cell,
        style: {
          ...cell.style,
          [`border${side}`]: border.style,
          [`border${side}Color`]: border.color,
        },
      };

      const { col, row } = cellIdToCoords(id);
      let neighborId = '';
      let neighborSide = '';

      if (side === 'Top' && row > 0) {
        neighborId = coordsToCellId(col, row - 1);
        neighborSide = 'Bottom';
      }
      if (side === 'Bottom') {
        neighborId = coordsToCellId(col, row + 1);
        neighborSide = 'Top';
      }
      if (side === 'Left' && col > 0) {
        neighborId = coordsToCellId(col - 1, row);
        neighborSide = 'Right';
      }
      if (side === 'Right') {
        neighborId = coordsToCellId(col + 1, row);
        neighborSide = 'Left';
      }

      if (neighborId) {
        const nCell = newCells[neighborId] || { id: neighborId, value: '' };
        const neighborType = border.style === undefined ? undefined : 'none';
        newCells[neighborId] = {
          ...nCell,
          style: {
            ...nCell.style,
            [`border${neighborSide}`]: neighborType,
            [`border${neighborSide}Color`]: undefined,
          },
        };
      }

      return {
        ...state,
        cells: newCells,
      };
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const prev = state.undoStack[state.undoStack.length - 1];
      const newUndo = state.undoStack.slice(0, -1);

      return {
        ...state,
        ...prev,
        undoStack: newUndo,
        redoStack: [...state.redoStack, { cells: state.cells, rowHeights: state.rowHeights }],
      };
    }

    case 'REDO': {
      if (state.redoStack.length === 0) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      const newRedo = state.redoStack.slice(0, -1);

      return {
        ...state,
        ...next,
        undoStack: [...state.undoStack, { cells: state.cells, rowHeights: state.rowHeights }],
        redoStack: newRedo,
      };
    }

    case 'PASTE_CONTENT': {
      if (!state.selection.active) return state;

      const data: ClipboardItem[][] = action.data;
      const targetStart = cellIdToCoords(state.selection.active);
      const prevCells = { ...state.cells };
      const newCells = { ...state.cells };
      const affectedRows = new Set<number>();

      data.forEach((row: ClipboardItem[], rIndex) => {
        row.forEach((item: ClipboardItem, cIndex) => {
          const targetCol = targetStart.col + cIndex;
          const targetRow = targetStart.row + rIndex;
          const targetId = coordsToCellId(targetCol, targetRow);

          const existing = newCells[targetId] || { id: targetId, value: '' };
          newCells[targetId] = {
            ...existing,
            value: normalizeCellValue(item.value),
            style: item.style ? { ...item.style } : undefined,
          };

          affectedRows.add(targetRow);
        });
      });

      const recalculated = recalculateGrid(newCells);
      const newRowHeights = { ...state.rowHeights };
      affectedRows.forEach((r) => {
        newRowHeights[r] = getAutoRowHeight(recalculated, r, state.columnWidths);
      });

      return {
        ...state,
        cells: recalculated,
        rowHeights: newRowHeights,
        undoStack: [
          ...state.undoStack,
          { cells: prevCells, rowHeights: state.rowHeights },
        ],
        redoStack: [],
      };
    }

    case 'CLEAR_RANGE': {
      const { startCol, endCol, startRow, endRow } = getRangeCoords(action.start, action.end);
      const newCells = { ...state.cells };

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const id = coordsToCellId(c, r);
          if (newCells[id]) {
            newCells[id] = {
              ...newCells[id],
              value: '',
              computed: null,
            };
          }
        }
      }

      const recalculated = recalculateGrid(newCells);
      const newRowHeights = { ...state.rowHeights };

      for (let r = startRow; r <= endRow; r++) {
        newRowHeights[r] = getAutoRowHeight(recalculated, r, state.columnWidths);
      }

      return {
        ...state,
        cells: recalculated,
        rowHeights: newRowHeights,
      };
    }

    case 'RESIZE_COL':
      return {
        ...state,
        columnWidths: {
          ...state.columnWidths,
          [action.col]: Math.max(20, action.width),
        },
      };

    case 'RESIZE_ROW':
      return {
        ...state,
        rowHeights: {
          ...state.rowHeights,
          [action.row]: Math.max(24, action.height),
        },
      };

    case 'AUTO_FIT_COL': {
      const colIndex = colLabelToContent(action.col);
      let maxWidth = 30;

      Object.values(state.cells).forEach((cell: CellData) => {
        const { col } = cellIdToCoords(cell.id);
        if (col === colIndex) {
          const displayValue = formatValue(
            cell.computed ?? cell.value,
            cell.style?.format,
          );
          const font = `${cell.style?.bold ? 'bold ' : ''}${cell.style?.italic ? 'italic ' : ''
            }${cell.style?.fontSize || 11}pt ${cell.style?.fontFamily || 'Calibri'}`;
          const width = getTextWidth(displayValue, font);
          if (width > maxWidth) maxWidth = width;
        }
      });

      const headerWidth = getTextWidth(action.col, 'bold 12px sans-serif');
      if (headerWidth > maxWidth) maxWidth = headerWidth;
      maxWidth += 16;

      return {
        ...state,
        columnWidths: {
          ...state.columnWidths,
          [action.col]: maxWidth,
        },
      };
    }

    case 'AUTO_FILL': {
      const sourceRange = getRangeCoords(action.sourceRange.start, action.sourceRange.end);
      const targetRange = getRangeCoords(action.targetRange.start, action.targetRange.end);
      const newCells = { ...state.cells };
      const prevCells = { ...state.cells };

      const isVertical = targetRange.endRow !== sourceRange.endRow || targetRange.startRow !== sourceRange.startRow;

      if (isVertical) {
        // Vertical Fill
        for (let c = sourceRange.startCol; c <= sourceRange.endCol; c++) {
          const sourceValues: string[] = [];
          for (let r = sourceRange.startRow; r <= sourceRange.endRow; r++) {
            sourceValues.push(state.cells[coordsToCellId(c, r)]?.value || '');
          }

          for (let r = targetRange.startRow; r <= targetRange.endRow; r++) {
            if (r >= sourceRange.startRow && r <= sourceRange.endRow) continue;
            const targetId = coordsToCellId(c, r);
            const sourceId = coordsToCellId(c, sourceRange.startRow + ((r - targetRange.startRow) % sourceValues.length));
            const sourceValue = state.cells[sourceId]?.value || '';

            let newValue;
            if (sourceValue.startsWith('=')) {
              const rOffset = r - cellIdToCoords(sourceId).row;
              newValue = applyOffset(sourceValue, 0, rOffset);
            } else {
              newValue = getAutoFillValue(sourceValues, r - sourceRange.startRow);
            }

            newCells[targetId] = {
              ...(newCells[targetId] || { id: targetId }),
              value: normalizeCellValue(newValue),
              style: state.cells[sourceId]?.style,
            };
          }
        }
      } else {
        // Horizontal Fill
        for (let r = sourceRange.startRow; r <= sourceRange.endRow; r++) {
          const sourceValues: string[] = [];
          for (let c = sourceRange.startCol; c <= sourceRange.endCol; c++) {
            sourceValues.push(state.cells[coordsToCellId(c, r)]?.value || '');
          }

          for (let c = targetRange.startCol; c <= targetRange.endCol; c++) {
            if (c >= sourceRange.startCol && c <= sourceRange.endCol) continue;
            const targetId = coordsToCellId(c, r);
            const sourceId = coordsToCellId(sourceRange.startCol + ((c - targetRange.startCol) % sourceValues.length), r);
            const sourceValue = state.cells[sourceId]?.value || '';

            let newValue;
            if (sourceValue.startsWith('=')) {
              const cOffset = c - cellIdToCoords(sourceId).col;
              newValue = applyOffset(sourceValue, cOffset, 0);
            } else {
              newValue = getAutoFillValue(sourceValues, c - sourceRange.startCol);
            }

            newCells[targetId] = {
              ...(newCells[targetId] || { id: targetId }),
              value: normalizeCellValue(newValue),
              style: state.cells[sourceId]?.style,
            };
          }
        }
      }

      const recalculated = recalculateGrid(newCells);
      const newRowHeights = { ...state.rowHeights };
      for (let r = targetRange.startRow; r <= targetRange.endRow; r++) {
        newRowHeights[r] = getAutoRowHeight(recalculated, r, state.columnWidths);
      }

      return {
        ...state,
        cells: recalculated,
        rowHeights: newRowHeights,
        undoStack: [
          ...state.undoStack.slice(-20),
          { cells: prevCells, rowHeights: state.rowHeights },
        ],
        redoStack: [],
        selection: {
          ...state.selection,
          start: action.targetRange.start,
          end: action.targetRange.end,
        }
      };
    }

    default:
      return state;
  }
};

const workbookReducer = (state: WorkbookState, action: SheetAction): WorkbookState => {
  switch (action.type) {
    case 'RESET_WORKBOOK':
      return {
        ...initialWorkbookState,
        clipboard: getPasteClipboard(state),
      };

    case 'ADD_SHEET': {
      let i = 1;
      while (state.sheetOrder.includes(`Sheet${i}`)) i++;
      const newId = `Sheet${i}`;

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [newId]: createEmptySheet(),
        },
        sheetOrder: [...state.sheetOrder, newId],
        activeSheetId: newId,
      };
    }

    case 'SWITCH_SHEET':
      return { ...state, activeSheetId: action.id };

    case 'SELECT_CELL':
    case 'SELECT_RANGE': {
      const activeSheet = state.sheets[state.activeSheetId];
      const newSheetState = singleSheetReducer(activeSheet, action);
      if (newSheetState === activeSheet) return state;
      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: newSheetState,
        },
      };
    }

    case 'DELETE_SHEET': {
      if (state.sheetOrder.length <= 1) return state;

      const newSheets = { ...state.sheets };
      delete newSheets[action.id];

      const newOrder = state.sheetOrder.filter((id) => id !== action.id);
      const newActive = state.activeSheetId === action.id ? newOrder[0] : state.activeSheetId;

      return {
        ...state,
        sheets: newSheets,
        sheetOrder: newOrder,
        activeSheetId: newActive,
      };
    }

    case 'COPY': {
      const sheet = state.sheets[state.activeSheetId];
      const { start, end } = sheet.selection;
      if (!start || !end) return state;

      const { startCol, endCol, startRow, endRow } = getRangeCoords(start, end);
      const data: ClipboardItem[][] = [];

      for (let r = startRow; r <= endRow; r++) {
        const rowData: ClipboardItem[] = [];
        for (let c = startCol; c <= endCol; c++) {
          const id = coordsToCellId(c, r);
          const cell = sheet.cells[id];
          // Capture display result to support external/internal "Paste Value" behavior as requested
          const valueToCopy = cell?.computed !== undefined ? String(cell.computed) : (cell?.value || '');
          rowData.push({
            value: valueToCopy,
            style: cell?.style,
          });
        }
        data.push(rowData);
      }

      const nextClipboard: WorkbookClipboard = {
        data,
        sourceRange: { sheetId: state.activeSheetId, start, end },
        sourceWorkbookId: state.workbookId ?? null,
        type: 'copy',
      };
      storeGlobalClipboard(nextClipboard);

      return {
        ...state,
        clipboard: nextClipboard,
      };
    }

    case 'CUT': {
      const sheet = state.sheets[state.activeSheetId];
      const { start, end } = sheet.selection;
      if (!start || !end) return state;

      const copyState = workbookReducer(state, { type: 'COPY' } as any);
      const cutClipboard: WorkbookClipboard = { ...copyState.clipboard!, type: 'cut' };
      storeGlobalClipboard(cutClipboard);
      return {
        ...copyState,
        clipboard: cutClipboard,
      };
    }

    case 'PASTE': {
      const clipboardToUse = getPasteClipboard(state);
      if (!clipboardToUse?.data) return state;

      const sourceRange = clipboardToUse.sourceRange;
      const canClearCutSource =
        clipboardToUse.sourceWorkbookId === (state.workbookId ?? null) && !!sourceRange;
      const isCut = clipboardToUse.type === 'cut' && canClearCutSource;
      let nextSheets = { ...state.sheets };

      if (isCut && sourceRange) {
        const sourceSheet = state.sheets[sourceRange.sheetId];
        if (sourceSheet) {
          nextSheets[sourceRange.sheetId] = singleSheetReducer(sourceSheet, {
            type: 'CLEAR_RANGE',
            start: sourceRange.start,
            end: sourceRange.end,
          } as any);
        }
      }

      const targetSheet = nextSheets[state.activeSheetId];
      const pastedTargetSheet = singleSheetReducer(targetSheet, {
        type: 'PASTE_CONTENT',
        data: clipboardToUse.data,
      } as any);

      const nextClipboard = isCut ? null : clipboardToUse;
      if (isCut) {
        storeGlobalClipboard(null);
      } else {
        storeGlobalClipboard(clipboardToUse);
      }

      window.hasUnsavedChanges = true;
      window.currentEditingSheet = state.activeSheetId;
      window.sheetHasUnsavedChanges = true;

      return {
        ...state,
        sheets: {
          ...nextSheets,
          [state.activeSheetId]: pastedTargetSheet,
        },
        clipboard: nextClipboard,
      };
    }

    case 'CLEAR_CLIPBOARD':
      storeGlobalClipboard(null);
      return {
        ...state,
        clipboard: null,
      };

    case 'LOAD_WORKBOOK':
      return {
        ...action.payload,
        clipboard: getPasteClipboard(state),
      };

    default: {
      const activeSheet = state.sheets[state.activeSheetId];
      const newSheetState = singleSheetReducer(activeSheet, action);
      if (newSheetState === activeSheet) return state;

      if (
        action.type === 'SET_CELL' ||
        action.type === 'PASTE_CONTENT' ||
        action.type === 'CLEAR_RANGE' ||
        action.type === 'UNDO' ||
        action.type === 'REDO'
      ) {
        window.hasUnsavedChanges = true;
        window.currentEditingSheet = state.activeSheetId;
        window.sheetHasUnsavedChanges = true;
      }

      return {
        ...state,
        sheets: {
          ...state.sheets,
          [state.activeSheetId]: newSheetState,
        },
      };
    }
  }
};

type AppToast = {
  message: string;
  tone: 'success' | 'error';
};

type AppView = 'workbook' | 'user-management' | 'my-profile';
interface AppProps {
  currentUser: AuthSession;
  onLogout: () => void;
  onSessionUpdate: (updates: Partial<AuthSession>) => void;
}

const App: React.FC<AppProps> = ({ currentUser, onLogout, onSessionUpdate }) => {
  const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5278/api';
  const [state, dispatch] = useReducer(workbookReducer, initialWorkbookState);
  const [activeTool, setTool] = useState<'none' | 'draw_border' | 'draw_grid' | 'eraser'>('none');
  const [activeLineColor, setLineColor] = useState<string>('#000000');
  const [activeLineStyle, setLineStyle] = useState<BorderType>('thin');
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [toast, setToast] = useState<AppToast | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [files, setFiles] = useState<WorkbookListItem[]>([]);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [reopenOpenModalAfterShare, setReopenOpenModalAfterShare] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isUnsavedWarningOpen, setIsUnsavedWarningOpen] = useState(false);
  const [pendingFileOpenId, setPendingFileOpenId] = useState<string | null>(null);
  const [isSavingBeforeOpen, setIsSavingBeforeOpen] = useState(false);
  const [isSaveAsForNewFile, setIsSaveAsForNewFile] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<AppView>('workbook');
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [isUserListLoading, setIsUserListLoading] = useState(false);
  const [userListError, setUserListError] = useState<string | null>(null);
  const [updatingUserStatusId, setUpdatingUserStatusId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [updatingManagedUserId, setUpdatingManagedUserId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<MyProfileData | null>(null);
  const [isMyProfileLoading, setIsMyProfileLoading] = useState(false);
  const [myProfileError, setMyProfileError] = useState<string | null>(null);
  const [isMyProfileSaving, setIsMyProfileSaving] = useState(false);
  const [requiresFullWorkbookSave, setRequiresFullWorkbookSave] = useState(false);
  const [shareTargetWorkbook, setShareTargetWorkbook] = useState<WorkbookListItem | null>(null);
  const [shareMode, setShareMode] = useState<'copy' | 'live' | null>(null);
  const [shareableUsers, setShareableUsers] = useState<ShareableUser[]>([]);
  const [isShareableUsersLoading, setIsShareableUsersLoading] = useState(false);
  const [shareModalError, setShareModalError] = useState<string | null>(null);
  const [isSubmittingShare, setIsSubmittingShare] = useState(false);
  const [loadedWorkbookUpdatedAt, setLoadedWorkbookUpdatedAt] = useState<string | null>(null);
  const [isLiveCollaborationEnabled, setIsLiveCollaborationEnabled] = useState(false);
  const [isGridEditing, setIsGridEditing] = useState(false);
  const [lastLocalEditAt, setLastLocalEditAt] = useState(0);
  const workbookStateRef = useRef(state);
  const pendingCellChangesRef = useRef<Record<string, Record<string, PersistedCellPayload>>>({});
  const loadedWorksheetWindowsRef = useRef<Record<string, Array<{ startRow: number; endRow: number }>>>({});
  const inFlightWorksheetWindowsRef = useRef<Record<string, Set<string>>>({});
  const [visibleRowWindow, setVisibleRowWindow] = useState<VisibleRowWindow>({ startRow: 0, endRow: 200 });
  const [sheetFilters, setSheetFilters] = useState<Record<string, SheetFilterState>>({});
  const [showFilterError, setShowFilterError] = useState(false);

  const activeSheet = state.sheets[state.activeSheetId];
  const filterCacheKey = `${state.workbookId || 'local'}_${state.activeSheetId}`;
  const activeSheetFilter = sheetFilters[filterCacheKey] ?? {
    enabled: false,
    range: null,
    columns: {},
    sort: null,
  };

  const selectionStats = useMemo(() => {
    if (activeView !== 'workbook' || !activeSheet.selection.start || !activeSheet.selection.end) {
      return null;
    }

    const { startCol, endCol, startRow, endRow } = getRangeCoords(
      activeSheet.selection.start,
      activeSheet.selection.end
    );

    // Hide if only one cell is selected (Excel behavior)
    if (startCol === endCol && startRow === endRow) {
      return null;
    }

    let count = 0;
    let sum = 0;
    let numericCount = 0;
    let isTimeIncluded = false;

    const isTime = (v: any) => typeof v === 'string' && /^\d{1,2}:\d{2}$/.test(v.trim());
    const timeToMinutes = (v: string) => {
      const [h, m] = v.trim().split(':').map(Number);
      return h * 60 + m;
    };

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const id = coordsToCellId(c, r);
        const cell = activeSheet.cells[id];
        // Prioritize computed result over raw formula/value
        const val = cell?.computed !== undefined ? cell.computed : cell?.value;

        if (val !== null && val !== undefined && val !== '' && String(val).trim() !== '') {
          count++;

          if (isTime(val)) {
          sum += timeToMinutes(String(val));
            numericCount++;
            isTimeIncluded = true;
          } else {
            const num = Number(val);
            // Skip non-numeric strings (like text or #ERROR) in Sum/Avg
            if (!isNaN(num) && typeof val !== 'boolean') {
              sum += num;
              numericCount++;
            }
          }
        }
      }
    }

    if (count === 0) return null;

    return {
      count,
      sum,
      average: numericCount > 0 ? sum / numericCount : null,
      hasNumbers: numericCount > 0,
      isTimeIncluded
    };
  }, [activeSheet.selection, activeSheet.cells, activeView]);

  const minutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
  };
  const activeCellId = activeSheet.selection.active;
  const activeCellData = activeCellId ? activeSheet.cells[activeCellId] : undefined;
  const copiedRange =
    state.clipboard?.sourceWorkbookId === (state.workbookId ?? null) &&
      state.clipboard?.sourceRange?.sheetId === state.activeSheetId
      ? {
        start: state.clipboard.sourceRange.start,
        end: state.clipboard.sourceRange.end,
      }
      : null;

  useEffect(() => {
    workbookStateRef.current = state;
  }, [state]);


  const isNewUnsavedWorkbook = isDirty && !state.workbookId;
  const showSuccessToast = (message: string) => setToast({ message, tone: 'success' });
  const showErrorToast = (message: string) => setToast({ message, tone: 'error' });

  const updateActiveSheetFilter = (
    updater: (current: SheetFilterState) => SheetFilterState
  ) => {
    setSheetFilters((current) => {
      const existing = current[filterCacheKey] ?? {
        enabled: false,
        range: null,
        columns: {},
        sort: null,
      };
      return {
        ...current,
        [filterCacheKey]: updater(existing),
      };
    });
  };

  const handleToggleFilter = useCallback(() => {
    updateActiveSheetFilter((current) => {
      if (current.enabled) {
        return { enabled: false, range: null, columns: {}, sort: null };
      }

      const startId = activeSheet.selection.start ?? activeSheet.selection.active;
      const endId = activeSheet.selection.end ?? activeSheet.selection.active;
      if (!startId || !endId) {
        return { enabled: false, range: null, columns: {}, sort: null };
      }

      let { startCol, endCol, startRow, endRow } = getRangeCoords(startId, endId);
      const isSingleCell = startCol === endCol && startRow === endRow;

      const isCellEmptyAt = (c: number, r: number) => {
        const id = coordsToCellId(c, r);
        const cell = activeSheet.cells[id];
        return !cell?.value || cell.value.trim() === '';
      };

      const isRowEmptyInRange = (r: number, scIndex: number, ecIndex: number) => {
        for (let c = scIndex; c <= ecIndex; c++) {
          if (!isCellEmptyAt(c, r)) return false;
        }
        return true;
      };

      const isColEmptyInRange = (c: number, srIndex: number, erIndex: number) => {
        for (let r = srIndex; r <= erIndex; r++) {
          if (!isCellEmptyAt(c, r)) return false;
        }
        return true;
      };

      if (isSingleCell) {
        // Expand to current region
        let changed = true;
        const maxIter = 1000; // safety
        let iters = 0;
        while (changed && iters < maxIter) {
          changed = false;
          iters++;

          // Up
          if (startRow > 0 && !isRowEmptyInRange(startRow - 1, startCol, endCol)) {
            startRow--;
            changed = true;
          }
          // Down
          if (endRow < 2000 && !isRowEmptyInRange(endRow + 1, startCol, endCol)) {
            endRow++;
            changed = true;
          }
          // Left
          if (startCol > 0 && !isColEmptyInRange(startCol - 1, startRow, endRow)) {
            startCol--;
            changed = true;
          }
          // Right
          if (endCol < 1000 && !isColEmptyInRange(endCol + 1, startRow, endRow)) {
            endCol++;
            changed = true;
          }
        }
      }

      // Truncate based on continuity rule
      let finalEndRow = startRow;
      for (let r = startRow + 1; r <= endRow; r++) {
        if (isRowEmptyInRange(r, startCol, endCol)) {
          break;
        }
        finalEndRow = r;
      }

      // Validation: After expansion and truncation, check if the range is valid
      const isRangeEmpty = isRowEmptyInRange(startRow, startCol, endCol) &&
        (finalEndRow === startRow || isRowEmptyInRange(finalEndRow, startCol, endCol));

      // Better validation: Check if ANY cell in the header row or first data row has content
      let hasData = false;
      for (let r = startRow; r <= finalEndRow; r++) {
        if (!isRowEmptyInRange(r, startCol, endCol)) {
          hasData = true;
          break;
        }
      }

      if (!hasData) {
        setShowFilterError(true);
        return current; // Don't change anything
      }

      return {
        enabled: true,
        range: {
          headerRow: startRow,
          startRow: startRow + 1,
          endRow: finalEndRow,
          startCol,
          endCol,
        },
        columns: {},
        sort: null,
      };
    });
  }, [activeSheet.selection, activeSheet.cells, filterCacheKey]);

  const handleTabNavigation = useCallback((shift: boolean) => {
    if (isGridEditing || activeView !== 'workbook') return;

    const { start, end, active } = activeSheet.selection;
    if (!start || !end || !active) return;

    const isRange = start !== end;
    const { startCol, endCol, startRow, endRow } = isRange
      ? getRangeCoords(start, end)
      : { startCol: 0, endCol: 25, startRow: 0, endRow: 999 };

    const activeCoords = cellIdToCoords(active);
    let nextCol, nextRow;

    if (!shift) {
      // Tab
      if (activeCoords.col < endCol) {
        nextCol = activeCoords.col + 1;
        nextRow = activeCoords.row;
      } else {
        nextCol = startCol;
        nextRow = activeCoords.row < endRow ? activeCoords.row + 1 : startRow;
      }
    } else {
      // Shift + Tab
      if (activeCoords.col > startCol) {
        nextCol = activeCoords.col - 1;
        nextRow = activeCoords.row;
      } else {
        nextCol = endCol;
        nextRow = activeCoords.row > startRow ? activeCoords.row - 1 : endRow;
      }
    }

    const nextId = coordsToCellId(nextCol, nextRow);

    if (!isRange) {
      dispatch({ type: 'SELECT_CELL', id: nextId });
    } else {
      dispatch({ type: 'SELECT_RANGE', end, active: nextId });
    }
  }, [activeSheet.selection, isGridEditing, activeView]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Shift + L
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleToggleFilter();
      }

      // Tab / Shift + Tab
      if (e.key === 'Tab') {
        if (!isGridEditing) {
          e.preventDefault();
          handleTabNavigation(e.shiftKey);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleToggleFilter, handleTabNavigation, isGridEditing]);

  const handleClearAllFilters = () => {
    updateActiveSheetFilter((current) => ({ ...current, columns: {}, sort: null }));
  };

  const handleUpdateColumnFilter = (column: number, nextFilter: ColumnFilterConfig | null) => {
    updateActiveSheetFilter((current) => {
      const nextColumns = { ...current.columns };
      if (nextFilter) nextColumns[column] = nextFilter;
      else delete nextColumns[column];
      return {
        ...current,
        columns: nextColumns,
      };
    });
  };

  const handleClearColumnFilter = (column: number) => {
    updateActiveSheetFilter((current) => {
      const nextColumns = { ...current.columns };
      delete nextColumns[column];
      const nextSort =
        current.sort?.column === column
          ? null
          : current.sort;
      return {
        ...current,
        columns: nextColumns,
        sort: nextSort,
      };
    });
  };

  const handleSetSort = (nextSort: FilterSortConfig | null) => {
    updateActiveSheetFilter((current) => ({
      ...current,
      sort: nextSort,
    }));
  };

  useEffect(() => {
    ensureGlobalClipboard();
    if (typeof window.sheetHasUnsavedChanges !== 'boolean') {
      window.sheetHasUnsavedChanges = false;
    }
    if (typeof window.hasUnsavedChanges !== 'boolean') {
      window.hasUnsavedChanges = false;
    }
    if (window.currentEditingSheet === undefined) {
      window.currentEditingSheet = null;
    }
  }, []);

  useEffect(() => {
    window.sheetHasUnsavedChanges = isDirty;
    window.hasUnsavedChanges = isDirty;
    if (!isDirty) {
      window.currentEditingSheet = null;
    }
  }, [isDirty]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const trackedDispatch = (action: SheetAction) => {
    if (persistenceChangingActionTypes.has(action.type) || structuralPersistenceActionTypes.has(action.type)) {
      const nextState = workbookReducer(state, action);

      if (persistenceChangingActionTypes.has(action.type)) {
        queueChangedCellsForSheet(
          state.activeSheetId,
          state.sheets[state.activeSheetId]?.cells || {},
          nextState.sheets[nextState.activeSheetId]?.cells || {},
        );
      } else if (structuralPersistenceActionTypes.has(action.type)) {
        setRequiresFullWorkbookSave(true);
      }

      if (hasWorkbookCellValueChanges(state, nextState) || persistenceChangingActionTypes.has(action.type) || structuralPersistenceActionTypes.has(action.type)) {
        setIsDirty(true);
        setLastLocalEditAt(Date.now());
        window.currentEditingSheet = state.activeSheetId;
        window.hasUnsavedChanges = true;
        window.sheetHasUnsavedChanges = true;
      }
    }
    dispatch(action);
  };

  useEffect(() => {
    const handleCopyCut = (e: ClipboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const { start, end } = activeSheet.selection;
      if (!start || !end) return;

      const { startCol, endCol, startRow, endRow } = getRangeCoords(start, end);
      const data: ClipboardItem[][] = [];

      for (let r = startRow; r <= endRow; r++) {
        const rowData: ClipboardItem[] = [];
        for (let c = startCol; c <= endCol; c++) {
          const id = coordsToCellId(c, r);
          const cell = activeSheet.cells[id];
          // Use computed result for copying to match Excel "value" behavior
          const valueToCopy = cell?.computed !== undefined ? String(cell.computed) : (cell?.value || '');
          rowData.push({
            value: valueToCopy,
            style: cell?.style,
          });
        }
        data.push(rowData);
      }

      dispatch({ type: e.type === 'cut' ? 'CUT' : 'COPY' });

      const text = data.map((row) => row.map((cell) => cell.value).join('\t')).join('\n');
      e.clipboardData?.setData('text/plain', text);
      e.clipboardData?.setData('application/x-excel-clone', 'internal');
      e.preventDefault();
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const internalMarker = clipboardData.getData('application/x-excel-clone');
      const text = clipboardData.getData('text/plain');

      if (internalMarker === 'internal') {
        e.preventDefault();
        trackedDispatch({ type: 'PASTE' });
        return;
      }

      if (text && text.trim().length > 0) {
        e.preventDefault();
        const rows = text.replace(/\r/g, '').split('\n').filter((r) => r.length > 0);
        const pastedData: ClipboardItem[][] = rows.map((row) =>
          row.split('\t').map((value) => ({ value, style: undefined })),
        );

        trackedDispatch({
          type: 'PASTE_CONTENT',
          data: pastedData,
        });
        return;
      }

      if (state.clipboard?.data?.length) {
        e.preventDefault();
        trackedDispatch({ type: 'PASTE' });
        return;
      }

      if (window.sheetClipboard?.data?.length) {
        e.preventDefault();
        trackedDispatch({ type: 'PASTE' });
      }
    };

    window.addEventListener('copy', handleCopyCut);
    window.addEventListener('cut', handleCopyCut);
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('copy', handleCopyCut);
      window.removeEventListener('cut', handleCopyCut);
      window.removeEventListener('paste', handlePaste);
    };
  }, [activeSheet, state.clipboard, state]);

  useEffect(() => {
    fetchAllFiles();
  }, [currentUser.token]);

  useEffect(() => {
    if (activeView !== 'user-management') {
      return;
    }

    fetchManagedUsers();
  }, [activeView]);

  useEffect(() => {
    if (activeView !== 'my-profile') {
      return;
    }

    void fetchMyProfile();
  }, [activeView]);

  useEffect(() => {
    if (activeView !== 'workbook') {
      return;
    }

    void fetchWorksheetWindow(state.activeSheetId, visibleRowWindow.startRow, visibleRowWindow.endRow);
  }, [activeView, state.activeSheetId, state.worksheetIds, visibleRowWindow.endRow, visibleRowWindow.startRow]);

  useEffect(() => {
    if (
      activeView !== 'workbook' ||
      !isLiveCollaborationEnabled ||
      !state.workbookId ||
      !currentFileName ||
      !isDirty ||
      isGridEditing ||
      document.hidden
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void syncLiveWorkbook();
    }, LIVE_SYNC_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [activeView, currentFileName, isDirty, isGridEditing, isLiveCollaborationEnabled, state, state.workbookId, requiresFullWorkbookSave]);

  useEffect(() => {
    if (activeView !== 'workbook' || !isLiveCollaborationEnabled || !state.workbookId || isGridEditing) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (!document.hidden && !isDirty && !isGridEditing) {
        void refreshLiveWorkbook();
      }
    }, LIVE_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [activeView, isDirty, isGridEditing, isLiveCollaborationEnabled, loadedWorkbookUpdatedAt, state.workbookId]);

  const getAuthorizedHeaders = (contentType = false): HeadersInit => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${currentUser.token}`,
    };

    if (contentType) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  };

  const resetPendingWorkbookPersistence = () => {
    pendingCellChangesRef.current = {};
    setRequiresFullWorkbookSave(false);
  };

  const resetLoadedWorksheetWindows = () => {
    loadedWorksheetWindowsRef.current = {};
    inFlightWorksheetWindowsRef.current = {};
  };

  const isWorksheetWindowCovered = (sheetId: string, startRow: number, endRow: number) =>
    (loadedWorksheetWindowsRef.current[sheetId] ?? []).some(
      (window) => window.startRow <= startRow && window.endRow >= endRow,
    );

  const markWorksheetWindowLoaded = (sheetId: string, startRow: number, endRow: number) => {
    const windows = [...(loadedWorksheetWindowsRef.current[sheetId] ?? []), { startRow, endRow }]
      .sort((a, b) => a.startRow - b.startRow);

    const merged: Array<{ startRow: number; endRow: number }> = [];
    for (const window of windows) {
      const lastWindow = merged[merged.length - 1];
      if (!lastWindow || window.startRow > lastWindow.endRow + 1) {
        merged.push({ ...window });
      } else {
        lastWindow.endRow = Math.max(lastWindow.endRow, window.endRow);
      }
    }

    loadedWorksheetWindowsRef.current[sheetId] = merged;
  };

  const buildSheetStateFromCells = (
    baseSheet: SheetState,
    cells: Record<CellId, CellData>,
    startRow?: number,
    endRow?: number,
  ): SheetState => {
    const recalculated = recalculateGrid(cells);
    const nextRowHeights = { ...baseSheet.rowHeights };

    const rowsToUpdate = new Set<number>();
    if (startRow !== undefined && endRow !== undefined) {
      for (let row = startRow; row <= endRow; row++) {
        rowsToUpdate.add(row);
      }
    } else {
      Object.keys(recalculated).forEach((cellId) => {
        rowsToUpdate.add(cellIdToCoords(cellId).row);
      });
    }

    rowsToUpdate.forEach((row) => {
      nextRowHeights[row] = getAutoRowHeight(recalculated, row, baseSheet.columnWidths);
    });

    return {
      ...baseSheet,
      cells: recalculated,
      rowHeights: nextRowHeights,
    };
  };

  const mergeWorksheetWindowIntoState = (
    currentState: WorkbookState,
    sheetName: string,
    window: WorksheetWindowResponse,
  ): WorkbookState => {
    const currentSheet = currentState.sheets[sheetName] ?? createEmptySheet();
    const mergedCells: Record<CellId, CellData> = { ...currentSheet.cells };

    Object.keys(mergedCells).forEach((cellId) => {
      const { row } = cellIdToCoords(cellId);
      if (row >= window.startRow && row <= window.endRow) {
        delete mergedCells[cellId];
      }
    });

    window.cells.forEach((cell) => {
      const id = coordsToCellId(Number(cell.column ?? 0), Number(cell.row ?? 0));
      mergedCells[id] = {
        id,
        value: normalizeCellValue(cell.value),
        style: cell.styleJson ? JSON.parse(cell.styleJson) : undefined,
      };
    });

    Object.entries(pendingCellChangesRef.current[sheetName] ?? {}).forEach(([cellId, cell]) => {
      const pendingCell = cell as PersistedCellPayload;
      mergedCells[cellId] = {
        id: cellId,
        value: normalizeCellValue(pendingCell.value),
        style: pendingCell.styleJson ? JSON.parse(pendingCell.styleJson) : undefined,
      };
    });

    return {
      ...currentState,
      sheets: {
        ...currentState.sheets,
        [sheetName]: buildSheetStateFromCells(currentSheet, mergedCells, window.startRow, window.endRow),
      },
    };
  };

  const queueChangedCellsForSheet = (
    sheetId: string,
    previousCells: Record<CellId, CellData>,
    nextCells: Record<CellId, CellData>,
  ) => {
    const changedCellIds = new Set([
      ...Object.keys(previousCells),
      ...Object.keys(nextCells),
    ]);

    const nextPendingChanges = { ...pendingCellChangesRef.current };
    const sheetPendingChanges = { ...(nextPendingChanges[sheetId] ?? {}) };

    changedCellIds.forEach((cellId) => {
      if (getCellPersistenceSignature(previousCells[cellId]) === getCellPersistenceSignature(nextCells[cellId])) {
        return;
      }

      sheetPendingChanges[cellId] = buildPersistedCellPayload(cellId, nextCells[cellId]);
    });

    if (Object.keys(sheetPendingChanges).length === 0) {
      delete nextPendingChanges[sheetId];
    } else {
      nextPendingChanges[sheetId] = sheetPendingChanges;
    }

    pendingCellChangesRef.current = nextPendingChanges;
  };

  const getPendingWorksheetCellPatches = (): WorksheetCellPatchPayload[] =>
    Object.entries(pendingCellChangesRef.current)
      .map(([sheetId, cellsById]) => ({
        name: sheetId,
        cells: Object.values(cellsById),
      }))
      .filter((worksheet) => worksheet.cells.length > 0);

  const fetchAllFiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/workbooks`, {
        headers: getAuthorizedHeaders(),
      });
      if (res.ok) {
        const data: WorkbookListItem[] = await res.json();
        setFiles(data);
      }
    } catch (e) {
      console.error('Failed to fetch files', e);
    }
  };

  const fetchManagedUsers = async () => {
    setIsUserListLoading(true);
    setUserListError(null);

    try {
      const response = await fetch(`${API_BASE}/Users`, {
        headers: getAuthorizedHeaders(),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load users.');
      }

      const users = (await response.json()) as ManagedUser[];
      setManagedUsers(users);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load users.';
      setUserListError(message);
    } finally {
      setIsUserListLoading(false);
    }
  };

  const fetchMyProfile = async () => {
    setIsMyProfileLoading(true);
    setMyProfileError(null);

  try {
    // ✅ FIXED FETCH
const response = await fetch("http://localhost:3000/api/zeaatlas/me", {
  credentials: "include",
});

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Failed to load your profile.");
    }

    // ✅ GET RESPONSE
const result = await response.json();

console.log("PROFILE API:", result);

// ✅ FIX TYPE
const profile = (result as any).data;

// ✅ SET DIRECTLY
setMyProfile(profile);

  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load your profile.";

    setMyProfileError(message);
  } finally {
    setIsMyProfileLoading(false);
  }
};

  const fetchWorksheetWindow = async (sheetName: string, requestedStartRow: number, requestedEndRow: number) => {
    const currentWorkbookState = workbookStateRef.current;
    if (!currentWorkbookState.workbookId) {
      return;
    }

    const worksheetId = currentWorkbookState.worksheetIds?.[sheetName];
    if (!worksheetId) {
      return;
    }

    const startRow = Math.max(0, requestedStartRow - WORKSHEET_WINDOW_PADDING);
    const endRow = requestedEndRow + WORKSHEET_WINDOW_PADDING;

    if (isWorksheetWindowCovered(sheetName, startRow, endRow)) {
      return;
    }

    const windowKey = `${startRow}:${endRow}`;
    const inFlightWindows = inFlightWorksheetWindowsRef.current[sheetName] ?? new Set<string>();
    if (inFlightWindows.has(windowKey)) {
      return;
    }

    inFlightWindows.add(windowKey);
    inFlightWorksheetWindowsRef.current[sheetName] = inFlightWindows;

    try {
      const response = await fetch(
        `${API_BASE}/Workbooks/worksheet/${worksheetId}?startRow=${startRow}&endRow=${endRow}`,
        { headers: getAuthorizedHeaders() },
      );

      if (!response.ok) {
        return;
      }

      const windowData = (await response.json()) as WorksheetWindowResponse;
      dispatch({
        type: 'LOAD_WORKBOOK',
        payload: mergeWorksheetWindowIntoState(
          {
            ...workbookStateRef.current,
            workbookId: windowData.workbookId,
          },
          sheetName,
          windowData,
        ),
      });
      markWorksheetWindowLoaded(sheetName, windowData.startRow, windowData.endRow);
      setLoadedWorkbookUpdatedAt(windowData.workbookUpdatedAt);
    } catch (error) {
      console.error('Worksheet window fetch failed', error);
    } finally {
      inFlightWindows.delete(windowKey);
    }
  };

  const fetchShareableUsers = async () => {
    setIsShareableUsersLoading(true);
    setShareModalError(null);

    try {
      const response = await fetch(`${API_BASE}/Users`, {
        headers: getAuthorizedHeaders(),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load users.');
      }

      const users = (await response.json()) as ShareableUser[];
      setShareableUsers(
        users.filter((user) => user.id !== currentUser.id && (user.role === 'User' || user.role === 'Manager')),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load users.';
      setShareModalError(message);
    } finally {
      setIsShareableUsersLoading(false);
    }
  };

  const loadWorkbook = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/Workbooks/${id}`, {
        headers: getAuthorizedHeaders(),
      });
      if (!res.ok) throw new Error('Failed to load');
      const workbook = await res.json();
      console.log('Loaded:', workbook?.worksheets?.flatMap((ws: any) => ws?.cells ?? []) ?? []);
      const newState = convertWorkbookToState(workbook);
      dispatch({ type: 'LOAD_WORKBOOK', payload: newState });
      resetPendingWorkbookPersistence();
      resetLoadedWorksheetWindows();
      newState.sheetOrder.forEach((sheetId) => markWorksheetWindowLoaded(sheetId, 0, 200));
      setCurrentFileName(workbook.name || 'Unnamed');
      setIsDirty(false);
      setLoadedWorkbookUpdatedAt((workbook.updatedAt as string) || null);
      setIsLiveCollaborationEnabled(Boolean(workbook.isLiveCollaborationEnabled));
      showSuccessToast('Workbook loaded');
      setIsOpenModalOpen(false);
      setActiveView('workbook');
    } catch (e) {
      console.error('Load error:', e);
      showErrorToast('Error loading workbook');
    }
  };

  const refreshLiveWorkbook = async () => {
    const currentWorkbookState = workbookStateRef.current;
    if (!currentWorkbookState.workbookId) {
      return;
    }

    if (Date.now() - lastLocalEditAt < 3000) {
      return;
    }

    try {
      const worksheetId = currentWorkbookState.worksheetIds?.[currentWorkbookState.activeSheetId];
      if (!worksheetId) {
        return;
      }

      const response = await fetch(
        `${API_BASE}/Workbooks/worksheet/${worksheetId}?startRow=${visibleRowWindow.startRow}&endRow=${visibleRowWindow.endRow}`,
        { headers: getAuthorizedHeaders() },
      );

      if (!response.ok) {
        return;
      }

      const windowData = (await response.json()) as WorksheetWindowResponse;
      if (!windowData.workbookUpdatedAt || windowData.workbookUpdatedAt === loadedWorkbookUpdatedAt) {
        return;
      }

      dispatch({
        type: 'LOAD_WORKBOOK',
        payload: mergeWorksheetWindowIntoState(workbookStateRef.current, currentWorkbookState.activeSheetId, windowData),
      });
      markWorksheetWindowLoaded(currentWorkbookState.activeSheetId, windowData.startRow, windowData.endRow);
      setLoadedWorkbookUpdatedAt(windowData.workbookUpdatedAt);
    } catch (error) {
      console.error('Live refresh failed', error);
    }
  };

  const convertWorkbookToState = (workbook: any): WorkbookState => {
    const sheets: Record<string, SheetState> = {};
    const sheetOrder: string[] = [];
    const worksheetIds: Record<string, string> = {};

    if (!workbook.worksheets || !Array.isArray(workbook.worksheets)) {
      return {
        sheets: { 'Sheet1': createEmptySheet() },
        sheetOrder: ['Sheet1'],
        activeSheetId: 'Sheet1',
        clipboard: null,
        workbookId: workbook.id,
        worksheetIds: {},
      };
    }

    const sortedWorksheets = [...workbook.worksheets].sort((a: any, b: any) => {
      const numA = parseInt((a.name || '').replace('Sheet', '')) || 0;
      const numB = parseInt((b.name || '').replace('Sheet', '')) || 0;
      return numA - numB;
    });

    sortedWorksheets.forEach((ws: any) => {
      const sheetName = ws.name || 'Sheet1';
      sheetOrder.push(sheetName);
      if (ws.id) {
        worksheetIds[sheetName] = ws.id;
      }

      const cells: Record<CellId, CellData> = {};

      if (ws.cells && Array.isArray(ws.cells)) {
        ws.cells.forEach((cell: any) => {
          const col = Number(cell.column ?? 0);
          const row = Number(cell.row ?? 0);
          const id = coordsToCellId(col, row);

          cells[id] = {
            id,
            value: normalizeCellValue(cell.value),
            style: cell.styleJson ? JSON.parse(cell.styleJson) : undefined,
          };
        });
      }

      const recalculated = recalculateGrid(cells);

      const rowHeights: Record<number, number> = {};
      const rows = new Set<number>(
        Object.values(cells).map((c) => cellIdToCoords(c.id).row)
      );

      rows.forEach((r) => {
        rowHeights[r] = getAutoRowHeight(recalculated, r, {});
      });

      sheets[sheetName] = {
        cells: recalculated,
        columnWidths: {},
        rowHeights,
        selection: { start: 'A1', end: 'A1', active: 'A1' },
        undoStack: [],
        redoStack: [],
      };
    });

    if (sheetOrder.length === 0 || !sheets[sheetOrder[0]]) {
      sheets.Sheet1 = createEmptySheet();
      sheetOrder.splice(0, sheetOrder.length, 'Sheet1');
    }

    return {
      sheets,
      sheetOrder: sheetOrder.length > 0 ? sheetOrder : ['Sheet1'],
      activeSheetId: sheetOrder[0] || 'Sheet1',
      clipboard: null,
      workbookId: workbook.id,
      worksheetIds,
    };
  };

  const convertStateToDto = (nameOverride?: string) => ({
    name: nameOverride || currentFileName || 'Untitled',
    worksheets: state.sheetOrder.map((sheetId) => {
      const sheet = state.sheets[sheetId];
      const cells = Object.values(sheet.cells)
        .filter((cell: CellData) => hasPersistedCellContent(cell))
        .map((cell: CellData) => {
          const { col, row } = cellIdToCoords(cell.id);
          return {
            row,
            column: col,
            value: normalizeCellValue(cell.value),
            styleJson: cell.style ? JSON.stringify(cell.style) : null,
          };
        });
      return { name: sheetId, cells };
    }),
  });

  const patchWorkbookCells = async (): Promise<boolean> => {
    if (!state.workbookId) {
      return false;
    }

    const worksheets = getPendingWorksheetCellPatches();
    if (worksheets.length === 0) {
      return true;
    }

    const response = await fetch(`${API_BASE}/Workbooks/${state.workbookId}/cells`, {
      method: 'PATCH',
      headers: {
  "Content-Type": "application/json"
},
      body: JSON.stringify({ worksheets }),
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json();
    resetPendingWorkbookPersistence();
    setIsDirty(false);
    setLastLocalEditAt(Date.now());
    setLoadedWorkbookUpdatedAt((payload.updatedAt as string) || new Date().toISOString());
    return true;
  };

  const saveCurrentWorkbook = async (): Promise<boolean> => {
    try {
      if (!requiresFullWorkbookSave) {
        const patched = await patchWorkbookCells();
        if (patched) {
          showSuccessToast('Saved successfully');
          return true;
        }
      }

      if (state.workbookId && currentFileName) {
        const res = await fetch(`${API_BASE}/Workbooks/${state.workbookId}`, {
          method: 'PUT',
          headers: getAuthorizedHeaders(true),
          body: JSON.stringify(convertStateToDto()),
        });

        if (!res.ok) {
          showErrorToast('Failed to save');
          return false;
        }

        const payload = await res.json();
        resetPendingWorkbookPersistence();
        setIsDirty(false);
        setLastLocalEditAt(Date.now());
        setLoadedWorkbookUpdatedAt((payload.updatedAt as string) || new Date().toISOString());
        showSuccessToast('Saved successfully');
        return true;
      }

      return false;
    } catch (e) {
      console.error('Save error:', e);
      showErrorToast('Connection error');
      return false;
    }
  };

  const syncLiveWorkbook = async () => {
    if (!state.workbookId || !currentFileName) {
      return;
    }

    try {
      if (!requiresFullWorkbookSave) {
        const patched = await patchWorkbookCells();
        if (patched) {
          return;
        }
      }

      const response = await fetch(`${API_BASE}/Workbooks/${state.workbookId}`, {
        method: 'PUT',
        headers: getAuthorizedHeaders(true),
        body: JSON.stringify(convertStateToDto()),
      });

      if (!response.ok) {
        throw new Error('Live sync failed');
      }

      const payload = await response.json();
      resetPendingWorkbookPersistence();
      setIsDirty(false);
      setLastLocalEditAt(Date.now());
      setLoadedWorkbookUpdatedAt((payload.updatedAt as string) || new Date().toISOString());
    } catch (error) {
      console.error('Live sync failed', error);
    }
  };

  const handleSheetSwitchRequest = (sheetId: string) => {
    if (sheetId === state.activeSheetId) return;
    dispatch({ type: 'SWITCH_SHEET', id: sheetId });
  };

  const handleToolbarPaste = async () => {
    const clipboardToUse = getPasteClipboard(workbookStateRef.current);
    try {
      const text = await navigator.clipboard.readText();
      if (!text || text.trim().length === 0) {
        if (clipboardToUse?.data?.length) {
          trackedDispatch({ type: 'PASTE' });
        }
        return;
      }

      const normalizedText = text.replace(/\r/g, '');
      const internalClipboardText = clipboardToUse?.data
        ?.map((row) => row.map((cell) => cell.value).join('\t'))
        .join('\n');

      if (clipboardToUse?.data?.length && internalClipboardText === normalizedText) {
        trackedDispatch({ type: 'PASTE' });
        return;
      }

      const pastedData: ClipboardItem[][] = normalizedText
        .split('\n')
        .filter((row) => row.length > 0)
        .map((row) => row.split('\t').map((value) => ({ value, style: undefined })));

      trackedDispatch({
        type: 'PASTE_CONTENT',
        data: pastedData,
      });
    } catch (error) {
      if (clipboardToUse?.data?.length) {
        trackedDispatch({ type: 'PASTE' });
        return;
      }
      console.error('Toolbar paste failed', error);
      showErrorToast('Paste failed');
    }
  };

  const handleFileAction = (action: 'save' | 'save_as' | 'new' | 'open' | 'share') => {
    if (action === 'new') {
      if (isDirty && !window.confirm('You have unsaved changes in this workbook. Are you sure you want to create a new one?')) return;
      dispatch({ type: 'RESET_WORKBOOK' });
      resetPendingWorkbookPersistence();
      resetLoadedWorksheetWindows();
      setCurrentFileName(null);
      setIsDirty(false);
      showSuccessToast('New workbook created');
    } else if (action === 'open') {
      if (isDirty) {
        setIsUnsavedWarningOpen(true);
        return;
      }
      setIsOpenModalOpen(true);
    } else if (action === 'save_as') {
      setIsSaveModalOpen(true);
    } else if (action === 'save') {
      if (state.workbookId && currentFileName) {
        saveCurrentWorkbook();
      } else {
        setIsSaveModalOpen(true);
      }
    } else if (action === 'share') {
      if (!state.workbookId) {
        showErrorToast('Please save the workbook first');
        return;
      }
      fetch(`${API_BASE}/Workbooks/${state.workbookId}/share`, {
        method: 'POST',
       headers: {
  "Content-Type": "application/json"
},
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to generate share link');
          return res.json();
        })
        .then((data) => {
          const link = data.shareUrl;
          setShareLink(link);
          navigator.clipboard.writeText(link);
          showSuccessToast('Share link ready! Click Copy link');
        })
        .catch((err) => {
          console.error(err);
          showErrorToast('Failed to create share link');
        });
    }
  };

  const handleConfirmSaveAs = async (baseName: string) => {
    const name = baseName.trim() || 'Untitled';
    const savePayload = convertStateToDto(name);
    console.log('Saving:', savePayload);

    try {
     const res = await fetch(`${API_BASE}/workbooks`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(savePayload),
});

      if (!res.ok) {
        const errorText = await res.text();
        if (res.status === 400 && errorText.includes('File already exists')) {
          showErrorToast('The file name already exists. Please choose a different name.');
        } else {
          throw new Error('Save failed');
        }
        return; // Keep modal open so user can try again
      }

      const id = await res.text().then(text => text.replace(/"/g, ''));

      dispatch({
        type: 'LOAD_WORKBOOK',
        payload: {
          ...state,
          workbookId: id,
        },
      });

      resetPendingWorkbookPersistence();
      resetLoadedWorksheetWindows();
      setCurrentFileName(name);
      setIsDirty(false);
      setIsSaveModalOpen(false);

      if (isSaveAsForNewFile) {
        setIsSaveAsForNewFile(false);
        setIsOpenModalOpen(true);
      }

      showSuccessToast(`Saved as ${name}`);
      fetchAllFiles();
    } catch (err) {
      console.error(err);
      showErrorToast('Error saving file');
    }
  };

  const handleUnsavedWarningSave = () => {
    if (isNewUnsavedWorkbook) {
      setIsSaveAsForNewFile(true);
      setIsSaveModalOpen(true);
      setIsUnsavedWarningOpen(false);
    } else {
      setIsSavingBeforeOpen(true);
      saveCurrentWorkbook().then(saved => {
        setIsSavingBeforeOpen(false);
        if (saved) {
          setIsUnsavedWarningOpen(false);
          setIsOpenModalOpen(true);
        }
      });
    }
  };

  const handleUnsavedDontSave = () => {
    setIsDirty(false);
    window.hasUnsavedChanges = false;
    window.sheetHasUnsavedChanges = false;
    window.currentEditingSheet = null;
    setIsUnsavedWarningOpen(false);
    setIsOpenModalOpen(true);
  };

  const closeUnsavedWarning = () => {
    setIsUnsavedWarningOpen(false);
  };

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const path = window.location.pathname;

    if (path.startsWith('/sheet/')) {
      const token = path.split('/sheet/')[1];

      if (token) {
        fetch(`${API_BASE}/Workbooks/shared/${token}`)
          .then(res => {
            if (!res.ok) throw new Error('Failed to load shared sheet');
            return res.json();
          })
          .then(data => {
            const newState = convertWorkbookToState(data);
            dispatch({ type: 'LOAD_WORKBOOK', payload: newState });
            resetPendingWorkbookPersistence();
            resetLoadedWorksheetWindows();
            newState.sheetOrder.forEach((sheetId) => markWorksheetWindowLoaded(sheetId, 0, 200));
            setCurrentFileName(data.name || 'Shared Sheet');
            setIsDirty(false);
            setLoadedWorkbookUpdatedAt((data.updatedAt as string) || null);
            setIsLiveCollaborationEnabled(false);
          })
          .catch(err => {
            console.error(err);
            showErrorToast('Failed to load shared sheet');
          });
      }
    }
  }, []);

  const createUser = async (formData: CreateUserFormData) => {
    const response = await fetch(`${API_BASE}/Users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentUser.token}`,
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Failed to create user.');
    }

    setIsAddUserModalOpen(false);
    showSuccessToast('User created successfully');
    await fetchManagedUsers();
  };

  const updateUserStatus = async (user: ManagedUser) => {
    setUpdatingUserStatusId(user.id);

    try {
      const nextStatus = user.accountStatus === 'Active' ? 'Inactive' : 'Active';
      const response = await fetch(`${API_BASE}/Users/${user.id}/status`, {
        method: 'PATCH',
        headers: getAuthorizedHeaders(true),
        body: JSON.stringify({ accountStatus: nextStatus }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to update account status.');
      }

      const updatedUser = (await response.json()) as ManagedUser;
      setManagedUsers((currentUsers) =>
        currentUsers.map((currentUser) => (currentUser.id === updatedUser.id ? updatedUser : currentUser)),
      );
      showSuccessToast(`User ${nextStatus === 'Active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update account status.';
      setUserListError(message);
    } finally {
      setUpdatingUserStatusId(null);
    }
  };

  const deleteManagedUser = async (user: ManagedUser) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${user.name}?`)) {
      return;
    }

    setDeletingUserId(user.id);
    setUserListError(null);

    try {
      const response = await fetch(`${API_BASE}/Users/${user.id}`, {
        method: 'DELETE',
        headers: getAuthorizedHeaders(),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to delete user.');
      }

      setManagedUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== user.id));
      showSuccessToast('User deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user.';
      setUserListError(message);
    } finally {
      setDeletingUserId(null);
    }
  };

  const updateManagedUser = async (formData: UpdateUserFormData) => {
    if (!editingUser) {
      return;
    }

    setUpdatingManagedUserId(editingUser.id);
    setUserListError(null);

    const payload: Partial<UpdateUserFormData> = {};

    if (currentUser.role === 'Admin') {
      payload.name = formData.name;
      payload.email = formData.email;
      payload.phoneNumber = formData.phoneNumber;
      payload.employeeId = formData.employeeId;
      payload.department = formData.department;
      payload.role = formData.role;

      if (formData.password) {
        payload.password = formData.password;
      }

      if (formData.role === 'User') {
        payload.managerName = formData.managerName;
      }
    } else if (currentUser.role === 'Manager') {
      payload.name = formData.name;
      payload.email = formData.email;
      payload.phoneNumber = formData.phoneNumber;
      payload.employeeId = formData.employeeId;
      payload.department = formData.department;

      if (formData.password) {
        payload.password = formData.password;
      }
    } else {
      payload.name = formData.name;
      payload.phoneNumber = formData.phoneNumber;
    }

    try {
      const response = await fetch(`${API_BASE}/Users/${editingUser.id}`, {
        method: 'PATCH',
        headers: getAuthorizedHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to update user.');
      }

      const updatedUser = (await response.json()) as ManagedUser;
      setManagedUsers((currentUsers) =>
        currentUsers.map((currentUser) => (currentUser.id === updatedUser.id ? updatedUser : currentUser)),
      );
      setEditingUser(null);
      showSuccessToast('User updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user.';
      setUserListError(message);
      throw error;
    } finally {
      setUpdatingManagedUserId(null);
    }
  };

  const updateMyProfile = async (formData: UpdateMyProfileFormData) => {
    setIsMyProfileSaving(true);
    setMyProfileError(null);

    try {
      const response = await fetch(`${API_BASE}/Users/me`, {
        method: 'PATCH',
        headers: getAuthorizedHeaders(true),
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to update your profile.');
      }

      const updatedProfile = (await response.json()) as MyProfileData;
      setMyProfile(updatedProfile);
      onSessionUpdate({ name: updatedProfile.name });
      showSuccessToast('Profile updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update your profile.';
      setMyProfileError(message);
      throw error;
    } finally {
      setIsMyProfileSaving(false);
    }
  };

  const openShareModal = async (file: WorkbookListItem, mode: 'copy' | 'live') => {
    const shouldReopenOpenModal = isOpenModalOpen;
    setReopenOpenModalAfterShare(shouldReopenOpenModal);
    if (shouldReopenOpenModal) {
      setIsOpenModalOpen(false);
    }
    setShareTargetWorkbook(file);
    setShareMode(mode);
    setShareModalError(null);
    setShareableUsers([]);
    await fetchShareableUsers();
  };

  const closeShareModal = () => {
    const shouldReopenOpenModal = reopenOpenModalAfterShare;
    setShareTargetWorkbook(null);
    setShareMode(null);
    setShareModalError(null);
    setIsSubmittingShare(false);
    setReopenOpenModalAfterShare(false);
    if (shouldReopenOpenModal) {
      setIsOpenModalOpen(true);
    }
  };

  const submitWorkbookShare = async (recipientUserIds: string[]) => {
    if (!shareTargetWorkbook || !shareMode) {
      return;
    }

    setIsSubmittingShare(true);
    setShareModalError(null);

    try {
      const endpoint = shareMode === 'copy' ? 'share-copy' : 'share-live';
      const succeededUserIds: string[] = [];
      const failedUserIds: string[] = [];

      for (const recipientUserId of recipientUserIds) {
        try {
          const response = await fetch(`${API_BASE}/Workbooks/${shareTargetWorkbook.id}/${endpoint}`, {
            method: 'POST',
           headers: {
  "Content-Type": "application/json"
},
            body: JSON.stringify({ recipientUserId }),
          });

          if (!response.ok) {
            const message = await response.text();
            throw new Error(message || 'Failed to share workbook.');
          }
          succeededUserIds.push(recipientUserId);
        } catch {
          failedUserIds.push(recipientUserId);
        }
      }

      if (shareMode === 'live' && succeededUserIds.length > 0 && state.workbookId === shareTargetWorkbook.id) {
        setIsLiveCollaborationEnabled(true);
      }

      if (failedUserIds.length > 0) {
        const failedRecipients = failedUserIds.map((recipientUserId) => {
          const user = shareableUsers.find((shareableUser) => shareableUser.id === recipientUserId);
          return user?.name || user?.email || 'Unknown user';
        });
        const partialSuccessMessage =
          succeededUserIds.length > 0 ? `Shared with ${succeededUserIds.length} user(s). ` : '';

        setShareModalError(
          `${partialSuccessMessage}Failed for: ${failedRecipients.join(', ')}. Please review and try again.`,
        );
        showErrorToast(shareMode === 'copy' ? 'Sheet copy share failed' : 'Sheet live share failed');
        setIsSubmittingShare(false);
        return;
      }

      showSuccessToast(
        shareMode === 'copy'
          ? 'Sheet copy shared successfully'
          : 'Sheet shared successfully',
      );
      closeShareModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to share workbook.';
      setShareModalError(message);
      showErrorToast(shareMode === 'copy' ? 'Sheet copy share failed' : 'Sheet live share failed');
      setIsSubmittingShare(false);
    }
  };

  const deleteWorkbook = async (file: WorkbookListItem) => {
    const response = await fetch(`${API_BASE}/Workbooks/${file.id}`, {
      method: 'DELETE',
      headers: getAuthorizedHeaders(),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Failed to delete workbook.');
    }

    if (state.workbookId === file.id) {
      dispatch({ type: 'RESET_WORKBOOK' });
      resetPendingWorkbookPersistence();
      resetLoadedWorksheetWindows();
      setCurrentFileName(null);
      setIsDirty(false);
      setLoadedWorkbookUpdatedAt(null);
      setIsLiveCollaborationEnabled(false);
    }

    await fetchAllFiles();
    showSuccessToast(file.isOwner ? 'Workbook deleted successfully' : 'Workbook access removed successfully');
  };

  const downloadWorkbook = async (file: WorkbookListItem) => {
    try {
      const response = await fetch(`${API_BASE}/Workbooks/${file.id}/download`, {
        headers: getAuthorizedHeaders(),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to download workbook.');
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const disposition = response.headers.get('Content-Disposition') || response.headers.get('content-disposition');
      const fileNameMatch = disposition?.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
      const fileName = fileNameMatch?.[1] ? decodeURIComponent(fileNameMatch[1].replace(/"/g, '')) : `${file.name || 'Workbook'}.xlsx`;

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);

      showSuccessToast('Workbook download started');
    } catch (error) {
      console.error('Download error:', error);
      showErrorToast('Failed to download workbook');
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-gray-800 font-sans text-[13px]">
      <Ribbon
        dispatch={trackedDispatch}
        activeStyle={activeCellData?.style}
        activeTool={activeTool}
        setTool={setTool}
        activeLineColor={activeLineColor}
        setLineColor={setLineColor}
        activeLineStyle={activeLineStyle}
        setLineStyle={setLineStyle}
        fileName={currentFileName}
        onFileAction={handleFileAction}
        isDirty={isDirty}
        currentUserRole={currentUser.role}
        activeView={activeView}
        onOpenUserManagement={() => setActiveView('user-management')}
        onOpenMyProfile={() => setActiveView('my-profile')}
        onOpenWorkbook={() => setActiveView('workbook')}
        onLogout={onLogout}
        onPasteClick={handleToolbarPaste}
        isFilterEnabled={activeSheetFilter.enabled}
        onToggleFilter={handleToggleFilter}
        onClearAllFilters={handleClearAllFilters}
      />

      {activeView === 'workbook' ? (
        <>
          <FormulaBar
            activeCellId={activeCellId}
            value={activeCellData?.value || ''}
            onChange={(val) => {
              if (activeCellId) trackedDispatch({ type: 'SET_CELL', id: activeCellId, value: val });
            }}
            onEnter={() => {
              if (activeCellId) {
                const nextId = getNextCellId(activeCellId, 0, 1);
                trackedDispatch({ type: 'SELECT_CELL', id: nextId });
              }
            }}
          />

          <div className="flex-1 flex overflow-hidden relative">
            <Grid
              state={activeSheet}
              dispatch={trackedDispatch}
              activeTool={activeTool}
              setTool={setTool}
              activeLineColor={activeLineColor}
              activeLineStyle={activeLineStyle}
              copiedRange={copiedRange}
              onEditingStateChange={setIsGridEditing}
              onVisibleWindowChange={setVisibleRowWindow}
              filterState={activeSheetFilter}
              onUpdateColumnFilter={handleUpdateColumnFilter}
              onClearColumnFilter={handleClearColumnFilter}
              onSetFilterSort={handleSetSort}
            />
          </div>

          <div className="h-8 bg-[#e6e6e6] flex items-end px-2 gap-1 border-t border-gray-300 select-none">
            <div className="flex overflow-x-auto max-w-[80vw] no-scrollbar items-end h-full">
              {state.sheetOrder.map((sheetId) => {
                const isActive = sheetId === state.activeSheetId;
                return (
                  <div
                    key={sheetId}
                    onClick={() => handleSheetSwitchRequest(sheetId)}
                    className={`
                      px-4 py-1.5 min-w-[80px] text-center text-xs cursor-pointer
                      border-t-2 transition-colors flex items-center justify-between group rounded-t-sm
                      ${isActive
                        ? 'bg-white text-[#107c41] font-bold border-[#107c41] z-10 shadow-sm mb-[-1px] pb-2'
                        : 'bg-transparent text-gray-700 border-transparent hover:bg-gray-200 hover:text-gray-900'
                      }
                    `}
                  >
                    <span>{sheetId}</span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => dispatch({ type: 'ADD_SHEET' })}
              className="w-8 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-300 rounded-full ml-1 mb-0.5"
              title="New Sheet"
            >
              <Icon name="Plus" size={18} />
            </button>
          </div>
        </>
      ) : activeView === 'user-management' ? (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <UserManagementView
            currentUserRole={currentUser.role}
            users={managedUsers}
            isLoading={isUserListLoading}
            error={userListError}
            isRefreshingStatusId={updatingUserStatusId}
            isDeletingUserId={deletingUserId}
            isUpdatingUserId={updatingManagedUserId}
            onRefresh={fetchManagedUsers}
            onToggleStatus={updateUserStatus}
            onDeleteUser={deleteManagedUser}
            onOpenUpdateUser={setEditingUser}
            onOpenAddUser={() => setIsAddUserModalOpen(true)}
          />
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <MyProfileView
            profile={myProfile}
            isLoading={isMyProfileLoading}
            isSaving={isMyProfileSaving}
            error={myProfileError}
            onRefresh={() => void fetchMyProfile()}
            onSubmit={updateMyProfile}
          />
        </div>
      )}

      {isUnsavedWarningOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30">
          <div className="w-[380px] rounded-md bg-white shadow-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800">
                {isNewUnsavedWorkbook ? 'Save this new workbook?' : 'Do you want to save changes?'}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                {isNewUnsavedWorkbook
                  ? 'This workbook has not been saved yet. You need to choose a name to save it.'
                  : 'You have unsaved edits. Opening a different workbook without saving will lose them.'}
              </p>
            </div>
            <div className="px-5 py-3 flex justify-end gap-2">
              {isNewUnsavedWorkbook ? (
                <button
                  onClick={handleUnsavedWarningSave}
                  className="px-4 py-2 text-xs rounded bg-[#107c41] text-white hover:bg-[#0f6f3a]"
                >
                  Save As...
                </button>
              ) : (
                <button
                  onClick={handleUnsavedWarningSave}
                  disabled={isSavingBeforeOpen}
                  className="px-3 py-1.5 text-xs rounded bg-[#107c41] text-white hover:bg-[#0f6f3a] disabled:opacity-60"
                >
                  {isSavingBeforeOpen ? 'Saving...' : 'Save'}
                </button>
              )}
              <button
                onClick={handleUnsavedDontSave}
                className="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Don't Save
              </button>
              <button
                onClick={closeUnsavedWarning}
                className="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-6 bg-[#f5f5f5] border-t border-gray-300 flex items-center px-4 text-xs text-gray-500 justify-between select-none">
        <div className="flex items-center gap-2">
          <span>{toast?.tone === 'success' ? 'Saved' : 'Ready'}</span>
          {activeView === 'workbook' && isDirty && <span className="text-gray-400">| Unsaved Changes</span>}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {selectionStats && (
            <div className="flex items-center gap-4 text-gray-700 animate-in fade-in duration-200">
              {selectionStats.average !== null && (
                <span>Average: {selectionStats.isTimeIncluded
                  ? minutesToTime(selectionStats.average)
                  : new Intl.NumberFormat('en-US', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 0
                  }).format(selectionStats.average)}</span>
              )}
              <span>Count: {selectionStats.count}</span>
              {selectionStats.hasNumbers && (
                <span>Sum: {selectionStats.isTimeIncluded
                  ? minutesToTime(selectionStats.sum)
                  : new Intl.NumberFormat('en-US').format(selectionStats.sum)}</span>
              )}
            </div>
          )}
          {!selectionStats && (
            <span>{activeView === 'workbook' ? `Count: ${Object.keys(activeSheet.selection).length > 0 ? 'Selected' : '0'}` : `Users: ${managedUsers.length}`}</span>
          )}
        </div>
      </div>

      {isSaveModalOpen && (
        <SaveAsModal
          initialValue={currentFileName ? currentFileName.replace('.xlsx', '') : ''}
          onSave={handleConfirmSaveAs}
          onCancel={() => {
            setIsSaveModalOpen(false);
            if (isSaveAsForNewFile) {
              setIsSaveAsForNewFile(false);
            }
          }}
        />
      )}

      {isOpenModalOpen && (
        <OpenModal
          files={files}
          onOpen={(file) => {
            if (isDirty) {
              setPendingFileOpenId(file.id);
              setIsUnsavedWarningOpen(true);
            } else {
              loadWorkbook(file.id);
            }
          }}
          onDownload={downloadWorkbook}
          onShareCopy={(file) => void openShareModal(file, 'copy')}
          onShareLive={(file) => void openShareModal(file, 'live')}
          onDelete={deleteWorkbook}
          onCancel={() => setIsOpenModalOpen(false)}
        />
      )}

      {shareLink && <ShareModal link={shareLink} onClose={() => setShareLink(null)} />}

      {toast && (
        <div className="fixed top-4 right-4 z-[750]">
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-xl ${toast.tone === 'success' ? 'bg-[#107c41]' : 'bg-[#c0392b]'
              }`}
          >
            <Icon name={toast.tone === 'success' ? 'CheckCircle' : 'AlertCircle'} size={16} />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {shareTargetWorkbook && shareMode && (
        <ShareWorkbookModal
          workbook={shareTargetWorkbook}
          mode={shareMode}
          users={shareableUsers}
          isLoadingUsers={isShareableUsersLoading}
          isSubmitting={isSubmittingShare}
          error={shareModalError}
          onSubmit={submitWorkbookShare}
          onCancel={closeShareModal}
        />
      )}

      {isAddUserModalOpen && (
        <AddUserModal
          creatorRole={currentUser.role}
          onSubmit={createUser}
          onCancel={() => setIsAddUserModalOpen(false)}
        />
      )}

      {editingUser && (
        <EditUserModal
          currentUserRole={currentUser.role}
          user={editingUser}
          onSubmit={updateManagedUser}
          onCancel={() => setEditingUser(null)}
        />
      )}

      {showFilterError && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/30">
          <div className="w-[450px] rounded-sm bg-white shadow-2xl border border-gray-400 flex flex-col overflow-hidden">
            <div className="bg-[#107c41] text-white px-3 py-1.5 flex items-center justify-between text-xs font-semibold">
              <span>ZEA Sheets</span>
              <button onClick={() => setShowFilterError(false)} className="hover:bg-[#0c5e31] p-0.5 px-1 leading-none">✕</button>
            </div>
            <div className="p-6 flex gap-6 items-start bg-white">
              <div className="text-[#2b7dce] mt-1">
                <Icon name="Info" size={32} />
              </div>
              <div className="text-[14px] text-gray-800 flex-1 leading-snug font-normal pt-1">
                This can't be applied to the selected range. Select a single cell in a range and try again.
              </div>
            </div>
            <div className="bg-[#f0f0f0] p-3 border-t border-gray-200 flex justify-end px-4">
              <button
                onClick={() => setShowFilterError(false)}
                className="min-w-[85px] px-4 py-1.5 border border-[#ababab] bg-[#e1e1e1] hover:bg-[#d0d0d0] text-[13px] text-gray-900 shadow-sm active:bg-[#c0c0c0] transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;




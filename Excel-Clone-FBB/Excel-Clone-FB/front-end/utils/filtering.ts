import {
  CellData,
  ColumnFilterConfig,
  DateFilterOperator,
  FilterDataType,
  FilterRange,
  FilterCriterion,
  FilterOperator,
} from '../types';
import { cellIdToCoords, colIndexToLabel, formatValue } from './helpers';

export const FILTER_BLANKS_TOKEN = '__excel_filter_blanks__';

export interface FilterColumnMeta {
  column: number;
  label: string;
  headerValue: string;
  type: FilterDataType;
  uniqueValues: string[];
  blankCount: number;
  uniqueColors: string[];     // background colors
  uniqueTextColors: string[]; // font/text colors
  average?: number;
  top10Threshold?: number;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const normalizeString = (value: string) => value.trim().toLowerCase();

export const isBlankValue = (value: string | null | undefined) =>
  value == null || value.trim() === '';

export const getCellDisplayValue = (cell?: CellData) => {
  if (!cell) return '';
  return formatValue(cell.computed !== undefined ? cell.computed : cell.value, cell.style?.format);
};

export const detectFilterRange = (cells: Record<string, CellData>): FilterRange | null => {
  let minRow = Number.POSITIVE_INFINITY;
  let maxRow = Number.NEGATIVE_INFINITY;
  let minCol = Number.POSITIVE_INFINITY;
  let maxCol = Number.NEGATIVE_INFINITY;

  for (const cell of Object.values(cells)) {
    const displayValue = getCellDisplayValue(cell);
    if (isBlankValue(displayValue)) continue;
    const { row, col } = cellIdToCoords(cell.id);
    minRow = Math.min(minRow, row);
    maxRow = Math.max(maxRow, row);
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);
  }

  if (!Number.isFinite(minRow) || !Number.isFinite(minCol)) {
    return null;
  }

  return {
    headerRow: minRow,
    startRow: minRow + 1,
    endRow: Math.max(minRow + 1, maxRow),
    startCol: minCol,
    endCol: maxCol,
  };
};

const parseNumberValue = (value: string) => {
  if (isBlankValue(value)) return null;
  const sanitized = value.replace(/,/g, '').trim();
  if (!/^[-+]?\d*\.?\d+$/.test(sanitized)) return null;
  const numeric = Number(sanitized);
  return Number.isFinite(numeric) ? numeric : null;
};

const parseDateValue = (value: string) => {
  if (isBlankValue(value)) return null;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return null;
  return new Date(timestamp);
};

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const isSameDay = (left: Date, right: Date) => startOfDay(left).getTime() === startOfDay(right).getTime();

const inferColumnType = (values: string[]): FilterDataType => {
  let numberCount = 0;
  let dateCount = 0;
  let textCount = 0;

  for (const value of values) {
    if (isBlankValue(value)) continue;
    if (parseNumberValue(value) !== null) {
      numberCount++;
      continue;
    }
    if (parseDateValue(value) !== null) {
      dateCount++;
      continue;
    }
    textCount++;
  }

  if (textCount > 0) return 'text';
  if (dateCount > 0 && numberCount === 0) return 'date';
  if (numberCount > 0 && dateCount === 0) return 'number';
  return 'text';
};

export const getColumnMeta = (
  cells: Record<string, CellData>,
  range: FilterRange,
  column: number
): FilterColumnMeta => {
  const headerValue = getCellDisplayValue(cells[`${colIndexToLabel(column)}${range.headerRow + 1}`]);
  const rawValues: string[] = [];
  const unique = new Set<string>();
  let blankCount = 0;

  for (let row = range.startRow; row <= range.endRow; row++) {
    const value = getCellDisplayValue(cells[`${colIndexToLabel(column)}${row + 1}`]);
    rawValues.push(value);
    if (isBlankValue(value)) {
      blankCount++;
      continue;
    }
    unique.add(value);
  }

  const type = inferColumnType(rawValues);
  const uniqueValues = Array.from(unique).sort((left, right) => {
    if (type === 'number') {
      const leftNum = parseNumberValue(left);
      const rightNum = parseNumberValue(right);
      if (leftNum != null && rightNum != null) return leftNum - rightNum;
    }
    if (type === 'date') {
      const leftDate = parseDateValue(left);
      const rightDate = parseDateValue(right);
      if (leftDate && rightDate) return leftDate.getTime() - rightDate.getTime();
    }
    return collator.compare(left, right);
  });

  // Collect unique background colors from cells in this column within the filter range
  const seenColors = new Set<string>();
  const seenTextColors = new Set<string>();
  for (let row = range.startRow; row <= range.endRow; row++) {
    const cell = cells[`${colIndexToLabel(column)}${row + 1}`];
    const bg = cell?.style?.backgroundColor;
    if (bg && typeof bg === 'string' && bg.trim() !== '') {
      seenColors.add(bg.trim().toLowerCase());
    }
    const tc = cell?.style?.color;
    if (tc && typeof tc === 'string' && tc.trim() !== '') {
      seenTextColors.add(tc.trim().toLowerCase());
    }
  }
  const uniqueColors = Array.from(seenColors);
  const uniqueTextColors = Array.from(seenTextColors);

  // Calculate numeric metadata if applicable
  let average: number | undefined;
  let top10Threshold: number | undefined;

  if (type === 'number') {
    const numbers = uniqueValues
      .map(v => parseNumberValue(v))
      .filter((n): n is number => n !== null)
      .sort((a, b) => b - a); // descending

    if (numbers.length > 0) {
      average = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      const top10Count = Math.max(1, Math.ceil(numbers.length * 0.1));
      top10Threshold = numbers[Math.min(numbers.length - 1, top10Count - 1)];
    }
  }

  return {
    column,
    label: colIndexToLabel(column),
    headerValue,
    type,
    uniqueValues,
    blankCount,
    uniqueColors,
    uniqueTextColors,
    average,
    top10Threshold,
  };
};

const matchesTextCondition = (value: string, criterion: FilterCriterion) => {
  const haystack = normalizeString(value);
  const needle = normalizeString(criterion.value || '');

  // Handle wildcards
  if (needle.includes('*') || needle.includes('?')) {
    const regexStr = needle
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex special chars
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexStr}$`);

    switch (criterion.operator) {
      case 'equals': return regex.test(haystack);
      case 'doesNotEqual': return !regex.test(haystack);
      default: break; // fall through for startsWith/endsWith/contains which don't usually use wildcards in Excel this way but we'll handle them
    }
  }

  switch (criterion.operator) {
    case 'equals':
      return haystack === needle;
    case 'doesNotEqual':
      return haystack !== needle;
    case 'contains':
      return haystack.includes(needle);
    case 'doesNotContain':
      return !haystack.includes(needle);
    case 'startsWith':
      return haystack.startsWith(needle);
    case 'endsWith':
      return haystack.endsWith(needle);
    default:
      return true;
  }
};

const matchesNumberCondition = (value: string, criterion: FilterCriterion, meta: FilterColumnMeta) => {
  const numericValue = parseNumberValue(value);
  if (numericValue === null) return false;

  const threshold = parseNumberValue(criterion.value || '');

  switch (criterion.operator) {
    case 'equals':
      return threshold !== null && numericValue === threshold;
    case 'doesNotEqual':
      return threshold !== null && numericValue !== threshold;
    case 'greaterThan':
      return threshold !== null && numericValue > threshold;
    case 'greaterThanOrEqual':
      return threshold !== null && numericValue >= threshold;
    case 'lessThan':
      return threshold !== null && numericValue < threshold;
    case 'lessThanOrEqual':
      return threshold !== null && numericValue <= threshold;
    case 'aboveAverage':
      return meta.average !== undefined && numericValue > meta.average;
    case 'belowAverage':
      return meta.average !== undefined && numericValue < meta.average;
    case 'top10':
      return meta.top10Threshold !== undefined && numericValue >= meta.top10Threshold;
    default:
      return true;
  }
};

const matchesDateCondition = (value: string, criterion: FilterCriterion) => {
  const dateValue = parseDateValue(value);
  if (!dateValue) return false;

  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  switch (criterion.operator as DateFilterOperator) {
    case 'today':
      return isSameDay(dateValue, today);
    case 'yesterday':
      return isSameDay(dateValue, yesterday);
    case 'thisMonth':
      return dateValue.getFullYear() === today.getFullYear() && dateValue.getMonth() === today.getMonth();
    case 'lastMonth': {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return dateValue.getFullYear() === lastMonth.getFullYear() && dateValue.getMonth() === lastMonth.getMonth();
    }
    case 'customRange': {
      // Excel Custom Filter usually handles dates via multiple logic.
      // For now we'll keep customRange as a direct operator if needed, but it might be handled via between logic.
      const start = parseDateValue(criterion.value || '');
      if (!start) return false;
      return startOfDay(dateValue).getTime() === startOfDay(start).getTime();
    }
    default:
      return true;
  }
};

export const applyFilter = (value: string, config: ColumnFilterConfig, meta: FilterColumnMeta) => {
  // 1. Check values list (checkboxes)
  if (config.values !== null) {
    let matches = false;
    const normalizedValue = isBlankValue(value) ? FILTER_BLANKS_TOKEN : value;
    if (config.values.includes(normalizedValue)) {
      matches = true;
    }
    if (!matches) return false;
  }

  // 2. Check condition (Top filters)
  if (config.condition) {
    const { criteria, logicalOperator } = config.condition;
    if (criteria.length === 0) return true;

    const results = criteria.map(criterion => {
      if (!criterion.operator) return true;
      if (meta.type === 'text') return matchesTextCondition(value, criterion);
      if (meta.type === 'number') return matchesNumberCondition(value, criterion, meta);
      if (meta.type === 'date') return matchesDateCondition(value, criterion);
      return true;
    });

    if (logicalOperator === 'and') {
      return results.every(r => r);
    } else {
      return results.some(r => r);
    }
  }

  return true;
};

export const compareFilterValues = (left: string, right: string, dataType: FilterDataType) => {
  const leftBlank = isBlankValue(left);
  const rightBlank = isBlankValue(right);
  if (leftBlank && rightBlank) return 0;
  if (leftBlank) return 1;
  if (rightBlank) return -1;

  if (dataType === 'number') {
    const leftNum = parseNumberValue(left);
    const rightNum = parseNumberValue(right);
    if (leftNum != null && rightNum != null) return leftNum - rightNum;
  }

  if (dataType === 'date') {
    const leftDate = parseDateValue(left);
    const rightDate = parseDateValue(right);
    if (leftDate && rightDate) return leftDate.getTime() - rightDate.getTime();
  }

  return collator.compare(left, right);
};

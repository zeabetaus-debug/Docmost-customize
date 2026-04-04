import { cellIdToCoords, coordsToCellId, colLabelToContent, colIndexToLabel, getRangeCoords } from './helpers';

import { CellData, CellId } from '../types';

type Cell = CellData;

const isNumberLike = (v: any) => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)));

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const compareValues = (left: any, right: any, order: number) => {
  if (left === right) return 0;

  const leftBlank = left == null || String(left).trim() === '';
  const rightBlank = right == null || String(right).trim() === '';

  if (leftBlank && rightBlank) return 0;
  if (leftBlank) return 1; // Blanks go to the end in Excel ascending/descending
  if (rightBlank) return -1;

  let comparison = 0;
  if (typeof left === 'number' && typeof right === 'number') {
    comparison = left - right;
  } else {
    comparison = collator.compare(String(left), String(right));
  }
  return comparison * order;
};

const resolveToGrid = (arg: string, evalCell: (id: string) => any): any[][] | string => {
  // Handle literal arrays or already evaluated arrays
  if (arg.startsWith('{') && arg.endsWith('}')) {
     // Simplified literal array support if needed, but for now we rely on formulas
  }

  // Range string check (before general evaluateFormula to avoid scalar resolution)
  if (arg.includes(':') && !arg.startsWith('"')) {
    const parts = arg.split(':');
    if (parts.length === 2) {
      const coords = getRangeCoords(normalizeReference(parts[0]), normalizeReference(parts[1]));
      if (coords) {
        const grid: any[][] = [];
        for (let r = coords.startRow; r <= coords.endRow; r++) {
          const row: any[] = [];
          for (let c = coords.startCol; c <= coords.endCol; c++) {
            row.push(evalCell(coordsToCellId(c, r)));
          }
          grid.push(row);
        }
        return grid;
      }
    }
  }

  const evaluated = evaluateFormula(arg, evalCell);
  if (Array.isArray(evaluated)) return evaluated;

  return [[evaluated]];
};

const splitArguments = (str: string): string[] => {
  const args: string[] = [];
  let current = '';
  let parenLevel = 0;
  let inQuotes = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"') inQuotes = !inQuotes;
    if (!inQuotes) {
      if (char === '(') parenLevel++;
      if (char === ')') parenLevel--;
      if (char === ',' && parenLevel === 0) {
        args.push(current.trim());
        current = '';
        continue;
      }
    }
    current += char;
  }
  if (current.trim()) args.push(current.trim());
  return args;
};

const expandRange = (rangeStr: string): string[] => {
  const parts = rangeStr.split(':');
  if (parts.length !== 2) return [rangeStr];
  const [startId, endId] = parts;
  const { startCol, endCol, startRow, endRow } = getRangeCoords(startId, endId);
  const cells: string[] = [];
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      cells.push(coordsToCellId(c, r));
    }
  }
  return cells;
};

const wildcardMatch = (text: string, pattern: string): boolean => {
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex chars
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  const regex = new RegExp(`^${regexStr}$`, 'i');
  return regex.test(text);
};

const evaluateCondition = (cellValue: any, criteria: string): boolean => {
  const sCellValue = String(cellValue);
  const sCriteria = criteria.startsWith('"') && criteria.endsWith('"') ? criteria.slice(1, -1) : criteria;

  // Check for operators
  const opMatch = sCriteria.match(/^(>=|<=|<>|[><=])(.*)$/);
  if (opMatch) {
    const op = opMatch[1];
    const critValStr = opMatch[2].trim();

    if (isNumberLike(cellValue) && isNumberLike(critValStr)) {
      const v1 = Number(cellValue);
      const v2 = Number(critValStr);
      switch (op) {
        case '>': return v1 > v2;
        case '<': return v1 < v2;
        case '>=': return v1 >= v2;
        case '<=': return v1 <= v2;
        case '<>': return v1 !== v2;
        case '=': return v1 === v2;
      }
    } else {
      // String comparison with operators (allow wildcards for = and <>)
      const v1 = sCellValue.toLowerCase();
      const v2 = critValStr.toLowerCase();
      if (op === '=') {
        return wildcardMatch(v1, v2);
      }
      if (op === '<>') {
        return !wildcardMatch(v1, v2);
      }
      // For other operators with strings, default to alphabetical comparison or false
      switch (op) {
        case '>': return v1 > v2;
        case '<': return v1 < v2;
        case '>=': return v1 >= v2;
        case '<=': return v1 <= v2;
      }
    }
    return false; // If an operator was found but not matched (shouldn't happen with above logic)
  }

  // No operator: exact match or wildcard match
  if (isNumberLike(cellValue) && isNumberLike(sCriteria)) {
    return Number(cellValue) === Number(sCriteria);
  }
  return wildcardMatch(sCellValue.toLowerCase(), sCriteria.toLowerCase());
};

export const normalizeReference = (ref: string) => ref.replace(/\$/g, '').toUpperCase();

export const parseCellReference = (ref: string) => {
  const match = ref.match(/^(\$?)([A-Z]+)(\$?)(\d+)$/i);
  if (!match) return null;
  return {
    isColAbsolute: match[1] === '$',
    colLabel: match[2].toUpperCase(),
    isRowAbsolute: match[3] === '$',
    rowNumber: parseInt(match[4], 10),
  };
};

export const applyOffset = (formula: string, colOffset: number, rowOffset: number) => {
  if (!formula.startsWith('=')) return formula;
  const expr = formula.slice(1);
  const updatedExpr = expr.replace(/(\$?[A-Z]+\$?\d+)/gi, (ref) => {
    const parsed = parseCellReference(ref);
    if (!parsed) return ref;

    let newColLabel = parsed.colLabel;
    if (!parsed.isColAbsolute) {
      const colIdx = colLabelToContent(parsed.colLabel);
      newColLabel = colIndexToLabel(colIdx + colOffset);
    }

    let newRowNumber = parsed.rowNumber;
    if (!parsed.isRowAbsolute) {
      newRowNumber = parsed.rowNumber + rowOffset;
    }

    // Ensure row doesn't go below 1
    if (newRowNumber < 1) return '#REF!';

    return `${parsed.isColAbsolute ? '$' : ''}${newColLabel}${parsed.isRowAbsolute ? '$' : ''}${newRowNumber}`;
  });
  return `=${updatedExpr}`;
};

const evalExpression = (expr: string): any => {
  try {
    // Sanitize: Allow numbers, operators, decimals, parentheses, spaces, comparisons, quotes, and basic text
    if (/[^0-9+\-*/()., <>=!'"a-zA-Z]/.test(expr)) return '#ERROR';

    // Simple check for division by zero
    if (/\/\s*0(\.0*)?(\s|$)|\/\s*0(\.0*)?(?![0-9])/.test(expr)) return '#DIV/0!';

    // Excel to JS operator conversion
    let jsExpr = expr.replace(/>=/g, '__GE__')
      .replace(/<=/g, '__LE__')
      .replace(/<>/g, '__NE__')
      .replace(/!=/g, '__NE__')
      .replace(/=/g, '===')
      .replace(/__GE__/g, '>=')
      .replace(/__LE__/g, '<=')
      .replace(/__NE__/g, '!==');

    // Handle Excel-style logical literals
    jsExpr = jsExpr.replace(/\bTRUE\b/gi, 'true').replace(/\bFALSE\b/gi, 'false');

    // eslint-disable-next-line no-new-func
    const res = Function(`"use strict"; return (${jsExpr})`)();

    if (typeof res === 'number') {
      if (res === Infinity || res === -Infinity || isNaN(res)) return '#DIV/0!';
      return Math.round(res * 1e10) / 1e10;
    }

    if (res === true) return 'TRUE';
    if (res === false) return 'FALSE';

    return res;
  } catch (e) {
    return '#ERROR';
  }
};

export const evaluateFormula = (expr: string, evalCell: (id: string) => any): any => {
  const trimmed = expr.trim();

  // If it's a simple quoted string, return it immediately without eval
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }

  // 1. Handle IF(condition, true_val, false_val)
  const ifMatch = trimmed.match(/^IF\s*\((.*)\)$/i);
  if (ifMatch) {
    const args = splitArguments(ifMatch[1]);
    if (args.length !== 3) return '#ERROR';
    const condition = evaluateFormula(args[0], evalCell);
    const isTrue = condition === true || condition === 'TRUE' || (isNumberLike(condition) && Number(condition) !== 0);
    return evaluateFormula(isTrue ? args[1] : args[2], evalCell);
  }

  // 1.1 Handle IFERROR(value, value_if_error)
  const ifErrorMatch = trimmed.match(/^IFERROR\s*\((.*)\)$/i);
  if (ifErrorMatch) {
    const args = splitArguments(ifErrorMatch[1]);
    if (args.length !== 2) return '#ERROR';
    const value = evaluateFormula(args[0], evalCell);
    const isError = typeof value === 'string' && (
      value === '#DIV/0!' || value === '#ERROR' || value === '#SPILL!' || value === '#CALC!' || value === '#VALUE!' || value === '#REF!' || value === '#N/A'
    );
    if (isError) {
      return evaluateFormula(args[1], evalCell);
    }
    return value;
  }

  // 2. Handle AND(arg1, arg2, ...)
  const andMatch = trimmed.match(/^AND\s*\((.*)\)$/i);
  if (andMatch) {
    const args = splitArguments(andMatch[1]);
    if (args.length < 2) return '#ERROR';
    for (const arg of args) {
      const res = evaluateFormula(arg, evalCell);
      const isTrue = res === true || res === 'TRUE' || (isNumberLike(res) && Number(res) !== 0);
      if (!isTrue) return 'FALSE';
    }
    return 'TRUE';
  }

  // 3. Handle AVERAGEIF(range, criteria, [average_range])
  const averageIfMatch = trimmed.match(/^AVERAGEIF\s*\((.*)\)$/i);
  if (averageIfMatch) {
    const args = splitArguments(averageIfMatch[1]);
    if (args.length < 2 || args.length > 3) return '#ERROR';

    const rangeStr = args[0];
    const criteriaRaw = evaluateFormula(args[1], evalCell);
    const criteria = String(criteriaRaw);
    const averageRangeStr = args.length === 3 ? args[2] : rangeStr;

    const rangeCells = expandRange(rangeStr);
    const avgCells = expandRange(averageRangeStr);

    if (rangeCells.length !== avgCells.length) return '#ERROR';

    const matches: number[] = [];
    for (let i = 0; i < rangeCells.length; i++) {
      const condVal = evalCell(normalizeReference(rangeCells[i]));
      if (evaluateCondition(condVal, criteria)) {
        const avgVal = evalCell(normalizeReference(avgCells[i]));
        if (isNumberLike(avgVal)) {
          matches.push(Number(avgVal));
        }
      }
    }

    if (matches.length === 0) return '#DIV/0!';
    const sum = matches.reduce((a, b) => a + b, 0);
    return sum / matches.length;
  }

  // 3.1 Handle SUMIF(range, criteria, [sum_range])
  const sumIfMatch = trimmed.match(/^SUMIF\s*\((.*)\)$/i);
  if (sumIfMatch) {
    const args = splitArguments(sumIfMatch[1]);
    if (args.length < 2 || args.length > 3) return '#ERROR';

    const rangeStr = args[0];
    const criteriaRaw = evaluateFormula(args[1], evalCell);
    const criteria = String(criteriaRaw);
    const sumRangeStr = args.length === 3 ? args[2] : rangeStr;

    const rangeCells = expandRange(rangeStr);
    const sumCells = expandRange(sumRangeStr);

    if (rangeCells.length !== sumCells.length) return '#ERROR';

    let total = 0;
    for (let i = 0; i < rangeCells.length; i++) {
      const condVal = evalCell(normalizeReference(rangeCells[i]));
      if (evaluateCondition(condVal, criteria)) {
        const sumVal = evalCell(normalizeReference(sumCells[i]));
        if (isNumberLike(sumVal)) {
          total += Number(sumVal);
        }
      }
    }
    return total;
  }

  // 3.2 Handle SUM(arg1, arg2, ...)
  const sumMatch = trimmed.match(/^SUM\s*\((.*)\)$/i);
  if (sumMatch) {
    const args = splitArguments(sumMatch[1]);
    let total = 0;
    for (const arg of args) {
      if (arg.includes(':') && !arg.startsWith('"')) {
        const rangeCells = expandRange(arg);
        for (const cellId of rangeCells) {
          const val = evalCell(normalizeReference(cellId));
          if (isNumberLike(val)) total += Number(val);
        }
      } else {
        const val = evaluateFormula(arg, evalCell);
        if (isNumberLike(val)) total += Number(val);
      }
    }
    return total;
  }

  // 4. Handle SUMIFS(sum_range, criteria_range1, criteria1, [criteria_range2, criteria2] ...)
  const sumIfsMatch = trimmed.match(/^SUMIFS\s*\((.*)\)$/i);
  if (sumIfsMatch) {
    const args = splitArguments(sumIfsMatch[1]);
    if (args.length < 3 || (args.length - 1) % 2 !== 0) return '#ERROR';

    const sumRangeStr = args[0];
    const sumCells = expandRange(sumRangeStr);

    const criteriaPairs: { cells: string[]; criteria: string }[] = [];
    for (let i = 1; i < args.length; i += 2) {
      const rangeStr = args[i];
      const criteriaRaw = evaluateFormula(args[i + 1], evalCell);
      const criteria = String(criteriaRaw);
      const rangeCells = expandRange(rangeStr);
      if (rangeCells.length !== sumCells.length) return '#ERROR';
      criteriaPairs.push({ cells: rangeCells, criteria });
    }

    let totalSum = 0;
    for (let i = 0; i < sumCells.length; i++) {
      let allMatch = true;
      for (const pair of criteriaPairs) {
        const condVal = evalCell(normalizeReference(pair.cells[i]));
        if (!evaluateCondition(condVal, pair.criteria)) {
          allMatch = false;
          break;
        }
      }

      if (allMatch) {
        const sumVal = evalCell(normalizeReference(sumCells[i]));
        if (isNumberLike(sumVal)) {
          totalSum += Number(sumVal);
        }
      }
    }
    return totalSum;
  }

  // 4.1 Handle COUNTIF(range, criteria)
  const countIfMatch = trimmed.match(/^COUNTIF\s*\((.*)\)$/i);
  if (countIfMatch) {
    const args = splitArguments(countIfMatch[1]);
    if (args.length !== 2) return '#ERROR';

    const rangeStr = args[0];
    const criteriaRaw = evaluateFormula(args[1], evalCell);
    const criteria = String(criteriaRaw);

    const rangeCells = expandRange(rangeStr);
    let count = 0;
    for (const cellId of rangeCells) {
      const val = evalCell(normalizeReference(cellId));
      if (evaluateCondition(val, criteria)) {
        count++;
      }
    }
    return count;
  }

  // 4.2 Handle COUNT(arg1, arg2, ...)
  const countMatch = trimmed.match(/^COUNT\s*\((.*)\)$/i);
  if (countMatch) {
    const args = splitArguments(countMatch[1]);
    let count = 0;
    for (const arg of args) {
      if (arg.includes(':') && !arg.startsWith('"')) {
        const rangeCells = expandRange(arg);
        for (const cellId of rangeCells) {
          const val = evalCell(normalizeReference(cellId));
          if (isNumberLike(val)) count++;
        }
      } else {
        const val = evaluateFormula(arg, evalCell);
        if (isNumberLike(val)) count++;
      }
    }
    return count;
  }

  // 5. Handle COUNTIFS(criteria_range1, criteria1, [criteria_range2, criteria2] ...)
  const countIfsMatch = trimmed.match(/^COUNTIFS\s*\((.*)\)$/i);
  if (countIfsMatch) {
    const args = splitArguments(countIfsMatch[1]);
    if (args.length < 2 || args.length % 2 !== 0) return '#ERROR';

    const criteriaPairs: { cells: string[]; criteria: string }[] = [];
    let baseLength = -1;

    for (let i = 0; i < args.length; i += 2) {
      const rangeStr = args[i];
      const criteriaRaw = evaluateFormula(args[i + 1], evalCell);
      const criteria = String(criteriaRaw);
      const rangeCells = expandRange(rangeStr);

      if (baseLength === -1) {
        baseLength = rangeCells.length;
      } else if (rangeCells.length !== baseLength) {
        return '#ERROR';
      }

      criteriaPairs.push({ cells: rangeCells, criteria });
    }

    let count = 0;
    for (let i = 0; i < baseLength; i++) {
      let allMatch = true;
      for (const pair of criteriaPairs) {
        const condVal = evalCell(normalizeReference(pair.cells[i]));
        if (!evaluateCondition(condVal, pair.criteria)) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) count++;
    }
    return count;
  }

  // 6. Handle VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])
  const vlookupMatch = trimmed.match(/^VLOOKUP\s*\((.*)\)$/i);
  if (vlookupMatch) {
    const args = splitArguments(vlookupMatch[1]);
    if (args.length < 3 || args.length > 4) return '#ERROR';

    const lookupValueStr = evaluateFormula(args[0], evalCell);
    const tableRangeStr = args[1];
    const colIndexRaw = evaluateFormula(args[2], evalCell);
    const rangeLookupRaw = args.length === 4 ? evaluateFormula(args[3], evalCell) : 'TRUE';

    if (!isNumberLike(colIndexRaw)) return '#VALUE!';
    const colIndex = Math.floor(Number(colIndexRaw));
    const rangeLookup = rangeLookupRaw === 'TRUE' || rangeLookupRaw === true || (isNumberLike(rangeLookupRaw) && Number(rangeLookupRaw) !== 0);

    const parts = tableRangeStr.split(':');
    if (parts.length !== 2) return '#REF!';
    const [startId, endId] = parts;
    const { startCol, endCol, startRow, endRow } = getRangeCoords(normalizeReference(startId), normalizeReference(endId));

    const numCols = endCol - startCol + 1;
    const numRows = endRow - startRow + 1;

    if (colIndex < 1 || colIndex > numCols) return '#REF!';

    // Get 2D grid of cell values
    const table: any[][] = [];
    for (let r = startRow; r <= endRow; r++) {
      const rowData: any[] = [];
      for (let c = startCol; c <= endCol; c++) {
        rowData.push(evalCell(coordsToCellId(c, r)));
      }
      table.push(rowData);
    }

    if (rangeLookup) {
      // Approximate match (closest smaller or equal)
      // Assumes first column is sorted ascending
      let bestRowIndex = -1;
      let bestVal: any = null;

      for (let i = 0; i < table.length; i++) {
        const val = table[i][0];

        // Handle comparisons safely
        if (evaluateCondition(val, `<=${lookupValueStr}`)) {
          if (bestVal === null || evaluateCondition(val, `>${bestVal}`)) {
            bestVal = val;
            bestRowIndex = i;
          }
        }
      }

      if (bestRowIndex !== -1) {
        return table[bestRowIndex][colIndex - 1];
      }
      return '#N/A';
    } else {
      // Exact match
      for (let i = 0; i < table.length; i++) {
        if (evaluateCondition(table[i][0], `=${lookupValueStr}`)) {
          return table[i][colIndex - 1];
        }
      }
      return '#N/A';
    }
  }

  // 7. Handle SUMPRODUCT(array1, array2, ...)
  const sumProductMatch = trimmed.match(/^SUMPRODUCT\s*\((.*)\)$/i);
  if (sumProductMatch) {
    const args = splitArguments(sumProductMatch[1]);
    if (args.length < 1) return '#ERROR';

    const arrays: number[][] = [];
    let commonLength = -1;

    for (const arg of args) {
      if (arg.includes(':') && !arg.startsWith('"')) {
        const cells = expandRange(arg);
        const values = cells.map(id => {
          const val = evalCell(normalizeReference(id));
          return isNumberLike(val) ? Number(val) : 0;
        });

        if (commonLength === -1) {
          commonLength = values.length;
        } else if (values.length !== commonLength) {
          return '#VALUE!';
        }
        arrays.push(values);
      } else {
        // Scalar value or non-range
        const val = evaluateFormula(arg, evalCell);
        const num = isNumberLike(val) ? Number(val) : 0;
        // In Excel, scalars are treated as arrays of length 1 if other arrays are length 1, 
        // or it returns #VALUE! if they don't match. 
        // For simplicity, we'll treat it as a single-element array.
        if (commonLength === -1) {
          commonLength = 1;
        } else if (commonLength !== 1) {
          return '#VALUE!';
        }
        arrays.push([num]);
      }
    }

    let total = 0;
    for (let i = 0; i < commonLength; i++) {
      let product = 1;
      for (const arr of arrays) {
        product *= arr[i];
      }
      total += product;
    }
    return total;
  }

  // 8. Handle CONCAT(value1, value2, ...)
  const concatMatch = trimmed.match(/^CONCAT\s*\((.*)\)$/i);
  if (concatMatch) {
    const args = splitArguments(concatMatch[1]);
    if (args.length === 0) return '#ERROR';

    let result = '';
    for (const arg of args) {
      if (arg.includes(':') && !arg.startsWith('"')) {
        const cells = expandRange(arg);
        for (const cellId of cells) {
          const val = evalCell(normalizeReference(cellId));
          result += (val != null ? String(val) : '');
        }
      } else {
        const val = evaluateFormula(arg, evalCell);
        result += (val != null ? String(val) : '');
      }
    }
    return result;
  }

  // 9. Handle TEXTJOIN(delimiter, ignore_empty, text1, text2, ...)
  const textjoinMatch = trimmed.match(/^TEXTJOIN\s*\((.*)\)$/i);
  if (textjoinMatch) {
    const args = splitArguments(textjoinMatch[1]);
    if (args.length < 3) return '#ERROR';

    const delimiterRaw = evaluateFormula(args[0], evalCell);
    const delimiter = String(delimiterRaw);

    const ignoreEmptyRaw = evaluateFormula(args[1], evalCell);
    const ignoreEmpty = ignoreEmptyRaw === 'TRUE' || ignoreEmptyRaw === true || (isNumberLike(ignoreEmptyRaw) && Number(ignoreEmptyRaw) !== 0);

    const values: string[] = [];
    for (let i = 2; i < args.length; i++) {
      const arg = args[i];
      if (arg.includes(':') && !arg.startsWith('"')) {
        const cells = expandRange(arg);
        for (const cellId of cells) {
          const val = evalCell(normalizeReference(cellId));
          if (val != null && String(val) !== '') {
            values.push(String(val));
          } else if (!ignoreEmpty) {
            values.push('');
          }
        }
      } else {
        const val = evaluateFormula(arg, evalCell);
        if (val != null && String(val) !== '') {
          values.push(String(val));
        } else if (!ignoreEmpty) {
          values.push('');
        }
      }
    }
    return values.join(delimiter);
  }

  // 10. Handle UNIQUE(array, [by_col], [exactly_once])
  const uniqueMatch = trimmed.match(/^UNIQUE\s*\((.*)\)$/i);
  if (uniqueMatch) {
    const args = splitArguments(uniqueMatch[1]);
    if (args.length < 1 || args.length > 3) return '#ERROR';

    const rangeStr = args[0];
    const byColRaw = args.length >= 2 ? evaluateFormula(args[1], evalCell) : 'FALSE';
    const exactlyOnceRaw = args.length === 3 ? evaluateFormula(args[2], evalCell) : 'FALSE';

    const byCol = byColRaw === 'TRUE' || byColRaw === true || (isNumberLike(byColRaw) && Number(byColRaw) !== 0);
    const exactlyOnce = exactlyOnceRaw === 'TRUE' || exactlyOnceRaw === true || (isNumberLike(exactlyOnceRaw) && Number(exactlyOnceRaw) !== 0);

    const grid = resolveToGrid(rangeStr, evalCell);
    if (typeof grid === 'string') return grid;

    const units: any[][] = [];
    if (byCol) {
      // Columns are units
      const numCols = grid[0]?.length ?? 0;
      for (let c = 0; c < numCols; c++) {
        const col: any[] = [];
        for (let r = 0; r < grid.length; r++) {
          col.push(grid[r][c]);
        }
        units.push(col);
      }
    } else {
      // Rows are units
      units.push(...grid);
    }

    // Deduplicate or count occurrences
    const occurrences = new Map<string, { unit: any[]; count: number; firstIndex: number }>();
    units.forEach((unit, index) => {
      const key = JSON.stringify(unit.map(v => (v != null ? String(v).toLowerCase() : '')));
      const existing = occurrences.get(key);
      if (existing) {
        existing.count++;
      } else {
        occurrences.set(key, { unit, count: 1, firstIndex: index });
      }
    });

    const resultUnits: any[][] = [];
    const sortedUnits = Array.from(occurrences.values()).sort((a, b) => a.firstIndex - b.firstIndex);

    for (const item of sortedUnits) {
      if (exactlyOnce) {
        if (item.count === 1) resultUnits.push(item.unit);
      } else {
        resultUnits.push(item.unit);
      }
    }

    // Return the result array
    // Note: If dynamic spill is not implemented, the UI may need adjustment to display this.
    return resultUnits;
  }

  // 5. Handle AVERAGE(arg1, arg2, ...)
  const averageMatch = trimmed.match(/^AVERAGE\s*\((.*)\)$/i);
  if (averageMatch) {
    const args = splitArguments(averageMatch[1]);
    const values: number[] = [];
    for (const arg of args) {
      if (arg.includes(':') && !arg.startsWith('"')) {
        const rangeCells = expandRange(arg);
        for (const cellId of rangeCells) {
          const val = evalCell(normalizeReference(cellId));
          if (isNumberLike(val)) values.push(Number(val));
        }
      } else {
        const val = evaluateFormula(arg, evalCell);
        if (isNumberLike(val)) values.push(Number(val));
      }
    }
    if (values.length === 0) return '#DIV/0!';
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  // 11. Handle FILTER(array, include, [if_empty])
  const filterMatch = trimmed.match(/^FILTER\s*\((.*)\)$/i);
  if (filterMatch) {
    const args = splitArguments(filterMatch[1]);
    if (args.length < 2 || args.length > 3) return '#ERROR';

    const sourceRangeStr = args[0];
    const includeExprRaw = args[1];
    const ifEmptyValRaw = args.length === 3 ? args[2] : '#CALC!';
    const ifEmptyVal = ifEmptyValRaw.startsWith('"') && ifEmptyValRaw.endsWith('"') ? ifEmptyValRaw.slice(1, -1) : evaluateFormula(ifEmptyValRaw, evalCell);

    const grid = resolveToGrid(sourceRangeStr, evalCell);
    if (typeof grid === 'string') return grid;

    const numRows = grid.length;
    const numCols = grid[0].length;

    // Find all ranges in the include expression
    const rangeRegex = /(\$?[A-Z]+\$?\d+:\$?[A-Z]+\$?\d+)/gi;
    const includeRanges: { fullMatch: string; startCol: number; startRow: number; endCol: number; endRow: number }[] = [];

    let m;
    while ((m = rangeRegex.exec(includeExprRaw)) !== null) {
      const parts = m[1].split(':');
      const coords = getRangeCoords(normalizeReference(parts[0]), normalizeReference(parts[1]));
      if (coords.endRow - coords.startRow + 1 !== numRows) return '#VALUE!';
      includeRanges.push({ fullMatch: m[1], ...coords });
    }

    const resultGrid: any[][] = [];
    for (let i = 0; i < numRows; i++) {
      // Create row-specific include expression
      let rowIncludeExpr = includeExprRaw;
      for (const ir of includeRanges) {
        const rowId = coordsToCellId(ir.startCol, ir.startRow + i);
        rowIncludeExpr = rowIncludeExpr.split(ir.fullMatch).join(rowId);
      }

      const res = evaluateFormula(rowIncludeExpr, evalCell);
      const isTrue = res === true || res === 'TRUE' || (isNumberLike(res) && Number(res) !== 0);

      if (isTrue) {
        resultGrid.push(grid[i]);
      }
    }

    if (resultGrid.length === 0) return ifEmptyVal;
    return resultGrid;
  }

  // 12. Handle SORT(array, [sort_index], [sort_order], [by_col])
  const sortMatch = trimmed.match(/^SORT\s*\((.*)\)$/i);
  if (sortMatch) {
    const args = splitArguments(sortMatch[1]);
    if (args.length < 1 || args.length > 4) return '#ERROR';

    const rangeStr = args[0];
    const sortIndexRaw = args.length >= 2 ? evaluateFormula(args[1], evalCell) : 1;
    const sortOrderRaw = args.length >= 3 ? evaluateFormula(args[2], evalCell) : 1;
    const byColRaw = args.length === 4 ? evaluateFormula(args[3], evalCell) : 'FALSE';

    const sortIndex = isNumberLike(sortIndexRaw) ? Math.floor(Number(sortIndexRaw)) : 1;
    const sortOrder = isNumberLike(sortOrderRaw) ? (Number(sortOrderRaw) < 0 ? -1 : 1) : 1;
    const byCol = byColRaw === 'TRUE' || byColRaw === true || (isNumberLike(byColRaw) && Number(byColRaw) !== 0);

    const grid = resolveToGrid(rangeStr, evalCell);
    if (typeof grid === 'string') return grid;

    const numRows = grid.length;
    const numCols = grid[0].length;

    if (!byCol) {
      // Sort rows (vertical)
      if (sortIndex < 1 || sortIndex > numCols) return '#VALUE!';
      const sortedRows = [...grid].sort((a, b) => compareValues(a[sortIndex - 1], b[sortIndex - 1], sortOrder));
      return sortedRows;
    } else {
      // Sort columns (horizontal)
      if (sortIndex < 1 || sortIndex > numRows) return '#VALUE!';
      const columns: any[][] = [];
      for (let c = 0; c < numCols; c++) {
        const col: any[] = [];
        for (let r = 0; r < numRows; r++) {
          col.push(grid[r][c]);
        }
        columns.push(col);
      }

      const sortedCols = [...columns].sort((a, b) => compareValues(a[sortIndex - 1], b[sortIndex - 1], sortOrder));

      const finalGrid: any[][] = [];
      for (let r = 0; r < numRows; r++) {
        const row: any[] = [];
        for (let c = 0; c < numCols; c++) {
          row.push(sortedCols[c][r]);
        }
        finalGrid.push(row);
      }
      return finalGrid;
    }
  }

  // 13. Resolve cell references & strings before evaluation
  let potentialError = '';
  const processed = trimmed.replace(/(\$?[A-Z]+\$?\d+)/gi, (m) => {
    const ref = normalizeReference(m);
    const val = evalCell(ref);
    if (val === '#DIV/0!' || val === '#ERROR' || val === '#SPILL!' || val === '#CALC!') {
      potentialError = val;
      return '0';
    }
    if (typeof val === 'string' && !isNumberLike(val) && val !== 'TRUE' && val !== 'FALSE') {
      return `"${val.replace(/"/g, '\\"')}"`;
    }
    return String(val);
  });

  if (potentialError) return potentialError;

  return evalExpression(processed);
};

export const recalculateGrid = (cellsIn: Record<string, CellData>) => {
  const cells: Record<string, CellData> = { ...cellsIn };

  // Clear previous spills and mark original cells
  const originalCellIds = new Set(Object.keys(cells).filter(id => cells[id].value));
  Object.keys(cells).forEach(id => {
    if (cells[id].spillParent) {
      if (!originalCellIds.has(id)) {
        delete cells[id];
      } else {
        const { ...rest } = cells[id];
        delete rest.spillParent;
        cells[id] = rest;
      }
    }
  });

  const cache: Record<string, any> = {};
  const visiting: Record<string, boolean> = {};

  const evalCell = (id: string): any => {
    if (cache[id] !== undefined) return cache[id];
    if (visiting[id]) return '#ERROR';
    visiting[id] = true;

    const cell = cells[id];
    if (!cell) {
      cache[id] = 0;
      visiting[id] = false;
      return 0;
    }

    const v = cell.value ?? '';
    let result: any;

    if (typeof v === 'string' && v.startsWith('=')) {
      result = evaluateFormula(v.slice(1), evalCell);
    } else if (isNumberLike(v)) {
      result = Number(v);
    } else {
      result = v;
    }

    cache[id] = result;
    visiting[id] = false;
    return result;
  };

  // Evaluate all original cells
  originalCellIds.forEach(id => {
    evalCell(id);
  });

  // Track all cells that are part of a spill to detect overlaps
  const spillOccupied = new Map<string, string>(); // CellId -> SourceId

  // Handle spills
  originalCellIds.forEach(sourceId => {
    const res = cache[sourceId];
    if (Array.isArray(res)) {
      const { col: startCol, row: startRow } = cellIdToCoords(sourceId);
      const rows = res.length;
      const cols = Array.isArray(res[0]) ? res[0].length : 1;

      // Check for collisions
      let collision = false;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const targetId = coordsToCellId(startCol + c, startRow + r);
          if (targetId === sourceId) continue;

          // Collision if target cell has a manual value
          if (originalCellIds.has(targetId)) {
            collision = true;
            break;
          }
          // Collision if target cell is already occupied by another spill
          if (spillOccupied.has(targetId)) {
            collision = true;
            break;
          }
        }
        if (collision) break;
      }

      if (collision) {
        cells[sourceId] = { ...cells[sourceId], computed: '#SPILL!' };
        cache[sourceId] = '#SPILL!';
      } else {
        // Apply spill
        for (let r = 0; r < rows; r++) {
          const rowData = res[r];
          for (let c = 0; c < cols; c++) {
            const targetId = coordsToCellId(startCol + c, startRow + r);
            const val = Array.isArray(rowData) ? rowData[c] : (c === 0 ? rowData : undefined);

            if (targetId === sourceId) {
              cells[sourceId] = { ...cells[sourceId], computed: val };
              cache[sourceId] = val;
            } else {
              cells[targetId] = {
                ...(cells[targetId] || { id: targetId, value: '' }),
                computed: val,
                spillParent: sourceId
              };
              cache[targetId] = val;
              spillOccupied.set(targetId, sourceId);
            }
          }
        }
      }
    } else {
      cells[sourceId] = { ...cells[sourceId], computed: res };
    }
  });

  return cells;
};

export default recalculateGrid;


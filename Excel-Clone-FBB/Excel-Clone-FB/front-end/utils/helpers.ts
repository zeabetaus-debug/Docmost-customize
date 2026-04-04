// utils/helpers.ts
export const colIndexToLabel = (index: number): string => {
  let label = '';
  let i = index;
  while (i >= 0) {
    label = String.fromCharCode((i % 26) + 65) + label;
    i = Math.floor(i / 26) - 1;
  }
  return label;
};

export const colLabelToContent = (label: string): number => {
  let result = 0;
  for (let i = 0; i < label.length; i++) {
    result = result * 26 + (label.charCodeAt(i) - 64);
  }
  return result - 1;
};

export const coordsToCellId = (col: number, row: number): string => {
  return `${colIndexToLabel(col)}${row + 1}`;
};

export const cellIdToCoords = (id: string): { col: number; row: number } => {
  const m = id.match(/^([A-Z]+)(\d+)$/i);
  if (!m) return { col: 0, row: 0 };
  const colLabel = m[1].toUpperCase();
  const row = parseInt(m[2], 10) - 1;
  return { col: colLabelToContent(colLabel), row };
};

export const getRangeCoords = (startId: string, endId: string) => {
  const s = cellIdToCoords(startId);
  const e = cellIdToCoords(endId);
  return {
    startCol: Math.min(s.col, e.col),
    endCol: Math.max(s.col, e.col),
    startRow: Math.min(s.row, e.row),
    endRow: Math.max(s.row, e.row),
  };
};

export const getRangeStr = (startId: string, endId: string): string => {
  if (startId === endId) return startId;
  const { startCol, endCol, startRow, endRow } = getRangeCoords(startId, endId);
  const tl = coordsToCellId(startCol, startRow);
  const br = coordsToCellId(endCol, endRow);
  return `${tl}:${br}`;
};

const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
const ctx = canvas ? canvas.getContext('2d') : null;

export const getTextWidth = (text: string, font: string = '11pt Calibri'): number => {
  try {
    if (ctx) {
      ctx.font = font;
      return Math.ceil(ctx.measureText(text || '').width);
    }
  } catch { }
  return Math.max(10, (text || '').length * 7);
};

export const formatValue = (value: any, format?: string) => {
  if (value == null) return '';
  if (format === 'number' || typeof value === 'number') {
    const n = Number(value);
    return isNaN(n) ? String(value) : n.toString();
  }
  return String(value);
};

export const getNextCellId = (id: string, dCol = 0, dRow = 0): string => {
  const { col, row } = cellIdToCoords(id);
  const nc = Math.max(0, col + dCol);
  const nr = Math.max(0, row + dRow);
  return coordsToCellId(nc, nr);
};

export const calculateRotatedHeight = (
  text: string,
  fontSizePt: number = 11,
  rotation: number | 'vertical' | undefined
) => {
  const fontPx = (fontSizePt || 11) * 1.333;
  if (!rotation) return fontPx * 1.2;
  if (rotation === 'vertical') return Math.max(fontPx, text.length * fontPx * 0.9);
  const theta = (Math.abs(Number(rotation)) || 0) * (Math.PI / 180);
  const textWidth = (text || '').length * (fontPx * 0.5);
  const height = Math.abs(Math.sin(theta) * textWidth) + Math.abs(Math.cos(theta) * fontPx);
  return Math.ceil(Math.max(fontPx * 1.2, height));
};

export const getAutoRowHeight = (
  cells: Record<string, any>,
  row: number,
  columnWidths: Record<string, number>,
  defaultColWidth = 64
) => {
  let max = 24;
  Object.values(cells).forEach((cell: any) => {
    if (!cell?.id) return;
    const coords = cellIdToCoords(cell.id);
    if (coords.row !== row) return;

    const fontSize = cell.style?.fontSize || 11;
    const rotation = cell.style?.textRotation;
    const wrapText = cell.style?.wrapText || false;
    const content = cell.computed ?? cell.value ?? '';

    if (rotation === 'vertical') {
      const h = calculateRotatedHeight(String(content), fontSize, 'vertical');
      if (h > max) max = h;
      return;
    }

    const colLabel = colIndexToLabel(coords.col);
    const colWidth = columnWidths[colLabel] || defaultColWidth;
    const font = `${cell.style?.bold ? 'bold ' : ''}${cell.style?.italic ? 'italic ' : ''}${fontSize}pt ${cell.style?.fontFamily || 'Calibri'}`;
    const textWidth = getTextWidth(String(content), font) + 8;
    let lines = 1;
    if (wrapText) {
      lines = Math.max(1, Math.ceil(textWidth / colWidth));
    }
    const lineHeight = fontSize * 1.333 * 1.15; // Adjusted to match Excel's tighter spacing
    const h = Math.ceil(lines * lineHeight);
    if (h > max) max = h;
  });
  return max;
};
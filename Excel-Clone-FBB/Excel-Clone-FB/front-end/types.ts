// types.ts
export type CellId = string;
export type UserRole = 'Admin' | 'Manager' | 'User';
export type AccountStatus = 'Active' | 'Inactive';
export type Department = 'Zea Us' | 'Zea India' | 'Zea Lead-Gen' | 'Admin';

export type BorderType =
  | 'none'
  | 'thin'
  | 'medium'
  | 'thick'
  | 'double'
  | 'dotted'
  | 'dashed'
  | 'long_dashed'
  | 'dash_dot'
  | 'dash_dot_dot';

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: 'single' | 'double';
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  textRotation?: number | 'vertical';
  borderTop?: BorderType;
  borderRight?: BorderType;
  borderBottom?: BorderType;
  borderLeft?: BorderType;
  borderTopColor?: string;
  borderRightColor?: string;
  borderBottomColor?: string;
  borderLeftColor?: string;
  format?: 'general' | 'number' | 'currency' | 'percent' | 'date';
  wrapText?: boolean;
}

export interface CellData {
  id: CellId;
  value: string;
  computed?: string | number | null | any[] | any[][];
  style?: CellStyle;
  spillParent?: CellId;
}

export interface ClipboardItem {
  value: string;
  style?: CellStyle;
}

export interface SheetState {
  cells: Record<CellId, CellData>;
  columnWidths: Record<string, number>;
  rowHeights: Record<number, number>;
  selection: {
    start: CellId | null;
    end: CellId | null;
    active: CellId | null;
  };
  undoStack: Partial<SheetState>[];
  redoStack: Partial<SheetState>[];
}

export interface WorkbookClipboard {
  data: ClipboardItem[][];
  sourceRange: { sheetId: string; start: CellId; end: CellId } | null;
  sourceWorkbookId?: string | null;
  type: 'copy' | 'cut' | null;
}

export interface WorkbookState {
  sheets: Record<string, SheetState>;
  activeSheetId: string;
  sheetOrder: string[];
  clipboard: WorkbookClipboard | null;
  workbookId?: string;
  worksheetIds?: Record<string, string>;
}

export type BorderActionType =
  | 'bottom' | 'top' | 'left' | 'right'
  | 'no_border' | 'all' | 'outside' | 'thick_outside'
  | 'bottom_double' | 'thick_bottom'
  | 'top_bottom' | 'top_thick_bottom' | 'top_double_bottom';

export type FilterDataType = 'text' | 'number' | 'date';

export type TextFilterOperator =
  | 'equals'
  | 'doesNotEqual'
  | 'contains'
  | 'doesNotContain'
  | 'startsWith'
  | 'endsWith';

export type NumberFilterOperator =
  | 'equals'
  | 'doesNotEqual'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'between'
  | 'top10'
  | 'aboveAverage'
  | 'belowAverage';

export type DateFilterOperator =
  | 'today'
  | 'yesterday'
  | 'thisMonth'
  | 'lastMonth'
  | 'customRange';

export type FilterOperator =
  | TextFilterOperator
  | NumberFilterOperator
  | DateFilterOperator;

export interface FilterCriterion {
  operator: FilterOperator | '';
  value?: string;
}

export interface ColumnFilterCondition {
  criteria: FilterCriterion[];
  logicalOperator: 'and' | 'or';
}

export interface ColumnFilterConfig {
  values: string[] | null;
  condition: ColumnFilterCondition | null;
  color?: string | null;       // background color filter
  textColor?: string | null;   // font/text color filter
}

export interface FilterSortConfig {
  column: number;
  direction: 'asc' | 'desc' | 'color';
  color?: string | null;
  colorType?: 'background' | 'text'; // which color dimension to sort by
}

export interface FilterRange {
  headerRow: number;
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

export interface SheetFilterState {
  enabled: boolean;
  range: FilterRange | null;
  columns: Record<number, ColumnFilterConfig>;
  sort: FilterSortConfig | null;
}

export type SheetAction =
  | { type: 'SET_CELL'; id: CellId; value: string }
  | { type: 'SELECT_CELL'; id: CellId; multi?: boolean }
  | { type: 'SELECT_RANGE'; end: CellId; active?: CellId }
  | { type: 'UPDATE_STYLE'; style: Partial<CellStyle> }
  | { type: 'APPLY_BORDER'; borderType: BorderActionType; color?: string; styleOverride?: BorderType }
  | { type: 'SET_CELL_BORDER'; id: CellId; border: { side: 'top' | 'right' | 'bottom' | 'left'; style?: BorderType; color?: string } }
  | { type: 'COPY' }
  | { type: 'CUT' }
  | { type: 'PASTE' }
  | { type: 'PASTE_CONTENT'; data: ClipboardItem[][] }
  | { type: 'CLEAR_RANGE'; start: CellId; end: CellId }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESIZE_COL'; col: string; width: number }
  | { type: 'RESIZE_ROW'; row: number; height: number }
  | { type: 'AUTO_FIT_COL'; col: string }
  | { type: 'ADD_SHEET' }
  | { type: 'SWITCH_SHEET'; id: string }
  | { type: 'DELETE_SHEET'; id: string }
  | { type: 'RESET_WORKBOOK' }
  | { type: 'CLEAR_CLIPBOARD' }
  | { type: 'LOAD_WORKBOOK'; payload: WorkbookState }
  | { type: 'AUTO_FILL'; sourceRange: { start: CellId; end: CellId }; targetRange: { start: CellId; end: CellId } };

// Type for file list from /api/Workbooks (GET all)
export interface WorkbookListItem {
  id: string;
  name: string;
  creatorName: string | null;
  creatorDepartment: string | null;
  isOwner: boolean;
  canShare: boolean;
  accessType: 'Owner' | 'Live Shared' | 'Department Access';
}

export interface AuthSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  token: string;
}

export interface CreateUserFormData {
  name: string;
  employeeId: string;
  phoneNumber: string;
  managerName: string;
  department: Department;
  email: string;
  password: string;
  role: UserRole;
  accountStatus: AccountStatus;
}

export interface UpdateUserFormData {
  name: string;
  employeeId: string;
  phoneNumber: string;
  managerName: string;
  department: Department;
  email: string;
  password: string;
  role: UserRole;
}

export interface MyProfileData {
  id: string;
  name: string;
  employeeId: string;
  phoneNumber: string;
  managerName: string;
  department: string;
  role: UserRole;
  email: string;
  accountStatus: AccountStatus;
}

export interface UpdateMyProfileFormData {
  name: string;
  employeeId: string;
  phoneNumber: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  employeeId: string;
  managerName: string;
  department: string;
  role: UserRole;
  email: string;
  phoneNumber: string;
  accountStatus: AccountStatus;
  canManageStatus: boolean;
  canDeleteUser: boolean;
  canUpdateUser: boolean;
}

export interface ShareableUser {
  id: string;
  name: string;
  department: string;
  role: UserRole;
  email: string;
  accountStatus: AccountStatus;
}

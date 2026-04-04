// components/Ribbon.tsx
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { SheetAction, CellStyle, BorderActionType, BorderType, UserRole } from '../types';
import { ColorPalette } from './ColorPalette';
import { BorderPalette } from './BorderPalette';

interface RibbonProps {
  dispatch: React.Dispatch<SheetAction>;
  activeStyle?: CellStyle;
  activeTool: 'none' | 'draw_border' | 'draw_grid' | 'eraser';
  setTool: (tool: 'none' | 'draw_border' | 'draw_grid' | 'eraser') => void;
  activeLineColor: string;
  setLineColor: (color: string) => void;
  activeLineStyle: BorderType;
  setLineStyle: (style: BorderType) => void;
  fileName: string | null;
  onFileAction: (action: 'save' | 'save_as' | 'new' | 'open' | 'share') => void;
  isDirty: boolean;
  currentUserRole: UserRole;
  activeView: 'workbook' | 'user-management' | 'my-profile';
  onOpenUserManagement: () => void;
  onOpenMyProfile: () => void;
  onOpenWorkbook: () => void;
  onLogout: () => void;
  onPasteClick: () => void | Promise<void>;
  isFilterEnabled: boolean;
  onToggleFilter: () => void;
  onClearAllFilters: () => void;
}

const FONT_FAMILIES = [
  "Calibri", "Arial", "Times New Roman", "Verdana", "Helvetica",
  "Segoe UI", "Tahoma", "Trebuchet MS", "Georgia", "Garamond",
  "Courier New", "Brush Script MT", "Comic Sans MS"
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

const RibbonGroup = ({ label, children }: { label: string; children?: React.ReactNode }) => (
  <div className="flex flex-col items-center px-2 border-r border-gray-300 h-full justify-between pb-1">
    <div className="flex flex-wrap justify-center gap-1">{children}</div>
    <span className="text-[10px] text-gray-500 font-medium mt-1">{label}</span>
  </div>
);

const RibbonButton = ({ 
  icon, 
  label, 
  active, 
  onClick, 
  color 
}: { 
  icon: any; 
  label?: string; 
  active?: boolean; 
  onClick?: () => void;
  color?: string;
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-1 rounded hover:bg-gray-100 ${
      active ? 'bg-gray-200' : ''
    } min-w-[32px]`}
    title={label}
  >
    <Icon name={icon} size={18} className={color ? '' : 'text-gray-700'} />
    {color && <div className="h-1 w-4 mt-0.5" style={{ backgroundColor: color }} />}
    {label && <span className="text-[10px] text-gray-700 mt-0.5">{label}</span>}
  </button>
);

const FileMenu = ({
  fileName,
  onAction
}: {
  fileName: string | null;
  onAction: (action: 'save' | 'save_as' | 'new' | 'open' | 'share') => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative z-50">
      <div
        className={`px-4 py-1 hover:bg-[#0c5e31] cursor-pointer font-bold select-none ${isOpen ? 'bg-[#0c5e31]' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        File
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 w-48 bg-white shadow-xl border border-gray-200 py-1 text-sm text-gray-800 flex flex-col">
          <div
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
            onClick={() => { onAction('open'); setIsOpen(false); }}
          >
            <Icon name="FolderOpen" size={16} />
            <span>View Sheet</span>
          </div>

          {fileName && (
            <div
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
              onClick={() => { onAction('save'); setIsOpen(false); }}
            >
              <Icon name="Save" size={16} />
              <span>Save</span>
            </div>
          )}

          <div
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
            onClick={() => { onAction('save_as'); setIsOpen(false); }}
          >
            <Icon name="SaveAll" size={16} />
            <span>Save As...</span>
          </div>

          {fileName && (
            <div
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
              onClick={() => { onAction('share'); setIsOpen(false); }}
            >
              <Icon name="Share2" size={16} />
              <span>Share</span>
            </div>
          )}

          <div className="border-t border-gray-200 my-1"></div>

          <div
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
            onClick={() => { onAction('new'); setIsOpen(false); }}
          >
            <Icon name="FilePlus" size={16} />
            <span>New Sheet</span>
          </div>
        </div>
      )}
    </div>
  );
};

const OrientationDropdown = ({ 
  onSelect,
  activeRotation
}: { 
  onSelect: (rotation: number | 'vertical') => void;
  activeRotation?: number | 'vertical';
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<React.CSSProperties>({ opacity: 0 });

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-portal="orientation-dropdown"]')) return;
        if (containerRef.current && containerRef.current.contains(target)) return;
        setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useLayoutEffect(() => {
      if (!isOpen || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const top = rect.bottom;
      const left = rect.left;
      
      setPosition({
          position: 'fixed',
          top,
          left,
          zIndex: 10000,
          opacity: 1
      });
  }, [isOpen]);

  const options: { label: string; icon: any; rotation: number | 'vertical' }[] = [
      { label: 'Angle Counterclockwise', icon: 'TrendingUp', rotation: 45 },
      { label: 'Angle Clockwise', icon: 'TrendingDown', rotation: -45 },
      { label: 'Vertical Text', icon: 'ArrowDown', rotation: 'vertical' },
      { label: 'Rotate Text Up', icon: 'RotateCcw', rotation: 90 },
      { label: 'Rotate Text Down', icon: 'RotateCw', rotation: -90 },
  ];

  return (
    <div ref={containerRef} className="relative">
      <RibbonButton 
        icon="WrapText" 
        label="Orientation" 
        onClick={() => setIsOpen(!isOpen)} 
        active={isOpen || activeRotation !== undefined}
      />
      {isOpen && createPortal(
         <div 
            style={position}
            data-portal="orientation-dropdown"
            className="bg-white border border-gray-400 shadow-xl py-1 w-[200px] select-none"
         >
             {options.map((opt) => (
                 <div 
                    key={opt.label}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs"
                    onClick={() => {
                        onSelect(opt.rotation);
                        setIsOpen(false);
                    }}
                 >
                     <Icon name={opt.icon} size={14} className="text-gray-600" />
                     <span>{opt.label}</span>
                 </div>
             ))}
             <div className="border-t border-gray-200 mt-1 pt-1">
                <div 
                   className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs"
                   onClick={() => {
                       onSelect(0);
                       setIsOpen(false);
                   }}
                >
                    <Icon name="Minus" size={14} className="text-gray-600" />
                    <span>Format Cell Alignment</span>
                </div>
             </div>
         </div>,
         document.body
      )}
    </div>
  );
};

const ColorSplitButton = ({
  icon,
  selectedColor,
  onApply,
  onSelect,
  active,
  showNoColor
}: {
  icon: any;
  selectedColor: string;
  onApply: (color: string) => void;
  onSelect: (color: string | undefined) => void;
  active?: boolean;
  showNoColor?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      if (containerRef.current) {
        setTriggerRect(containerRef.current.getBoundingClientRect());
      }
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => setIsOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
        if (containerRef.current) setTriggerRect(containerRef.current.getBoundingClientRect());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative flex flex-col items-center justify-center">
      <div className="flex rounded hover:bg-gray-100 p-0.5">
        <button
          onClick={() => onApply(selectedColor)}
          className="flex flex-col items-center justify-center p-0.5 px-1 rounded hover:bg-gray-200"
          title="Apply Color"
        >
           <Icon name={icon} size={16} className="text-gray-700" />
           <div className="h-1 w-4 mt-0.5 border border-gray-300" style={{ backgroundColor: selectedColor || 'transparent' }} />
        </button>
        <button
          onClick={handleToggle}
          className={`flex items-center justify-center px-0.5 rounded hover:bg-gray-200 ${isOpen ? 'bg-gray-200' : ''}`}
          title="More Colors"
        >
          <Icon name="ChevronDown" size={10} className="text-gray-600" />
        </button>
      </div>
      {isOpen && (
        <ColorPalette 
          showNoColor={showNoColor}
          onSelect={(c) => { onSelect(c); setIsOpen(false); }}
          onClose={() => setIsOpen(false)}
          triggerRect={triggerRect}
        />
      )}
    </div>
  );
};

const BorderDropdown = ({ 
    onSelect, onToolSelect, onColorSelect, onStyleSelect, activeColor, activeStyle, activeTool 
}: { 
    onSelect: (type: BorderActionType) => void;
    onToolSelect: (tool: 'none' | 'draw_border' | 'draw_grid' | 'eraser') => void;
    onColorSelect: (color: string) => void;
    onStyleSelect: (style: BorderType) => void;
    activeColor: string;
    activeStyle: BorderType;
    activeTool: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLButtonElement>(null);
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  
    const handleToggle = () => {
      if (isOpen) {
        setIsOpen(false);
      } else {
        onToolSelect('none');
        if (containerRef.current) setTriggerRect(containerRef.current.getBoundingClientRect());
        setIsOpen(true);
      }
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleScroll = (e: Event) => {
            const target = e.target as HTMLElement;
            if (target && target.closest && target.closest('.border-palette-scroll-container')) {
                return;
            }
            setIsOpen(false);
        };
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [isOpen]);
  
    return (
      <>
        <button
          ref={containerRef}
          onClick={handleToggle}
          className={`flex flex-col items-center justify-center p-1 rounded hover:bg-gray-100 ${isOpen || activeTool !== 'none' ? 'bg-gray-200' : ''} min-w-[32px]`}
          title="Borders"
        >
          <div className="flex items-center gap-0.5">
            <Icon name={activeTool === 'draw_border' ? 'Pencil' : (activeTool === 'eraser' ? 'Eraser' : (activeTool === 'draw_grid' ? 'Grid' : 'Grid3X3'))} size={18} className="text-gray-700" />
            <Icon name="ChevronDown" size={10} className="text-gray-600" />
          </div>
        </button>
        {isOpen && (
          <BorderPalette 
            onSelect={(t) => { onSelect(t); setIsOpen(false); }}
            onToolSelect={(t) => { onToolSelect(t); setIsOpen(false); }}
            onColorSelect={onColorSelect}
            onStyleSelect={onStyleSelect}
            onClose={() => setIsOpen(false)}
            triggerRect={triggerRect}
            activeColor={activeColor}
            activeStyle={activeStyle}
            activeTool={activeTool}
          />
        )}
      </>
    );
};

export const Ribbon: React.FC<RibbonProps> = ({ 
    dispatch, activeStyle, 
    activeTool, setTool, activeLineColor, setLineColor, activeLineStyle, setLineStyle,
    fileName, onFileAction, isDirty, currentUserRole, activeView, onOpenUserManagement, onOpenMyProfile, onOpenWorkbook, onLogout, onPasteClick,
    isFilterEnabled, onToggleFilter, onClearAllFilters
}) => {
  const currentFontSize = activeStyle?.fontSize || 11;
  const currentFontFamily = activeStyle?.fontFamily || 'Calibri';
  
  const [lastFillColor, setLastFillColor] = useState<string>('yellow');
  const [lastTextColor, setLastTextColor] = useState<string>('red');
  const [activeTab, setActiveTab] = useState('Home');

  useEffect(() => {
    if (activeView !== 'workbook') {
      setActiveTab('Home');
    }
  }, [activeView]);

  const handleFontSizeStep = (step: number) => {
    let newSize = currentFontSize;
    let index = FONT_SIZES.findIndex(s => s === currentFontSize);
    
    if (index === -1) {
      if (step > 0) {
        newSize = FONT_SIZES.find(s => s > currentFontSize) || 72;
      } else {
        newSize = [...FONT_SIZES].reverse().find(s => s < currentFontSize) || 8;
      }
    } else {
      const nextIndex = Math.min(Math.max(index + step, 0), FONT_SIZES.length - 1);
      newSize = FONT_SIZES[nextIndex];
    }
    dispatch({ type: 'UPDATE_STYLE', style: { fontSize: newSize } });
  };

  const applyFillColor = (color: string | undefined) => {
    if (color) setLastFillColor(color);
    dispatch({ type: 'UPDATE_STYLE', style: { backgroundColor: color } });
  };

  const applyTextColor = (color: string | undefined) => {
    if (color) setLastTextColor(color);
    dispatch({ type: 'UPDATE_STYLE', style: { color: color } });
  };

  return (
    <div className="w-full bg-white flex flex-col border-b border-gray-300 relative z-40">
      <div className="bg-[#107c41] text-white flex text-xs items-center">
        <FileMenu fileName={fileName} onAction={onFileAction} />
        <button
          onClick={() => {
            onOpenWorkbook();
            setActiveTab('Home');
          }}
          className={`px-4 py-1 font-bold rounded-t-md mt-1 ml-1 border-t-2 ${
            activeView === 'workbook' && activeTab === 'Home'
              ? 'bg-white text-[#107c41] border-[#107c41]'
              : 'border-transparent hover:bg-[#0c5e31]'
          }`}
        >
          Home
        </button>
        {['Insert', 'Draw', 'Page Layout', 'Formulas', 'Data', 'Review', 'View'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              onOpenWorkbook();
              setActiveTab(tab);
            }}
            className={`px-4 py-1 mt-1 border-t-2 ${
              activeView === 'workbook' && activeTab === tab
                ? 'bg-white text-[#107c41] border-[#107c41]'
                : 'border-transparent hover:bg-[#0c5e31]'
            }`}
          >
            {tab}
          </button>
        ))}
        <button
          onClick={onOpenUserManagement}
          className={`mt-1 flex items-center gap-1 px-4 py-1 ${
            activeView === 'user-management' ? 'bg-[#0c5e31]' : 'hover:bg-[#0c5e31]'
          }`}
          title="User Management"
        >
          <Icon name="Users" size={14} className="text-white" />
          <span>User Management</span>
        </button>
        <button
          onClick={onOpenMyProfile}
          className={`mt-1 flex items-center gap-1 px-4 py-1 ${
            activeView === 'my-profile' ? 'bg-[#0c5e31]' : 'hover:bg-[#0c5e31]'
          }`}
          title="My Profile"
        >
          <Icon name="UserRound" size={14} className="text-white" />
          <span>My Profile</span>
        </button>
        {/* <div className="px-4 py-1 hover:bg-[#0c5e31] cursor-pointer mt-1">Help</div> */}
        {fileName && (
           <div className="ml-auto px-4 py-1 opacity-90 font-normal italic flex items-center gap-1">
               <span>{fileName}</span>
               {isDirty && <span className="text-white font-bold text-lg leading-none" title="Unsaved changes">*</span>}
           </div>
        )}
        <button
          onClick={onLogout}
          className="mt-1 flex items-center gap-1 px-4 py-1 hover:bg-[#0c5e31]"
          title="Logout"
        >
          <Icon name="LogOut" size={14} className="text-white" />
          <span>Logout</span>
        </button>
      </div>

      <div className="flex items-stretch bg-[#f5f5f5] h-24 p-1 overflow-x-auto shadow-sm">
        {activeTab === 'Data' ? (
          <>
            <RibbonGroup label="Sort & Filter">
              <div className="flex gap-2 items-center h-full">
                <button
                  onClick={onToggleFilter}
                  className={`flex min-w-[88px] flex-col items-center justify-center rounded border px-3 py-2 text-xs font-medium ${
                    isFilterEnabled
                      ? 'border-[#107c41] bg-[#e8f3ec] text-[#107c41]'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon name={isFilterEnabled ? 'FunnelX' : 'Funnel'} size={18} />
                  <span className="mt-1">{isFilterEnabled ? 'Disable Filter' : 'Filter'}</span>
                </button>
                <button
                  onClick={onClearAllFilters}
                  className="flex min-w-[88px] flex-col items-center justify-center rounded border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Icon name="ListRestart" size={18} />
                  <span className="mt-1">Clear Filters</span>
                </button>
              </div>
            </RibbonGroup>
          </>
        ) : (
          <>
        <RibbonGroup label="Clipboard">
           <RibbonButton icon="Clipboard" label="Paste" onClick={() => { void onPasteClick(); }} />
           <div className="flex flex-col gap-1">
             <RibbonButton icon="Scissors" onClick={() => dispatch({ type: 'CUT' })} />
             <RibbonButton icon="Copy" onClick={() => dispatch({ type: 'COPY' })} />
           </div>
        </RibbonGroup>

        <RibbonGroup label="Font">
          <div className="flex flex-col gap-1">
            <div className="flex gap-1 items-center mb-1">
              <select 
                className="text-xs border p-0.5 rounded w-32 outline-none focus:border-[#107c41]"
                value={currentFontFamily}
                onChange={(e) => dispatch({ type: 'UPDATE_STYLE', style: { fontFamily: e.target.value } })}
              >
                {FONT_FAMILIES.map(font => (
                  <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                ))}
              </select>
              <select 
                className="text-xs border p-0.5 rounded w-14 outline-none focus:border-[#107c41]"
                value={currentFontSize}
                onChange={(e) => dispatch({ type: 'UPDATE_STYLE', style: { fontSize: parseInt(e.target.value) } })}
              >
                {FONT_SIZES.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <div className="flex gap-0 ml-1 bg-white rounded border border-gray-300">
                <button className="p-1 hover:bg-gray-100 text-gray-700" onClick={() => handleFontSizeStep(1)}>
                  <Icon name="AArrowUp" size={14} />
                </button>
                <div className="w-[1px] bg-gray-300"></div>
                <button className="p-1 hover:bg-gray-100 text-gray-700" onClick={() => handleFontSizeStep(-1)}>
                  <Icon name="AArrowDown" size={14} />
                </button>
              </div>
            </div>

            <div className="flex gap-0.5 items-center">
              <RibbonButton 
                icon="Bold" 
                active={activeStyle?.bold} 
                onClick={() => dispatch({ type: 'UPDATE_STYLE', style: { bold: !activeStyle?.bold } })} 
              />
              <RibbonButton 
                icon="Italic" 
                active={activeStyle?.italic} 
                onClick={() => dispatch({ type: 'UPDATE_STYLE', style: { italic: !activeStyle?.italic } })} 
              />
              <select 
                className={`h-[28px] border border-gray-300 rounded text-xs px-1 outline-none focus:border-[#107c41] ${activeStyle?.underline ? 'bg-gray-200' : 'bg-white'}`}
                value={activeStyle?.underline || 'none'}
                onChange={(e) => dispatch({ 
                    type: 'UPDATE_STYLE', 
                    style: { underline: e.target.value === 'none' ? undefined : e.target.value as 'single' | 'double' } 
                })}
              >
                <option value="none">None</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
              </select>

              <BorderDropdown 
                onSelect={(type) => {
                    dispatch({ type: 'APPLY_BORDER', borderType: type, color: activeLineColor, styleOverride: activeLineStyle });
                    setTool('none'); 
                }}
                onToolSelect={setTool}
                onColorSelect={setLineColor}
                onStyleSelect={(style) => {
                    setLineStyle(style);
                    setTool('draw_border');
                }}
                activeColor={activeLineColor}
                activeStyle={activeLineStyle}
                activeTool={activeTool}
              />

               <div className="border-l border-gray-300 mx-1 h-5"></div>
               
               <ColorSplitButton 
                 icon="PaintBucket"
                 selectedColor={lastFillColor}
                 onApply={(color) => applyFillColor(color)}
                 onSelect={(color) => applyFillColor(color)}
                 showNoColor={true}
               />
               <ColorSplitButton 
                 icon="Type"
                 selectedColor={lastTextColor}
                 onApply={(color) => applyTextColor(color)}
                 onSelect={(color) => applyTextColor(color)}
               />
            </div>
          </div>
        </RibbonGroup>

        <RibbonGroup label="Alignment">
           <div className="flex flex-col gap-1">
              <div className="flex gap-1">
                 <RibbonButton 
                    icon="AlignLeft" 
                    active={activeStyle?.align === 'left'} 
                    onClick={() => dispatch({ type: 'UPDATE_STYLE', style: { align: 'left' } })} 
                 />
                 <RibbonButton 
                    icon="AlignCenter" 
                    active={activeStyle?.align === 'center'} 
                    onClick={() => dispatch({ type: 'UPDATE_STYLE', style: { align: 'center' } })} 
                 />
                 <RibbonButton 
                    icon="AlignRight" 
                    active={activeStyle?.align === 'right'} 
                    onClick={() => dispatch({ type: 'UPDATE_STYLE', style: { align: 'right' } })} 
                 />
                 <div className="border-l border-gray-300 mx-0.5 h-6"></div>
                 <OrientationDropdown 
                    activeRotation={activeStyle?.textRotation}
                    onSelect={(rotation) => dispatch({ type: 'UPDATE_STYLE', style: { textRotation: rotation } })}
                 />
              </div>
              <div className="flex gap-1 justify-center w-full">
                 <RibbonButton 
                   icon="WrapText" 
                   active={activeStyle?.wrapText}
                   onClick={() => dispatch({ type: 'UPDATE_STYLE', style: { wrapText: !activeStyle?.wrapText } })}
                 />
                 <RibbonButton icon="Merge" />
              </div>
           </div>
        </RibbonGroup>

         <RibbonGroup label="Number">
           <div className="flex flex-col gap-1">
              <select 
                className="text-xs border p-0.5 rounded w-28" 
                value={activeStyle?.format || 'general'}
                onChange={(e) => dispatch({ type: 'UPDATE_STYLE', style: { format: e.target.value as any } })}
              >
                <option value="general">General</option>
                <option value="number">Number</option>
                <option value="currency">Currency</option>
                <option value="percent">Percentage</option>
                <option value="date">Short Date</option>
              </select>
              <div className="flex gap-1">
                 <RibbonButton icon="DollarSign" onClick={() => dispatch({ type: 'UPDATE_STYLE', style: { format: 'currency' } })} />
                 <RibbonButton icon="Percent" onClick={() => dispatch({ type: 'UPDATE_STYLE', style: { format: 'percent' } })} />
              </div>
           </div>
        </RibbonGroup>

        <RibbonGroup label="Cells">
            <div className="flex flex-col gap-1">
                <RibbonButton icon="ListPlus" label="Insert" onClick={() => alert("Insert logic here")} />
                <RibbonButton icon="Trash" label="Delete" onClick={() => dispatch({ type: 'UPDATE_STYLE', style: {} })} /> 
            </div>
        </RibbonGroup>

         <RibbonGroup label="Editing">
             <div className="flex gap-2">
               <RibbonButton icon="Undo" label="Undo" onClick={() => dispatch({ type: 'UNDO' })} />
               <RibbonButton icon="Redo" label="Redo" onClick={() => dispatch({ type: 'REDO' })} />
             </div>
        </RibbonGroup>
          </>
        )}
      </div>
    </div>
  );
};

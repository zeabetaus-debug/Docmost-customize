import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BorderActionType, BorderType } from '../types';
import { Icon } from './Icon';
import { ColorPalette } from './ColorPalette';

interface BorderPaletteProps {
  onSelect: (type: BorderActionType) => void;
  onToolSelect: (tool: 'draw_border' | 'draw_grid' | 'eraser') => void;
  onColorSelect: (color: string) => void;
  onStyleSelect: (style: BorderType) => void;
  onClose: () => void;
  triggerRect: DOMRect | null;
  activeColor: string;
  activeStyle: BorderType;
  activeTool: string;
}

// Helper to draw border icons with CSS
const BorderIcon = ({ type }: { type: BorderActionType }) => {
  const base = "w-4 h-4 border-gray-300 relative";
  const Line = ({ className }: { className: string }) => <div className={`absolute bg-black ${className}`} />;

  switch(type) {
    case 'bottom': return <div className={base}><Line className="bottom-0 left-0 w-full h-[1px]" /></div>;
    case 'top': return <div className={base}><Line className="top-0 left-0 w-full h-[1px]" /></div>;
    case 'left': return <div className={base}><Line className="top-0 left-0 w-[1px] h-full" /></div>;
    case 'right': return <div className={base}><Line className="top-0 right-0 w-[1px] h-full" /></div>;
    case 'no_border': return <div className="w-4 h-4 border border-dashed border-gray-400 opacity-50 relative flex items-center justify-center text-[8px]"></div>;
    case 'all': return <div className="w-4 h-4 border border-black flex items-center justify-center relative"><div className="w-full h-[1px] bg-black absolute" /><div className="h-full w-[1px] bg-black absolute" /></div>;
    case 'outside': return <div className="w-4 h-4 border border-black"></div>;
    case 'thick_outside': return <div className="w-4 h-4 border-2 border-black"></div>;
    case 'bottom_double': return <div className={base}><div className="absolute bottom-0 left-0 w-full h-[3px] border-b-2 border-black border-double" /></div>;
    case 'thick_bottom': return <div className={base}><Line className="bottom-0 left-0 w-full h-[2px]" /></div>;
    case 'top_bottom': return <div className={base}><Line className="top-0 left-0 w-full h-[1px]" /><Line className="bottom-0 left-0 w-full h-[1px]" /></div>;
    case 'top_thick_bottom': return <div className={base}><Line className="top-0 left-0 w-full h-[1px]" /><Line className="bottom-0 left-0 w-full h-[2px]" /></div>;
    case 'top_double_bottom': return <div className={base}><Line className="top-0 left-0 w-full h-[1px]" /><div className="absolute bottom-0 left-0 w-full h-[3px] border-b-2 border-black border-double" /></div>;
    default: return <div className={base}></div>;
  }
};

const BORDER_OPTIONS: { type: BorderActionType; label: string }[] = [
  { type: 'bottom', label: 'Bottom Border' },
  { type: 'top', label: 'Top Border' },
  { type: 'left', label: 'Left Border' },
  { type: 'right', label: 'Right Border' },
  { type: 'no_border', label: 'No Border' },
  { type: 'all', label: 'All Borders' },
  { type: 'outside', label: 'Outside Borders' },
  { type: 'thick_outside', label: 'Thick Outside Borders' },
  { type: 'bottom_double', label: 'Bottom Double Border' },
  { type: 'thick_bottom', label: 'Thick Bottom Border' },
  { type: 'top_bottom', label: 'Top and Bottom Border' },
  { type: 'top_thick_bottom', label: 'Top and Thick Bottom Border' },
  { type: 'top_double_bottom', label: 'Top and Double Bottom Border' },
];

const LINE_STYLES: { type: BorderType; label: string; preview: React.ReactNode }[] = [
    { 
      type: 'none', 
      label: 'None', 
      preview: <div className="text-gray-400 text-[10px] italic">None</div> 
    },
    { 
      type: 'thin', 
      label: 'Thin', 
      preview: <div className="w-full border-b border-black h-[1px]" /> 
    },
    { 
      type: 'medium', 
      label: 'Medium', 
      preview: <div className="w-full border-b-[2px] border-black h-[2px]" /> 
    },
    { 
      type: 'thick', 
      label: 'Thick', 
      preview: <div className="w-full border-b-[3px] border-black h-[3px]" /> 
    },
    { 
      type: 'dotted', 
      label: 'Dotted', 
      preview: <div className="w-full border-b border-dotted border-black h-[1px]" /> 
    },
    { 
      type: 'dashed', 
      label: 'Dashed', 
      preview: <div className="w-full border-b border-dashed border-black h-[1px]" /> 
    },
    { 
      type: 'long_dashed', 
      label: 'Long Dashed', 
      preview: <div className="w-full h-[1px]" style={{background: 'repeating-linear-gradient(90deg, black, black 8px, transparent 8px, transparent 12px)'}} /> 
    },
    { 
      type: 'dash_dot', 
      label: 'Dash Dot', 
      preview: <div className="w-full h-[1px]" style={{background: 'repeating-linear-gradient(90deg, black, black 6px, transparent 6px, transparent 9px, black 9px, black 11px, transparent 11px, transparent 14px)'}} /> 
    },
    { 
      type: 'dash_dot_dot', 
      label: 'Dash Dot Dot', 
      preview: <div className="w-full h-[1px]" style={{background: 'repeating-linear-gradient(90deg, black, black 6px, transparent 6px, transparent 9px, black 9px, black 11px, transparent 11px, transparent 14px, black 14px, black 16px, transparent 16px, transparent 19px)'}} /> 
    },
    { 
      type: 'double', 
      label: 'Double', 
      preview: <div className="w-full border-b-[3px] border-double border-black h-[3px]" /> 
    },
];

const LineStyleFlyout = ({ 
    triggerRect, 
    onSelect, 
    onClose,
    activeStyle
}: { 
    triggerRect: DOMRect; 
    onSelect: (t: BorderType) => void; 
    onClose: () => void; 
    activeStyle: BorderType;
}) => {
    const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0 });

    useLayoutEffect(() => {
        if (!triggerRect) return;
        
        const width = 140;
        const height = LINE_STYLES.length * 34; // approx height
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = triggerRect.right - 4; // Overlap slightly
        let top = triggerRect.top;

        // Flip to left if not enough space
        if (left + width > viewportWidth) {
            left = triggerRect.left - width + 4;
        }

        // Adjust vertically if needed
        if (top + height > viewportHeight) {
            top = viewportHeight - height - 10;
        }

        setStyle({
            position: 'fixed',
            top,
            left,
            zIndex: 10000,
            opacity: 1
        });
    }, [triggerRect]);

    return createPortal(
        <div 
            className="bg-white border border-gray-400 shadow-xl py-1 w-[140px] select-none text-left cursor-default"
            style={style}
            data-portal="line-style-palette"
            onMouseLeave={onClose}
        >
             {LINE_STYLES.map(style => {
                const isActive = activeStyle === style.type;
                return (
                    <div 
                        key={style.type}
                        className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer h-8 relative ${isActive ? 'bg-gray-50' : ''}`}
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            onSelect(style.type); 
                            // Don't call onClose() here because onSelect closes the entire palette which unmounts this component.
                        }}
                        title={style.label}
                    >
                        {isActive && (
                            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-700">
                                <Icon name="Pencil" size={10} />
                            </div>
                        )}

                        {/* Centered preview */}
                        <div className="w-full flex items-center justify-center h-4 pointer-events-none pl-1">
                            {style.preview}
                        </div>
                    </div>
                );
            })}
        </div>,
        document.body
    );
};

export const BorderPalette: React.FC<BorderPaletteProps> = ({ 
  onSelect, onToolSelect, onColorSelect, onStyleSelect, onClose, triggerRect, activeColor, activeStyle, activeTool 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const colorTriggerRef = useRef<HTMLDivElement>(null);
  const styleTriggerRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0, position: 'fixed', zIndex: 9999 });
  const [activeSubMenu, setActiveSubMenu] = useState<'none' | 'color' | 'style'>('none');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking inside the main palette
      if (containerRef.current && containerRef.current.contains(target)) {
        return;
      }
      // Don't close if clicking inside a ColorPalette portal (submenu)
      if (target.closest('[data-portal="color-palette"]')) {
        return;
      }
      // Don't close if clicking inside a LineStyle portal (submenu)
      if (target.closest('[data-portal="line-style-palette"]')) {
        return;
      }
      // If clicking totally outside, close everything.
      onClose();
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [onClose]);

  useLayoutEffect(() => {
    if (!triggerRect || !containerRef.current) return;
    const { height, width } = containerRef.current.getBoundingClientRect();
    const { top, left, bottom } = triggerRect;
    const viewportWidth = window.innerWidth;
    
    // Default Excel behavior: Open downwards if space, else up.
    let finalTop = top < height ? bottom : top - height;
    let finalLeft = left;

    if (finalLeft + width > viewportWidth) finalLeft = viewportWidth - width - 10;
    if (finalLeft < 0) finalLeft = 10;

    setStyle({
      position: 'fixed',
      top: finalTop,
      left: finalLeft,
      zIndex: 9999,
      opacity: 1
    });
  }, [triggerRect]);

  const handleColorSelect = (c: string | undefined) => {
      if (c) onColorSelect(c);
      setActiveSubMenu('none');
  };

  return createPortal(
    <div 
      ref={containerRef}
      style={style}
      className="border-palette-scroll-container bg-white border border-gray-400 shadow-xl py-1 w-[220px] select-none text-left cursor-default flex flex-col max-h-[80vh] overflow-y-auto"
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="text-[11px] font-semibold text-gray-500 px-3 py-1 bg-gray-50 border-b border-gray-200 mb-1">Borders</div>
      {BORDER_OPTIONS.map((opt, idx) => (
        <div 
          key={opt.type}
          className={`flex items-center gap-3 px-3 py-1.5 hover:bg-gray-100 cursor-pointer ${idx === 4 || idx === 7 ? 'border-b border-gray-200 mb-1 pb-1.5' : ''}`}
          onClick={() => { onSelect(opt.type); onClose(); }}
          title={opt.label}
        >
          <div className="flex items-center justify-center w-5 h-5">
             <BorderIcon type={opt.type} />
          </div>
          <span className="text-xs text-gray-700">{opt.label}</span>
        </div>
      ))}

      {/* Draw Borders Section */}
      <div className="text-[11px] font-semibold text-gray-500 px-3 py-1 bg-gray-50 border-y border-gray-200 mt-1 mb-1">Draw Borders</div>
      
      <div 
         className={`flex items-center gap-3 px-3 py-1.5 hover:bg-gray-100 cursor-pointer ${activeTool === 'draw_border' ? 'bg-gray-200' : ''}`} 
         onClick={() => { onToolSelect('draw_border'); onClose(); }}
      >
          <div className="w-5 h-5 flex items-center justify-center"><Icon name="Pencil" size={14} /></div>
          <span className="text-xs text-gray-700">Draw Border</span>
      </div>
      <div 
         className={`flex items-center gap-3 px-3 py-1.5 hover:bg-gray-100 cursor-pointer ${activeTool === 'draw_grid' ? 'bg-gray-200' : ''}`} 
         onClick={() => { onToolSelect('draw_grid'); onClose(); }}
      >
          <div className="w-5 h-5 flex items-center justify-center"><Icon name="Grid" size={14} /></div>
          <span className="text-xs text-gray-700">Draw Border Grid</span>
      </div>
      <div 
         className={`flex items-center gap-3 px-3 py-1.5 hover:bg-gray-100 cursor-pointer border-b border-gray-200 mb-1 pb-1.5 ${activeTool === 'eraser' ? 'bg-gray-200' : ''}`} 
         onClick={() => { onToolSelect('eraser'); onClose(); }}
      >
          <div className="w-5 h-5 flex items-center justify-center"><Icon name="Eraser" size={14} /></div>
          <span className="text-xs text-gray-700">Erase Border</span>
      </div>

      {/* Line Color */}
      <div 
        ref={colorTriggerRef}
        className="flex items-center gap-3 px-3 py-1.5 hover:bg-gray-100 cursor-pointer relative justify-between group"
        onClick={() => setActiveSubMenu(activeSubMenu === 'color' ? 'none' : 'color')}
        onMouseEnter={() => setActiveSubMenu('color')}
      >
        <div className="flex items-center gap-3">
            <div className="w-5 h-5 flex items-center justify-center relative">
                <Icon name="Palette" size={14} />
                <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-gray-300" style={{ backgroundColor: activeColor }}></div>
            </div>
            <span className="text-xs text-gray-700">Line Color</span>
        </div>
        <Icon name="ChevronRight" size={12} className="text-gray-500" />
        
        {activeSubMenu === 'color' && (
             <ColorPalette 
                onSelect={handleColorSelect}
                onClose={() => setActiveSubMenu('none')}
                triggerRect={colorTriggerRef.current?.getBoundingClientRect() || null}
                align="side"
             />
        )}
      </div>

      {/* Line Style */}
      <div 
        ref={styleTriggerRef}
        className="flex items-center gap-3 px-3 py-1.5 hover:bg-gray-100 cursor-pointer relative justify-between group"
        onMouseEnter={() => setActiveSubMenu('style')}
        onClick={() => setActiveSubMenu(activeSubMenu === 'style' ? 'none' : 'style')}
      >
        <div className="flex items-center gap-3">
             <div className="w-5 h-5 flex items-center justify-center"><Icon name="Minus" size={14} /></div>
             <span className="text-xs text-gray-700">Line Style</span>
        </div>
        
        {/* Visual Indicator of Active Style (Pencil) */}
        <div className="flex items-center gap-1">
             {activeStyle && activeStyle !== 'thin' && (
                 <Icon name="Pencil" size={10} className="text-gray-500" />
             )}
             <Icon name="ChevronRight" size={12} className="text-gray-500" />
        </div>

        {activeSubMenu === 'style' && (
            <LineStyleFlyout 
                triggerRect={styleTriggerRef.current?.getBoundingClientRect() || new DOMRect()}
                onSelect={(s) => { 
                    onStyleSelect(s); 
                    onClose(); // Close main palette on style select
                }}
                onClose={() => setActiveSubMenu('none')}
                activeStyle={activeStyle}
            />
        )}
      </div>

    </div>,
    document.body
  );
};
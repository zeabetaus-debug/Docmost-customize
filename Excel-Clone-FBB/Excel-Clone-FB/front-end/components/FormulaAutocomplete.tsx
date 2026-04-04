import React, { useRef } from 'react';

interface FormulaAutocompleteProps {
  keyword: string;
  suggestions: string[];
  selectedIndex: number;
  onSelect: (formula: string) => void;
  onMouseEnter: (index: number) => void;
  anchorRect?: { left: number; top: number; width: number; height: number };
  style?: React.CSSProperties;
}

const FormulaAutocomplete: React.FC<FormulaAutocompleteProps> = ({
  keyword,
  suggestions,
  selectedIndex,
  onSelect,
  onMouseEnter,
  anchorRect,
  style: customStyle
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Force reflow to ensure UI updates instantly
  React.useEffect(() => {
    if (containerRef.current) {
      const el = containerRef.current;
      el.style.display = 'none';
      void el.offsetHeight; // trigger reflow
      el.style.display = 'block';
    }
    console.log("Rendering suggestions:", suggestions);
  }, [keyword, suggestions]);

  if (!keyword || suggestions.length === 0) return null;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: anchorRect?.left ?? 0,
    top: anchorRect ? (anchorRect.top + anchorRect.height) : '100%',
    minWidth: '180px',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    zIndex: 9999,
    maxHeight: '240px',
    overflowY: 'auto',
    borderRadius: '4px',
    padding: '4px 0',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    transform: 'translateZ(0)',
    willChange: 'transform',
    ...customStyle
  };

  return (
    <div ref={containerRef} style={style} onMouseDown={e => e.stopPropagation()}>
      {suggestions.map((f, i) => (
        <div
          key={f}
          onMouseDown={(e) => {
            // Prevent input from losing focus
            e.preventDefault();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(f);
          }}
          style={{
            padding: '4px 8px',
            backgroundColor: i === selectedIndex ? '#005a9e' : 'transparent',
            cursor: 'pointer',
            fontSize: '12px',
            color: i === selectedIndex ? 'white' : '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textTransform: 'uppercase'
          }}
          onMouseEnter={() => onMouseEnter(i)}
        >
          <div style={{ 
            width: '16px', 
            height: '16px', 
            border: `1px solid ${i === selectedIndex ? 'white' : '#666'}`,
            borderRadius: '50%',
            fontSize: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontStyle: 'italic',
            flexShrink: 0
          }}>fx</div>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {f}
          </span>
        </div>
      ))}
    </div>
  );
};

export default React.memo(FormulaAutocomplete);
export { FormulaAutocomplete };

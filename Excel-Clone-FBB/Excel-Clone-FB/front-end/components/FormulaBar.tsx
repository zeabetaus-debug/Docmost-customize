import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { CellId } from '../types';
import { useFormulaAutocomplete } from '../hooks/useFormulaAutocomplete';
import FormulaAutocomplete from './FormulaAutocomplete';

interface FormulaBarProps {
  activeCellId: CellId | null;
  value: string;
  onChange: (val: string) => void;
  onEnter: () => void;
}

export const FormulaBar: React.FC<FormulaBarProps> = ({ activeCellId, value, onChange, onEnter }) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync when selection changes externally
  useEffect(() => {
    setLocalValue(value);
  }, [value, activeCellId]);

  const { suggestions, selectedIndex, handleKeyDown: handleAutocompleteKeyDown, setSelectedIndex: onAutocompleteMouseEnter } = useFormulaAutocomplete(
    localValue.startsWith('=') ? localValue.slice(1) : '',
    (formula) => {
      const newValue = `=${formula}()`;
      setLocalValue(newValue);
      onChange(newValue);
      setTimeout(() => {
        const input = document.getElementById('formula-bar-input') as HTMLInputElement;
        if (input) {
          input.focus();
          const pos = newValue.length - 1;
          input.setSelectionRange(pos, pos);
        }
      }, 0);
    },
    () => { /* onClose logic if needed */ }
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (handleAutocompleteKeyDown(e)) {
      return;
    }

    if (e.key === 'Enter') {
      onEnter();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div className="flex items-center gap-2 p-1 border-b border-gray-300 bg-white h-8 text-sm overflow-visible z-[60]">
        <div className="w-10 text-center border-r border-gray-300 font-bold text-gray-600 truncate">
            {activeCellId || ''}
        </div>
        <div className="flex gap-2 px-2 text-gray-400">
            <Icon name="X" size={14} className="hover:text-red-500 cursor-pointer" />
            <Icon name="Check" size={14} className="hover:text-green-500 cursor-pointer" onClick={onEnter} />
            <Icon name="FunctionSquare" size={14} className="hover:text-blue-500 cursor-pointer" />
        </div>
        <div className="flex-1 relative h-full">
            <input 
                className="w-full outline-none h-full px-2" 
                value={localValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                id="formula-bar-input"
            />
            {localValue.startsWith('=') && (
                <FormulaAutocomplete
                    keyword={localValue.slice(1)}
                    suggestions={suggestions}
                    selectedIndex={selectedIndex}
                    onSelect={(formula) => {
                        const newValue = `=${formula}()`;
                        setLocalValue(newValue);
                        onChange(newValue);
                        setTimeout(() => {
                            const input = document.getElementById('formula-bar-input') as HTMLInputElement;
                            if (input) {
                                input.focus();
                                const pos = newValue.length - 1;
                                input.setSelectionRange(pos, pos);
                            }
                        }, 0);
                    }}
                    onMouseEnter={onAutocompleteMouseEnter}
                    style={{ top: '100%', left: 0 }}
                />
            )}
        </div>
    </div>
  );
};

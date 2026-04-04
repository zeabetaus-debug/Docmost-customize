import React, { useState } from 'react';
import { FilterOperator, FilterCriterion, ColumnFilterCondition, FilterDataType } from '../types';
import { Icon } from './Icon';

interface CustomFilterModalProps {
    columnName: string;
    dataType: FilterDataType;
    initialCondition: ColumnFilterCondition | null;
    onApply: (condition: ColumnFilterCondition) => void;
    onClose: () => void;
}

const TEXT_OPERATOR_OPTIONS = [
    { label: 'equals', value: 'equals' },
    { label: 'does not equal', value: 'doesNotEqual' },
    { label: 'begins with', value: 'startsWith' },
    { label: 'ends with', value: 'endsWith' },
    { label: 'contains', value: 'contains' },
    { label: 'does not contain', value: 'doesNotContain' },
];

const NUMBER_OPERATOR_OPTIONS = [
    { label: 'is equal to', value: 'equals' },
    { label: 'is not equal to', value: 'doesNotEqual' },
    { label: 'is greater than', value: 'greaterThan' },
    { label: 'is greater than or equal to', value: 'greaterThanOrEqual' },
    { label: 'is less than', value: 'lessThan' },
    { label: 'is less than or equal to', value: 'lessThanOrEqual' },
];

export const CustomFilterModal: React.FC<CustomFilterModalProps> = ({
    columnName,
    dataType,
    initialCondition,
    onApply,
    onClose,
}) => {
    const [criteria, setCriteria] = useState<FilterCriterion[]>(() => {
        if (initialCondition?.criteria && initialCondition.criteria.length > 0) {
            if (initialCondition.criteria.length === 1) {
                return [initialCondition.criteria[0], { operator: '', value: '' }];
            }
            return initialCondition.criteria;
        }
        // If it's a number column, default to 'equals', but if it's text, it's also 'equals'
        return [{ operator: 'equals', value: '' }, { operator: '', value: '' }];
    });
    const [logicalOperator, setLogicalOperator] = useState<'and' | 'or'>(initialCondition?.logicalOperator || 'and');

    const operators = dataType === 'number' ? NUMBER_OPERATOR_OPTIONS : TEXT_OPERATOR_OPTIONS;

    const handleApply = () => {
        onApply({
            criteria: criteria.filter(c => c.operator !== ''),
            logicalOperator
        });
    };

    const updateCriterion = (index: number, updates: Partial<FilterCriterion>) => {
        const next = [...criteria];
        next[index] = { ...next[index], ...updates };
        setCriteria(next);
    };

    return (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/20" onMouseDown={onClose}>
            <div
                className="bg-white border border-gray-400 shadow-2xl w-[450px] rounded-sm p-5 overflow-hidden font-sans"
                onMouseDown={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[14px] text-gray-800">Custom AutoFilter</h2>
                    <button onClick={onClose} className="hover:bg-gray-100 p-1 rounded-sm transition-colors">
                        <Icon name="X" size={14} className="text-gray-500" />
                    </button>
                </div>

                <div className="text-[13px] text-[#333]">
                    <div className="mb-4">
                        <p className="mb-2">Show rows where:</p>
                        <p className="font-bold text-[14px]">{columnName}</p>
                    </div>

                    <div className="space-y-4">
                        {/* First Criterion */}
                        <div className="flex gap-4 items-center">
                            <select
                                className="flex-1 border border-gray-300 rounded-sm p-1 h-[28px] outline-none hover:border-blue-400 focus:border-blue-500 transition-colors"
                                value={criteria[0].operator}
                                onChange={e => updateCriterion(0, { operator: e.target.value as FilterOperator })}
                            >
                                {operators.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <input
                                type="text"
                                className="flex-1 border border-gray-300 rounded-sm p-1 h-[28px] outline-none hover:border-blue-400 focus:border-blue-500 transition-colors"
                                value={criteria[0].value || ''}
                                onChange={e => updateCriterion(0, { value: e.target.value })}
                            />
                        </div>

                        {/* Logical Operator */}
                        <div className="flex gap-6 pl-4 items-center h-[30px]">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    className="w-3 h-3 cursor-pointer"
                                    checked={logicalOperator === 'and'}
                                    onChange={() => setLogicalOperator('and')}
                                />
                                <span className="group-hover:text-blue-600 transition-colors">And</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    className="w-3 h-3 cursor-pointer"
                                    checked={logicalOperator === 'or'}
                                    onChange={() => setLogicalOperator('or')}
                                />
                                <span className="group-hover:text-blue-600 transition-colors">Or</span>
                            </label>
                        </div>

                        {/* Second Criterion */}
                        <div className="flex gap-4 items-center">
                            <select
                                className="flex-1 border border-gray-300 rounded-sm p-1 h-[28px] outline-none hover:border-blue-400 focus:border-blue-500 transition-colors"
                                value={criteria[1].operator}
                                onChange={e => updateCriterion(1, { operator: e.target.value as FilterOperator })}
                            >
                                <option value="">(None)</option>
                                {operators.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <input
                                type="text"
                                className="flex-1 border border-gray-300 rounded-sm p-1 h-[28px] outline-none hover:border-blue-400 focus:border-blue-500 transition-colors"
                                value={criteria[1].value || ''}
                                onChange={e => updateCriterion(1, { value: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-100 text-[#666] text-[11px] leading-relaxed">
                        <p>Use ? to represent any single character</p>
                        <p>Use * to represent any series of characters</p>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            className="min-w-[75px] h-[30px] px-4 bg-white border border-gray-300 rounded-sm hover:border-blue-500 hover:bg-blue-50 transition-all text-[13px] active:scale-95"
                            onClick={handleApply}
                        >
                            OK
                        </button>
                        <button
                            className="min-w-[75px] h-[30px] px-4 bg-white border border-gray-300 rounded-sm hover:border-red-400 hover:bg-red-50 transition-all text-[13px] active:scale-95"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

import { evaluateFormula } from './Excel-Clone-FB/front-end/utils/formulas.ts';

const evalCell = (id: string) => {
  if (id === 'F7') return 3;
  if (id === 'G7') return 3;
  if (id === 'A1') return 10;
  if (id === 'A2') return 20;
  return 0;
};

console.log("--- Formula Verification ---");
console.log("=SUM(F7,G7) expected 6, got:", evaluateFormula("SUM(F7,G7)", evalCell));
console.log("=SUM(1,2,3) expected 6, got:", evaluateFormula("SUM(1,2,3)", evalCell));
console.log("=SUM(A1:A2, 5) expected 35, got:", evaluateFormula("SUM(A1:A2, 5)", evalCell));
console.log("=COUNT(1, 'A', 3) expected 2, got:", evaluateFormula("COUNT(1, 'A', 3)", evalCell));
console.log("=IFERROR(1/0, 'Error') expected 'Error', got:", evaluateFormula("IFERROR(1/0, 'Error')", evalCell));
console.log("=SUMIF(A1:A2, '>15') expected 20, got:", evaluateFormula("SUMIF(A1:A2, '>15')", evalCell));

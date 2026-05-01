export const formatNumber = (val: string | number): string => {
  if (val === undefined || val === null || val === '') return '';
  const num = typeof val === 'string' ? val.replace(/,/g, '') : val.toString();
  if (isNaN(Number(num))) return val.toString();
  return Number(num).toLocaleString('en-US');
};

export const parseFormattedNumber = (val: string): number => {
  if (!val) return 0;
  return parseFloat(val.replace(/,/g, '')) || 0;
};

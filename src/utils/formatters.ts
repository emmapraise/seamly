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

export const formatWhatsAppNumber = (phone: string): string => {
	if (!phone) return '';
	let clean = phone.replace(/\D/g, '');
	
	if (clean.startsWith('2340')) {
		clean = '234' + clean.slice(4);
	}
	
	if (clean.startsWith('0')) {
		clean = '234' + clean.slice(1);
	} 
	else if (clean.length === 10) {
		clean = '234' + clean;
	}
	else if (clean.length < 11 && !clean.startsWith('234')) {
		clean = '234' + clean;
	}
	
	return clean;
};

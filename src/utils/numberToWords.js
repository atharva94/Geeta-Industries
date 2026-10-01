// Indian numbering system converter to words

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertLessThanThousand(n) {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) {
    const unit = n % 10;
    return tens[Math.floor(n / 10)] + (unit !== 0 ? ' ' + ones[unit].toLowerCase() : '');
  }
  const rem = n % 100;
  return (
    ones[Math.floor(n / 100)] +
    ' hundred' +
    (rem !== 0 ? ' and ' + convertLessThanThousand(rem).toLowerCase() : '')
  );
}

export function numberToIndianWords(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '';
  const num = Math.round(Number(amount) * 100) / 100;
  if (num === 0) return 'INR Zero rupees only';

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let remaining = integerPart;
  let parts = [];

  // Crores (10,000,000)
  if (remaining >= 10000000) {
    const crores = Math.floor(remaining / 10000000);
    parts.push(convertLessThanThousand(crores) + ' crore');
    remaining %= 10000000;
  }

  // Lakhs (100,000)
  if (remaining >= 100000) {
    const lakhs = Math.floor(remaining / 100000);
    parts.push(convertLessThanThousand(lakhs) + ' lakh');
    remaining %= 100000;
  }

  // Thousands (1,000)
  if (remaining >= 1000) {
    const thousands = Math.floor(remaining / 1000);
    parts.push(convertLessThanThousand(thousands) + ' thousand');
    remaining %= 1000;
  }

  // Hundreds and remaining (< 1000)
  if (remaining > 0) {
    parts.push(convertLessThanThousand(remaining));
  }

  let words = parts.join(' ').trim();
  // Capitalize first letter of each major unit
  words = words
    .replace(/\b([a-z])/g, (m, p) => p.toUpperCase())
    .replace(/\bAnd\b/g, 'and');

  let result = `INR ${words} rupees only`;

  if (decimalPart > 0) {
    const paiseText = convertLessThanThousand(decimalPart).toLowerCase();
    result = `INR ${words} rupees and ${paiseText} paise only`;
  }

  return result;
}

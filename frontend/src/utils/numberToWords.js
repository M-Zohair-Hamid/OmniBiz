/**
 * Convert numbers to words in English
 * Example: 45443 => "Forty Five Thousand Four Hundred Forty Three"
 */

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

const scales = [
  '', 'Thousand', 'Million', 'Billion', 'Trillion'
];

/**
 * Convert a number less than 1000 to words
 */
const convertThreeDigits = (num) => {
  let result = '';

  // Handle hundreds
  if (num >= 100) {
    result += ones[Math.floor(num / 100)] + ' Hundred';
    num %= 100;
    if (num > 0) result += ' ';
  }

  // Handle tens and ones
  if (num >= 20) {
    result += tens[Math.floor(num / 10)];
    if (num % 10 > 0) {
      result += ' ' + ones[num % 10];
    }
  } else if (num > 0) {
    result += ones[num];
  }

  return result.trim();
};

/**
 * Convert integer part to words
 */
const convertIntegerToWords = (num) => {
  if (num === 0) return 'Zero';

  let words = '';
  let scaleIndex = 0;

  while (num > 0 && scaleIndex < scales.length) {
    const group = num % 1000;

    if (group !== 0) {
      const groupWords = convertThreeDigits(group);
      if (words) {
        words = groupWords + ' ' + scales[scaleIndex] + ' ' + words;
      } else {
        words = groupWords + (scaleIndex > 0 ? ' ' + scales[scaleIndex] : '');
      }
    }

    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  return words.trim();
};

/**
 * Convert decimal part (paise/cents) to words
 */
const convertPaiseToWords = (paise) => {
  if (!paise || paise === 0) return '';

  if (paise === 1) return 'One Paisa';

  return convertIntegerToWords(paise) + ' Paise';
};

/**
 * Main function to convert amount to words
 * @param {number} amount - The amount to convert
 * @returns {string} - The amount in words
 * Example: 45443.50 => "Forty Five Thousand Four Hundred Forty Three Rupees and Fifty Paise"
 */
export const amountToWords = (amount) => {
  if (!amount || amount === 0) {
    return 'Zero Rupees';
  }

  // Round to 2 decimal places and split using integer paise to avoid float issues
  const totalPaise = Math.round(Number(amount) * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;

  // Convert integer part
  let result = convertIntegerToWords(rupees) + ' Rupees';

  // Add paise part if exists
  if (paise > 0) {
    const paiseWords = convertPaiseToWords(paise);
    if (paiseWords) {
      result += ' and ' + paiseWords;
    }
  }

  return result;
};

export default amountToWords;

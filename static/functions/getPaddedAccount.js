/**
 * Get padded account number with customer prefix
 * 
 * @param {string} customerNumber 
 * @returns {string}
 */
const getPaddedAccount = (customerNumber) => {
    const customerNumberStr = String(customerNumber);
    console.log('getPaddedAccount received:', customerNumber, 'type:', typeof customerNumber);
    console.log('Arguments length:', arguments.length);
    console.log('All arguments:', Array.from(arguments));
    
    // Ensure we only use the first argument
    const cleanNumber = String(arguments[0] || customerNumber);
    
    // Pad to exactly 5 digits
    const paddedNumber = cleanNumber.padStart(5, '0');
    console.log('Final padded result:', paddedNumber);
    
    return paddedNumber;
};
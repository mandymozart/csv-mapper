/**
 * Get padded account number with customer prefix
 * 
 * @param {string} billingCountryISO 
 * @param {string} shippingCountryISO 
 * @returns {string}
 */
const getPaddedAccount = (billingCountryISO, shippingCountryISO) => {
    const accountNumber = getAccountNumber(billingCountryISO, shippingCountryISO);
    // Replace first digit with "2" and pad to 6 digits
    return `2${accountNumber.slice(1).padStart(5, '0')}`;
};
/**
 * Get tax code based on country and company status
 * 
 * @param {string} billingCountryISO 
 * @param {string} shippingCountryISO 
 * @param {boolean} isCompany 
 * @returns {string}
 */
const getTaxCode = (billingCountryISO, shippingCountryISO, isCompany = false) => {

    const EU_COUNTRIES = [
        'AUT', 'BEL', 'BGR', 'CYP', 'CZE', 'DEU', 'DNK', 'EST', 'ESP', 'FIN',
        'FRA', 'GRC', 'HRV', 'HUN', 'IRL', 'ITA', 'LVA', 'LUX', 'MLT',
        'NLD', 'POL', 'PRT', 'ROM', 'SWE', 'SVN', 'SUI', 'TCH'
    ];

    /**
     * Check if country is in EU
     * 
     * @param {string} countryISO 
     * @returns {boolean}
     */
    const isEUCountry = (countryISO) => {
        return EU_COUNTRIES.includes(countryISO);
    };

    const customerCountry = billingCountryISO || shippingCountryISO;
    const customerCountryIsEU = isEUCountry(customerCountry);

    if (isCompany) {
        if (customerCountryIsEU) {
            return '7'; // Tax-free intra-EU delivery for companies
        } else {
            return '5'; // Export delivery for companies outside EU
        }
    } else {
        return '1'; // Default tax code for consumers
    }
};
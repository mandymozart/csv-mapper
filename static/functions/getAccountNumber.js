/**
 * Main function to get account number
 * 
 * @param {string} billingCountryISO 
 * @param {string} shippingCountryISO 
 * @returns {string}
 */
const getAccountNumber = (billingCountryISO, shippingCountryISO, isCompany = false) => {
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
        return '4100'; // Tax-free intra-EU delivery
      } else {
        return '4050'; // Export delivery
      }
    }
    
    /**
     * Regular customers get country-specific revenue accounts
     * @type {Object<string, string>}
     */
    const countryAccountMap = {
      'DEU': '4001', // Deutschland - 19% EU-OSS
      'FRA': '4002', // Frankreich - 20% EU-OSS
      'ESP': '4003', // Spanien - 21% EU-OSS
      'HRV': '4004', // Kroatien - 25% EU-OSS
      'HUN': '4005', // Ungarn - 27% EU-OSS
      'SWE': '4006', // Schweden - 25% EU-OSS
      'BEL': '4007', // Belgien - 21% EU-OSS
      'IRL': '4008', // Irland - 23% EU-OSS
      'ITA': '4009', // Italien - 22% EU-OSS
      'LUX': '4010', // Luxemburg - 17% EU-OSS
      'NLD': '4011', // Niederlande - 21% EU-OSS
      'POL': '4012', // Polen - 23% EU-OSS
      'SVN': '4013', // Slowenien - 22% EU-OSS
      'DNK': '4014', // Dänemark - 25% EU-OSS
      'MLT': '4015', // Malta - 18% EU-OSS
      'CZE': '4016'  // Tschechien - 21% EU-OSS
    };
    
    if (countryAccountMap[billingCountryISO]) {
      return countryAccountMap[billingCountryISO];
    }
    
    if (countryAccountMap[shippingCountryISO]) {
      return countryAccountMap[shippingCountryISO];
    }
    
    return "4000"; // Default Naturkosmetik
  };
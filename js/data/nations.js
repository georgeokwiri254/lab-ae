/* ============================================================================
 * UAE CAPITALISM LAB  -  WORLD ECONOMIES (starting data for the macro model)
 * Tags: REAL = from a dated official / IMF figure; EST = approximate recent value.
 *  gdp      nominal GDP, USD bn            (US, China, Germany, Japan: IMF WEO Apr 2026 REAL; India REAL-approx; others EST)
 *  growth   real GDP growth / yr           (US 2.3%, China 4.5%: IMF WEO Oct 2026 REAL; UAE 0.2%: IMF Article IV Nov 2026 REAL)
 *  infl     consumer price inflation / yr  (US 3.7% CPI Sep 2026 REAL; China 0.9% CPI Jan-Jul 2026 REAL; UAE ~5% IMF Nov 2026 REAL)
 *  unemp    unemployment rate              (US 4.1% Oct 2026 REAL (BLS); China 5.3% urban surveyed Aug 2026 REAL)
 *  rate     central-bank policy rate       (Fed 3.75-4.00% Nov 2026 REAL; PBOC 1-yr LPR 3.0% Oct 2026 REAL; CBUAE 3.90% REAL)
 *  debt     government debt, share of GDP  (EST)
 *  pop      population, millions           (EST)
 *  tax      headline corporate tax rate    (US 21% federal, China 25%, UAE 9% REAL; others EST combined rates)
 *  trend    long-run real growth the model reverts to; natural unemployment; inflation target
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.NATIONS_ASOF = 'Nov 2026';
UAE.NATIONS = [
  { id: 'US', name: 'United States', flag: '🇺🇸', gdp: 32380, growth: 0.023, infl: 0.037, unemp: 0.041, rate: 0.03875, debt: 1.24, pop: 342, tax: 0.21,
    trend: 0.020, nat: 0.042, target: 0.02, cb: 'Federal Reserve (Fed)', reg: 'SEC – Securities and Exchange Commission', src: 'REAL' },
  { id: 'CN', name: 'China', flag: '🇨🇳', gdp: 20850, growth: 0.045, infl: 0.009, unemp: 0.053, rate: 0.030, debt: 0.96, pop: 1408, tax: 0.25,
    trend: 0.040, nat: 0.052, target: 0.02, cb: "People's Bank of China (PBOC)", reg: 'CSRC – China Securities Regulatory Commission', src: 'REAL' },
  { id: 'DE', name: 'Germany', flag: '🇩🇪', gdp: 5450, growth: 0.010, infl: 0.022, unemp: 0.035, rate: 0.020, debt: 0.64, pop: 84, tax: 0.30,
    trend: 0.010, nat: 0.034, target: 0.02, cb: 'European Central Bank (ECB)', reg: 'BaFin', src: 'EST' },
  { id: 'JP', name: 'Japan', flag: '🇯🇵', gdp: 4380, growth: 0.007, infl: 0.025, unemp: 0.025, rate: 0.0075, debt: 2.35, pop: 123, tax: 0.30,
    trend: 0.006, nat: 0.025, target: 0.02, cb: 'Bank of Japan (BoJ)', reg: 'FSA – Financial Services Agency', src: 'EST' },
  { id: 'IN', name: 'India', flag: '🇮🇳', gdp: 4150, growth: 0.064, infl: 0.030, unemp: 0.051, rate: 0.055, debt: 0.82, pop: 1460, tax: 0.25,
    trend: 0.062, nat: 0.050, target: 0.04, cb: 'Reserve Bank of India (RBI)', reg: 'SEBI', src: 'EST' },
  { id: 'GB', name: 'United Kingdom', flag: '🇬🇧', gdp: 4100, growth: 0.012, infl: 0.035, unemp: 0.048, rate: 0.040, debt: 1.02, pop: 69, tax: 0.25,
    trend: 0.013, nat: 0.045, target: 0.02, cb: 'Bank of England (BoE)', reg: 'FCA – Financial Conduct Authority', src: 'EST' },
  { id: 'FR', name: 'France', flag: '🇫🇷', gdp: 3400, growth: 0.008, infl: 0.012, unemp: 0.075, rate: 0.020, debt: 1.16, pop: 68.6, tax: 0.25,
    trend: 0.010, nat: 0.073, target: 0.02, cb: 'European Central Bank (ECB)', reg: 'AMF', src: 'EST' },
  { id: 'CA', name: 'Canada', flag: '🇨🇦', gdp: 2400, growth: 0.012, infl: 0.022, unemp: 0.070, rate: 0.025, debt: 1.10, pop: 41.5, tax: 0.26,
    trend: 0.016, nat: 0.062, target: 0.02, cb: 'Bank of Canada (BoC)', reg: 'CSA – Canadian Securities Administrators', src: 'EST' },
  { id: 'BR', name: 'Brazil', flag: '🇧🇷', gdp: 2400, growth: 0.022, infl: 0.050, unemp: 0.060, rate: 0.150, debt: 0.92, pop: 213, tax: 0.34,
    trend: 0.020, nat: 0.075, target: 0.03, cb: 'Banco Central do Brasil', reg: 'CVM', src: 'EST' },
  { id: 'KR', name: 'South Korea', flag: '🇰🇷', gdp: 1900, growth: 0.010, infl: 0.020, unemp: 0.028, rate: 0.025, debt: 0.55, pop: 51.7, tax: 0.24,
    trend: 0.019, nat: 0.030, target: 0.02, cb: 'Bank of Korea (BoK)', reg: 'FSC – Financial Services Commission', src: 'EST' },
  { id: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', gdp: 1300, growth: 0.040, infl: 0.020, unemp: 0.035, rate: 0.045, debt: 0.30, pop: 35, tax: 0.20,
    trend: 0.035, nat: 0.035, target: 0.02, cb: 'Saudi Central Bank (SAMA)', reg: 'CMA – Capital Market Authority', src: 'EST' },
  // the UAE row is driven by the game's own emirate economies; these are the real reference values
  { id: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', gdp: 570, growth: 0.002, infl: 0.050, unemp: 0.021, rate: 0.039, debt: 0.30, pop: 11, tax: 0.09,
    trend: 0.045, nat: 0.025, target: 0.02, cb: 'Central Bank of the UAE (CBUAE)', reg: 'SCA – Securities and Commodities Authority', src: 'REAL', game: true }
];

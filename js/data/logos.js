/* ============================================================================
 * UAE CAPITALISM LAB  -  REAL COMPANY LOGOS
 * Official website of each real company. The logo shown in the game is that
 * website's own icon, loaded at runtime (needs internet once; the app caches it).
 * Fictional / player companies get a drawn monogram badge instead (ui/logos.js).
 * Not listed on purpose (no usable website icon): Ajman Bank, Berkshire Hathaway -> monogram.
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.LOGO_DOMAINS = {
  // ---- UAE (DFM / ADX / private groups)
  EMAAR: 'emaar.com', EMAARDEV: 'emaar.com', DEWA: 'dewa.gov.ae', ENBD: 'emiratesnbd.com', SALIK: 'salik.ae',
  PARKIN: 'parkin.ae', DTC: 'dubaitaxi.ae', TECOM: 'tecomgroup.ae', TALABAT: 'talabat.com', DU: 'du.ae',
  DFMX: 'dfm.ae', AIRARABIA: 'airarabia.com', DIB: 'dib.ae', SPINNEYS: 'spinneys.com', TAALEEM: 'taaleem.ae',
  TABREED: 'tabreed.ae', ALDAR: 'aldar.com', FAB: 'bankfab.com', ADCB: 'adcb.com',
  ADIB: 'adib.ae', ADPORTS: 'adportsgroup.com', ADNOCGAS: 'adnocgas.ae', ADNOCDRILL: 'adnocdrilling.ae',
  ADNOCDIST: 'adnocdistribution.ae', ADNOCLS: 'adnocls.ae', BOROUGE: 'borouge.com', FERTIGLB: 'fertiglobe.com',
  ETISALAT: 'eand.com', IHC: 'ihcuae.com', ALPHADHABI: 'alphadhabi.com', PRESIGHT: 'presight.ai',
  RAKCEC: 'rakceramics.com', RAKBANK: 'rakbank.ae', GCEM: 'gulfcement.ae', SIB: 'sib.ae', NOON: 'noon.com',
  EMIRATES: 'emirates.com', FLYDUBAI: 'flydubai.com', DPWORLD: 'dpworld.com', EGA: 'ega.ae',
  DUBAIHOLDING: 'dubaiholding.com', JUMEIRAH: 'jumeirah.com', ADNOC: 'adnoc.ae', MUBADALA: 'mubadala.com',
  MIRAL: 'miral.ae', ETIHAD: 'etihad.com', G42: 'g42.ai', AMAZONAE: 'amazon.ae', CAREEM: 'careem.com',
  LANDMARK: 'landmarkgroup.com', INSTASHOP: 'instashop.com',
  // ---- NYSE / NASDAQ
  US_NVDA: 'nvidia.com', US_AAPL: 'apple.com', US_MSFT: 'microsoft.com', US_GOOGL: 'google.com', US_AMZN: 'amazon.com',
  US_META: 'meta.com', US_TSLA: 'tesla.com', US_AVGO: 'broadcom.com', US_NFLX: 'netflix.com', US_COST: 'costco.com',
  US_WMT: 'walmart.com', US_PLTR: 'palantir.com', US_JPM: 'jpmorganchase.com',
  US_ORCL: 'oracle.com', US_V: 'visa.com', US_LLY: 'lilly.com', US_XOM: 'exxonmobil.com', US_DELL: 'dell.com',
  US_KO: 'coca-cola.com', US_DIS: 'disney.com', US_GS: 'goldmansachs.com'
};

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
/* World companies added 2026-11-22 (official website icons) */
Object.assign(UAE.LOGO_DOMAINS, {
  US_AMD: 'amd.com', US_ASML: 'asml.com', US_CSCO: 'cisco.com', US_QCOM: 'qualcomm.com', US_ADBE: 'adobe.com', US_INTC: 'intel.com', US_PEP: 'pepsico.com',
  US_MA: 'mastercard.com', US_UNH: 'unitedhealthgroup.com', US_JNJ: 'jnj.com', US_PG: 'pg.com', US_HD: 'homedepot.com', US_BAC: 'bankofamerica.com',
  US_CVX: 'chevron.com', US_CRM: 'salesforce.com', US_IBM: 'ibm.com', US_UBER: 'uber.com', US_BABA: 'alibaba.com',
  SA_ARAMCO: 'aramco.com', SA_RAJHI: 'alrajhibank.com.sa', SA_ACWA: 'acwapower.com', SA_MAADEN: 'maaden.com.sa',
  GB_AZN: 'astrazeneca.com', GB_SHEL: 'shell.com', GB_HSBA: 'hsbc.com', GB_ULVR: 'unilever.com', GB_RR: 'rolls-royce.com',
  FR_MC: 'lvmh.com', FR_RMS: 'hermes.com', FR_OR: 'loreal.com', FR_TTE: 'totalenergies.com', FR_AIR: 'airbus.com',
  DE_SAP: 'sap.com', DE_SIE: 'siemens.com', CH_NESN: 'nestle.com', CH_ROG: 'roche.com', CH_NOVN: 'novartis.com', DK_NOVO: 'novonordisk.com', ES_ITX: 'inditex.com',
  JP_TM: 'toyota-global.com', JP_SONY: 'sony.com', JP_SBG: 'group.softbank', CN_TCEHY: 'tencent.com', CN_BYD: 'byd.com', CN_XIAOMI: 'mi.com', CN_CATL: 'catl.com',
  TW_TSMC: 'tsmc.com', TW_HONHAI: 'honhai.com', KR_SSNLF: 'samsung.com', KR_HYNIX: 'skhynix.com', IN_RIL: 'ril.com', IN_TCS: 'tcs.com', IN_HDFCB: 'hdfcbank.com'
});

Object.assign(UAE.LOGO_DOMAINS, { KE_SCOM: 'safaricom.co.ke', KE_EQTY: 'equitygroupholdings.com', KE_KCB: 'kcbgroup.com', KE_EABL: 'eabl.com',
  KE_COOP: 'co-opbank.co.ke', KE_NCBA: 'ncbagroup.com', KE_SBIC: 'stanbicbank.co.ke', KE_ABSA: 'absabank.co.ke', KE_BAT: 'batkenya.com',
  KE_KEGN: 'kengen.co.ke', KE_KPLC: 'kplc.co.ke', US_SPACEX: 'spacex.com', US_ANT: 'anthropic.com' });

// ===== TEST DATA =====

const bppSetupPrefix = `PT##$S6A#@;#TICK#CHEC#BOAR#0101110112011301210122012301C#0201A34#03BRB061661#0430G25F
TT01#01L08004790100000`;
const bppSendSimple = 'CP#A#01S#CP#C01#02@@01#03M1THIS IS A BARCODE#04THIS IS A BOARDING PASS#';
const bppSendFull = 'CP#A#01S#CP#C01#02@@01#03M1TEST/ADULT                                            RFIFWX    DENLASF9    0775    174Y014B0004    347>5181        1174BF9    042231015000129000000000000000                                                                                                        #04TEST/ADULT#05WED,    JUN    23,    2021#06#07SEQ004#08#09#12RFIFWX#13NO    CARRY    ON    ALLOWED#14#15#16#17#20DEN    -->    LAS#30Denver    to    Las    Vegas#32F9        775#3312:30AM#3401:15PM#3501:00PM#404#43#4414B#5092518095#54#55#64Sold    by#66Frontier    Airlines#';

const btpSetupPrefix = `BTT0801~J 500262=#01C0M5493450304#02C0M5493450304#03B1MA020250541=06#04B1MK200464141=06#05L0 A258250000#`;
const btpSendSimple = 'BTP080101#01THIS IS A#02BAG TAG#03123#04456#0501#';

export const aeaCommandsData = {
  boardingPassPrinter: {
    'Setup: Assets + Logo': bppSetupPrefix,
    'Send: Simple BP': bppSendSimple,
    'Send: Full BP': bppSendFull,
  },
  bagTagPrinter: {
    'Setup: Assets + Logo': btpSetupPrefix,
    'Send: Simple BT': btpSendSimple,
  },
};

export async function loadCompanyLogo() {
  try {
    const response = await fetch('data/company-logo.itps');
    const logo = (await response.text()).trim();
    aeaCommandsData.boardingPassPrinter['Setup: Assets + Logo'] = `${bppSetupPrefix}\n${logo}`;
    aeaCommandsData.bagTagPrinter['Setup: Assets + Logo'] = `${btpSetupPrefix}\n${logo}`;
  } catch (e) {
    console.warn('Failed to load company logo test data:', e);
  }
}

// ===== CONSTANTS =====
export const CAPABILITY_METHODS = [
  'query', 'cancel', 'setup', 'enable', 'disable',
  'send', 'read', 'offer', 'play', 'pause', 'resume', 'stop',
  'forward', 'backward', 'process',
];

export const NO_RECONNECT_CODES = [1000, 4001, 4002, 4003, 4004, 4005, 4006];

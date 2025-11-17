// ===== IMPORTS =====
import { Cuss2, Models } from "../../dist/cuss2.esm.js";
const { ApplicationStateCodes, ComponentState, MessageCodes } = Models;

let cuss2 = null;

// ===== TEST DATA DEFINITIONS =====
// Company logo ITPS command (used in SETUP for printers)
const companyLogo = 'LT0146940A020101000000001D01630064006400000000000000000000000000000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0001240001001E016400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000C4FF9FDEFFC1FCC3FFC1FE7FDEFFC1FCC3FFC1F9C2FF03DCFFC1FCC3FFC1E7C1FF81C1FE07DBFFC1FCC3FF9FC1FC7FC1FFC1F87FDAFFC1FCC2FFC1FE7FC1E3C3FF9FDAFFC1FCC2FFC1FDC1FF3FC3FFC1F3DAFFC1FCC2FFC1F3C1FCC4FFC1FCDAFFC1FCC2FFC1E7C1F3C5FF7FD9FFC1FCC2FFC1DFC1E7C1FFC1F0003FC2FFC1F7D8FFC1FCC2FFBF9FC1FFC20003C2FFC1F9D8FFC1FCC2FFC27FC1F80FC1FFC1C07FC1FFC1FCD8FFC1FCC1FFC1FEC1FCC1FFC1C0C2FFC1FC0FC1FFC1FE7FD7FFC1FCC1FFC1FDC1FBC1FF07C3FF83C2FFBFD7FFC1FCC1FFC1FBC1F7C1FE1FC3FFC1E1C2FFC1DFD7FFC1FCC1FFC1F7C1EFC1F87FC3FFC1F87FC1FFC1EFD7FFC1FCC1FFC1EFC1DFC1F1C4FFC1FE3FC1FFC1E7D7FFC1FCC1FFC1DFBFC1C3C5FF8FC2F7D7FFC1FCC1FFC1DF7F8FC5FFC1C7C2FBD7FFC1FCC1FFBE7F1FC5FFC1E3C2FDD7FFC1FCC1FF7EC1FE3FC5FFC1F1C2FCD7FFC1FCC1FF7DC1FC7FC5FFC1F8C2FED7FFC1FCC1FEC1FBC1F8C6FFC1FCC37FD6FFC1FCC1FCC1F3C1F1C6FFC1FE3FBF7FD6FFC1FCC1FDC1F7C1F3C7FF1FC2BFD6FFC1FCC1FBC1EFC1E7C7FF9FC2DFD6FFC1FCC1FBC1EFC1CFC7FFC1CFC1FFC1DFD6FFC1FCC1F3C1DFC1CFC7FFC1C7C2EFD6FFC1FCC1F7C1DF9FC7FFC2E7C1EFD6FFC1FCC1F7BF3FC7FFC1F3C1F7C1EFD6FFC1FCC1EFBF3FC7FFC1F3C2F7D6FFC1FCC1EF7E3FC7FFC1F9C1FBC1F7D6FFC1FCC1CF7E7FC7FFC1F9C2FBD6FFC1FCC1DF7C7FC7FFC1FCC1FDC1FBD6FFC1FCC1DEC1FCC8FFC1FCC1FDC1FBD6FFC1FCC1DEC1FCC8FFC1FCC2FDD6FFC1FCBEC1F9C1FFC1E00003C1FFC1EFC2FFC1FE7FC1FDC1FFC1C00007C1FFC1DFC1FFC1F7C2FFBFC1FFC1C00007C1FFC1C00007C1FFC1C00FC1FCBDC1F9C1FFC1C00001C1FFC1C3C2FFC1FE7EC1FDC1FF800003C1FF8FC1FFC1E3C2FF1FC1FF800003C1FF800003C1FF8001C1FCBDC1F9C1FFC1C00001C1FFC1C3C2FFC1FE7EC1FDC1FF800003C1FF87C1FFC1C3C1FFC1FE0FC1FF800003C1FF800003C1FF80007CBDC1F9C1FFC1E00003C1FFC1C3C3FF3EC2FFC1C00003C1FF87C1FFC1C3C1FFC1FE0FC1FFC1C00003C1FFC1C00007C1FFC1C0003CBDC1F3C5FFC1C3C3FF3EC1FEC5FFC1C3C1FF87C1FFC1FE0FCAFFC1F81C7DC1F3C5FFC1C3C3FF3F7EC5FFC1C3C1FF87C1FFC1FC07CAFFC1FE0C7FC1F3C5FFC1C3C3FF3F7EC5FFC1E1C1FF8FC1FFC1FC07CBFF0C7BC1F3C5FFC1C3C3FF3FC1FEC5FFC1E1C1FF0FC1FFC1F843C2FFC1E7C6FFC1DFC1FF847BC1F3C5FFC1C3C3FF3FC1FEC5FFC1F1C1FF1FC1FFC1F843C2FFC1C3C6FF8FC1FF847BC1F3C5FFC1C3C3FFBFC1FEC5FFC1F0C1FE1FC1FFC1F0C1E1C2FFC1C3C6FF8FC1FFC1C07BC1F3C5FFC1C3C3FF9FC1FEC5FFC1F0C1FE1FC1FFC1F0C1E1C2FFC1C3C6FF8FC1FFC1C07BC1F3C1FFC1E00001C1FFC1C3C3FF9FC1FEC1FFC1C00003C1FFC1F87E3FC1FFC2F1C2FFC1C3C2FFC1C00003C1FF8FC1FFC1C07BC1F3C1FFC1C00001C1FFC1C3C3FF9FC1FEC1FF800003C1FFC1F87C3FC1FFC1E1C1F0C2FFC1C3C2FF800003C1FF8FC1FFC1C07BC1F3C1FFC1E00001C1FFC1C3C3FF9FC1FEC1FFC1C00003C1FFC1FC7C7FC1FFC1E1C1F0C2FFC1C3C2FF800003C1FF8FC1FFC1C07BC1F3C5FFC1C3C3FF9FC1FEC5FFC1FC387FC1FFC1C3C1F87FC1FFC1C3C6FF8FC1FFC1C07BC1F3C5FFC1C3C3FF3FC1FEC5FFC1FE387FC1FFC1C3C1F87FC1FFC1C3C6FF8FC1FFC1C07BC1F3C5FFC1C3C3FF3FC1FEC5FFC1FE10C2FFC1C7C1FC7FC1FFC1C3C6FF8FC1FF847BC1F3C5FFC1C3C3FF3FC1FEC5FFC1FE10C2FF87C1FC3FC1FFC1C3C6FF8FC1FF847FC1F3C5FFC1C3C3FF3FC1FEC6FF01C2FF87C1FE3FC1FFC1C3C6FF8FC1FF0CBDC1F3C5FFC1C3C3FF3FC1FEC6FF01C2FF0FC1FE1FC1FFC1C3C6FF8FC1FE0CBDC1F3C5FFC1C3C3FF3FC1FEC6FF81C2FF0FC1FE1FC1FFC1C3C6FF8FC1F81CBDC1F9C1FFC1E00003C1FFC1C00003C1FE7FC1FEC1FFC1C00007C2FF83C1FFC1FE1FC1FF1FC1FFC1C3C2FFC1C00007C1FF80003CBDC1F9C1FFC1C00001C1FFC1C00001C1FE7FC2FF800003C2FF83C1FFC1FE1FC1FF0FC1FFC1C3C2FF800003C1FF80007CBDC1F9C1FFC1C00001C1FFC1C00001C1FE7FC1FDC1FF800003C2FFC1C7C1FFC1FE1FC1FF8FC1FFC1C3C2FF800003C1FF8001C1FCC1FEC1FCC1FFC1E00003C1FFC1E00003C1FE7FC1FDC1FFC1C00003C2FFC1E7C2FF3FC1FF9FC1FFC1E7C2FFC1C00007C1FFC1C00FC1FCC1DEC1FCC8FFC1FCC1FFC1FDD6FFC1FCC1DEC1FCC8FFC1FCC1FFC1FDD6FFC1FCC1DF7E7FC7FFC1F9C1FFC1FBD6FFC1FCC1EF7E7FC7FFC1F9C1FFC1FBD6FFC1FCC1EFBF3FC7FFC1F1C1FFC1FBD6FFC1FCC1EFBF3FC7FFC1F3C1FFC1F7D6FFC1FCC1F7BF9FC7FFC1E7C1FFC1F7D6FFC1FCC1F7C1DF9FC7FFC1E7C1FFC1EFD6FFC1FCC1FBC1DFC1CFC7FFC1CFC1FFC1EFD6FFC1FCC1FBC1EFC1C7C7FF8FC1FFC1EFD6FFC1FCC1FDC1E7C1E3C7FF1FC1FFC1DFD6FFC1FCC1FDC1F7C1F3C7FF3FC1FFC1DFD6FFC1FCC1FEC1FBC1F9C6FFC1FE7FC1FFBFD6FFC1FCC1FEC1FBC1FCC6FFC1FCC2FF3FD6FFC1FCC1FF7DC1FE7FC5FFC1F9C2FF7FD6FFC1FCC1FFBEC1FF3FC5FFC1F1C1FFC1FED7FFC1FCC1FFBF7F8FC5FFC1E7C1FFC1FED7FFC1FCC2FF3FC1C7C5FF8FC1FFC1FDD7FFC1FCC2FFC1DFC1E3C5FF1FC1FFC1FBD7FFC1FCC2FFC1CFC1F0C4FFC1FC3FC1FFC1F7D7FFC1FCC2FFC1E7C1FC3FC3FFC1F0C1FFBFC1E7D7FFC1FCC2FFC1F3C1FF0FC3FFC1C3C1FF3FC1EFD7FFC1FCC2FFC1FDC1FFC1C3C3FF0FC1FEC1FFC1DFD7FFC1FCC2FFC1FEC1FFC1F03FC1FFC1F83FC1FDC1FFBFD7FFC1FCC3FF3FC1FC01C1FE00C1FFC1F3C1FF7FD7FFC1FCC3FFC1DFC1FFC1C00007C1FFC1E7C1FED8FFC1FCC3FFC1E7C2FF87C2FF9FC1F9D8FFC1FCC3FFC1F9C4FFC1FE7FC1F3D8FFC1FCC3FFC1FE7FC3FFC1F9C1FFC1EFD8FFC1FCC4FF8FC3FFC1C7C1FF9FD8FFC1FCC4FFC1F1C2FFC1E3FC1FF7FD8FFC1FCC4FFC1FE1FC1FFC1E1C1FFC1FCD9FFC1FCC5FFC1E0001FC1FFC1F3D9FFC1FCC9FFC1CFD9FFC1FCC9FF3FD9FFC1FCC8FFC1F8DAFFC1FCC8FFC1C7DAFFC1FCC7FFC1F07FDAFFC1FCC6FFC1FC0FDBFFC1FC';

// Test barcode data (for barcode reader simulation)
const testBarcode = 'M1TESTER/TEST          UGZVFJ MCODENF9 3311 234Y016F0032 147>5180Mo5234BF9 00000000000';

// Test passport MRZ data (Machine Readable Zone) - ICAO 9303 standard
const testPassportMRZ = 'P<USATESTER<<TEST<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n5123456789USA9001014M3012315<<<<<<<<<<<<<<04';

// Boarding pass printer SETUP data (multi-line: assets + logo)
const bppSetupAssets = `PT##$S6A#@;#TICK#CHEC#BOAR#0101110112011301210122012301C#0201A34#03BRB061661#0430G25F
TT01#01L08004790100000
${companyLogo}`;

// Boarding pass printer SEND data
const bppSendSimple = 'CP#A#01S#CP#C01#02@@01#03M1THIS IS A BARCODE#04THIS IS A BOARDING PASS#';
const bppSendFull = 'CP#A#01S#CP#C01#02@@01#03M1TEST/ADULT                                            RFIFWX    DENLASF9    0775    174Y014B0004    347>5181        1174BF9    042231015000129000000000000000                                                                                                        #04TEST/ADULT#05WED,    JUN    23,    2021#06#07SEQ004#08#09#12RFIFWX#13NO    CARRY    ON    ALLOWED#14#15#16#17#20DEN    -->    LAS#30Denver    to    Las    Vegas#32F9        775#3312:30AM#3401:15PM#3501:00PM#404#43#4414B#5092518095#54#55#64Sold    by#66Frontier    Airlines#';

// Bag tag printer SETUP data (multi-line: assets + logo)
const btpSetupAssets = `BTT0801~J 500262=#01C0M5493450304#02C0M5493450304#03B1MA020250541=06#04B1MK200464141=06#05L0 A258250000#
${companyLogo}`;

// Bag tag printer SEND data
const btpSendSimple = 'BTP080101#01THIS IS A#02BAG TAG#03123#04456#0501#';

const aeaCommands = {
  // Boarding pass printer commands
  boardingPassPrinter: {
    'Setup: Assets + Logo': bppSetupAssets,
    'Send: Simple BP': bppSendSimple,
    'Send: Full BP': bppSendFull
  },
  // Bag tag printer commands
  bagTagPrinter: {
    'Setup: Assets + Logo': btpSetupAssets,
    'Send: Simple BT': btpSendSimple
  },
  // Test data for barcode readers
  barcodeReader: {
    'Test Boarding Pass Barcode': testBarcode
  },
  // Test data for document readers
  documentReader: {
    'Test Passport MRZ (TEST TESTER)': testPassportMRZ
  }
};

// ===== COMPONENT CAPABILITY DEFINITIONS =====
// Based on the CUSS Virtual Component Concept and our new hierarchy
const componentCapabilities = {
  // Get capabilities for a component based on its type
  getCapabilities(component) {
    const deviceType = component.deviceType?.toLowerCase() || '';
    const capabilities = [];

    // All components have query (from BaseComponent)
    capabilities.push('query');

    // Most components have cancel and setup (from BaseComponent)
    if (!this.isFeederComponent(deviceType)) {
      capabilities.push('cancel', 'setup');
    } else {
      // Feeder only has query and offer
      capabilities.push('offer');
      return capabilities;
    }

    // Interactive components (enable/disable)
    if (this.isInteractiveComponent(deviceType)) {
      capabilities.push('enable', 'disable');
    }

    // Output components (send)
    if (this.isOutputComponent(deviceType)) {
      capabilities.push('send');
    }

    // Media components with offer capability
    if (this.isMediaOfferCapable(deviceType)) {
      capabilities.push('offer');
    }

    // Announcement components
    if (this.isAnnouncementComponent(deviceType)) {
      capabilities.push('play', 'pause', 'resume', 'stop');
    }

    // Input components with read capability
    if (this.isDataReadCapable(deviceType)) {
      capabilities.push('read');
    }

    // Conveyor components
    if (this.isConveyorComponent(deviceType)) {
      capabilities.push('forward', 'backward', 'process');
    }

    return capabilities;
  },

  // Component type checkers based on CUSS Virtual Component Concept
  isInteractiveComponent(type) {
    // Components that can be enabled/disabled (all classes extending InteractiveComponent)
    // Convert to lowercase and handle both underscore and non-underscore versions
    const normalizedType = type.toLowerCase().replace(/_/g, '');
    return [
      // MediaInputComponent subclasses
      'barcodereader', 'documentreader', 'cardreader', 'camera', 'rfid', 'passportreader',
      // UserInputComponent subclasses
      'keypad', 'keyboard',
      // UserOutputComponent subclasses
      'headset', 'biometric',
      // MediaOutputComponent subclasses
      'boardingpassprinter', 'bagtagprinter', 'printer', 'aeasbd',
      // BaggageScaleComponent
      'scale',
      // DispenserComponent
      'dispenser',
      // InsertionBeltComponent
      'insertionbelt',
      // AnnouncementComponent - THIS WAS MISSING!
      'announcement'
    ].some(t => normalizedType.includes(t));
  },

  isOutputComponent(type) {
    // Components that can send data (OutputCapable interface)
    const normalizedType = type.toLowerCase().replace(/_/g, '');
    return [
      // DataOutputComponent (extends BaseComponent)
      'illumination',
      // MediaOutputComponent (extends InteractiveComponent)
      'boardingpassprinter', 'bagtagprinter', 'printer', 'aeasbd',
      // UserOutputComponent (extends InteractiveComponent)
      'headset', 'biometric',
      // ConveyorComponent and subclasses
      'insertionbelt', 'verificationbelt', 'parkingbelt',
      // Note: Announcement does NOT have send, it has play/pause/resume/stop
      // Note: BHS is DataInputComponent, does NOT have send
    ].some(t => normalizedType.includes(t));
  },

  isMediaOfferCapable(type) {
    // DISPENSER type
    const normalizedType = type.toLowerCase().replace(/_/g, '');
    return normalizedType.includes('dispenser');
  },

  isAnnouncementComponent(type) {
    const normalizedType = type.toLowerCase().replace(/_/g, '');
    return normalizedType.includes('announcement');
  },

  isDataReadCapable(type) {
    // Components with DataReadCapable interface
    const normalizedType = type.toLowerCase().replace(/_/g, '');
    return [
      // MediaInputComponent subclasses
      'barcodereader', 'documentreader', 'cardreader', 'passportreader',
      'camera', 'rfid',
      // BaggageScaleComponent
      'scale',
      // DataInputComponent
      'bhs'
      // Note: Biometric is UserOutputComponent, does NOT have read
    ].some(t => normalizedType.includes(t));
  },

  isConveyorComponent(type) {
    // Belt components
    const normalizedType = type.toLowerCase().replace(/_/g, '');
    return [
      'insertionbelt', 'verificationbelt', 'parkingbelt'
    ].some(t => normalizedType.includes(t));
  },

  isFeederComponent(type) {
    // Feeder has offer but no enable/disable per spec
    const normalizedType = type.toLowerCase().replace(/_/g, '');
    return normalizedType.includes('feeder');
  },

  // Check if a specific capability is allowed for this component
  hasCapability(component, capability) {
    const capabilities = this.getCapabilities(component);
    return capabilities.includes(capability);
  }
};

// ===== QUERY PARAMETER PARSING =====
const urlParams = new URLSearchParams(window.location.search);
const queryConfig = {
  clientId: urlParams.get("CLIENT-ID"),
  clientSecret: urlParams.get("CLIENT-SECRET"),
  wss: urlParams.get("CUSS-WSS"),
  tokenUrl: urlParams.get("OAUTH-URL"),
  deviceId: urlParams.get("DEVICE-ID"),
  go: urlParams.get("go"),
};

// ===== URL UTILITIES =====
const urlUtils = {
  // Allowed protocols for CUSS2 connections
  ALLOWED_PROTOCOLS: ['http:', 'https:', 'ws:', 'wss:'],

  // Validate URL format and protocol
  validateURL(url, urlType = 'URL') {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return { isValid: false, error: `${urlType} cannot be empty` };
    }

    try {
      const parsedUrl = new URL(url.trim());

      if (!this.ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
        const allowedList = this.ALLOWED_PROTOCOLS.map(p => p.replace(':', '://')).join(', ');
        return {
          isValid: false,
          error: `${urlType} uses unsupported protocol '${parsedUrl.protocol}'. Only ${allowedList} are supported.`
        };
      }

      return { isValid: true, url: parsedUrl.href };
    } catch (error) {
      return { isValid: false, error: `${urlType} is not a valid URL format` };
    }
  },

  // Check for mixed content issues
  checkMixedContent(targetUrl) {
    // Only check if current page is served over HTTPS
    if (location.protocol !== 'https:') {
      return { hasMixedContent: false };
    }

    try {
      const url = new URL(targetUrl);
      const isHttpTarget = url.protocol === 'http:' || url.protocol === 'ws:';

      return {
        hasMixedContent: isHttpTarget,
        currentProtocol: location.protocol,
        targetProtocol: url.protocol,
        suggestedUrl: isHttpTarget ? targetUrl.replace(/^(ws|http):/, url.protocol === 'ws:' ? 'wss:' : 'https:') : targetUrl
      };
    } catch (error) {
      return { hasMixedContent: false, error: error.message };
    }
  }
};

// ===== DOM HELPERS =====
const dom = {
  // Cache DOM elements
  elements: {
    form: null,
    connectBtn: null,
    disconnectBtn: null,
    connectionStatus: null,
    connectionStatusConnected: null,
    currentState: null,
    componentList: null,
    logContainer: null,
    envDetails: null,
    stateButtons: {},
    appInfo: {},
    // Panels
    connectionPanel: null,
    stateManagementPanel: null,
    environmentPanel: null,
    componentsPanel: null,
    eventLogPanel: null,
    // New connection UI elements
    connectButtonContainer: null,
    connectionStatusContainer: null,
    cancelConnectionBtn: null,
  },

  // Initialize DOM element cache
  init() {
    this.elements.form = document.getElementById("connectionForm");
    this.elements.connectBtn = document.getElementById("connectBtn");
    this.elements.disconnectBtn = document.getElementById("disconnectBtn");
    this.elements.connectionStatus = document.getElementById("connectionStatus");
    this.elements.connectionStatusConnected = document.getElementById("connectionStatusConnected");
    this.elements.currentState = document.getElementById("currentState");
    this.elements.componentList = document.getElementById("componentList");
    this.elements.logContainer = document.getElementById("logContainer");
    this.elements.envDetails = document.getElementById("envDetails");

    // Panels
    this.elements.connectionPanel = document.getElementById("connectionPanel");
    this.elements.stateManagementPanel = document.getElementById("stateManagementPanel");
    this.elements.environmentPanel = document.getElementById("environmentPanel");
    this.elements.componentsPanel = document.getElementById("componentsPanel");
    this.elements.eventLogPanel = document.getElementById("eventLogPanel");

    // New connection UI elements
    this.elements.connectButtonContainer = document.getElementById("connectButtonContainer");
    this.elements.connectionStatusContainer = document.getElementById("connectionStatusContainer");
    this.elements.cancelConnectionBtn = document.getElementById("cancelConnectionBtn");

    // State buttons
    this.elements.stateButtons = {
      initialize: document.getElementById("initializeBtn"),
      unavailable: document.getElementById("unavailableBtn"),
      available: document.getElementById("availableBtn"),
      active: document.getElementById("activeBtn"),
      stopped: document.getElementById("stoppedBtn"),
      reload: document.getElementById("reloadBtn"),
    };

    // App info elements
    this.elements.appInfo = {
      multiTenant: document.getElementById("multiTenant"),
      accessibleMode: document.getElementById("accessibleMode"),
      language: document.getElementById("language"),
    };
  },

  // Get form values
  getFormData() {
    return {
      wss: document.getElementById("wss").value,
      clientId: document.getElementById("clientId").value,
      clientSecret: document.getElementById("clientSecret").value,
      deviceId: document.getElementById("deviceId").value,
      tokenUrl: document.getElementById("tokenUrl").value,
    };
  },

  // Update element text content
  setText(element, text) {
    if (element) element.textContent = text;
  },

  // Update element class
  setClass(element, className) {
    if (element) element.className = className;
  },

  // Enable/disable button
  setButtonState(button, disabled) {
    if (button) button.disabled = disabled;
  },

  // Show/hide element
  setVisible(element, visible) {
    if (element) element.style.display = visible ? "block" : "none";
  },

  // Show validation error on input field
  showFieldError(inputId, errorMessage) {
    const input = document.getElementById(inputId);
    if (!input) return;

    // Remove any existing error
    this.clearFieldError(inputId);

    // Add error class to input
    input.classList.add('error');

    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.id = `${inputId}-error`;
    errorDiv.textContent = errorMessage;

    // Insert error after input
    input.parentNode.insertBefore(errorDiv, input.nextSibling);
  },

  // Clear validation error from input field
  clearFieldError(inputId) {
    const input = document.getElementById(inputId);
    const errorDiv = document.getElementById(`${inputId}-error`);

    if (input) {
      input.classList.remove('error');
    }
    if (errorDiv) {
      errorDiv.remove();
    }
  },

  // Clear all field errors
  clearAllFieldErrors() {
    const errorElements = document.querySelectorAll('.field-error');
    const inputElements = document.querySelectorAll('.error');

    errorElements.forEach(el => el.remove());
    inputElements.forEach(el => el.classList.remove('error'));
  },
};

// ===== LOGGING UTILITY =====
const logger = {
  // Log types enum
  types: {
    INFO: "info",
    SUCCESS: "success",
    ERROR: "error",
    EVENT: "event",
  },

  // Create a log entry
  log(message, type = "info") {
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    dom.elements.logContainer.appendChild(entry);
    dom.elements.logContainer.scrollTop = dom.elements.logContainer.scrollHeight;
  },

  // Convenience methods
  info(message) {
    this.log(message, this.types.INFO);
  },
  success(message) {
    this.log(message, this.types.SUCCESS);
  },
  error(message) {
    this.log(message, this.types.ERROR);
  },
  event(message) {
    this.log(message, this.types.EVENT);
  },
};

// ===== HTML TEMPLATES =====
const templates = {
  // Environment details template
  environmentDetails(env) {
    // Helper to format values
    const formatValue = (value) => {
      if (value === null || value === undefined) return '-';
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (typeof value === 'object') return JSON.stringify(value, null, 2);
      return String(value);
    };

    // Build HTML for all environment properties
    let html = '';

    // Device Info
    html += `<div class="env-group"><strong>Device Information</strong></div>`;
    html += `<div class="env-item"><span class="env-label">Device ID:</span> <span class="env-value">${formatValue(env.deviceID)}</span></div>`;
    html += `<div class="env-item"><span class="env-label">Device Name:</span> <span class="env-value">${formatValue(env.deviceModelName)}</span></div>`;
    if (env.deviceLocation) {
      html += `<div class="env-item"><span class="env-label">Airport Code:</span> <span class="env-value">${formatValue(env.deviceLocation.airportCode)}</span></div>`;
      html += `<div class="env-item"><span class="env-label">Terminal:</span> <span class="env-value">${formatValue(env.deviceLocation.terminalID)}</span></div>`;
      html += `<div class="env-item"><span class="env-label">Gate:</span> <span class="env-value">${formatValue(env.deviceLocation.gateID)}</span></div>`;
    }

    // CUSS Version Info
    html += `<div class="env-group"><strong>CUSS Platform</strong></div>`;
    html += `<div class="env-item"><span class="env-label">CUSS Versions:</span> <span class="env-value">${env.cussVersions?.join(', ') || '-'}</span></div>`;
    html += `<div class="env-item"><span class="env-label">OS Name:</span> <span class="env-value">${formatValue(env.osName)}</span></div>`;
    html += `<div class="env-item"><span class="env-label">OS Version:</span> <span class="env-value">${formatValue(env.osVersion)}</span></div>`;

    // Session Timeouts
    html += `<div class="env-group"><strong>Session Timeouts</strong></div>`;
    html += `<div class="env-item"><span class="env-label">Session Timeout:</span> <span class="env-value">${formatValue(env.sessionTimeout)}s</span></div>`;
    html += `<div class="env-item"><span class="env-label">Kill Timeout:</span> <span class="env-value">${formatValue(env.killTimeout)}s</span></div>`;
    html += `<div class="env-item"><span class="env-label">Expected ACK Time:</span> <span class="env-value">${formatValue(env.expectedAckTime)}ms</span></div>`;
    html += `<div class="env-item"><span class="env-label">Max Cache Time:</span> <span class="env-value">${formatValue(env.maxCacheTime)}s</span></div>`;

    return html;
  },

  // Component item template - creates DOM elements from HTML template
  componentItem(id, component) {
    // Clone the base component template
    const template = document.getElementById('component-template');
    const clone = template.content.cloneNode(true);
    const componentEl = clone.querySelector('.component-item');

    // Set component state classes
    if (component.ready) componentEl.classList.add('ready');
    if (component.enabled) componentEl.classList.add('enabled');

    // Populate title row
    const componentName = clone.querySelector('.component-name');
    componentName.textContent = `${component.deviceType} (ID: ${id})`;

    // Set ready badge
    const readyBadge = clone.querySelector('.ready-badge');
    if (component.ready) {
      readyBadge.textContent = 'Ready';
      readyBadge.classList.add('ready');
    } else {
      readyBadge.textContent = 'Not Ready';
      readyBadge.classList.add('not-ready');
    }

    // Setup Query button
    const queryBtn = clone.querySelector('[data-action="query"]');
    queryBtn.dataset.componentId = id;

    // Setup Required toggle
    const requiredToggle = clone.querySelector('.toggle-required');
    requiredToggle.dataset.componentId = id;
    requiredToggle.dataset.currentRequired = component.required;
    if (component.required) {
      requiredToggle.classList.add('required');
    }

    // Setup Enabled toggle (only if component supports it)
    const enabledToggleContainer = clone.querySelector('.enabled-toggle-container');
    if (componentCapabilities.hasCapability(component, 'enable')) {
      enabledToggleContainer.style.display = '';
      const enabledToggle = clone.querySelector('.enabled-toggle-container .toggle-switch');
      enabledToggle.dataset.componentId = id;
      enabledToggle.dataset.currentState = component.enabled;

      if (component.enabled) {
        enabledToggle.classList.add('enabled');
      }
      if (!component.ready) {
        enabledToggle.classList.add('disabled');
      }
    }

    // Get capabilities and populate action columns
    const capabilities = componentCapabilities.getCapabilities(component);
    const leftColumn = clone.querySelector('.left-column');
    const rightColumn = clone.querySelector('.right-column');

      // Populate columns based on component type
    this.populateActionColumns(leftColumn, rightColumn, id, component, capabilities);

    return clone;
  },

  // Populate action columns based on component capabilities
  populateActionColumns(leftColumn, rightColumn, id, component, capabilities) {
    // Left column - Setup (most components)
    if (capabilities.includes('setup')) {
      const setupTemplate = document.getElementById('setup-action-template');
      const setupClone = setupTemplate.content.cloneNode(true);
      const textarea = setupClone.querySelector('.setup-textarea');
      const button = setupClone.querySelector('.setup-btn');
      const dropdown = setupClone.querySelector('.setup-dropdown');

      textarea.id = `setup-input-${id}`;
      button.dataset.componentId = id;

      // Check if this is a printer component and populate dropdown
      let commandSet = null;
      if (component.deviceType === 'BOARDING_PASS_PRINTER') {
        commandSet = aeaCommands.boardingPassPrinter;
      } else if (component.deviceType === 'BAG_TAG_PRINTER') {
        commandSet = aeaCommands.bagTagPrinter;
      }

      if (commandSet && dropdown) {
        // Populate dropdown with commands
        Object.entries(commandSet).forEach(([name, command]) => {
          const option = document.createElement('option');
          option.value = command;
          option.textContent = name;
          dropdown.appendChild(option);
        });

        // Show dropdown and add change listener
        dropdown.style.display = 'block';
        dropdown.addEventListener('change', (e) => {
          if (e.target.value) {
            textarea.value = e.target.value;
          }
        });
      }

      leftColumn.appendChild(setupClone);
    }

    // Right column - varies by component type
    if (capabilities.includes('send')) {
      // Output components (HEADSET, BOARDING_PASS_PRINTER, CONVEYOR)
      const sendTemplate = document.getElementById('send-action-template');
      const sendClone = sendTemplate.content.cloneNode(true);
      const textarea = sendClone.querySelector('.send-textarea');
      const buttonsContainer = sendClone.querySelector('.send-buttons');
      const dropdown = sendClone.querySelector('.send-dropdown');

      textarea.id = `send-input-${id}`;

      // Check if this is a printer component and populate dropdown
      let commandSet = null;
      if (component.deviceType === 'BOARDING_PASS_PRINTER') {
        commandSet = aeaCommands.boardingPassPrinter;
      } else if (component.deviceType === 'BAG_TAG_PRINTER') {
        commandSet = aeaCommands.bagTagPrinter;
      }

      if (commandSet && dropdown) {
        // Populate dropdown with commands
        Object.entries(commandSet).forEach(([name, command]) => {
          const option = document.createElement('option');
          option.value = command;
          option.textContent = name;
          dropdown.appendChild(option);
        });

        // Show dropdown and add change listener
        dropdown.style.display = 'block';
        dropdown.addEventListener('change', (e) => {
          if (e.target.value) {
            textarea.value = e.target.value;
          }
        });
      }

      // Add Send button
      this.addButton(buttonsContainer, 'Send', 'send', id);

      // Add additional buttons for specific types
      if (componentCapabilities.isConveyorComponent(component.deviceType)) {
        if (capabilities.includes('forward')) this.addButton(buttonsContainer, 'Forward', 'forward', id);
        if (capabilities.includes('backward')) this.addButton(buttonsContainer, 'Backward', 'backward', id);
        if (capabilities.includes('process')) this.addButton(buttonsContainer, 'Process', 'process', id);
      }
      if (capabilities.includes('cancel')) {
        this.addButton(buttonsContainer, 'Cancel', 'cancel', id);
      }

      rightColumn.appendChild(sendClone);
    } else if (capabilities.includes('play')) {
      // Announcement components
      const playTemplate = document.getElementById('play-action-template');
      const playClone = playTemplate.content.cloneNode(true);
      const textarea = playClone.querySelector('.play-textarea');
      const buttonsContainer = playClone.querySelector('.play-buttons');

      textarea.id = `play-input-${id}`;

      // Add playback control buttons
      this.addButton(buttonsContainer, 'Play', 'play', id);
      if (capabilities.includes('pause')) this.addButton(buttonsContainer, 'Pause', 'pause', id);
      if (capabilities.includes('resume')) this.addButton(buttonsContainer, 'Resume', 'resume', id);
      if (capabilities.includes('stop')) this.addButton(buttonsContainer, 'Stop', 'stop', id);
      if (capabilities.includes('cancel')) this.addButton(buttonsContainer, 'Cancel', 'cancel', id);

      rightColumn.appendChild(playClone);
    } else if (capabilities.includes('read')) {
      // Media input components
      const readTemplate = document.getElementById('read-action-template');
      const readClone = readTemplate.content.cloneNode(true);
      const input = readClone.querySelector('.read-input');
      const buttonsContainer = readClone.querySelector('.read-buttons');
      const dropdown = readClone.querySelector('.read-dropdown');

      input.id = `read-input-${id}`;

      // Check if this is a barcode reader or document reader and populate dropdown with test data
      const isBarcodeReader = component.deviceType === 'BARCODE_READER';
      const isDocumentReader = component.deviceType === 'PASSPORT_READER';

      if (isBarcodeReader && dropdown && aeaCommands.barcodeReader) {
        // Populate dropdown with example barcode data for testing/reference
        // Note: These are examples of what the device SHOULD return when you scan a physical barcode
        Object.entries(aeaCommands.barcodeReader).forEach(([name, data]) => {
          const option = document.createElement('option');
          option.value = data;
          option.textContent = name;
          dropdown.appendChild(option);
        });

        // Show dropdown and add change listener to display the expected barcode data
        dropdown.style.display = 'block';
        dropdown.addEventListener('change', (e) => {
          if (e.target.value) {
            // Display the test barcode in the console for reference
            const selectedName = e.target.options[e.target.selectedIndex].text;
            logger.info(`Test barcode example: ${selectedName}`);
            logger.info(`Expected data: ${e.target.value}`);
          }
        });
      } else if (isDocumentReader && dropdown && aeaCommands.documentReader) {
        // Populate dropdown with example document data (MRZ) for testing/reference
        // Note: These are examples of what the device SHOULD return when you scan a physical document
        Object.entries(aeaCommands.documentReader).forEach(([name, data]) => {
          const option = document.createElement('option');
          option.value = data;
          option.textContent = name;
          dropdown.appendChild(option);
        });

        // Show dropdown and add change listener to display the expected document data
        dropdown.style.display = 'block';
        dropdown.addEventListener('change', (e) => {
          if (e.target.value) {
            // Display the test document data in the console for reference
            const selectedName = e.target.options[e.target.selectedIndex].text;
            logger.info(`Test document example: ${selectedName}`);
            logger.info(`Expected MRZ data: ${e.target.value}`);
          }
        });
      }

      // Add Read and Cancel buttons
      this.addButton(buttonsContainer, 'Read', 'read', id);
      if (capabilities.includes('cancel')) {
        this.addButton(buttonsContainer, 'Cancel', 'cancel', id);
      }

      rightColumn.appendChild(readClone);
    } else {
      // Default right column - just buttons (Offer, Cancel, etc.)
      const rightButtonsTemplate = document.getElementById('right-buttons-template');
      const rightButtonsClone = rightButtonsTemplate.content.cloneNode(true);
      const buttonsContainer = rightButtonsClone.querySelector('.right-buttons');

      if (capabilities.includes('offer')) {
        this.addButton(buttonsContainer, 'Offer', 'offer', id);
      }
      if (capabilities.includes('cancel')) {
        this.addButton(buttonsContainer, 'Cancel', 'cancel', id);
      }

      if (buttonsContainer.children.length > 0) {
        rightColumn.appendChild(rightButtonsClone);
      }
    }
  },

  // Helper to add a button to a container
  addButton(container, text, action, componentId) {
    const button = document.createElement('button');
    button.className = 'component-action-btn';
    button.textContent = text;
    button.dataset.action = action;
    button.dataset.componentId = componentId;
    container.appendChild(button);
  },

  // Timeout warning banner template
  timeoutWarning(seconds) {
    return `
      <div id="timeoutBanner" class="timeout-banner">
        <div class="timeout-header">
          <strong>⚠️ Session Timeout Warning</strong>
          <button id="dismissTimeout" class="dismiss-btn">×</button>
        </div>
        <p>Application will be terminated in <span id="timeoutCounter">${seconds}</span> seconds</p>
      </div>
    `;
  },

  // Mixed content warning banner template
  mixedContentWarning(currentProtocol, targetProtocol, suggestedUrl) {
    return `
      <div id="mixedContentBanner" class="mixed-content-banner">
        <div class="mixed-content-header">
          <strong>🔒 Mixed Content Security Warning</strong>
          <button id="dismissMixedContent" class="dismiss-btn">×</button>
        </div>
        <p>This page is served over <strong>${currentProtocol.replace(':', '').toUpperCase()}</strong> but trying to connect to <strong>${targetProtocol.replace(':', '').toUpperCase()}</strong>.</p>
        <p>Modern browsers block this for security reasons.</p>
        <div class="mixed-content-actions">
          <button id="useSuggestedUrl" class="suggested-url-btn" data-url="${suggestedUrl}">
            Use Secure URL: ${suggestedUrl}
          </button>
          <button id="continueAnyway" class="continue-anyway-btn">Continue Anyway</button>
        </div>
      </div>
    `;
  }
};

// ===== UI UPDATE UTILITIES =====
const ui = {
  // Connection status states
  connectionStates: {
    CONNECTED: { class: "status connected", text: "Connected" },
    DISCONNECTED: { class: "status disconnected", text: "Disconnected" },
    CONNECTING: { class: "status connecting", text: "Connecting..." },
    FAILED: { class: "status disconnected", text: "Connection failed" },
  },

  // Update connection status
  updateConnectionStatus(state) {
    const status = this.connectionStates[state];

    if (state === "CONNECTED") {
      // Switch to State Management view (connected)
      dom.setVisible(dom.elements.connectionPanel, false);
      dom.setVisible(dom.elements.stateManagementPanel, true);
      dom.setVisible(dom.elements.environmentPanel, true);
      dom.setVisible(dom.elements.componentsPanel, true);
      dom.elements.eventLogPanel.classList.remove('panel-centered');
      dom.setVisible(dom.elements.connectionStatusConnected, true);
      dom.setClass(dom.elements.connectionStatusConnected, status.class);
      dom.setText(dom.elements.connectionStatusConnected, status.text);

      // Reset connection form UI
      dom.setVisible(dom.elements.connectButtonContainer, true);
      dom.setVisible(dom.elements.connectionStatusContainer, false);
    } else if (state === "CONNECTING") {
      // Show status bar with cancel button instead of connect button
      dom.setVisible(dom.elements.connectButtonContainer, false);
      dom.setVisible(dom.elements.connectionStatusContainer, true);
      dom.setClass(dom.elements.connectionStatus, status.class);
      dom.setText(dom.elements.connectionStatus, status.text);
    } else {
      // Switch to Connection view (disconnected/failed)
      dom.setVisible(dom.elements.connectionPanel, true);
      dom.setVisible(dom.elements.stateManagementPanel, false);
      dom.setVisible(dom.elements.environmentPanel, false);
      dom.setVisible(dom.elements.componentsPanel, false);
      dom.elements.eventLogPanel.classList.add('panel-centered');

      // Show connect button, hide status
      dom.setVisible(dom.elements.connectButtonContainer, true);
      dom.setVisible(dom.elements.connectionStatusContainer, false);

      // Update status text for any error messages
      if (state === "FAILED" || state === "DISCONNECTED") {
        dom.setClass(dom.elements.connectionStatus, status.class);
        dom.setText(dom.elements.connectionStatus, status.text);
      }
    }
  },

  // Update state display
  updateStateDisplay(state) {
    dom.setClass(dom.elements.currentState, `state-badge ${state}`);
    dom.setText(dom.elements.currentState, state);
    this.updateStateButtons(state);
  },

  // Update application info
  updateApplicationInfo(show = false) {
    if (show && cuss2) {
      dom.setText(dom.elements.appInfo.multiTenant, cuss2.multiTenant ? "Yes" : "No");
      dom.setText(dom.elements.appInfo.accessibleMode, cuss2.accessibleMode ? "Yes" : "No");
      dom.setText(dom.elements.appInfo.language, cuss2.language || "-");
    }
    else {
      Object.values(dom.elements.appInfo).forEach((el) => dom.setText(el, "-"));
    }
  },

  // Update state transition buttons
  updateStateButtons(currentState) {
    // Disable all buttons first
    Object.values(dom.elements.stateButtons).forEach((btn) => dom.setButtonState(btn, true));

    if (!cuss2 || !cuss2.connection.isOpen) return;

    // Check if there are any unavailable required components
    const hasUnavailableRequiredComponents = cuss2.unavailableRequiredComponents?.length > 0;

    // Define what states applications can move to based on platform logic
    const canMoveTo = {
      [ApplicationStateCodes.STOPPED]: ["initialize"],
      [ApplicationStateCodes.INITIALIZE]: ["unavailable", "stopped", "disabled"],
      [ApplicationStateCodes.UNAVAILABLE]: ["stopped", "suspended", "reload", "available"],
      [ApplicationStateCodes.AVAILABLE]: ["suspended", "reload", "disabled", "active", "unavailable", "stopped"],
      [ApplicationStateCodes.ACTIVE]: ["active", "unavailable", "disabled", "reload", "stopped", "available"],
      [ApplicationStateCodes.RELOAD]: ["disabled", "initialize", "unavailable"],
      [ApplicationStateCodes.SUSPENDED]: ["available", "unavailable", "stopped"],
      [ApplicationStateCodes.DISABLED]: ["stopped", "initialize"],
    };

    // Define what states applications are allowed to request
    const canRequest = ["initialize", "unavailable", "available", "active", "reload"];

    // Get transitions that are both valid to move to AND allowed to request
    const validTransitions = canMoveTo[currentState] || [];
    let allowedTransitions = validTransitions.filter(action => canRequest.includes(action));

    // If there are unavailable required components, block transitions to AVAILABLE and ACTIVE
    if (hasUnavailableRequiredComponents) {
      allowedTransitions = allowedTransitions.filter(action => {
        // Only allow transitions that don't require all components to be healthy
        // Block AVAILABLE and ACTIVE - these require all required components to be ready
        return action !== 'available' && action !== 'active';
      });

      // Log the restriction for user awareness
      if (allowedTransitions.length < validTransitions.filter(action => canRequest.includes(action)).length) {
        logger.info(`AVAILABLE/ACTIVE transitions blocked: ${cuss2.unavailableRequiredComponents.length} required component(s) unavailable`);
      }
    }

    // Enable buttons for allowed transitions
    allowedTransitions.forEach((action) => {
      if (dom.elements.stateButtons[action]) {
        dom.setButtonState(dom.elements.stateButtons[action], false);
      }
    });

    // STOPPED button always stays disabled (not requestable by applications)
    dom.setButtonState(dom.elements.stateButtons.stopped, true);
  },

  // Display environment info
  displayEnvironment(env) {
    dom.elements.envDetails.innerHTML = templates.environmentDetails(env);
  },

  // Display components
  displayComponents() {
    if (!cuss2 || !cuss2.components) {
      dom.elements.componentList.innerHTML = '<p style="color: #666;">No components available</p>';
      return;
    }

    dom.elements.componentList.innerHTML = "";

    Object.entries(cuss2.components).forEach(([id, component]) => {
      const item = this.createComponentItem(id, component);
      dom.elements.componentList.appendChild(item);
    });
  },

  // Create a component item element
  createComponentItem(id, component) {
    // Use the new template-based approach
    const fragment = templates.componentItem(id, component);

    // Extract the actual element from the DocumentFragment
    const item = fragment.querySelector('.component-item');

    // Add toggle switch event listener (only if toggle exists)
    const toggleElement = item.querySelector('.toggle-switch:not(.toggle-required)');

    if (toggleElement) {
      toggleElement.addEventListener('click', async (e) => {
        e.stopPropagation();

        // Don't allow toggle if component is not ready or already pending
        if (!component.ready || toggleElement.classList.contains('pending')) {
          return;
        }

        const originalState = toggleElement.dataset.currentState === 'true';
        const action = originalState ? 'disable' : 'enable';

        // Set pending state immediately
        toggleElement.classList.add('pending');
        toggleElement.classList.remove('enabled');

        try {
          await componentHandlers.handleComponentAction(component, action, id);

          // Success: Get fresh component reference and update based on actual component state
          const freshComponent = cuss2.components[id];
          componentHandlers.syncToggleState(toggleElement, freshComponent || component);
        } catch (error) {
          // Error: Revert to original state
          if (originalState) {
            toggleElement.classList.add('enabled');
          } else {
            toggleElement.classList.remove('enabled');
          }
          toggleElement.dataset.currentState = originalState;
        } finally {
          // Always remove pending state
          toggleElement.classList.remove('pending');
        }
      });
    }

    // Add required toggle event listener
    const requiredToggleElement = item.querySelector('.toggle-required');
    if (requiredToggleElement) {
      requiredToggleElement.addEventListener('click', async (e) => {
        e.stopPropagation();

        // Don't allow toggle if already pending
        if (requiredToggleElement.classList.contains('pending')) {
          return;
        }

        const currentRequired = requiredToggleElement.dataset.currentRequired === 'true';
        const newRequired = !currentRequired;

        // Set pending state immediately
        requiredToggleElement.classList.add('pending');

        try {
          // Update the component's required property
          component.required = newRequired;

          // Update toggle visual state
          if (newRequired) {
            requiredToggleElement.classList.add('required');
          } else {
            requiredToggleElement.classList.remove('required');
          }
          requiredToggleElement.dataset.currentRequired = newRequired;

          // Log the change
          logger.info(`Component ${component.deviceType} marked as ${newRequired ? 'REQUIRED' : 'NOT REQUIRED'}`);

          // Enforce CUSS2 required device rules based on the change
          if (cuss2) {
            // Only trigger state changes if the logic makes sense
            if (newRequired && !component.ready) {
              // Marking an unavailable component as required → force UNAVAILABLE
              logger.info(`Required component ${component.deviceType} is not ready - requesting UNAVAILABLE state`);
              cuss2.requestUnavailableState();
            } else if (!newRequired) {
              // Unmarking a component as required → check if we can leave UNAVAILABLE
              // Only call sync if we're in UNAVAILABLE and might be able to transition to AVAILABLE
              if (cuss2.state === ApplicationStateCodes.UNAVAILABLE) {
                cuss2.checkRequiredComponentsAndSyncState();
              }
            }
            // If marking a READY component as required while in ACTIVE/AVAILABLE → do nothing
          }

          // Update state buttons to reflect new required component status
          ui.updateStateButtons(cuss2.state);
        } catch (error) {
          logger.error(`Failed to toggle required state: ${error.message}`);
          // Revert on error
          component.required = currentRequired;
          if (currentRequired) {
            requiredToggleElement.classList.add('required');
          } else {
            requiredToggleElement.classList.remove('required');
          }
          requiredToggleElement.dataset.currentRequired = currentRequired;
        } finally {
          // Always remove pending state
          requiredToggleElement.classList.remove('pending');
        }
      });
    }

    // Add action button event listeners
    const actionButtons = item.querySelectorAll('.component-action-btn');
    actionButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = button.dataset.action;
        const componentId = button.dataset.componentId;

        // Disable button during operation
        button.disabled = true;

        try {
          // Check if this action requires input
          const inputId = `${action}-input-${componentId}`;
          const input = document.getElementById(inputId);

          if (input) {
            // Actions that need input data
            const inputValue = input.value.trim();
            await componentHandlers.handleComponentDataAction(component, action, inputValue, componentId);
          } else {
            // Actions without input (query, cancel, offer, pause, resume, stop, forward, backward, process)
            await componentHandlers.handleComponentSimpleAction(component, action, componentId);
          }
        } catch (error) {
          // Error is already logged in handler
        } finally {
          button.disabled = false;
        }
      });
    });

    return item;
  },

  // Store the timeout countdown interval so we can clear it
  _timeoutCountdown: null,

  // Show timeout warning banner with countdown
  showTimeoutWarning(seconds) {
    // Clear any existing countdown
    if (this._timeoutCountdown) {
      clearInterval(this._timeoutCountdown);
      this._timeoutCountdown = null;
    }

    // Remove any existing banner
    const existingBanner = document.getElementById('timeoutBanner');
    if (existingBanner) {
      existingBanner.remove();
    }

    // Add banner to body
    document.body.insertAdjacentHTML('afterbegin', templates.timeoutWarning(seconds));

    // Add dismiss button handler
    const dismissBtn = document.getElementById('dismissTimeout');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        this.dismissTimeoutWarning();
      });
    }

    // Start countdown timer
    let remainingSeconds = seconds;
    const counter = document.getElementById('timeoutCounter');

    this._timeoutCountdown = setInterval(() => {
      remainingSeconds--;
      if (counter) {
        counter.textContent = remainingSeconds;
      }

      if (remainingSeconds <= 0) {
        clearInterval(this._timeoutCountdown);
        this._timeoutCountdown = null;
      }
    }, 1000);
  },

  // Dismiss timeout warning banner
  dismissTimeoutWarning() {
    // Clear countdown interval
    if (this._timeoutCountdown) {
      clearInterval(this._timeoutCountdown);
      this._timeoutCountdown = null;
    }

    // Remove banner
    const banner = document.getElementById('timeoutBanner');
    if (banner) {
      banner.remove();
    }
  },

  // Store the accessible mode countdown interval
  _accessibleModeCountdown: null,

  // Show accessible mode acknowledgement toast with countdown
  showAccessibleModeToast(seconds) {
    // Clear any existing countdown
    if (this._accessibleModeCountdown) {
      clearInterval(this._accessibleModeCountdown);
      this._accessibleModeCountdown = null;
    }

    // Remove any existing banner
    const existingBanner = document.getElementById('accessibleModeBanner');
    if (existingBanner) {
      existingBanner.remove();
    }

    // Clone template and add to body
    const template = document.getElementById('accessible-mode-toast-template');
    const clone = template.content.cloneNode(true);

    // Set initial countdown value
    const counterElement = clone.getElementById('accessibleModeCounter');
    if (counterElement) {
      counterElement.textContent = seconds;
    }

    document.body.insertBefore(clone, document.body.firstChild);

    // Add acknowledge button handler
    const acknowledgeBtn = document.getElementById('acknowledgeAccessibleMode');
    if (acknowledgeBtn) {
      acknowledgeBtn.addEventListener('click', async () => {
        try {
          logger.info('Acknowledging accessible mode...');
          await cuss2.acknowledgeAccessibleMode();
          logger.success('Accessible mode acknowledged');
          this.dismissAccessibleModeToast();
        } catch (error) {
          logger.error(`Failed to acknowledge accessible mode: ${error.message}`);
        }
      });
    }

    // Start countdown timer
    let remainingSeconds = seconds;
    const counter = document.getElementById('accessibleModeCounter');

    this._accessibleModeCountdown = setInterval(() => {
      remainingSeconds--;
      if (counter) {
        counter.textContent = remainingSeconds;
      }

      if (remainingSeconds <= 0) {
        clearInterval(this._accessibleModeCountdown);
        this._accessibleModeCountdown = null;
      }
    }, 1000);
  },

  // Dismiss accessible mode toast
  dismissAccessibleModeToast() {
    // Clear countdown interval
    if (this._accessibleModeCountdown) {
      clearInterval(this._accessibleModeCountdown);
      this._accessibleModeCountdown = null;
    }

    // Remove banner
    const banner = document.getElementById('accessibleModeBanner');
    if (banner) {
      banner.remove();
    }
  },

  // Show mixed content warning banner
  showMixedContentWarning(mixedContentInfo) {
    // Remove any existing banner
    const existingBanner = document.getElementById('mixedContentBanner');
    if (existingBanner) {
      existingBanner.remove();
    }

    // Add banner to body
    document.body.insertAdjacentHTML('afterbegin',
      templates.mixedContentWarning(
        mixedContentInfo.currentProtocol,
        mixedContentInfo.targetProtocol,
        mixedContentInfo.suggestedUrl
      )
    );

    // Set up event listeners
    const dismissBtn = document.getElementById('dismissMixedContent');
    const suggestedBtn = document.getElementById('useSuggestedUrl');
    const continueBtn = document.getElementById('continueAnyway');

    dismissBtn?.addEventListener('click', () => {
      document.getElementById('mixedContentBanner')?.remove();
    });

    suggestedBtn?.addEventListener('click', () => {
      const suggestedUrl = suggestedBtn.dataset.url;

      // Update WebSocket URL field
      const wssInput = document.getElementById('wss');
      if (wssInput) {
        wssInput.value = suggestedUrl;
        // Trigger input event to update OAuth URL
        wssInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Remove banner
      document.getElementById('mixedContentBanner')?.remove();

      // Log the change
      logger.info(`Switched to secure URL: ${suggestedUrl}`);
    });

    continueBtn?.addEventListener('click', () => {
      document.getElementById('mixedContentBanner')?.remove();
    });

    return new Promise((resolve, reject) => {
      // Return a promise that resolves when user makes a choice
      continueBtn?.addEventListener('click', () => resolve('continue'));
      suggestedBtn?.addEventListener('click', () => resolve('suggested'));
      dismissBtn?.addEventListener('click', () => reject(new Error('User cancelled connection')));
    });
  },

  // Reset UI to disconnected state
  resetUI() {
    // Dismiss timeout banner (clears countdown and removes banner)
    this.dismissTimeoutWarning();

    // Dismiss accessible mode toast (clears countdown and removes banner)
    this.dismissAccessibleModeToast();

    // Remove mixed content banner if present
    const mixedContentBanner = document.getElementById('mixedContentBanner');
    if (mixedContentBanner) {
      mixedContentBanner.remove();
    }

    // Switch back to Connection panel
    dom.setVisible(dom.elements.connectionPanel, true);
    dom.setVisible(dom.elements.stateManagementPanel, false);
    dom.setVisible(dom.elements.environmentPanel, false);

    dom.elements.componentList.innerHTML =
      '<p style="color: #666;">Connect to see available components...</p>';
    this.updateStateDisplay("STOPPED");
    this.updateApplicationInfo(false);
  },
};

// Helper function to show or remove status badge for a component
function updateComponentStatusBadge(componentId, status) {
  // Find the component element
  const componentElement = document.querySelector(`[data-component-id="${componentId}"]`)?.closest('.component-item');
  if (!componentElement) return;

  // Find the badges container
  const badgesContainer = componentElement.querySelector('.component-badges');
  if (!badgesContainer) return;

  // Remove any existing status badge
  const existingStatusBadge = badgesContainer.querySelector('.component-badge.status-badge');
  if (existingStatusBadge) {
    existingStatusBadge.remove();
  }

  // If status is OK, just remove the badge and return (no badge needed)
  if (!status || status === 'OK') {
    return;
  }

  // Create new status badge for non-OK status
  const statusClass = `status-${status.toLowerCase().replace(/_/g, '-')}`;
  const temporaryStatuses = ['WRONG_APPLICATION_STATE', 'MEDIA_PRESENT', 'MEDIA_ABSENT'];
  const isTemporary = temporaryStatuses.includes(status);
  const fadeClass = isTemporary ? 'fade-out' : '';

  const badge = document.createElement('span');
  badge.className = `component-badge status-badge ${statusClass} ${fadeClass}`;
  badge.textContent = status.replace(/_/g, ' ');

  // Add to container
  badgesContainer.appendChild(badge);

  // If temporary, remove after animation completes
  if (isTemporary) {
    badge.addEventListener('animationend', () => {
      badge.remove();
    }, { once: true });
  }
}

function updateComponentReadyBadge(componentId, ready) {
  // Find the component element
  const componentElement = document.querySelector(`[data-component-id="${componentId}"]`)?.closest('.component-item');
  if (!componentElement) return;

  // Find the ready badge
  const readyBadge = componentElement.querySelector('.ready-badge');
  if (!readyBadge) return;

  // Update badge text and classes
  readyBadge.className = 'component-badge ready-badge'; // Reset classes
  if (ready) {
    readyBadge.textContent = 'Ready';
    readyBadge.classList.add('ready');
  } else {
    readyBadge.textContent = 'Not Ready';
    readyBadge.classList.add('not-ready');
  }
}

// ===== COMPONENT HANDLERS =====
const componentHandlers = {
  // Handle component action (enable/disable)
  async handleComponentAction(component, action, componentId) {
    const name = component.deviceType;

    try {
      const actionText = action === 'enable' ? 'Enabling' : 'Disabling';
      logger.info(`${actionText} ${name}...`);
      await component[action]();
      logger.success(`${name} ${action}d`);
    }
    catch (error) {
      logger.error(`Failed to ${action} ${name}: ${error.message}`);
      throw error; // Re-throw so the toggle can handle the error state
    }
    finally {
      // Update status badge based on current component status
      updateComponentStatusBadge(componentId, component.status);
    }
  },

  // Handle simple component actions (no input required)
  async handleComponentSimpleAction(component, action, componentId) {
    const name = component.deviceType;

    try {
      logger.info(`Executing ${action} on ${name}...`);

      // Check if the method exists on the component
      if (typeof component[action] === 'function') {
        const result = await component[action]();
        logger.success(`${action} completed on ${name}`);

        // Log result for query actions
        if (action === 'query' && result) {
          logger.event(`Query result: ${JSON.stringify(result.meta || result)}`);
        }
      } else {
        throw new Error(`${action} not available on ${name}`);
      }
    } catch (error) {
      logger.error(`Failed to ${action} ${name}: ${error.message}`);
      throw error;
    }
    finally {
      // Update status badge based on current component status
      updateComponentStatusBadge(componentId, component.status);
    }
  },

  // Handle component data action (setup/send/play/read)
  async handleComponentDataAction(component, action, inputValue, componentId) {
    const name = component.deviceType;

    try {
      let data = null;

      // Parse input based on action type
      if (inputValue) {
        if (action === 'read') {
          // For read, the input is timeout in milliseconds
          data = parseInt(inputValue) || 30000;
        } else if (action === 'play') {
          // For play, it's just text/SSML (not JSON)
          data = inputValue;
        } else if (action === 'setup' || action === 'send') {
          // For setup/send, create DataRecordList format
          // If input contains newlines, split into separate DataRecords (one per line)
          // This is required for multi-line printer SETUP commands
          const lines = inputValue.split('\n').filter(line => line.trim() !== '');
          data = lines.map(line => ({
            data: line,
            dsTypes: ['DS_TYPES_ITPS']  // Default to ITPS for printer commands
          }));
        } else {
          // For other actions, parse as JSON
          try {
            data = JSON.parse(inputValue);
          } catch (parseError) {
            logger.error(`Invalid JSON for ${action}: ${parseError.message}`);
            throw new Error(`Invalid JSON: ${parseError.message}`);
          }
        }
      }

      const actionText = action.charAt(0).toUpperCase() + action.slice(1);
      logger.info(`${actionText} ${name}${data !== null ? ' with: ' + (typeof data === 'object' ? JSON.stringify(data) : data) : ''}...`);

      // Call the appropriate method on the component
      if (typeof component[action] === 'function') {
        const result = data !== null ? await component[action](data) : await component[action]();
        logger.success(`${name} ${action} completed`);

        // Log result for read operations
        if (action === 'read' && result) {
          logger.event(`Read data: ${JSON.stringify(result)}`);
        }
      } else {
        throw new Error(`${action} not available on ${name}`);
      }
    }
    catch (error) {
      logger.error(`Failed to ${action} ${name}: ${error.message}`);
      throw error;
    }
    finally {
      // Update status badge based on current component status
      updateComponentStatusBadge(componentId, component.status);
    }
  },

  // Sync toggle visual state with component state
  syncToggleState(toggleElement, component) {
    // Check if component has enabled property (InteractiveComponents)
    if (component.enabled !== undefined) {
      if (component.enabled) {
        toggleElement.classList.add('enabled');
      } else {
        toggleElement.classList.remove('enabled');
      }
      toggleElement.dataset.currentState = component.enabled.toString();
    }
  },

  // Update all toggle states after component refresh
  updateAllToggleStates() {
    if (!cuss2 || !cuss2.components) return;

    Object.entries(cuss2.components).forEach(([id, component]) => {
      const toggleElement = document.querySelector(`[data-component-id="${id}"]`);
      if (toggleElement) {
        this.syncToggleState(toggleElement, component);
      }
    });
  },

  // Setup component data listeners
  setupComponentListeners() {
    const componentListeners = [
      {
        component: "barcodeReader",
        event: "data",
        handler: (data) => `Barcode scanned: ${data.rawData}`,
      },
      {
        component: "documentReader",
        event: "data",
        handler: (data) => `Document scanned: ${data.rawData || 'Document data received'}`,
      },
      {
        component: "cardReader",
        event: "data",
        handler: (data) => `Card read: ${data.track1 || data.track2 || "Chip/NFC"}`,
      },
      { component: "scale", event: "data", handler: (data) => `Weight: ${data.weight} ${data.unit}` },
    ];

    componentListeners.forEach(({ component, event, handler }) => {
      if (cuss2[component]) {
        cuss2[component].on(event, (dataRecords) => {
          // Log to console
          logger.event(handler(dataRecords));

          // Update data display box in UI
          componentHandlers.updateDataDisplay(cuss2[component].id, dataRecords);
        });
      }
    });
  },

  // Update data display box for a component
  updateDataDisplay(componentId, dataRecords) {
    const componentItem = document.querySelector(`[data-component-id="${componentId}"]`);
    if (!componentItem) return;

    const dataDisplayBox = componentItem.querySelector('.data-display-box');
    if (!dataDisplayBox) return;

    // Format the data for display
    let displayText = '';
    if (Array.isArray(dataRecords)) {
      dataRecords.forEach((record, index) => {
        if (index > 0) displayText += '\n---\n';
        displayText += `Data: ${record.data || 'N/A'}\n`;
        if (record.dsTypes && record.dsTypes.length > 0) {
          displayText += `Type: ${record.dsTypes.join(', ')}\n`;
        }
        if (record.dataStatus) {
          displayText += `Status: ${record.dataStatus}`;
        }
      });
    } else {
      displayText = JSON.stringify(dataRecords, null, 2);
    }

    dataDisplayBox.textContent = displayText;
  },
};

// ===== CONNECTION MANAGEMENT =====
const connectionManager = {
  // Setup connection event listeners
  setupConnectionListeners() {
    const connectionEvents = [
      {
        event: "connecting",
        handler: (attempt) => logger.info(`WebSocket connection attempt ${attempt}`),
      },
      {
        event: "authenticating",
        handler: (attempt) => logger.info(`Authentication attempt ${attempt}`),
      },
      { event: "authenticated", handler: () => logger.success("Authentication successful") },
      { event: "open", handler: () => logger.success("WebSocket connection opened") },
      { event: "close", handler: () => this.handleConnectionClose() },
      { event: "error", handler: (error) => logger.error(`Connection error: ${error.message}`) },
    ];

    connectionEvents.forEach(({ event, handler }) => {
      cuss2.connection.on(event, handler);
    });
  },

  // Handle connection close
  handleConnectionClose() {
    logger.error("WebSocket connection closed");
    ui.updateConnectionStatus("DISCONNECTED");
    dom.setButtonState(dom.elements.connectBtn, false);
    dom.setButtonState(dom.elements.disconnectBtn, true);
    Object.values(dom.elements.stateButtons).forEach((btn) => dom.setButtonState(btn, true));
  },

  // Setup platform event listeners
  setupPlatformListeners() {
    const platformEvents = [
      {
        event: "stateChange",
        handler: (stateChange) => {
          logger.event(`State changed: ${stateChange.previous} → ${stateChange.current}`);
          ui.updateStateDisplay(stateChange.current);
          ui.updateApplicationInfo(stateChange.current === ApplicationStateCodes.ACTIVE);

          // Set applicationOnline flag to enable required component monitoring
          // Online when in AVAILABLE or ACTIVE (user is present)
          if (cuss2) {
            cuss2.applicationOnline =
              stateChange.current === ApplicationStateCodes.AVAILABLE ||
              stateChange.current === ApplicationStateCodes.ACTIVE;
            logger.info(`Application online: ${cuss2.applicationOnline}`);
          }
        },
      },
      {
        event: "activated",
        handler: () => {
          logger.event("Application activated");
          ui.updateApplicationInfo(true);
          // Dismiss timeout warning when successfully reactivated
          ui.dismissTimeoutWarning();

          // Show accessible mode toast if activated in accessible mode
          if (cuss2.accessibleMode) {
            const killTimeoutSeconds = Math.floor(cuss2.environment.killTimeout / 1000);
            logger.info(`Accessible mode activated - showing acknowledgement prompt (${killTimeoutSeconds}s timeout)`);
            ui.showAccessibleModeToast(killTimeoutSeconds);
          }
        },
      },
      {
        event: "deactivated",
        handler: (newState) => {
          logger.event(`Application deactivated, new state: ${newState}`);
          ui.updateApplicationInfo(false);
          // Update the state display and buttons to reflect new state
          ui.updateStateDisplay(newState);
          // Dismiss timeout warning when leaving ACTIVE state
          ui.dismissTimeoutWarning();
          // Dismiss accessible mode toast when leaving ACTIVE state
          ui.dismissAccessibleModeToast();
        },
      },
      {
        event: "componentStateChange",
        handler: async (component) => {
          logger.event(`Component ${component.deviceType} state changed`);
          // Don't redisplay all components on every state change - too aggressive
          // Just update the toggle states to reflect current component state
          componentHandlers.updateAllToggleStates();
          // Update state buttons to reflect required component availability
          ui.updateStateButtons(cuss2.state);
          // Update the status badge to reflect the new component status
          updateComponentStatusBadge(component.id, component.status);
          // Update the ready badge to reflect the new component ready state
          updateComponentReadyBadge(component.id, component.ready);

          // Automatic transition back to AVAILABLE when all required devices become healthy
          // Only attempt this if:
          // 1. Currently in UNAVAILABLE state
          // 2. Application was online (meaning it's been through AVAILABLE/ACTIVE before)
          // 3. All required components are now healthy
          if (
            cuss2.state === ApplicationStateCodes.UNAVAILABLE &&
            cuss2.applicationOnline &&
            (!cuss2.unavailableRequiredComponents || cuss2.unavailableRequiredComponents.length === 0)
          ) {
            logger.info('All required components are now healthy - automatically transitioning to AVAILABLE');
            try {
              await cuss2.requestAvailableState();
              logger.success('Successfully transitioned to AVAILABLE state');
            } catch (error) {
              logger.error(`Failed to automatically transition to AVAILABLE: ${error.message}`);
            }
          }
        },
      },
      {
        event: "sessionTimeout",
        handler: async () => {
          // Get killTimeout from the environment data (fetched during initialization)
          const killTimeoutSeconds = Math.floor(cuss2.environment.killTimeout / 1000);
          logger.error(`Session timeout warning - Application will be terminated in ${killTimeoutSeconds} seconds`);
          ui.showTimeoutWarning(killTimeoutSeconds);

          // Per CUSS2 spec, application should transition to AVAILABLE state on session timeout
          if (cuss2 && cuss2.state === ApplicationStateCodes.ACTIVE) {
            logger.info("Session timeout received - transitioning to AVAILABLE state");
            try {
              await cuss2.requestAvailableState();
              logger.success("Successfully transitioned to AVAILABLE state");
            } catch (error) {
              logger.error(`Failed to transition to AVAILABLE state: ${error.message}`);
            }
          }
        },
      },
    ];

    platformEvents.forEach(({ event, handler }) => {
      cuss2.on(event, handler);
    });
  },

  // Connect to CUSS2
  async connect(config) {
    try {
      // Check for mixed content issues before connecting
      const mixedContentCheck = urlUtils.checkMixedContent(config.wss);
      if (mixedContentCheck.hasMixedContent) {
        logger.info("Mixed content detected, showing warning...");

        try {
          const userChoice = await ui.showMixedContentWarning(mixedContentCheck);

          if (userChoice === 'suggested') {
            // User chose to use suggested URL, but form should already be updated
            // Just return, the new URL will be used on next connection attempt
            return;
          } else if (userChoice === 'continue') {
            // User chose to continue anyway, proceed with connection
          }
        } catch (error) {
          // User cancelled
          logger.info("Connection cancelled by user");
          ui.updateConnectionStatus("DISCONNECTED");
          return;
        }
      }

      await this.performConnection(config);
    }
    catch (error) {
      logger.error(`Connection failed: ${error.message}`);
      ui.updateConnectionStatus("FAILED");
      dom.setButtonState(dom.elements.connectBtn, false);
      dom.setButtonState(dom.elements.disconnectBtn, true);
    }
  },

  // Perform the actual connection
  async performConnection(config) {
    logger.info("Connecting to CUSS2 platform...");
    ui.updateConnectionStatus("CONNECTING");

    // Close any existing connection before attempting a new one
    // This prevents old connections from continuing retry attempts
    if (cuss2) {
      logger.info("Closing previous connection before new attempt...");
      try {
        // Close the websocket connection
        cuss2.connection.close(1000, "New connection attempt");

        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        logger.error(`Error closing previous connection: ${e.message}`);
      }
      cuss2 = null;
    }

    // Pass through the token URL if provided, otherwise let the library handle it
    const tokenUrl = config.tokenUrl?.trim() || undefined;

    logger.info(`Using WebSocket URL: ${config.wss}`);
    if (tokenUrl) {
      logger.info(`Using OAuth Token URL: ${tokenUrl}`);
    } else {
      logger.info(`OAuth Token URL will be derived from WebSocket URL by the library`);
    }

    cuss2 = Cuss2.connect(
      config.clientId,
      config.clientSecret,
      config.wss,
      config.deviceId || undefined,
      tokenUrl,
    );
    window.cuss2 = cuss2;

    // Setup all listeners
    this.setupConnectionListeners();
    this.setupPlatformListeners();

    // Wait for connection
    await cuss2.connected;

    logger.success("Connected successfully!");
    ui.updateConnectionStatus("CONNECTED");
    dom.setButtonState(dom.elements.connectBtn, true);
    dom.setButtonState(dom.elements.disconnectBtn, false);

    // Display environment and components
    ui.displayEnvironment(cuss2.environment);
    ui.displayComponents();
    ui.updateStateDisplay(cuss2.state);

    // Setup component listeners
    componentHandlers.setupComponentListeners();

    // If auto-progressing to a state, do it now
    if (queryConfig.go) { // intentionally do no run if go is empty string
      const targetState = queryConfig.go.toUpperCase();
      await stateManager.progressToState(targetState);
    }
  },

  // Cancel ongoing connection attempt
  cancelConnection() {
    logger.info("Cancelling connection attempt...");
    if (cuss2) {
      // Close the connection which will abort any ongoing OAuth attempts
      cuss2.connection.close(1000, "Connection cancelled by user");
      cuss2 = null;
    }
    ui.updateConnectionStatus("DISCONNECTED");
    logger.info("Connection attempt cancelled");
  },

  // Disconnect
  disconnect() {
    if (cuss2) {
      cuss2.connection.close();
      cuss2 = null;
      ui.resetUI();
    }
  },
};

// ===== STATE MANAGEMENT =====
const stateManager = {
  // State request mapping
  stateRequests: {
    initialize: { method: "requestInitializeState", state: "INITIALIZE" },
    unavailable: { method: "requestUnavailableState", state: "UNAVAILABLE" },
    available: { method: "requestAvailableState", state: "AVAILABLE" },
    active: { method: "requestActiveState", state: "ACTIVE" },
    stopped: { method: "requestStoppedState", state: "STOPPED" },
    reload: {
      method: "requestReload",
      state: "RELOAD",
      confirm: "This will close the connection. Continue?",
    },
  },

  // Request state change
  async requestState(action) {
    const request = this.stateRequests[action];
    if (!request) {
      return;
    }

    // Check for confirmation requirement
    if (request.confirm && !confirm(request.confirm)) {
      return;
    }

    try {
      const result = await cuss2[request.method]();
      logger.success(`Requested ${request.state} state`);
    }
    catch (error) {
      logger.error(`Failed to request ${request.state}: ${error.message}`);
    }
  },

  // Setup state button listeners
  setupStateButtons() {
    Object.entries(dom.elements.stateButtons).forEach(([action, button]) => {
      button.addEventListener("click", () => this.requestState(action));
    });
  },

  // Progress through states to reach a target state
  async progressToState(targetState) {
    if (!cuss2) {
      logger.error("Cannot progress to state: not connected");
      return;
    }

    // Validate target state
    const targetIndex = ["UNAVAILABLE", "AVAILABLE", "ACTIVE"].indexOf(targetState);
    if (targetIndex === -1) {
      logger.error(`Invalid target state: ${targetState}`);
      return;
    }

    logger.info(`Auto-progressing to ${targetState} state...`);

    const s1 = (await cuss2.requestUnavailableState())?.meta.currentApplicationState.applicationStateCode;
    if(s1 !== ApplicationStateCodes.UNAVAILABLE || targetIndex === 0) {
      return;
    }
    const s2 = (await cuss2.requestAvailableState())?.meta.currentApplicationState.applicationStateCode;
    if(s2 !== ApplicationStateCodes.AVAILABLE || targetIndex === 1) {
      return;
    }
    await cuss2.requestActiveState();
  },
};

// ===== INITIALIZATION =====

// Function to generate OAuth URL from WebSocket URL (for placeholder/UI only)
function generateOAuthUrl(wsUrl) {
  if (!wsUrl) return '';

  try {
    // Handle URLs that might not have protocol
    const hasProtocol = wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://') || wsUrl.startsWith('http://') || wsUrl.startsWith('https://');
    const normalizedUrl = hasProtocol ? wsUrl : `http://${wsUrl}`;

    const url = new URL(normalizedUrl);

    // Map protocols for UI display only: ws/wss/http/https → http/https
    let httpScheme;
    if (url.protocol === 'wss:') {
      httpScheme = 'https:';
    } else if (url.protocol === 'ws:') {
      httpScheme = 'http:';
    } else {
      httpScheme = url.protocol; // Already http: or https:
    }

    // Construct OAuth URL for placeholder text
    return `${httpScheme}//${url.host}/oauth/token`;
  } catch (error) {
    return '';
  }
}

// Function to update Token URL placeholder text
function updateTokenUrlPlaceholder() {
  const wssInput = document.getElementById("wss");
  const tokenUrlInput = document.getElementById("tokenUrl");

  if (wssInput && tokenUrlInput) {
    const wsUrl = wssInput.value.trim() || 'http://localhost:22222';
    const placeholderUrl = generateOAuthUrl(wsUrl);
    tokenUrlInput.placeholder = placeholderUrl;
  }
}

// Function to check if WebSocket URL and Token URL are in sync
function areUrlsInSync() {
  const wssInput = document.getElementById("wss");
  const tokenUrlInput = document.getElementById("tokenUrl");

  if (!wssInput || !tokenUrlInput) return true;

  const currentTokenUrl = tokenUrlInput.value.trim();
  const wsUrl = wssInput.value.trim() || 'http://localhost:22222';
  const expectedTokenUrl = generateOAuthUrl(wsUrl);

  return currentTokenUrl === expectedTokenUrl;
}

// Function to update Generate/Regenerate button text and state
function updateGenerateButton() {
  const tokenUrlInput = document.getElementById("tokenUrl");
  const generateBtn = document.getElementById("generateTokenBtn");

  if (tokenUrlInput && generateBtn) {
    const hasValue = tokenUrlInput.value.trim() !== '';

    if (!hasValue) {
      // No value - show "Generate" and enable
      generateBtn.textContent = 'Generate';
      generateBtn.disabled = false;
    } else {
      // Has value - show "Regenerate"
      generateBtn.textContent = 'Regenerate';

      // Check if in sync
      const inSync = areUrlsInSync();
      generateBtn.disabled = inSync; // Disable when in sync, enable when out of sync
    }
  }
}

// Function to generate/fill Token URL
function generateTokenUrl() {
  const wssInput = document.getElementById("wss");
  const tokenUrlInput = document.getElementById("tokenUrl");

  if (wssInput && tokenUrlInput) {
    const wsUrl = wssInput.value.trim() || 'http://localhost:22222';
    const generatedUrl = generateOAuthUrl(wsUrl);
    tokenUrlInput.value = generatedUrl;
    updateGenerateButton();
  }
}

function init() {
  // Initialize DOM
  dom.init();

  // Apply query parameters to form if provided
  if (queryConfig.clientId) document.getElementById("clientId").value = queryConfig.clientId;
  if (queryConfig.clientSecret) {
    document.getElementById("clientSecret").value = queryConfig.clientSecret;
  }
  if (queryConfig.wss) document.getElementById("wss").value = queryConfig.wss;
  if (queryConfig.tokenUrl) document.getElementById("tokenUrl").value = queryConfig.tokenUrl;
  if (queryConfig.deviceId) document.getElementById("deviceId").value = queryConfig.deviceId;

  // Update Token URL placeholder based on WebSocket URL
  updateTokenUrlPlaceholder();

  // Initialize Generate/Regenerate button state
  updateGenerateButton();

  // Add event listeners for WebSocket URL changes
  const wssInput = document.getElementById("wss");
  if (wssInput) {
    // Update placeholder and button when WebSocket URL changes
    wssInput.addEventListener("input", () => {
      updateTokenUrlPlaceholder();
      updateGenerateButton(); // Check sync status
    });
    wssInput.addEventListener("change", () => {
      updateTokenUrlPlaceholder();
      updateGenerateButton(); // Check sync status
    });
  }

  // Add event listener for Token URL changes (to update button)
  const tokenUrlInput = document.getElementById("tokenUrl");
  if (tokenUrlInput) {
    tokenUrlInput.addEventListener("input", updateGenerateButton);
    tokenUrlInput.addEventListener("change", updateGenerateButton);
  }

  // Add event listener for Generate/Regenerate button
  const generateBtn = document.getElementById("generateTokenBtn");
  if (generateBtn) {
    generateBtn.addEventListener("click", generateTokenUrl);
  }

  // Setup form submission
  dom.elements.form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Clear any previous validation errors
    dom.clearAllFieldErrors();

    const formData = dom.getFormData();
    let hasErrors = false;

    // Validate WebSocket URL
    const wssValidation = urlUtils.validateURL(formData.wss, 'WebSocket URL');
    if (!wssValidation.isValid) {
      dom.showFieldError('wss', wssValidation.error);
      hasErrors = true;
    }

    // Validate Token URL if provided
    if (formData.tokenUrl && formData.tokenUrl.trim() !== '') {
      const tokenValidation = urlUtils.validateURL(formData.tokenUrl, 'Token URL');
      if (!tokenValidation.isValid) {
        dom.showFieldError('tokenUrl', tokenValidation.error);
        hasErrors = true;
      }
    }

    // Don't proceed if there are validation errors
    if (hasErrors) {
      logger.error('Please fix the validation errors before connecting');
      return;
    }

    await connectionManager.connect(formData);
  });

  // Setup real-time URL validation
  if (wssInput) {
    wssInput.addEventListener("blur", () => {
      const value = wssInput.value.trim();
      if (value) {
        const validation = urlUtils.validateURL(value, 'WebSocket URL');
        if (!validation.isValid) {
          dom.showFieldError('wss', validation.error);
        } else {
          dom.clearFieldError('wss');
        }
      }
    });

    wssInput.addEventListener("input", () => {
      // Clear error on input to give immediate feedback
      dom.clearFieldError('wss');
    });
  }

  if (tokenUrlInput) {
    // Add validation listeners (in addition to existing ones)
    tokenUrlInput.addEventListener("blur", () => {
      const value = tokenUrlInput.value.trim();
      if (value) {
        const validation = urlUtils.validateURL(value, 'Token URL');
        if (!validation.isValid) {
          dom.showFieldError('tokenUrl', validation.error);
        } else {
          dom.clearFieldError('tokenUrl');
        }
      }
    });

    tokenUrlInput.addEventListener("input", () => {
      // Clear error on input to give immediate feedback
      dom.clearFieldError('tokenUrl');
    });
  }

  // Setup disconnect button
  dom.elements.disconnectBtn.addEventListener("click", () => connectionManager.disconnect());

  // Setup cancel connection button
  dom.elements.cancelConnectionBtn.addEventListener("click", () => connectionManager.cancelConnection());

  // Setup state buttons
  stateManager.setupStateButtons();

  // Initial log message
  logger.info("CUSS2 Browser Client Demo ready");

  // Auto-connect if 'go' parameter is present
  if (typeof queryConfig.go === "string") {
    logger.info(`Auto-connect requested with target state: ${queryConfig.go.toUpperCase()}`);
    dom.elements.form.requestSubmit();
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
}
else {
  init();
}

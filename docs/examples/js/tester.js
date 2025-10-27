// ===== IMPORTS =====
import { Cuss2, ApplicationStateCodes, ComponentState, MessageCodes } from "https://esm.sh/jsr/@cuss/cuss2-typescript-models@latest";

let cuss2 = null;

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
    currentState: null,
    componentList: null,
    logContainer: null,
    environmentInfo: null,
    envDetails: null,
    stateButtons: {},
    appInfo: {},
  },

  // Initialize DOM element cache
  init() {
    this.elements.form = document.getElementById("connectionForm");
    this.elements.connectBtn = document.getElementById("connectBtn");
    this.elements.disconnectBtn = document.getElementById("disconnectBtn");
    this.elements.connectionStatus = document.getElementById("connectionStatus");
    this.elements.currentState = document.getElementById("currentState");
    this.elements.componentList = document.getElementById("componentList");
    this.elements.logContainer = document.getElementById("logContainer");
    this.elements.environmentInfo = document.getElementById("environmentInfo");
    this.elements.envDetails = document.getElementById("envDetails");

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
    return `
      <div><strong>Device ID:</strong> ${env.deviceID || "-"}</div>
      <div><strong>CUSS Version:</strong> ${env.cussVersions?.[0] || "-"}</div>
      <div><strong>Location:</strong> ${env.deviceLocation?.airportCode || "-"}</div>
    `;
  },

  // Component item template
  componentItem(id, component, enabledBadge, statusBadge, requiredBadge, readyBadge, toggleSwitch, requiredToggle) {
    // Get capabilities for this component
    const capabilities = componentCapabilities.getCapabilities(component);

    // Build action buttons based on capabilities
    let actionsHtml = '';

    // Query button (all components have this)
    if (capabilities.includes('query')) {
      actionsHtml += `<button class="component-action-btn" data-action="query" data-component-id="${id}">Query</button>`;
    }

    // Setup action (most components except Application and Feeder)
    if (capabilities.includes('setup')) {
      actionsHtml += `
        <div class="component-action-group">
          <input type="text" class="component-action-input" id="setup-input-${id}" placeholder="Setup data (JSON)">
          <button class="component-action-btn" data-action="setup" data-component-id="${id}">Setup</button>
        </div>
      `;
    }

    // Send action (output components)
    if (capabilities.includes('send')) {
      actionsHtml += `
        <div class="component-action-group">
          <input type="text" class="component-action-input" id="send-input-${id}" placeholder="Send data (JSON)">
          <button class="component-action-btn" data-action="send" data-component-id="${id}">Send</button>
        </div>
      `;
    }

    // Cancel button
    if (capabilities.includes('cancel')) {
      actionsHtml += `<button class="component-action-btn" data-action="cancel" data-component-id="${id}">Cancel</button>`;
    }

    // Offer button (dispensers and feeders)
    if (capabilities.includes('offer')) {
      actionsHtml += `<button class="component-action-btn" data-action="offer" data-component-id="${id}">Offer</button>`;
    }

    // Read action (input components)
    if (capabilities.includes('read')) {
      actionsHtml += `
        <div class="component-action-group">
          <input type="text" class="component-action-input" id="read-input-${id}" placeholder="Timeout ms (default: 30000)">
          <button class="component-action-btn" data-action="read" data-component-id="${id}">Read</button>
        </div>
      `;
    }

    // Announcement controls
    if (capabilities.includes('play')) {
      actionsHtml += `
        <div class="component-action-group">
          <input type="text" class="component-action-input" id="play-input-${id}" placeholder="SSML or text">
          <button class="component-action-btn" data-action="play" data-component-id="${id}">Play</button>
        </div>
      `;
    }
    if (capabilities.includes('pause')) {
      actionsHtml += `<button class="component-action-btn" data-action="pause" data-component-id="${id}">Pause</button>`;
    }
    if (capabilities.includes('resume')) {
      actionsHtml += `<button class="component-action-btn" data-action="resume" data-component-id="${id}">Resume</button>`;
    }
    if (capabilities.includes('stop')) {
      actionsHtml += `<button class="component-action-btn" data-action="stop" data-component-id="${id}">Stop</button>`;
    }

    // Conveyor controls
    if (capabilities.includes('forward')) {
      actionsHtml += `<button class="component-action-btn" data-action="forward" data-component-id="${id}">Forward</button>`;
    }
    if (capabilities.includes('backward')) {
      actionsHtml += `<button class="component-action-btn" data-action="backward" data-component-id="${id}">Backward</button>`;
    }
    if (capabilities.includes('process')) {
      actionsHtml += `<button class="component-action-btn" data-action="process" data-component-id="${id}">Process</button>`;
    }

    return `
      <div class="component-header">
        <div class="component-header-left">
          <div class="component-name">${component.deviceType} (ID: ${id})</div>
          <div class="component-badges">
            ${enabledBadge}
            ${requiredBadge}
          </div>
        </div>
        <div class="component-header-right">
          ${statusBadge}
          ${readyBadge}
          ${requiredToggle}
          ${toggleSwitch}
        </div>
      </div>
      <div class="component-actions">
        ${actionsHtml}
      </div>
    `;
  },

  // Toggle switch template
  toggleSwitch(id, component) {
    // Only show toggle for components that support enable/disable
    if (!componentCapabilities.hasCapability(component, 'enable')) {
      return '';
    }

    const canToggle = component.ready;
    const toggleClass = component.enabled ? 'enabled' : '';
    const disabledClass = !canToggle ? 'disabled' : '';

    return `
      <div class="toggle-container">
        <div class="toggle-switch ${toggleClass} ${disabledClass}" data-component-id="${id}" data-current-state="${component.enabled}">
          <div class="toggle-slider"></div>
        </div>
        <span class="toggle-label">Enabled</span>
      </div>
    `;
  },

  // Required toggle switch template
  requiredToggle(id, component) {
    const toggleClass = component.required ? 'required' : '';

    return `
      <div class="toggle-container">
        <div class="toggle-switch toggle-required ${toggleClass}" data-component-id="${id}" data-current-required="${component.required}">
          <div class="toggle-slider"></div>
        </div>
        <span class="toggle-label">Required</span>
      </div>
    `;
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
    dom.setClass(dom.elements.connectionStatus, status.class);
    dom.setText(dom.elements.connectionStatus, status.text);
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
    dom.setVisible(dom.elements.environmentInfo, true);
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
    const item = document.createElement("div");
    item.className = "component-item";

    if (component.ready) item.classList.add("ready");
    if (component.enabled) item.classList.add("enabled");

    // Create badges for component status
    const readyBadge = component.ready
      ? '<span class="component-badge ready">Ready</span>'
      : '<span class="component-badge not-ready">Not Ready</span>';

    // Only show enabled badge when actually enabled
    const enabledBadge = component.enabled
      ? '<span class="component-badge enabled">Enabled</span>'
      : '';

    // Show required badge when component is required
    const requiredBadge = component.required
      ? '<span class="component-badge required">Required</span>'
      : '';

    // Create status badge if component has a status other than OK
    let statusBadge = '';
    if (component.status && component.status !== 'OK') {
      const statusClass = `status-${component.status.toLowerCase().replace(/_/g, '-')}`;

      // Determine if this is a temporary status that should fade out
      const temporaryStatuses = ['WRONG_APPLICATION_STATE', 'MEDIA_PRESENT', 'MEDIA_ABSENT'];
      const isTemporary = temporaryStatuses.includes(component.status);
      const fadeClass = isTemporary ? 'fade-out' : '';

      statusBadge = `<span class="component-badge ${statusClass} ${fadeClass}" data-status="${component.status}">${component.status.replace(/_/g, ' ')}</span>`;
    }

    // Create toggle switches with proper state sync
    const toggleSwitch = templates.toggleSwitch(id, component);
    const requiredToggle = templates.requiredToggle(id, component);

    item.innerHTML = templates.componentItem(id, component, enabledBadge, statusBadge, requiredBadge, readyBadge, toggleSwitch, requiredToggle);

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
          await componentHandlers.handleComponentAction(component, action);

          // Success: Update based on actual component state
          componentHandlers.syncToggleState(toggleElement, component);
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

          // Refresh the component display to show updated badge
          ui.displayComponents();

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
            await componentHandlers.handleComponentDataAction(component, action, inputValue);
          } else {
            // Actions without input (query, cancel, offer, pause, resume, stop, forward, backward, process)
            await componentHandlers.handleComponentSimpleAction(component, action);
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

  // Show mixed content warning banner
  showMixedContentWarning(mixedContentInfo, onContinue) {
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
      existingBanner?.remove();
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
      if (onContinue) onContinue();
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

    // Remove mixed content banner if present
    const mixedContentBanner = document.getElementById('mixedContentBanner');
    if (mixedContentBanner) {
      mixedContentBanner.remove();
    }

    dom.setVisible(dom.elements.environmentInfo, false);
    dom.elements.componentList.innerHTML =
      '<p style="color: #666;">Connect to see available components...</p>';
    this.updateStateDisplay("STOPPED");
    this.updateApplicationInfo(false);
  },
};

// ===== COMPONENT HANDLERS =====
const componentHandlers = {
  // Handle component action (enable/disable)
  async handleComponentAction(component, action) {
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
  },

  // Handle simple component actions (no input required)
  async handleComponentSimpleAction(component, action) {
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
  },

  // Handle component data action (setup/send/play/read)
  async handleComponentDataAction(component, action, inputValue) {
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
        } else {
          // For setup/send, parse as JSON
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
        component: "cardReader",
        event: "data",
        handler: (data) => `Card read: ${data.track1 || data.track2 || "Chip/NFC"}`,
      },
      { component: "scale", event: "data", handler: (data) => `Weight: ${data.weight} ${data.unit}` },
    ];

    componentListeners.forEach(({ component, event, handler }) => {
      if (cuss2[component]) {
        cuss2[component].on(event, (data) => logger.event(handler(data)));
      }
    });
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
        },
      },
      {
        event: "componentStateChange",
        handler: (component) => {
          logger.event(`Component ${component.deviceType} state changed`);
          ui.displayComponents();
          // Ensure toggle states are synced after component refresh
          setTimeout(() => componentHandlers.updateAllToggleStates(), 10);
          // Update state buttons to reflect required component availability
          ui.updateStateButtons(cuss2.state);
        },
      },
      {
        event: "sessionTimeout",
        handler: async () => {
          // Get killTimeout from the environment data (fetched during initialization)
          const killTimeout = cuss2?.environment?.killTimeout || 30; // Default to 30 seconds if not provided
          logger.error(`Session timeout warning - Application will be terminated in ${killTimeout} seconds`);
          ui.showTimeoutWarning(killTimeout);

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
          const userChoice = await ui.showMixedContentWarning(mixedContentCheck, () => {
            // Continue anyway callback
            this.performConnection(config);
          });

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

  // Setup state buttons
  stateManager.setupStateButtons();

  // Initial log message
  logger.info("CUSS2 Browser Client Demo ready");
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
}
else {
  init();
}
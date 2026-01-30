import { Cuss2, Models, criticalErrors } from '../../dist/cuss2.esm.js';
import { aeaCommandsData, loadCompanyLogo, NO_RECONNECT_CODES } from './tester-data.js';
import { extractStatusCodeFromError, validateURL, checkMixedContent, generateOAuthUrl } from './tester-utils.js';
import ToggleSwitch from './components/ToggleSwitch.js';
import Keypad from './components/Keypad.js';
import Headset from './components/Headset.js';
import GenericComponent from './components/GenericComponent.js';

const { ApplicationStateCodes } = Models;
const { createApp } = Vue;

let cuss2 = null;

// ===== CONSTANTS =====
const urlParams = new URLSearchParams(window.location.search);
const queryConfig = {
  clientId: urlParams.get('CLIENT-ID'),
  clientSecret: urlParams.get('CLIENT-SECRET'),
  wss: urlParams.get('CUSS-WSS'),
  tokenUrl: urlParams.get('OAUTH-URL'),
  deviceId: urlParams.get('DEVICE-ID'),
  go: urlParams.get('go'),
};

const STATE_REQUESTS = {
  initialize: { method: 'requestInitializeState', state: 'INITIALIZE' },
  unavailable: { method: 'requestUnavailableState', state: 'UNAVAILABLE' },
  available: { method: 'requestAvailableState', state: 'AVAILABLE' },
  active: { method: 'requestActiveState', state: 'ACTIVE' },
  stopped: { method: 'requestStoppedState', state: 'STOPPED' },
  reload: { method: 'requestReload', state: 'RELOAD', confirm: 'This will close the connection. Continue?' },
};

const STATE_TRANSITIONS = {
  [ApplicationStateCodes.STOPPED]: ['initialize'],
  [ApplicationStateCodes.INITIALIZE]: ['unavailable', 'stopped', 'disabled'],
  [ApplicationStateCodes.UNAVAILABLE]: ['stopped', 'suspended', 'reload', 'available'],
  [ApplicationStateCodes.AVAILABLE]: ['suspended', 'reload', 'disabled', 'active', 'unavailable', 'stopped'],
  [ApplicationStateCodes.ACTIVE]: ['active', 'unavailable', 'disabled', 'reload', 'stopped', 'available'],
  [ApplicationStateCodes.RELOAD]: ['disabled', 'initialize', 'unavailable'],
  [ApplicationStateCodes.SUSPENDED]: ['available', 'unavailable', 'stopped'],
  [ApplicationStateCodes.DISABLED]: ['stopped', 'initialize'],
};

const REQUESTABLE_STATES = ['initialize', 'unavailable', 'available', 'active', 'stopped', 'reload'];

// ===== MAIN APP =====
const app = createApp({
  data() {
    return {
      // Form
      form: {
        wss: 'http://localhost:22222/platform/subscribe',
        clientId: 'EAI',
        clientSecret: 'secret',
        deviceId: '',
        tokenUrl: '',
      },
      fieldErrors: {},
      fieldProblem: null,

      // Connection
      connectionState: 'disconnected',
      connectionStages: {
        auth: { state: 'pending', attempts: 0, lastError: null },
        websocket: { state: 'pending', attempts: 0, lastError: null },
      },
      wasEverConnected: false,
      isReconnecting: false,
      lastConfig: null,

      // App state
      appState: 'STOPPED',
      appInfo: { brand: '-', multiTenant: '-', accessibleMode: '-', language: '-' },
      isOnline: false,

      // Environment
      environment: null,

      // Components
      components: {},
      componentStatuses: {},
      collapsedComponents: {},

      // Banners
      timeoutBanner: { visible: false, seconds: 0 },
      accessibleModeBanner: { visible: false, seconds: 0 },
      reconnectionBanner: { visible: false, attempts: 0 },
      reconnectionSuccess: { visible: false },
      mixedContentBanner: { visible: false, currentProtocol: '', targetProtocol: '', suggestedUrl: '' },

      // Log
      logEntries: [],
      logIdCounter: 0,

      // Button states
      buttonStates: {},

      // Action toasts
      actionToasts: [],
      toastIdCounter: 0,

      // AEA commands
      aeaCommands: null,

      // Toggle pending states
      pendingToggles: {},

      // Characteristics popover
      charPopover: { visible: false, top: 0, left: 0, json: '' },
      _charHoverTimer: null,
      _charHideTimer: null,
    };
  },

  computed: {
    isConnected() { return this.connectionState === 'connected'; },
    isConnecting() { return this.connectionState === 'connecting'; },

    componentList() {
      return Object.entries(this.components);
    },

    allCollapsed() {
      const collapsible = this.componentList.filter(([, c]) => !this.isHeaderOnly(c));
      return collapsible.length > 0 && collapsible.every(([id]) => this.collapsedComponents[id]);
    },

    allowedTransitions() {
      if (!cuss2 || !cuss2.connection?.isOpen) return [];
      const validTransitions = STATE_TRANSITIONS[this.appState] || [];
      let allowed = validTransitions.filter(a => REQUESTABLE_STATES.includes(a));
      const hasBlockers = cuss2.unavailableRequiredComponents?.length > 0;
      if (hasBlockers) {
        allowed = allowed.filter(a => a !== 'available' && a !== 'active');
      }
      return allowed;
    },

    tokenUrlPlaceholder() {
      return generateOAuthUrl(this.form.wss) || 'http://localhost:22222/oauth/token';
    },

    generateButtonText() {
      return this.form.tokenUrl.trim() ? 'Regenerate' : 'Generate';
    },

    generateButtonDisabled() {
      if (!this.form.tokenUrl.trim()) return false;
      return this.form.tokenUrl.trim() === generateOAuthUrl(this.form.wss);
    },

    progressTitle() {
      if (this.connectionStages.websocket.state === 'success') return '\u2705 Connected Successfully';
      if (this.connectionStages.auth.state === 'error' || this.connectionStages.websocket.state === 'error') return '\u26A0\uFE0F Connection Failed';
      return 'Connecting to Platform...';
    },

    requiredDevices() {
      const devices = [];
      for (const [id, component] of Object.entries(this.components)) {
        if (component && component.required === true) {
          devices.push({ id, component });
        }
      }
      return devices;
    },

    computedRequiredDeviceItems() {
      if (!cuss2) return [];
      const blockers = cuss2.unavailableRequiredComponents || [];
      const isUnavailable = this.appState === ApplicationStateCodes.UNAVAILABLE;

      return this.requiredDevices.map(({ id, component }) => {
        const tags = [];
        const isBlocking = blockers.some(b => String(b) === String(id));
        let isHealthy = true;

        if (!component) {
          tags.push({ text: 'Offline or not reported', className: 'error' });
          isHealthy = false;
        } else {
          if (component.ready === false) {
            tags.push({ text: 'Not ready', className: 'error' });
            isHealthy = false;
          }
          if (component.status && component.status !== 'OK') {
            tags.push({ text: `Status: ${component.status}`, className: 'error' });
            isHealthy = false;
          }
        }

        if (isBlocking && isUnavailable) {
          tags.push({ text: 'Blocking availability', className: 'blocking' });
        }
        if (isHealthy) {
          tags.push({ text: 'Healthy', className: 'healthy' });
        }

        let rowClass = '';
        if (isBlocking && isUnavailable) rowClass = 'blocking';
        else if (isHealthy) rowClass = 'healthy';
        else rowClass = 'unhealthy';

        return { id, name: component?.deviceType || id, tags, rowClass, isHealthy };
      });
    },

    showUnavailableWarning() {
      return this.appState === ApplicationStateCodes.UNAVAILABLE &&
        this.computedRequiredDeviceItems.some(d => !d.isHealthy);
    },
  },

  methods: {
    // ── Logging ────────────────────────────────────────────────────────
    log(message, type = 'info') {
      this.logEntries.push({
        id: ++this.logIdCounter,
        message: `[${new Date().toLocaleTimeString()}] ${message}`,
        type,
      });
      this.$nextTick(() => {
        const container = this.$refs.logContainer;
        if (container) container.scrollTop = container.scrollHeight;
      });
    },
    logInfo(msg) { this.log(msg, 'info'); },
    logSuccess(msg) { this.log(msg, 'success'); },
    logError(msg) { this.log(msg, 'error'); },
    logEvent(msg) { this.log(msg, 'event'); },

    // ── Form Validation ───────────────────────────────────────────────
    showFieldError(field, message) {
      this.fieldErrors[field] = message;
    },
    clearFieldError(field) {
      delete this.fieldErrors[field];
    },
    clearAllFieldErrors() {
      this.fieldErrors = {};
    },
    onFieldBlur(field) {
      const value = this.form[field]?.trim();
      if (value) {
        const label = field === 'wss' ? 'WebSocket URL' : 'Token URL';
        const validation = validateURL(value, label);
        if (!validation.isValid) this.showFieldError(field, validation.error);
        else this.clearFieldError(field);
      }
    },
    onFieldInput(field) {
      this.clearFieldError(field);
    },
    validateForm() {
      this.clearAllFieldErrors();
      let hasErrors = false;
      const wssValidation = validateURL(this.form.wss, 'WebSocket URL');
      if (!wssValidation.isValid) {
        this.showFieldError('wss', wssValidation.error);
        hasErrors = true;
      }
      if (this.form.tokenUrl?.trim()) {
        const tokenValidation = validateURL(this.form.tokenUrl, 'Token URL');
        if (!tokenValidation.isValid) {
          this.showFieldError('tokenUrl', tokenValidation.error);
          hasErrors = true;
        }
      }
      return !hasErrors;
    },
    generateTokenUrl() {
      this.form.tokenUrl = generateOAuthUrl(this.form.wss) || '';
    },

    // ── Connection Stages ─────────────────────────────────────────────
    resetConnectionStages() {
      this.connectionStages = {
        auth: { state: 'pending', attempts: 0, lastError: null },
        websocket: { state: 'pending', attempts: 0, lastError: null },
      };
      this.fieldProblem = null;
    },
    updateConnectionStage(stage, state, message, attempts = null) {
      const stageData = this.connectionStages[stage];
      stageData.state = state;
      if (attempts !== null) stageData.attempts = attempts;
      if (state === 'error' && message) stageData.lastError = message;
      if (state === 'error') this.highlightProblematicField();
    },
    highlightProblematicField() {
      this.fieldProblem = null;
      if (this.connectionStages.auth.state === 'error') {
        this.fieldProblem = 'tokenUrl';
      } else if (this.connectionStages.auth.state === 'success' && this.connectionStages.websocket.state === 'error') {
        this.fieldProblem = 'wss';
      }
      if (this.fieldProblem) {
        setTimeout(() => { this.fieldProblem = null; }, 3000);
      }
    },
    stageIcon(stageState) {
      return { progress: '\uD83D\uDD04', success: '\u2705', error: '\u274C' }[stageState] || '\u23F3';
    },
    stageStatusText(stageName, stageData) {
      const texts = {
        progress: stageName === 'auth' ? 'Authenticating...' : 'Connecting...',
        success: stageName === 'auth' ? 'Authenticated \u2713' : 'Connected \u2713',
        error: stageData.lastError || 'Failed',
      };
      return texts[stageData.state] || 'Pending...';
    },
    stageAttemptsText(stageData) {
      if ((stageData.state === 'progress' || stageData.state === 'error') && stageData.attempts > 0) {
        return `Attempt ${stageData.attempts}`;
      }
      return '';
    },

    // ── Connection Management ─────────────────────────────────────────
    async handleSubmit() {
      if (!this.validateForm()) {
        this.logError('Please fix the validation errors before connecting');
        return;
      }
      await this.connect({ ...this.form });
    },

    async connect(config) {
      try {
        const mixedContentCheck = checkMixedContent(config.wss);
        if (mixedContentCheck.hasMixedContent) {
          this.logInfo('Mixed content detected, showing warning...');
          try {
            const userChoice = await this.showMixedContentWarning(mixedContentCheck);
            if (userChoice === 'suggested') return;
          } catch {
            this.logInfo('Connection cancelled by user');
            this.connectionState = 'disconnected';
            return;
          }
        }
        await this.performConnection(config);
      } catch (error) {
        this.logError(`Connection failed: ${error.message}`);
      }
    },

    async performConnection(config) {
      this.logInfo('Connecting to CUSS2 platform...');
      this.connectionState = 'connecting';
      this.resetConnectionStages();

      if (cuss2) {
        this.logInfo('Closing previous connection before new attempt...');
        try {
          cuss2.connection.close(1000, 'New connection attempt');
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {
          this.logError(`Error closing previous connection: ${e.message}`);
        }
        cuss2 = null;
      }

      const tokenUrl = config.tokenUrl?.trim() || undefined;
      this.logInfo(`Using WebSocket URL: ${config.wss}`);
      if (tokenUrl) this.logInfo(`Using OAuth Token URL: ${tokenUrl}`);
      else this.logInfo('OAuth Token URL will be derived from WebSocket URL by the library');

      cuss2 = Cuss2.connect(config.clientId, config.clientSecret, config.wss, config.deviceId || undefined, tokenUrl);
      window.cuss2 = cuss2;

      this.setupConnectionListeners();
      this.setupPlatformListeners();
      await cuss2.connected;

      this.lastConfig = config;
      this.logSuccess('Connected successfully!');
      this.updateUrlWithConnectionParams(config);

      this.connectionState = 'connected';
      this.environment = cuss2.environment;
      this.initComponents();
      this.appState = cuss2.state;
      this.isOnline = cuss2.applicationOnline;

      this.setupComponentListeners();

      if (queryConfig.go) {
        await this.progressToState(queryConfig.go.toUpperCase());
      }
    },

    cancelConnection() {
      this.logInfo('Cancelling connection attempt...');
      if (cuss2) {
        cuss2.connection.close(1000, 'Connection cancelled by user');
        cuss2 = null;
      }
      this.connectionState = 'disconnected';
      this.logInfo('Connection attempt cancelled');
    },

    disconnect() {
      if (cuss2) {
        this.wasEverConnected = false;
        this.isReconnecting = false;
        cuss2.connection.close(1000, 'User disconnected');
        cuss2 = null;
        this.reconnectionBanner.visible = false;
        this.resetUI();
        this.logInfo('Disconnected and reset connection state');
      }
    },

    resetUI() {
      this.dismissTimeoutWarning();
      this.dismissAccessibleModeToast();
      this.mixedContentBanner.visible = false;
      this.connectionState = 'disconnected';
      this.components = {};
      this.componentStatuses = {};
      this.collapsedComponents = {};
      this.buttonStates = {};
      this.pendingToggles = {};
      this.appState = 'STOPPED';
      this.appInfo = { brand: '-', multiTenant: '-', accessibleMode: '-', language: '-' };
      this.environment = null;
      this.isOnline = false;
    },

    updateUrlWithConnectionParams(formData) {
      const params = new URLSearchParams();
      params.set('CLIENT-ID', formData.clientId);
      params.set('CLIENT-SECRET', formData.clientSecret);
      params.set('CUSS-WSS', formData.wss);
      if (formData.tokenUrl?.trim()) params.set('OAUTH-URL', formData.tokenUrl);
      if (formData.deviceId?.trim()) params.set('DEVICE-ID', formData.deviceId);
      if (queryConfig.go) params.set('go', queryConfig.go);
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
      this.logInfo('URL updated with connection parameters');
    },

    // ── Connection Listeners ──────────────────────────────────────────
    setupConnectionListeners() {
      cuss2.connection.on('connecting', (attempt) => {
        this.logInfo(`WebSocket connection attempt ${attempt}`);
        if (this.wasEverConnected) {
          this.reconnectionBanner = { visible: true, attempts: attempt };
          this.isReconnecting = true;
        } else {
          this.updateConnectionStage('websocket', 'progress', 'Connecting...', attempt);
        }
      });

      cuss2.connection.on('authenticating', (attempt) => {
        this.logInfo(`Authentication attempt ${attempt}`);
        this.updateConnectionStage('auth', 'progress', 'Authenticating...', attempt);
      });

      cuss2.connection.on('authenticated', () => {
        this.logSuccess('Authentication successful');
        this.updateConnectionStage('auth', 'success', 'Authenticated');
      });

      cuss2.connection.on('open', () => {
        this.logSuccess('WebSocket connection opened');
        const wasReconnecting = this.isReconnecting;
        this.wasEverConnected = true;
        if (wasReconnecting) {
          this.reconnectionBanner.visible = false;
          this.isReconnecting = false;
          this.showReconnectionSuccess();
        } else {
          this.updateConnectionStage('websocket', 'success', 'Connected');
        }
      });

      cuss2.connection.on('close', (event) => {
        if (event && event.code !== 1000 && this.connectionStages.websocket.state !== 'success' && !this.wasEverConnected) {
          this.updateConnectionStage('websocket', 'error', 'Connection closed');
        }
        this.handleConnectionClose(event);
      });

      cuss2.connection.on('error', (error) => {
        this.logError(`Connection error: ${error.message}`);
      });

      cuss2.connection.on('socketError', (error) => {
        this.logError(`Socket error: ${error}`);
        if (this.connectionStages.websocket.state !== 'success') {
          this.updateConnectionStage('websocket', 'error', 'Connection failed');
        }
      });

      cuss2.connection.on('authenticationError', (error) => {
        this.logError(`Authentication error: ${error.message}`);
        this.updateConnectionStage('auth', 'error', error.message || 'Authentication failed');
      });
    },

    // ── Platform Listeners ────────────────────────────────────────────
    setupPlatformListeners() {
      cuss2.on('stateChange', (stateChange) => {
        this.logEvent(`State changed: ${stateChange.previous} \u2192 ${stateChange.current}`);
        this.appState = stateChange.current;

        if (cuss2) {
          if (stateChange.current === ApplicationStateCodes.AVAILABLE ||
              stateChange.current === ApplicationStateCodes.ACTIVE) {
            cuss2.applicationOnline = true;
            this.isOnline = true;
            this.logInfo(`Application online: true (reached ${stateChange.current})`);
          } else if (stateChange.current === ApplicationStateCodes.STOPPED ||
                     stateChange.current === ApplicationStateCodes.RELOAD) {
            cuss2.applicationOnline = false;
            this.isOnline = false;
            this.logInfo(`Application online: false (${stateChange.current})`);
          }
        }
      });

      cuss2.on('activated', (activation) => {
        this.logEvent('Application activated');
        this.appInfo.brand = activation?.applicationBrand || '-';
        if (cuss2) {
          this.appInfo.multiTenant = cuss2.multiTenant ? 'Yes' : 'No';
          this.appInfo.accessibleMode = cuss2.accessibleMode ? 'Yes' : 'No';
          this.appInfo.language = cuss2.language || '-';
        }
        this.dismissTimeoutWarning();
        if (cuss2.accessibleMode) {
          const killTimeoutSeconds = Math.floor(cuss2.environment.killTimeout / 1000);
          this.logInfo(`Accessible mode activated - showing acknowledgement prompt (${killTimeoutSeconds}s timeout)`);
          this.showAccessibleModeToast(killTimeoutSeconds);
        }
      });

      cuss2.on('deactivated', (newState) => {
        this.logEvent(`Application deactivated, new state: ${newState}`);
        this.appInfo = { brand: '-', multiTenant: '-', accessibleMode: '-', language: '-' };
        this.appState = newState;
        this.dismissTimeoutWarning();
        this.dismissAccessibleModeToast();
      });

      cuss2.on('componentStateChange', (component) => {
        this.logEvent(`Component ${component.deviceType} state changed`);
        this.refreshComponent(component.id);
      });

      cuss2.on('sessionTimeout', () => {
        const killTimeoutSeconds = Math.floor(cuss2.environment.killTimeout / 1000);
        this.logError(`Session timeout warning - Application will be terminated in ${killTimeoutSeconds} seconds`);
        this.showTimeoutWarning(killTimeoutSeconds);
      });
    },

    // ── Connection Close Handling ─────────────────────────────────────
    handleConnectionClose(event) {
      const code = event?.code;
      this.logError(`WebSocket connection closed (code: ${code}, reason: ${event?.reason})`);

      const shouldReconnect = this.wasEverConnected && !NO_RECONNECT_CODES.includes(code);

      if (code === 1000) {
        this.logInfo('User manually disconnected');
        this.connectionState = 'disconnected';
        this.reconnectionBanner.visible = false;
      } else if (!this.wasEverConnected) {
        this.logInfo('Initial connection failed - showing error details');
      } else if (shouldReconnect) {
        this.logInfo('Connection dropped - reconnecting in 1 second...');
        this.wasEverConnected = false;
        this.isReconnecting = false;
        cuss2 = null;
        this.resetUI();
        if (this.lastConfig) {
          setTimeout(() => this.connect(this.lastConfig), 1000);
        } else {
          this.logError('Cannot reconnect - no previous connection config');
          this.connectionState = 'disconnected';
        }
      } else {
        this.logInfo(`Connection closed with error code ${code} - not reconnecting`);
        this.wasEverConnected = false;
        this.isReconnecting = false;
        cuss2 = null;
        this.resetUI();
        this.connectionState = 'disconnected';
      }
    },

    // ── Reconnection Banner ───────────────────────────────────────────
    handleRetryNow() {
      this.logInfo('User requested immediate retry');
      this.reconnectionBanner.visible = false;
      setTimeout(() => {
        if (this.isReconnecting && !cuss2?.connection?.isOpen) {
          this.reconnectionBanner.visible = true;
        }
      }, 100);
    },

    handleCancelReconnection() {
      this.logInfo('User cancelled reconnection');
      this.reconnectionBanner.visible = false;
      this.disconnect();
    },

    showReconnectionSuccess() {
      this.reconnectionSuccess.visible = true;
      setTimeout(() => { this.reconnectionSuccess.visible = false; }, 3000);
      this.logSuccess('Reconnection successful!');
    },

    // ── State Management ──────────────────────────────────────────────
    isTransitionAllowed(action) {
      return this.allowedTransitions.includes(action);
    },

    async requestState(action) {
      const request = STATE_REQUESTS[action];
      if (!request) return;
      if (request.confirm && !confirm(request.confirm)) return;

      try {
        if (action === 'unavailable') {
          cuss2.applicationOnline = false;
          this.isOnline = false;
          this.logInfo('User manually requested UNAVAILABLE - entering manual mode (applicationOnline = false)');
        } else if (action === 'available') {
          await cuss2[request.method]();
          cuss2.applicationOnline = true;
          this.isOnline = true;
          this.logInfo('User manually requested AVAILABLE - resuming automatic mode (applicationOnline = true)');
          this.logSuccess(`Requested ${request.state} state`);
          return;
        }

        await cuss2[request.method]();
        this.logSuccess(`Requested ${request.state} state`);
      } catch (error) {
        this.logError(`Failed to request ${request.state}: ${error.message}`);
      }
    },

    onIsOnlineChange() {
      if (cuss2) {
        cuss2.applicationOnline = this.isOnline;
        this.logInfo(`Application online: ${this.isOnline}`);
      }
    },

    async progressToState(targetState) {
      if (!cuss2) {
        this.logError('Cannot progress to state: not connected');
        return;
      }
      const targetIndex = ['UNAVAILABLE', 'AVAILABLE', 'ACTIVE'].indexOf(targetState);
      if (targetIndex === -1) {
        this.logError(`Invalid target state: ${targetState}`);
        return;
      }
      this.logInfo(`Auto-progressing to ${targetState} state...`);

      const s1 = (await cuss2.requestUnavailableState())?.meta.currentApplicationState.applicationStateCode;
      if (s1 !== ApplicationStateCodes.UNAVAILABLE || targetIndex === 0) return;
      const s2 = (await cuss2.requestAvailableState())?.meta.currentApplicationState.applicationStateCode;
      if (s2 !== ApplicationStateCodes.AVAILABLE || targetIndex === 1) return;
      await cuss2.requestActiveState();
    },

    // ── Component Helpers ─────────────────────────────────────────────
    hasCap(component, cap) {
      return typeof component[cap] === 'function';
    },

    startCharHover(event, component) {
      this.clearCharHideTimer();
      if (this._charHoverTimer) {
        clearTimeout(this._charHoverTimer);
      }
      const el = event.currentTarget;
      this._charHoverTimer = setTimeout(() => {
        const rect = el.getBoundingClientRect();
        this.charPopover = {
          visible: true,
          top: rect.bottom + window.scrollY + 6,
          left: rect.left + window.scrollX,
          json: JSON.stringify(component._component, null, 2),
        };
      }, 500);
    },

    cancelCharHover() {
      if (this._charHoverTimer) {
        clearTimeout(this._charHoverTimer);
        this._charHoverTimer = null;
      }
      this.startCharHideTimer();
    },

    startCharHideTimer() {
      this.clearCharHideTimer();
      this._charHideTimer = setTimeout(() => {
        this.charPopover = { visible: false, top: 0, left: 0, json: '' };
      }, 200);
    },

    clearCharHideTimer() {
      if (this._charHideTimer) {
        clearTimeout(this._charHideTimer);
        this._charHideTimer = null;
      }
    },

    isHeaderOnly(component) {
      const headerOnlyTypes = ['HEADSET'];
      return headerOnlyTypes.includes(component.deviceType);
    },

    initComponents() {
      if (!cuss2?.components) return;
      const comps = {};
      const statuses = {};
      for (const [id, component] of Object.entries(cuss2.components)) {
        comps[id] = component;
        const displayStatus = component.status || 'OK';
        statuses[id] = {
          statusBadge: displayStatus.replace(/_/g, ' '),
          statusClass: this.statusClass(displayStatus),
        };
      }
      this.components = comps;
      this.componentStatuses = statuses;
    },

    refreshComponent(id) {
      if (!cuss2?.components) return;
      const component = cuss2.components[id];
      if (!component) return;
      this.components[id] = component;
      this.updateComponentStatus(id, component.status);
      // Trigger reactivity for computed properties
      this.components = { ...this.components };
    },

    statusClass(status) {
      if (!status || status === 'OK') return 'status-ok';
      if (criticalErrors.includes(status)) return 'status-critical';
      return 'status-warning';
    },

    updateComponentStatus(id, status) {
      if (!this.componentStatuses[id]) return;
      const displayStatus = status || 'OK';
      this.componentStatuses[id].statusBadge = displayStatus.replace(/_/g, ' ');
      this.componentStatuses[id].statusClass = this.statusClass(displayStatus);
    },



    // ── Component Actions ─────────────────────────────────────────────
    async handleToggleEnabled(id) {
      const component = this.components[id];
      if (!component || !component.ready || this.pendingToggles[`enabled-${id}`]) return;

      this.pendingToggles[`enabled-${id}`] = true;
      const action = component.enabled ? 'disable' : 'enable';
      const name = component.deviceType;
      this.logInfo(`${action === 'enable' ? 'Enabling' : 'Disabling'} ${name}...`);
      const toast = this.addToast(`${name} (${id}) ${action}...`, 'pending');

      try {
        await component[action]();
        this.logSuccess(`${name} ${action}d`);
        this.refreshComponent(id);
        this.updateToast(toast.id, `${name} (${id}) ${action} — OK`, 'success', 1000);
      } catch (error) {
        this.logError(`Failed to ${action} ${name}: ${error.message}`);
        this.refreshComponent(id);
        this.updateToast(toast.id, `${name} (${id}) ${action} — Failed`, 'error', 3000);
      } finally {
        delete this.pendingToggles[`enabled-${id}`];
      }
    },

    toggleCollapse(id) {
      this.collapsedComponents[id] = !this.collapsedComponents[id];
      this.collapsedComponents = { ...this.collapsedComponents };
    },

    collapseAll() {
      for (const [id, component] of this.componentList) {
        if (!this.isHeaderOnly(component)) {
          this.collapsedComponents[id] = true;
        }
      }
      this.collapsedComponents = { ...this.collapsedComponents };
    },

    expandAll() {
      this.collapsedComponents = {};
    },

    isCollapsed(id) {
      return !!this.collapsedComponents[id];
    },

    async handleToggleRequired(id) {
      const component = this.components[id];
      if (!component || this.pendingToggles[`required-${id}`]) return;

      this.pendingToggles[`required-${id}`] = true;
      const newRequired = !component.required;

      try {
        component.required = newRequired;
        this.logInfo(`Component ${component.deviceType} marked as ${newRequired ? 'REQUIRED' : 'NOT REQUIRED'}`);

        if (cuss2) {
          if (newRequired && !component.ready) {
            this.logInfo(`Required component ${component.deviceType} is not ready - requesting UNAVAILABLE state`);
            cuss2.requestUnavailableState();
          } else if (!newRequired && cuss2.state === ApplicationStateCodes.UNAVAILABLE) {
            cuss2.checkRequiredComponentsAndSyncState();
          }
        }
        // Trigger reactivity
        this.components = { ...this.components };
      } catch (error) {
        this.logError(`Failed to toggle required state: ${error.message}`);
        component.required = !newRequired;
        this.components = { ...this.components };
      } finally {
        delete this.pendingToggles[`required-${id}`];
      }
    },

    async handleActionButton(id, action, buttonKey) {
      const component = this.components[id];
      if (!component) return;

      this.buttonStates[buttonKey] = 'loading';
      const name = component.deviceType;
      const toast = this.addToast(`${name} (${id}) ${action}...`, 'pending');

      try {
        await this.handleComponentSimpleAction(component, action, id);
        delete this.buttonStates[buttonKey];
        this.updateToast(toast.id, `${name} (${id}) ${action} — OK`, 'success', 1000);
      } catch {
        delete this.buttonStates[buttonKey];
        this.updateToast(toast.id, `${name} (${id}) ${action} — Failed`, 'error', 3000);
      }
    },

    async handleComponentSimpleAction(component, action, id) {
      const name = component.deviceType;
      let hadError = false;
      try {
        this.logInfo(`Executing ${action} on ${name}...`);
        if (typeof component[action] !== 'function') throw new Error(`${action} not available on ${name}`);
        const result = await component[action]();
        this.logSuccess(`${action} completed on ${name}`);
        if (action === 'query' && result) {
          this.logEvent(`Query result: ${JSON.stringify(result.meta || result)}`);
        }
      } catch (error) {
        hadError = true;
        this.logError(`Failed to ${action} ${name}: ${error.message}`);
        const statusCode = extractStatusCodeFromError(error);
        if (statusCode) this.updateComponentStatus(id, statusCode);
        throw error;
      } finally {
        if (!hadError) this.updateComponentStatus(id, component.status);
      }
    },

    // ── Component Data Listeners ──────────────────────────────────────
    setupComponentListeners() {
      const listeners = [
        { component: 'barcodeReader', handler: (records) => `Barcode scanned: ${records[0]?.data || 'No data'}` },
        { component: 'documentReader', handler: (records) => `Document scanned: ${records[0]?.data || 'Document data received'}` },
        { component: 'cardReader', handler: (records) => `Card read: ${records[0]?.data || 'Chip/NFC'}` },
        { component: 'scale', handler: (records) => `Weight: ${records[0]?.data || 'No data'}` },
      ];
      listeners.forEach(({ component, handler }) => {
        if (cuss2[component]) {
          const compId = String(cuss2[component].id);
          cuss2[component].on('data', (dataRecords) => {
            this.logEvent(handler(dataRecords));
            const ref = this.$refs['generic-' + compId];
            const generic = Array.isArray(ref) ? ref[0] : ref;
            generic?.updateData(dataRecords);
          });
        }
      });

      // Keypad listener — delegates to Keypad component via $refs
      if (cuss2.keypad) {
        const keypadId = String(cuss2.keypad.id);
        cuss2.keypad.on('data', (keyData) => {
          const pressed = Object.entries(keyData)
            .filter(([k, v]) => v && k !== 'dataRecords')
            .map(([k]) => k);
          this.logEvent(`Key pressed: ${pressed.join(', ') || 'None'}`);

          if (keyData.dataRecords) {
            const ref = this.$refs['keypad-' + keypadId];
            const keypad = Array.isArray(ref) ? ref[0] : ref;
            keypad?.addEvents(keyData.dataRecords);
          }
        });
      }
    },

    // ── Banner/Toast Management ───────────────────────────────────────
    showTimeoutWarning(seconds) {
      this.dismissTimeoutWarning();
      this.timeoutBanner = { visible: true, seconds };
      this._timeoutInterval = setInterval(() => {
        this.timeoutBanner.seconds--;
        if (this.timeoutBanner.seconds <= 0) this.dismissTimeoutWarning();
      }, 1000);
    },

    dismissTimeoutWarning() {
      if (this._timeoutInterval) {
        clearInterval(this._timeoutInterval);
        this._timeoutInterval = null;
      }
      this.timeoutBanner.visible = false;
    },

    showAccessibleModeToast(seconds) {
      this.dismissAccessibleModeToast();
      this.accessibleModeBanner = { visible: true, seconds };
      this._accessibleModeInterval = setInterval(() => {
        this.accessibleModeBanner.seconds--;
        if (this.accessibleModeBanner.seconds <= 0) {
          clearInterval(this._accessibleModeInterval);
          this._accessibleModeInterval = null;
        }
      }, 1000);
    },

    dismissAccessibleModeToast() {
      if (this._accessibleModeInterval) {
        clearInterval(this._accessibleModeInterval);
        this._accessibleModeInterval = null;
      }
      this.accessibleModeBanner.visible = false;
    },

    async acknowledgeAccessibleMode() {
      try {
        this.logInfo('Acknowledging accessible mode...');
        await cuss2.acknowledgeAccessibleMode();
        this.logSuccess('Accessible mode acknowledged');
        this.dismissAccessibleModeToast();
      } catch (error) {
        this.logError(`Failed to acknowledge accessible mode: ${error.message}`);
      }
    },

    showMixedContentWarning(info) {
      this.mixedContentBanner = {
        visible: true,
        currentProtocol: info.currentProtocol.replace(':', '').toUpperCase(),
        targetProtocol: info.targetProtocol.replace(':', '').toUpperCase(),
        suggestedUrl: info.suggestedUrl,
      };
      return new Promise((resolve, reject) => {
        this._mixedContentResolve = resolve;
        this._mixedContentReject = reject;
      });
    },

    handleMixedContentChoice(choice) {
      const suggestedUrl = this.mixedContentBanner.suggestedUrl;
      this.mixedContentBanner.visible = false;
      if (choice === 'dismiss') {
        this._mixedContentReject?.(new Error('User cancelled connection'));
      } else if (choice === 'suggested') {
        this.form.wss = suggestedUrl;
        this.logInfo(`Switched to secure URL: ${suggestedUrl}`);
        this._mixedContentResolve?.('suggested');
      } else {
        this._mixedContentResolve?.('continue');
      }
      this._mixedContentResolve = null;
      this._mixedContentReject = null;
    },

    // ── Button State Management ───────────────────────────────────────
    btnClasses(key) {
      const state = this.buttonStates[key];
      return { loading: state === 'loading' };
    },

    btnDisabled(key) {
      return this.buttonStates[key] === 'loading';
    },

    // ── Toast Management ──────────────────────────────────────────────
    addToast(message, type) {
      const toast = { id: ++this.toastIdCounter, message, type, fading: false };
      this.actionToasts.push(toast);
      return toast;
    },

    updateToast(id, message, type, dismissMs) {
      const toast = this.actionToasts.find(t => t.id === id);
      if (!toast) return;
      toast.message = message;
      toast.type = type;
      setTimeout(() => {
        toast.fading = true;
        setTimeout(() => {
          this.actionToasts = this.actionToasts.filter(t => t.id !== id);
        }, 300);
      }, dismissMs);
    },

    // ── Format Helpers ────────────────────────────────────────────────
    fmtValue(value) {
      if (value == null) return '-';
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (typeof value === 'object') return JSON.stringify(value, null, 2);
      return String(value);
    },

    fmtMs(value) {
      return value != null ? `${value}ms` : '-';
    },
  },

  async mounted() {
    await loadCompanyLogo();
    this.aeaCommands = aeaCommandsData;

    if (queryConfig.clientId) this.form.clientId = queryConfig.clientId;
    if (queryConfig.clientSecret) this.form.clientSecret = queryConfig.clientSecret;
    if (queryConfig.wss) this.form.wss = queryConfig.wss;
    if (queryConfig.tokenUrl) this.form.tokenUrl = queryConfig.tokenUrl;
    if (queryConfig.deviceId) this.form.deviceId = queryConfig.deviceId;

    this.logInfo('CUSS2 Browser Client Demo ready');

    if (typeof queryConfig.go === 'string') {
      this.logInfo(`Auto-connect requested with target state: ${queryConfig.go.toUpperCase()}`);
      this.handleSubmit();
    }
  },

  beforeUnmount() {
    this.dismissTimeoutWarning();
    this.dismissAccessibleModeToast();
    if (cuss2) {
      cuss2.connection.close(1000, 'App unmounting');
      cuss2 = null;
    }
  },
});

app.component('toggle-switch', ToggleSwitch);
app.component('keypad-component', Keypad);
app.component('headset-component', Headset);
app.component('generic-component', GenericComponent);
app.mount('#app');

import { CUSS2DevToolsClient, ComponentInterrogation } from '../../../dist/cuss2-devtools.esm.js';
import { exampleData } from './data.js';
import ToggleSwitch from './components/ToggleSwitch.js';
import KeypadUI from './components/KeypadUI.js';
import DataReaderUI from './components/DataReaderUI.js';
import HeadsetUI from './components/HeadsetUI.js';

const { createApp } = Vue;

export { exampleData };

let client = null;

// ── Main Application ─────────────────────────────────────────────────────────
const app = createApp({
  data() {
    return {
      wsUrl: 'ws://localhost:22222/devtools',
      connectionStatus: 'disconnected',
      components: [],
      componentStates: {},
      pendingToggles: {},
      tenants: {},
    };
  },

  computed: {
    tenantBrandList() {
      const list = [];
      for (const [tenantId, brands] of Object.entries(this.tenants)) {
        for (const [brandId, state] of Object.entries(brands)) {
          list.push({ id: `${tenantId}-${brandId}`, tenant: tenantId, brand: brandId, state });
        }
      }
      return list;
    },
  },

  methods: {
    // ── State Helpers ────────────────────────────────────────────────
    getState(componentId) {
      return this.componentStates[componentId] || {};
    },

    filteredState(componentId) {
      const state = this.getState(componentId);
      return Object.entries(state)
      .filter(([key, value]) =>
        !['enabled', 'status', 'power'].includes(key) && typeof value !== 'boolean')
      .map(([key, value]) => ({ key: key.replace(/_/g, ' '), value }));
    },

    isKeypad(component) {
      return ComponentInterrogation.isKeypad(component);
    },

    isDataReader(component) {
      return ComponentInterrogation.isBarcodeReader(component) || ComponentInterrogation.isDocumentReader(component);
    },

    isHeadset(component) {
      // Server sends `type` instead of `componentType`; isHeadset needs
      // componentType to exclude Announcement components.
      return ComponentInterrogation.isHeadset({
        ...component,
        componentType: component.type,
      });
    },

    getReaderType(component) {
      if (ComponentInterrogation.isDocumentReader(component)) return 'documentReader';
      if (ComponentInterrogation.isBarcodeReader(component)) return 'barcodeReader';
      return null;
    },

    hasNonPowerActions(component) {
      if (!component.actions) return false;
      return Object.keys(component.actions).some(k => k !== 'power');
    },

    cleanType(type) {
      return (type || '').replace('?', '');
    },

    formatName(name) {
      return (name || '').replace(/_/g, ' ');
    },

    // ── Logging ──────────────────────────────────────────────────────
    addLogEntry(type, message, data = null) {
      const timestamp = new Date().toLocaleTimeString();
      const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
      data ? console.log(logMessage, data) : console.log(logMessage);
    },

    // ── Connection ───────────────────────────────────────────────────
    async connect() {
      const url = this.wsUrl;
      if (!url) {
        this.addLogEntry('error', 'Please enter a WebSocket URL');
        return;
      }

      this.connectionStatus = 'connecting';
      this.addLogEntry('sent', `Connecting to ${url}`);

      try {
        client = new CUSS2DevToolsClient({ url });

        client.on('connected', () => {
          this.connectionStatus = 'connected';
          this.addLogEntry('received', 'Connection established');

          setTimeout(async () => {
            await this.fetchTenants();
            await this.refreshState();
          }, 500);
        });

        client.on('disconnected', (reason) => {
          this.connectionStatus = 'disconnected';
          this.addLogEntry('error', `Disconnected: ${reason || 'Connection closed'}`);
          this.components = [];
          this.tenants = {};
        });

        client.on('components', (comps) => {
          this.components = Array.isArray(comps) ? comps : [];
          this.addLogEntry('received', `Discovered ${this.components.length} components`);
        });

        client.on('tenant_update', (update) => {
          this.handleTenantUpdate(update);
        });

        client.on('message', (msg) => {
          this.addLogEntry('received', 'Platform message', msg);

          // Component update broadcast
          if ('componentID' in msg && !msg.action) {
            this.handleComponentUpdate(msg);
            return;
          }

          // Component data in message
          if (msg.components) {
            this.components = Array.isArray(msg.components) ? msg.components : [];
            this.addLogEntry('received', `Found ${this.components.length} components in message`);
          }

          // Component states response (not a tenant state update)
          if (msg.state && typeof msg.state === 'object' && !('tenant' in msg)) {
            this.componentStates = msg.state;
            this.addLogEntry('received', 'Component states updated');
          }
        });

        client.on('error', (error) => {
          this.addLogEntry('error', `Error: ${error.message || error}`);
        });

        await client.connect();
      } catch (error) {
        this.connectionStatus = 'disconnected';
        this.addLogEntry('error', `Connection failed: ${error.message || error}`);
      }
    },

    disconnect() {
      if (client) {
        client.disconnect();
        client = null;
      }
    },

    // ── Data Fetching ────────────────────────────────────────────────
    async refreshState() {
      if (!client || !client.isConnected()) {
        this.addLogEntry('error', 'Not connected');
        return;
      }

      try {
        const response = await client.sendWithResponse({ action: 'state' });
        this.addLogEntry('sent', 'Requested component states - OK');

        if (response.state) {
          this.componentStates = response.state;
        }
      } catch (error) {
        this.addLogEntry('error', `Failed to get state: ${error.message}`);
      }
    },

    async fetchTenants() {
      if (!client || !client.isConnected()) {
        this.addLogEntry('error', 'Not connected');
        return;
      }

      try {
        this.tenants = await client.listTenants();
        this.addLogEntry('sent', 'Requested tenant list - OK');
      } catch (error) {
        this.addLogEntry('error', `Failed to get tenants: ${error.message}`);
      }
    },

    async activateBrand(tenant, brand) {
      if (!client || !client.isConnected()) {
        this.addLogEntry('error', 'Not connected');
        return;
      }

      try {
        await client.activateBrand(tenant, brand);
        this.addLogEntry('sent', `Activated tenant: ${tenant}, brand: ${brand} - OK`);
        setTimeout(() => this.fetchTenants(), 500);
      } catch (error) {
        this.addLogEntry('error', `Failed to activate brand: ${error.message}`);
      }
    },

    // ── Event Handlers ───────────────────────────────────────────────
    handleComponentUpdate(msg) {
      const id = msg.componentID;
      if (!this.componentStates[id]) {
        this.componentStates[id] = {};
      }

      Object.keys(msg).forEach(key => {
        if (key !== 'componentID' && key !== 'previous' && key !== 'requestId') {
          this.componentStates[id][key] = msg[key];
        }
      });

      this.componentStates = { ...this.componentStates };
      this.addLogEntry('received', `Component #${id} update:`, msg);
    },

    handleTenantUpdate(update) {
      const { tenant, brand, state } = update;
      if (!this.tenants[tenant]) {
        this.tenants[tenant] = {};
      }

      if (brand) {
        this.tenants[tenant][brand] = state;
        this.addLogEntry('received', `Tenant ${tenant}/${brand} state changed to ${state}`);
      } else {
        Object.keys(this.tenants[tenant]).forEach(b => {
          this.tenants[tenant][b] = state;
        });
        this.addLogEntry('received', `Tenant ${tenant} (all brands) state changed to ${state}`);
      }
    },

    // ── Actions ──────────────────────────────────────────────────────
    async sendPower(componentId) {
      const key = `power-${componentId}`;
      if (this.pendingToggles[key]) return;

      const currentValue = !!this.getState(componentId).power;
      const newValue = !currentValue;

      this.pendingToggles[key] = true;
      if (!this.componentStates[componentId]) {
        this.componentStates[componentId] = {};
      }
      this.componentStates[componentId].power = newValue;
      this.componentStates = { ...this.componentStates };

      try {
        await client.cmd(componentId, 'power', { on: newValue });
        this.addLogEntry('sent', `Power ${newValue ? 'on' : 'off'} for component #${componentId} - OK`);
        await this.refreshState();
      } catch (error) {
        this.componentStates[componentId].power = currentValue;
        this.componentStates = { ...this.componentStates };
        this.addLogEntry('error', `Power command failed for component #${componentId}: ${error.message}`);
      } finally {
        delete this.pendingToggles[key];
        this.pendingToggles = { ...this.pendingToggles };
      }
    },

    async handleBooleanToggle(componentId, actionName, paramName) {
      const key = `${paramName}-${componentId}`;
      if (this.pendingToggles[key]) return;

      const currentValue = !!(this.getState(componentId)[paramName]);
      const newValue = !currentValue;

      this.pendingToggles[key] = true;
      if (!this.componentStates[componentId]) {
        this.componentStates[componentId] = {};
      }
      this.componentStates[componentId][paramName] = newValue;
      this.componentStates = { ...this.componentStates };

      const args = {};
      if (actionName === 'power') {
        args.on = newValue;
      } else {
        args[paramName] = newValue;
      }

      try {
        await client.cmd(componentId, actionName, args);
        this.addLogEntry('sent', `${actionName} ${paramName}: ${newValue} on component #${componentId} - OK`);
        await this.refreshState();
      } catch (error) {
        this.componentStates[componentId][paramName] = currentValue;
        this.componentStates = { ...this.componentStates };
        this.addLogEntry('error', `${actionName} failed for component #${componentId}: ${error.message}`);
      } finally {
        delete this.pendingToggles[key];
        this.pendingToggles = { ...this.pendingToggles };
      }
    },

    async handleStringAction(event, componentId, actionName, paramName) {
      const value = event.target.value.trim();
      if (!value) return;

      event.target.disabled = true;
      try {
        await client.cmd(componentId, actionName, { [paramName]: value });
        this.addLogEntry('sent', `${actionName} ${paramName}: "${value}" on component #${componentId} - OK`);
        event.target.value = '';
      } catch (error) {
        this.addLogEntry('error', `${actionName} failed for component #${componentId}: ${error.message}`);
      } finally {
        event.target.disabled = false;
      }
    },

    async executeAction(componentId, actionName) {
      try {
        await client.cmd(componentId, actionName, {});
        this.addLogEntry('sent', `Executed ${actionName} on component #${componentId} - OK`);
      } catch (error) {
        this.addLogEntry('error', `${actionName} failed for component #${componentId}: ${error.message}`);
      }
    },

    async handleKeyAction({ type, key, componentId }) {
      try {
        await client.cmd(componentId, type, { keyname: key });
        this.addLogEntry('sent', `${type} ${key} on keypad #${componentId}`);
      } catch (error) {
        this.addLogEntry('error', `${type} failed: ${error.message}`);
      }
    },

    async handleHeadsetInserted({ componentId }) {
      const key = `inserted-${componentId}`;
      if (this.pendingToggles[key]) return;

      const currentValue = !!(this.getState(componentId).inserted);
      const newValue = !currentValue;

      this.pendingToggles[key] = true;
      if (!this.componentStates[componentId]) {
        this.componentStates[componentId] = {};
      }
      this.componentStates[componentId].inserted = newValue;
      this.componentStates = { ...this.componentStates };

      try {
        await client.cmd(componentId, 'inserted', { inserted: newValue });
        this.addLogEntry('sent', `inserted: ${newValue} on component #${componentId}`);
        await this.refreshState();
      } catch (error) {
        this.componentStates[componentId].inserted = currentValue;
        this.componentStates = { ...this.componentStates };
        this.addLogEntry('error', `inserted failed for component #${componentId}: ${error.message}`);
      } finally {
        delete this.pendingToggles[key];
        this.pendingToggles = { ...this.pendingToggles };
      }
    },

    async handleMediaInserted({ componentId, inserted }) {
      try {
        await client.cmd(componentId, 'presence', { media_inserted: inserted });
        this.addLogEntry('sent', `media_inserted: ${inserted} on component #${componentId}`);
      } catch (error) {
        this.addLogEntry('error', `media_inserted failed for component #${componentId}: ${error.message}`);
      }
    },

    async handleSendData({ componentId, data, dsType }) {
      try {
        const args = { data };
        if (dsType) args.dsType = dsType;
        await client.cmd(componentId, 'input', args);
        this.addLogEntry('sent', `input data on component #${componentId}` + (dsType ? ` (${dsType})` : ''));
      } catch (error) {
        this.addLogEntry('error', `input failed for component #${componentId}: ${error.message}`);
      }
    },
  },
});

app.component('toggle-switch', ToggleSwitch);
app.component('keypad-ui', KeypadUI);
app.component('data-reader-ui', DataReaderUI);
app.component('headset-ui', HeadsetUI);
app.mount('#app');

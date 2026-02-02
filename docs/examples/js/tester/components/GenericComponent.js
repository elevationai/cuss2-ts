import { extractStatusCodeFromError } from '../utils.js';

export default {
  name: 'GenericComponent',
  props: {
    component: { type: Object, required: true },
    componentId: { type: String, required: true },
  },
  emits: ['log', 'status-update'],
  data() {
    return {
      buttonStates: {},
      inputs: { setupText: '', sendText: '', playText: '' },
      dataDisplay: '',
    };
  },
  methods: {
    hasCap(cap) {
      return typeof this.component[cap] === 'function';
    },

    btnClasses(key) {
      return { loading: this.buttonStates[key] === 'loading' };
    },

    btnDisabled(key) {
      return this.buttonStates[key] === 'loading';
    },

    async handleAction(action, buttonKey) {
      this.buttonStates[buttonKey] = 'loading';
      const name = this.component.deviceType;
      const toast = this.$root.addToast(`${name} (${this.componentId}) ${action}...`, 'pending');

      try {
        const dataActions = { setup: 'setupText', send: 'sendText', offer: 'sendText', process: 'sendText', play: 'playText' };
        if (dataActions[action]) {
          const inputValue = this.inputs[dataActions[action]]?.trim() || '';
          await this.handleDataAction(action, inputValue);
        } else {
          await this.handleSimpleAction(action);
        }
        delete this.buttonStates[buttonKey];
        this.$root.updateToast(toast.id, `${name} (${this.componentId}) ${action} — OK`, 'success', 1000);
      } catch {
        delete this.buttonStates[buttonKey];
        this.$root.updateToast(toast.id, `${name} (${this.componentId}) ${action} — Failed`, 'error', 3000);
      }
    },

    async handleSimpleAction(action) {
      const name = this.component.deviceType;
      let hadError = false;
      try {
        this.$emit('log', { message: `Executing ${action} on ${name}...`, type: 'info' });
        if (typeof this.component[action] !== 'function') throw new Error(`${action} not available on ${name}`);
        await this.component[action]();
        this.$emit('log', { message: `${action} completed on ${name}`, type: 'success' });
      } catch (error) {
        hadError = true;
        this.$emit('log', { message: `Failed to ${action} ${name}: ${error.message}`, type: 'error' });
        const statusCode = extractStatusCodeFromError(error);
        if (statusCode) this.$emit('status-update', statusCode);
        throw error;
      } finally {
        if (!hadError) this.$emit('status-update', this.component.status);
      }
    },

    async handleDataAction(action, inputValue) {
      const name = this.component.deviceType;
      let hadError = false;
      try {
        let data = null;
        if (inputValue) {
          if (action === 'play') {
            data = inputValue;
          } else if (action === 'setup' || action === 'send' || action === 'offer' || action === 'process') {
            const lines = inputValue.split('\n').filter(line => line.trim() !== '');
            data = lines.map(line => ({ data: line, dsTypes: ['DS_TYPES_ITPS'] }));
          } else {
            try { data = JSON.parse(inputValue); }
            catch (parseError) {
              this.$emit('log', { message: `Invalid JSON for ${action}: ${parseError.message}`, type: 'error' });
              throw new Error(`Invalid JSON: ${parseError.message}`);
            }
          }
        }

        const actionText = action.charAt(0).toUpperCase() + action.slice(1);
        this.$emit('log', { message: `${actionText} ${name}${data !== null ? ' with: ' + (typeof data === 'object' ? JSON.stringify(data) : data) : ''}...`, type: 'info' });

        if (typeof this.component[action] !== 'function') throw new Error(`${action} not available on ${name}`);
        data !== null ? await this.component[action](data) : await this.component[action]();
        this.$emit('log', { message: `${name} ${action} completed`, type: 'success' });
      } catch (error) {
        hadError = true;
        this.$emit('log', { message: `Failed to ${action} ${name}: ${error.message}`, type: 'error' });
        const statusCode = extractStatusCodeFromError(error);
        if (statusCode) this.$emit('status-update', statusCode);
        throw error;
      } finally {
        if (!hadError) this.$emit('status-update', this.component.status);
      }
    },

    updateData(dataRecords) {
      let displayText = '';
      if (Array.isArray(dataRecords)) {
        dataRecords.forEach((record, index) => {
          if (index > 0) displayText += '\n---\n';
          displayText += `Data: ${record.data || 'N/A'}\n`;
          if (record.dsTypes?.length > 0) displayText += `Type: ${record.dsTypes.join(', ')}\n`;
          if (record.dataStatus) displayText += `Status: ${record.dataStatus}`;
        });
      } else {
        displayText = JSON.stringify(dataRecords, null, 2);
      }
      this.dataDisplay = displayText;
    },
  },

  template: `
    <div class="component-actions-row">
      <!-- Left Column -->
      <div class="component-action-column left-column">
        <!-- Setup Section -->
        <template v-if="hasCap('setup')">
          <label class="component-action-label">Setup</label>
          <textarea class="component-action-textarea"
                    placeholder="Setup data" rows="5"
                    v-model="inputs.setupText"></textarea>
          <div class="component-action-buttons">
            <button class="component-action-btn"
                    :class="btnClasses('setup')"
                    :disabled="btnDisabled('setup')"
                    @click="handleAction('setup', 'setup')">
              <span class="btn-label">Setup</span>
              <span class="btn-spinner"></span>
            </button>
            <button v-if="hasCap('cancel')"
                    class="component-action-btn"
                    :class="btnClasses('cancel')"
                    :disabled="btnDisabled('cancel')"
                    @click="handleAction('cancel', 'cancel')">
              <span class="btn-label">Cancel</span>
              <span class="btn-spinner"></span>
            </button>
          </div>
        </template>

        <!-- Send Section -->
        <template v-if="hasCap('send')">
          <label class="component-action-label">Send</label>
          <textarea class="component-action-textarea"
                    placeholder="Send data" rows="5"
                    v-model="inputs.sendText"></textarea>
          <div class="component-action-buttons">
            <button class="component-action-btn"
                    :class="btnClasses('send')"
                    :disabled="btnDisabled('send')"
                    @click="handleAction('send', 'send')">
              <span class="btn-label">Send</span>
              <span class="btn-spinner"></span>
            </button>
            <button v-if="hasCap('offer')"
                    class="component-action-btn"
                    :class="btnClasses('offer')"
                    :disabled="btnDisabled('offer')"
                    @click="handleAction('offer', 'offer')">
              <span class="btn-label">Offer</span>
              <span class="btn-spinner"></span>
            </button>
            <button v-if="hasCap('process')"
                    class="component-action-btn"
                    :class="btnClasses('process')"
                    :disabled="btnDisabled('process')"
                    @click="handleAction('process', 'process')">
              <span class="btn-label">Process</span>
              <span class="btn-spinner"></span>
            </button>
          </div>
        </template>

        <!-- Play Section -->
        <template v-if="hasCap('play')">
          <label class="component-action-label">Play</label>
          <textarea class="component-action-textarea"
                    placeholder="SSML or text" rows="5"
                    v-model="inputs.playText"></textarea>
          <div class="component-action-buttons">
            <button class="component-action-btn"
                    :class="btnClasses('play')"
                    :disabled="btnDisabled('play')"
                    @click="handleAction('play', 'play')">
              <span class="btn-label">Play</span>
              <span class="btn-spinner"></span>
            </button>
            <button v-if="hasCap('pause')"
                    class="component-action-btn"
                    :class="btnClasses('pause')"
                    :disabled="btnDisabled('pause')"
                    @click="handleAction('pause', 'pause')">
              <span class="btn-label">Pause</span>
              <span class="btn-spinner"></span>
            </button>
            <button v-if="hasCap('resume')"
                    class="component-action-btn"
                    :class="btnClasses('resume')"
                    :disabled="btnDisabled('resume')"
                    @click="handleAction('resume', 'resume')">
              <span class="btn-label">Resume</span>
              <span class="btn-spinner"></span>
            </button>
            <button v-if="hasCap('stop')"
                    class="component-action-btn"
                    :class="btnClasses('stop')"
                    :disabled="btnDisabled('stop')"
                    @click="handleAction('stop', 'stop')">
              <span class="btn-label">Stop</span>
              <span class="btn-spinner"></span>
            </button>
          </div>
        </template>
      </div>

      <!-- Right Column -->
      <div class="component-action-column right-column">
        <!-- Read Section -->
        <template v-if="hasCap('read')">
          <label class="component-action-label">Read</label>
          <div class="data-display-container">
            <div class="data-display-box">
              <template v-if="dataDisplay">{{ dataDisplay }}</template>
            </div>
          </div>
        </template>

        <!-- Additional right-column buttons (forward, backward) -->
        <div v-if="hasCap('forward') || hasCap('backward')"
             class="component-action-buttons">
          <button v-if="hasCap('forward')"
                  class="component-action-btn"
                  :class="btnClasses('forward')"
                  :disabled="btnDisabled('forward')"
                  @click="handleAction('forward', 'forward')">
            <span class="btn-label">Forward</span>
            <span class="btn-spinner"></span>
          </button>
          <button v-if="hasCap('backward')"
                  class="component-action-btn"
                  :class="btnClasses('backward')"
                  :disabled="btnDisabled('backward')"
                  @click="handleAction('backward', 'backward')">
            <span class="btn-label">Backward</span>
            <span class="btn-spinner"></span>
          </button>
        </div>
      </div>
    </div>
  `,
};

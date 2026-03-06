import { extractStatusCodeFromError } from '../utils.js';

export default {
  name: 'PrinterComponent',
  props: {
    component: { type: Object, required: true },
    componentId: { type: String, required: true },
    aeaCommands: { type: Object, default: null },
  },
  emits: ['log', 'status-update'],
  data() {
    return {
      buttonStates: {},
      inputs: { setupText: '', sendText: '' },
      responseDisplay: '',
    };
  },
  computed: {
    commandPresets() {
      if (!this.aeaCommands) return null;
      if (this.component.deviceType === 'BOARDING_PASS_PRINTER') {
        return this.aeaCommands.boardingPassPrinter || null;
      }
      if (this.component.deviceType === 'BAG_TAG_PRINTER') {
        return this.aeaCommands.bagTagPrinter || null;
      }
      return null;
    },
  },
  methods: {
    btnClasses(key) {
      return { loading: this.buttonStates[key] === 'loading' };
    },

    btnDisabled(key) {
      return this.buttonStates[key] === 'loading';
    },

    applyPreset(field, value) {
      this.inputs[field] = value;
    },

    buildDataRecords(inputValue) {
      const lines = inputValue.split('\n').filter(line => line.trim() !== '');
      return lines.map(line => ({ data: line, dsTypes: ['DS_TYPES_ITPS'] }));
    },

    async handleAction(action, buttonKey) {
      this.buttonStates[buttonKey] = 'loading';
      const name = this.component.deviceType;
      const inputField = action === 'setup' ? 'setupText' : 'sendText';
      const inputValue = this.inputs[inputField]?.trim() || '';
      const toast = this.$root.addToast(`${name} (${this.componentId}) ${action}...`, 'pending');

      this.responseDisplay = '';

      try {
        if (typeof this.component[action] !== 'function') {
          throw new Error(`${action} not available on ${name}`);
        }

        let result;
        if (inputValue) {
          const data = this.buildDataRecords(inputValue);
          this.$emit('log', { message: `${action} ${name} with ${data.length} record(s)...`, type: 'info' });
          result = await this.component[action](data);
        } else {
          this.$emit('log', { message: `${action} ${name}...`, type: 'info' });
          result = await this.component[action]();
        }

        this.$emit('log', { message: `${name} ${action} completed`, type: 'success' });
        this.$emit('status-update', this.component.status);

        const records = result?.payload?.dataRecords;
        if (Array.isArray(records)) {
          const strings = records
            .map(r => r.data)
            .filter(d => typeof d === 'string');
          if (strings.length) {
            this.responseDisplay = strings.join('\n');
          }
        }

        delete this.buttonStates[buttonKey];
        this.$root.updateToast(toast.id, `${name} (${this.componentId}) ${action} — OK`, 'success', 1000);
      } catch (error) {
        this.$emit('log', { message: `Failed to ${action} ${name}: ${error.message}`, type: 'error' });
        const statusCode = extractStatusCodeFromError(error);
        if (statusCode) this.$emit('status-update', statusCode);
        delete this.buttonStates[buttonKey];
        this.$root.updateToast(toast.id, `${name} (${this.componentId}) ${action} — Failed`, 'error', 3000);
      }
    },

  },

  template: `
    <div class="printer-component">
      <!-- Setup Section -->
      <label class="component-action-label">Setup</label>
      <select v-if="commandPresets"
              class="component-action-dropdown"
              @change="applyPreset('setupText', $event.target.value); $event.target.selectedIndex = 0">
        <option value="" disabled selected>Load preset...</option>
        <option v-for="(value, label) in commandPresets" :key="'setup-'+label"
                v-show="label.startsWith('Setup:')"
                :value="value">{{ label }}</option>
      </select>
      <textarea class="component-action-textarea"
                placeholder="Setup data (one record per line)" rows="5"
                v-model="inputs.setupText"></textarea>
      <div class="component-action-buttons">
        <button class="component-action-btn"
                :class="btnClasses('setup')"
                :disabled="btnDisabled('setup')"
                @click="handleAction('setup', 'setup')">
          <span class="btn-label">Setup</span>
          <span class="btn-spinner"></span>
        </button>
      </div>

      <!-- Send Section -->
      <label class="component-action-label">Send</label>
      <select v-if="commandPresets"
              class="component-action-dropdown"
              @change="applyPreset('sendText', $event.target.value); $event.target.selectedIndex = 0">
        <option value="" disabled selected>Load preset...</option>
        <option v-for="(value, label) in commandPresets" :key="'send-'+label"
                v-show="label.startsWith('Send:')"
                :value="value">{{ label }}</option>
      </select>
      <textarea class="component-action-textarea"
                placeholder="Send data (one record per line)" rows="5"
                v-model="inputs.sendText"></textarea>
      <div class="component-action-buttons">
        <button class="component-action-btn"
                :class="btnClasses('send')"
                :disabled="btnDisabled('send')"
                @click="handleAction('send', 'send')">
          <span class="btn-label">Send</span>
          <span class="btn-spinner"></span>
        </button>
      </div>

      <!-- Response Display -->
      <template v-if="responseDisplay">
        <label class="component-action-label">Response</label>
        <div class="data-display-container">
          <div class="data-display-box">{{ responseDisplay }}</div>
        </div>
      </template>
    </div>
  `,
};

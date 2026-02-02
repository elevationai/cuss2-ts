import { extractStatusCodeFromError } from '../utils.js';

export default {
  name: 'BarcodeReader',
  props: {
    component: { type: Object, required: true },
    componentId: { type: String, required: true },
  },
  emits: ['log', 'status-update'],
  data() {
    return {
      selectedTypes: [],
      pendingType: null,
      dataDisplay: '',
      lastReadAt: null,
      lastReadTimestamp: '',
      lastReadAgo: '',
      _agoInterval: null,
      buttonStates: {},
    };
  },
  computed: {
    availableDsTypes() {
      const characteristics = this.component._component?.componentCharacteristics;
      if (!Array.isArray(characteristics)) return [];
      const types = new Set();
      for (const char of characteristics) {
        if (Array.isArray(char.dsTypesList)) {
          for (const t of char.dsTypesList) types.add(t);
        }
      }
      return [...types];
    },
  },
  methods: {
    toggleType(dsType) {
      const previous = [...this.selectedTypes];
      const idx = this.selectedTypes.indexOf(dsType);
      if (idx >= 0) {
        this.selectedTypes.splice(idx, 1);
      } else {
        this.selectedTypes.push(dsType);
      }
      this.pendingType = dsType;
      this.sendSetup(previous);
    },

    isSelected(dsType) {
      return this.selectedTypes.includes(dsType);
    },

    async sendSetup(previous) {
      const buttonKey = 'br-setup';
      this.buttonStates[buttonKey] = 'loading';
      const name = this.component.deviceType;
      const toast = this.$root.addToast(`${name} (${this.componentId}) setup...`, 'pending');

      try {
        const records = [{ data: '', dsTypes: [...this.selectedTypes] }];
        this.$emit('log', { message: `Setup ${name} with dsTypes: [${this.selectedTypes.join(', ')}]`, type: 'info' });

        if (typeof this.component.setup !== 'function') {
          throw new Error('setup not available on ' + name);
        }

        await this.component.setup(records);
        this.$emit('log', { message: `${name} setup completed`, type: 'success' });
        this.$emit('status-update', this.component.status);
        this.$root.updateToast(toast.id, `${name} (${this.componentId}) setup — OK`, 'success', 1000);
      } catch (error) {
        this.selectedTypes = previous;
        this.$emit('log', { message: `Failed to setup ${name}: ${error.message}`, type: 'error' });
        const statusCode = extractStatusCodeFromError(error);
        if (statusCode) this.$emit('status-update', statusCode);
        this.$root.updateToast(toast.id, `${name} (${this.componentId}) setup — Failed`, 'error', 3000);
      } finally {
        this.pendingType = null;
        delete this.buttonStates[buttonKey];
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
      this.lastReadAt = Date.now();
      this.lastReadTimestamp = new Date().toLocaleTimeString();
      this.updateAgo();
      if (!this._agoInterval) {
        this._agoInterval = setInterval(() => this.updateAgo(), 1000);
      }
    },

    updateAgo() {
      if (!this.lastReadAt) return;
      const seconds = Math.floor((Date.now() - this.lastReadAt) / 1000);
      if (seconds < 1) this.lastReadAgo = 'just now';
      else if (seconds < 60) this.lastReadAgo = `${seconds}s ago`;
      else this.lastReadAgo = `${Math.floor(seconds / 60)}m ago`;
    },

    formatLabel(dsType) {
      return dsType.replace(/^DS_TYPES_/, '');
    },

    btnClasses(key) {
      return { loading: this.buttonStates[key] === 'loading' };
    },

    btnDisabled(key) {
      return this.buttonStates[key] === 'loading';
    },
  },

  beforeUnmount() {
    if (this._agoInterval) {
      clearInterval(this._agoInterval);
      this._agoInterval = null;
    }
  },

  template: `
    <div class="component-actions-row">
      <!-- Left Column: DS Types selector -->
      <div class="component-action-column left-column">
        <label class="component-action-label">DS Types</label>
        <div v-if="availableDsTypes.length" class="dr-types-list">
          <button v-for="dsType in availableDsTypes" :key="dsType"
                  class="dr-type-chip"
                  :class="{ selected: isSelected(dsType), pending: pendingType === dsType }"
                  :disabled="btnDisabled('br-setup')"
                  @click="toggleType(dsType)">
            {{ formatLabel(dsType) }}
          </button>
        </div>
        <div v-else class="dr-no-types">
          No dsTypes reported by component
        </div>
        <div class="dr-selection-summary" v-if="selectedTypes.length">
          Selected: {{ selectedTypes.map(formatLabel).join(', ') }}
        </div>
      </div>

      <!-- Right Column: Incoming data display -->
      <div class="component-action-column right-column">
        <div class="dr-read-header">
          <label class="component-action-label">Read</label>
          <span v-if="lastReadAgo" class="dr-read-time">{{ lastReadTimestamp }} ({{ lastReadAgo }})</span>
        </div>
        <div class="data-display-container">
          <div class="data-display-box">
            <template v-if="dataDisplay">{{ dataDisplay }}</template>
          </div>
        </div>
      </div>
    </div>
  `,
};

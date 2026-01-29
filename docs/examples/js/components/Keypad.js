const SETUP_MODES = {
  'key': [{ data: '', dsTypes: ['DS_TYPES_KEY'] }],
  'keydown': [{ data: '', dsTypes: ['DS_TYPES_KEY_DOWN'] }],
  'keyup': [{ data: '', dsTypes: ['DS_TYPES_KEY_UP'] }],
  'keydown+keyup': [
    { data: '', dsTypes: ['DS_TYPES_KEY_DOWN'] },
    { data: '', dsTypes: ['DS_TYPES_KEY_UP'] },
  ],
};

const DS_TYPE_LABELS = {
  DS_TYPES_KEY: 'KEY',
  DS_TYPES_KEY_DOWN: 'KEY_DOWN',
  DS_TYPES_KEY_UP: 'KEY_UP',
};

export default {
  name: 'Keypad',
  props: {
    component: { type: Object, required: true },
    componentId: { type: String, required: true },
  },
  emits: ['log'],
  data() {
    return {
      events: [],
      buttonStates: {},
    };
  },
  methods: {
    async handleSetup(mode, buttonKey) {
      this.buttonStates[buttonKey] = 'loading';
      try {
        const records = SETUP_MODES[mode];
        this.$emit('log', { message: `Setting up ${this.component.deviceType} with mode: ${mode}`, type: 'info' });
        await this.component.setup(records);
        this.$emit('log', { message: `${this.component.deviceType} setup (${mode}) completed`, type: 'success' });
        this.setButtonSuccess(buttonKey);
      } catch (error) {
        this.$emit('log', { message: `Failed to setup ${this.component.deviceType}: ${error.message}`, type: 'error' });
        this.setButtonError(buttonKey);
      }
    },

    addEvents(dataRecords) {
      const logEl = this.$refs.eventLog;
      const wasAtBottom = logEl
        ? (logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight) < 8
        : true;

      const time = new Date().toLocaleTimeString();
      for (const record of dataRecords) {
        const dsType = record.dsTypes?.find(t => DS_TYPE_LABELS[t]);
        this.events.push({
          time,
          type: dsType ? DS_TYPE_LABELS[dsType] : 'KEY',
          key: record.data || '?',
        });
      }
      if (this.events.length > 200) {
        this.events = this.events.slice(-200);
      }

      if (wasAtBottom && logEl) {
        this.$nextTick(() => { logEl.scrollTop = logEl.scrollHeight; });
      }
    },

    clear() {
      this.events = [];
    },

    setButtonSuccess(key) {
      this.buttonStates[key] = 'success';
      setTimeout(() => { if (this.buttonStates[key] === 'success') delete this.buttonStates[key]; }, 1000);
    },

    setButtonError(key) {
      this.buttonStates[key] = 'error';
      setTimeout(() => { if (this.buttonStates[key] === 'error') delete this.buttonStates[key]; }, 1000);
    },

    btnClasses(key) {
      const state = this.buttonStates[key];
      return { loading: state === 'loading', success: state === 'success', error: state === 'error' };
    },

    btnDisabled(key) {
      return this.buttonStates[key] === 'loading';
    },
  },

  template: `
    <div class="component-actions-row">
      <div class="component-action-column left-column">
        <label class="component-action-label">Setup Mode</label>
        <div class="component-action-buttons">
          <button class="component-action-btn"
                  :class="btnClasses('kp-key')"
                  :disabled="btnDisabled('kp-key')"
                  @click="handleSetup('key', 'kp-key')">
            <span class="btn-label">KEY (default)</span>
            <span class="btn-spinner"></span>
          </button>
          <button class="component-action-btn"
                  :class="btnClasses('kp-keydown')"
                  :disabled="btnDisabled('kp-keydown')"
                  @click="handleSetup('keydown', 'kp-keydown')">
            <span class="btn-label">KEY_DOWN</span>
            <span class="btn-spinner"></span>
          </button>
          <button class="component-action-btn"
                  :class="btnClasses('kp-keyup')"
                  :disabled="btnDisabled('kp-keyup')"
                  @click="handleSetup('keyup', 'kp-keyup')">
            <span class="btn-label">KEY_UP</span>
            <span class="btn-spinner"></span>
          </button>
          <button class="component-action-btn"
                  :class="btnClasses('kp-both')"
                  :disabled="btnDisabled('kp-both')"
                  @click="handleSetup('keydown+keyup', 'kp-both')">
            <span class="btn-label">KEY_DOWN + KEY_UP</span>
            <span class="btn-spinner"></span>
          </button>
        </div>
      </div>
      <div class="component-action-column right-column">
        <div class="keypad-events-header">
          <label class="component-action-label">Key Events</label>
          <button v-if="events.length"
                  class="component-action-btn keypad-clear-btn"
                  @click="clear()">Clear</button>
        </div>
        <div class="data-display-box keypad-event-log" ref="eventLog">
          <div v-for="(evt, i) in events" :key="i" class="keypad-event-entry">
            <span class="keypad-event-time">{{ evt.time }}</span>
            <span class="keypad-event-type" :class="'keypad-type-' + evt.type.toLowerCase()">{{ evt.type }}</span>
            <span class="keypad-event-key">{{ evt.key }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
};

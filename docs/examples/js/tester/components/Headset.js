export default {
  name: 'Headset',
  props: {
    component: { type: Object, required: true },
    componentId: { type: [Number, String], required: true },
  },
  emits: ['log'],
  data() {
    return {
      lastChangedAt: null,
      lastChangedTimestamp: '',
      lastChangedAgo: '',
      _agoInterval: null,
      _lastStatus: null,
      speakPending: false,
    };
  },
  computed: {
    jackState() {
      const s = this.component?.status;
      if (s === 'MEDIA_PRESENT') return 'present';
      if (s === 'MEDIA_ABSENT') return 'absent';
      return 'unknown';
    },
    jackLabel() {
      if (this.jackState === 'present') return 'MEDIA_PRESENT';
      if (this.jackState === 'absent') return 'MEDIA_ABSENT';
      return this.component?.status || 'UNKNOWN';
    },
    helpPreview() {
      const lines = [];
      const chars = this.component?._component?.componentCharacteristics || [];
      const order = [
        ['deviceDescription', 'Description'],
        ['deviceLocation', 'Location'],
        ['deviceProfile', 'Profile'],
        ['deviceUsage', 'Usage'],
      ];
      for (const ch of chars) {
        const instruction = ch?.deviceHelpInstruction?.instruction;
        if (!instruction) continue;
        for (const [key, label] of order) {
          const elements = instruction[key];
          const first = Array.isArray(elements) ? elements[0] : null;
          const ssml = first?.ssmlElement;
          if (!ssml) continue;
          const text = ssml.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
          if (text) lines.push({ label, text });
        }
      }
      return lines;
    },
  },
  watch: {
    'component.status': {
      immediate: true,
      handler(newStatus) {
        if (newStatus !== this._lastStatus) {
          this._lastStatus = newStatus;
          if (newStatus === 'MEDIA_PRESENT' || newStatus === 'MEDIA_ABSENT') {
            this.lastChangedAt = Date.now();
            this.lastChangedTimestamp = new Date().toLocaleTimeString();
            this.updateAgo();
            if (!this._agoInterval) {
              this._agoInterval = setInterval(() => this.updateAgo(), 1000);
            }
          }
        }
      },
    },
  },
  methods: {
    updateAgo() {
      if (!this.lastChangedAt) return;
      const seconds = Math.floor((Date.now() - this.lastChangedAt) / 1000);
      if (seconds < 1) this.lastChangedAgo = 'just now';
      else if (seconds < 60) this.lastChangedAgo = `${seconds}s ago`;
      else this.lastChangedAgo = `${Math.floor(seconds / 60)}m ago`;
    },
    async speakHelp() {
      if (this.speakPending) return;
      this.speakPending = true;
      try {
        await this.$root.playHeadsetHelp(this.component);
      } finally {
        this.speakPending = false;
      }
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
      <!-- Left: Jack state -->
      <div class="component-action-column left-column">
        <label class="component-action-label">Jack State</label>
        <div class="headset-jack-indicator" :class="'headset-jack-' + jackState">
          <span class="headset-jack-icon" aria-hidden="true">
            <template v-if="jackState === 'present'">&#127911;</template>
            <template v-else-if="jackState === 'absent'">&#9055;</template>
            <template v-else>?</template>
          </span>
          <div class="headset-jack-text">
            <div class="headset-jack-label">{{ jackLabel }}</div>
            <div v-if="lastChangedTimestamp" class="headset-jack-time">
              {{ lastChangedTimestamp }} ({{ lastChangedAgo }})
            </div>
          </div>
        </div>
        <div class="component-action-buttons">
          <button class="component-action-btn"
                  :class="{ loading: speakPending }"
                  :disabled="speakPending || !helpPreview.length"
                  @click="speakHelp">
            <span class="btn-label">Speak Device Help</span>
            <span class="btn-spinner"></span>
          </button>
        </div>
      </div>

      <!-- Right: deviceHelpInstruction preview -->
      <div class="component-action-column right-column">
        <label class="component-action-label">Device Help Instruction (SSML)</label>
        <div v-if="helpPreview.length" class="headset-help-list">
          <div v-for="(line, i) in helpPreview" :key="i" class="headset-help-entry">
            <div class="headset-help-label">{{ line.label }}</div>
            <div class="headset-help-text">{{ line.text }}</div>
          </div>
        </div>
        <div v-else class="dr-no-types">
          No deviceHelpInstruction published by the platform
        </div>
      </div>
    </div>
  `,
};

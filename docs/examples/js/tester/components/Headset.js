export default {
  name: 'Headset',
  props: {
    component: { type: Object, required: true },
    componentId: { type: String, required: true },
  },
  emits: ['log'],
  data() {
    return {
      speakPending: false,
    };
  },
  computed: {
    /**
     * Extract deviceHelpInstruction SSML sections into plain-text lines.
     * The c2p-headset plugin publishes componentCharacteristics[].deviceHelpInstruction
     * describing the physical jack/volume per CUSS2 spec §2.5.
     */
    helpLines() {
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
  methods: {
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
  template: `
    <div class="component-actions-row">
      <div class="component-action-column left-column">
        <label class="component-action-label">
          Device Help
          <help-tooltip :lines="helpLines" title="Headset Help Instruction" />
        </label>
        <div class="component-action-buttons">
          <button class="component-action-btn"
                  :class="{ loading: speakPending }"
                  :disabled="speakPending || !helpLines.length"
                  @click="speakHelp">
            <span class="btn-label">Speak Device Help</span>
            <span class="btn-spinner"></span>
          </button>
        </div>
      </div>
    </div>
  `,
};

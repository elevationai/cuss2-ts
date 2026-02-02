const KEYBOARD_TO_KEYPAD = {
  ArrowUp: 'f18',
  ArrowDown: 'f19',
  ArrowLeft: 'f21',
  ArrowRight: 'f22',
  Enter: 'f20',
  Home: 'f23',
  End: 'f24',
};

export default {
  name: 'KeypadUI',
  props: {
    componentId: { type: [Number, String], required: true },
  },
  emits: ['keyaction'],
  data() {
    return {
      activeKeys: {},
      capturing: false,
      buttons: [
        { key: 'f17', classes: 'blue', helpIcon: true },
        { key: 'f18', classes: 'yellow-up' },
        { key: 'f19', classes: 'yellow-down' },
        { key: 'f20', classes: 'green' },
        { key: 'f21', classes: 'white-back', label: 'BACK' },
        { key: 'f22', classes: 'white-next', label: 'NEXT' },
        { key: 'f23', classes: 'black home', style: 'grid-area: home' },
        { key: 'f24', classes: 'red end', style: 'grid-area: end' },
      ],
    };
  },
  methods: {
    onDown(btn) {
      this.activeKeys[btn.key] = true;
      this.$emit('keyaction', { type: 'keydown', key: btn.key, componentId: this.componentId });
    },
    onUp(btn) {
      delete this.activeKeys[btn.key];
      this.$emit('keyaction', { type: 'keyup', key: btn.key, componentId: this.componentId });
    },
    onLeave(btn) {
      if (this.activeKeys[btn.key]) {
        delete this.activeKeys[btn.key];
      }
    },
    onMouseEnter() {
      this.capturing = true;
      window.addEventListener('keydown', this.captureKeyDown, true);
      window.addEventListener('keyup', this.captureKeyUp, true);
    },
    onMouseLeave() {
      this.capturing = false;
      window.removeEventListener('keydown', this.captureKeyDown, true);
      window.removeEventListener('keyup', this.captureKeyUp, true);
      // Release any held keys
      for (const key of Object.keys(this.activeKeys)) {
        delete this.activeKeys[key];
        this.$emit('keyaction', { type: 'keyup', key, componentId: this.componentId });
      }
    },
    captureKeyDown(e) {
      const mapped = KEYBOARD_TO_KEYPAD[e.key];
      if (!mapped) return;
      e.preventDefault();
      e.stopPropagation();
      if (this.activeKeys[mapped]) return; // already held
      this.activeKeys[mapped] = true;
      this.$emit('keyaction', { type: 'keydown', key: mapped, componentId: this.componentId });
    },
    captureKeyUp(e) {
      const mapped = KEYBOARD_TO_KEYPAD[e.key];
      if (!mapped) return;
      e.preventDefault();
      e.stopPropagation();
      delete this.activeKeys[mapped];
      this.$emit('keyaction', { type: 'keyup', key: mapped, componentId: this.componentId });
    },
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.captureKeyDown, true);
    window.removeEventListener('keyup', this.captureKeyUp, true);
  },
  template: `
    <div class="keypad-container" :class="{ capturing }"
         @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
      <div class="keypad-grid">
        <button v-for="btn in buttons" :key="btn.key"
                class="keypad-button"
                :class="[btn.classes, { active: activeKeys[btn.key] }]"
                :style="btn.style || ''"
                @mousedown="onDown(btn)"
                @mouseup="onUp(btn)"
                @mouseleave="onLeave(btn)">
          <span v-if="btn.helpIcon">?</span>
          <template v-else>{{ btn.label || '' }}</template>
        </button>
      </div>
      <div v-if="capturing" class="keypad-capture-hint">Keyboard captured</div>
    </div>
  `,
};

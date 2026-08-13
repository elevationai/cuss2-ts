/**
 * Hover-triggered help tooltip. Renders a "?" badge next to a label;
 * hovering opens a styled popover containing the component's
 * deviceHelpInstruction SSML sections as descriptive ADA text.
 *
 * Matches the existing char-popover pattern used for the device-name
 * hover (tester.js:startCharHover): 500ms open delay, 200ms close-delay
 * grace so the cursor can travel into the popover without it closing.
 *
 * Usage:
 *   <help-tooltip :lines="helpLines" title="Keypad Help Instruction" />
 *
 * Each entry in `lines` is { label: string, text: string }.
 */
export default {
  name: 'HelpTooltip',
  props: {
    lines: { type: Array, default: () => [] },
    title: { type: String, default: 'Device Help Instruction' },
  },
  data() {
    return {
      visible: false,
    };
  },
  beforeUnmount() {
    this._clearOpenTimer();
    this._clearCloseTimer();
  },
  methods: {
    _clearOpenTimer() {
      if (this._openTimer) {
        clearTimeout(this._openTimer);
        this._openTimer = null;
      }
    },
    _clearCloseTimer() {
      if (this._closeTimer) {
        clearTimeout(this._closeTimer);
        this._closeTimer = null;
      }
    },
    onBadgeEnter() {
      this._clearCloseTimer();
      if (this.visible) return;
      this._clearOpenTimer();
      this._openTimer = setTimeout(() => {
        this.visible = true;
      }, 500);
    },
    onBadgeLeave() {
      this._clearOpenTimer();
      this._scheduleClose();
    },
    onPopoverEnter() {
      this._clearCloseTimer();
    },
    onPopoverLeave() {
      this._scheduleClose();
    },
    _scheduleClose() {
      this._clearCloseTimer();
      this._closeTimer = setTimeout(() => {
        this.visible = false;
      }, 200);
    },
  },
  template: `
    <span class="help-tooltip-container">
      <span class="device-help-tip"
            :class="{ active: visible }"
            role="img"
            :aria-label="title"
            @mouseenter="onBadgeEnter"
            @mouseleave="onBadgeLeave">?</span>
      <div v-if="visible"
           class="help-tooltip-popover"
           @mouseenter="onPopoverEnter"
           @mouseleave="onPopoverLeave">
        <div class="help-tooltip-title">{{ title }}</div>
        <div v-if="lines.length" class="help-tooltip-body">
          <div v-for="(line, i) in lines" :key="i" class="help-tooltip-entry">
            <div class="help-tooltip-label">{{ line.label }}</div>
            <div class="help-tooltip-text">{{ line.text }}</div>
          </div>
        </div>
        <div v-else class="help-tooltip-empty">
          No deviceHelpInstruction published by the platform for this component.
        </div>
      </div>
    </span>
  `,
};

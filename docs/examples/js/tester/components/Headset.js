export default {
  name: 'Headset',
  props: {
    component: { type: Object, required: true },
    componentId: { type: String, required: true },
  },
  template: `
    <div class="component-actions-row">
      <div class="component-action-column left-column">
        <label class="component-action-label">
          Device Help
          <span class="device-help-tip" :title="$root.deviceHelpText(component)">?</span>
        </label>
        <div class="component-action-buttons">
          <button class="component-action-btn"
                  :disabled="!$root.deviceHelpText(component)"
                  @click="$root.playHeadsetHelp(component)">
            <span class="btn-label">Speak Device Help</span>
          </button>
        </div>
      </div>
    </div>
  `,
};

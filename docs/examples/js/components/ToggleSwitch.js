export default {
  name: 'ToggleSwitch',
  props: {
    value: Boolean,
    type: { type: String, default: 'enabled' },
    disabled: Boolean,
    pending: Boolean,
  },
  emits: ['toggle'],
  template: `
    <div class="toggle-switch"
         :class="{
           enabled: type === 'enabled' && value,
           required: type === 'required' && value,
           pending: pending,
           disabled: disabled
         }"
         @click.stop="!disabled && !pending && $emit('toggle')">
      <div class="toggle-slider"></div>
    </div>
  `,
};

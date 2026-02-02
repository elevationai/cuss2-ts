export default {
  name: 'ToggleSwitch',
  props: {
    value: Boolean,
    power: Boolean,
    pending: Boolean,
  },
  emits: ['toggle'],
  template: `
    <div class="toggle-switch"
         :class="{ active: value, 'power-toggle': power, pending: pending }"
         @click.stop="!pending && $emit('toggle')">
      <div class="toggle-slider"></div>
    </div>
  `,
};

export default {
  name: 'HeadsetUI',
  props: {
    componentId: { type: [Number, String], required: true },
    inserted: { type: Boolean, default: false },
    pending: { type: Boolean, default: false },
  },
  emits: ['toggle-inserted'],
  template: `
    <div class="action-param-row">
      <span class="action-param-label">Media Inserted</span>
      <toggle-switch
        :value="inserted"
        :pending="pending"
        @toggle="$emit('toggle-inserted', { componentId })"></toggle-switch>
    </div>
  `,
};

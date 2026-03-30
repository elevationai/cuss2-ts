export default {
  name: 'PrinterUI',
  props: {
    componentId: { type: [Number, String], required: true },
  },
  emits: ['printer-action'],
  data() {
    return {
      actions: [
        { name: 'ready', label: 'Ready', group: 'status', style: 'success' },
        { name: 'paperlow', label: 'Paper Low', group: 'paper', style: 'warning' },
        { name: 'paperempty', label: 'Paper Empty', group: 'paper', style: 'error' },
        { name: 'paperfull', label: 'Paper Full', group: 'paper', style: 'warning' },
        { name: 'paperjam', label: 'Paper Jam', group: 'paper', style: 'error' },
        { name: 'cutterjam', label: 'Cutter Jam', group: 'paper', style: 'critical' },
        { name: 'mediapresent', label: 'Media Present', group: 'workflow', style: 'info' },
        { name: 'mediataken', label: 'Media Taken', group: 'workflow', style: 'info' },
      ],
    };
  },
  methods: {
    exec(actionName) {
      this.$emit('printer-action', { componentId: this.componentId, action: actionName });
    },
  },
  template: `
    <div class="printer-ui">
      <div class="printer-actions">
        <button v-for="action in actions"
                :key="action.name"
                class="printer-action-btn"
                :class="'printer-' + action.style"
                @click="exec(action.name)">
          {{ action.label }}
        </button>
      </div>
    </div>
  `,
};

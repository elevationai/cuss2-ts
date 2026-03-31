export default {
  name: 'PrinterUI',
  props: {
    componentId: { type: [Number, String], required: true },
  },
  emits: ['printer-action'],
  data() {
    return {
      actions: [
        { name: 'ready', label: 'Ready' },
        { name: 'paperlow', label: 'Paper Low' },
        { name: 'paperempty', label: 'Paper Empty' },
        { name: 'paperfull', label: 'Paper Full' },
        { name: 'paperjam', label: 'Paper Jam' },
        { name: 'cutterjam', label: 'Cutter Jam' },
        { name: 'mediapresent', label: 'Media Present' },
        { name: 'mediataken', label: 'Media Taken' },
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
                class="action-button"
                @click="exec(action.name)">
          {{ action.label }}
        </button>
      </div>
    </div>
  `,
};

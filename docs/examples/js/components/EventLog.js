export default {
  name: 'EventLog',
  data() {
    return {
      entries: [],
      idCounter: 0,
    };
  },
  methods: {
    log(message, type = 'info') {
      this.entries.push({
        id: ++this.idCounter,
        message: `[${new Date().toLocaleTimeString()}] ${message}`,
        type,
      });
      this.$nextTick(() => {
        const el = this.$refs.container;
        if (el) el.scrollTop = el.scrollHeight;
      });
    },
    clear() {
      this.entries = [];
    },
  },
  template: `
    <div class="log-container" ref="container">
      <div v-for="entry in entries" :key="entry.id"
           class="log-entry" :class="entry.type">
        {{ entry.message }}
      </div>
    </div>
  `,
};

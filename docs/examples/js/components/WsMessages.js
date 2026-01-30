export default {
  name: 'WsMessages',
  data() {
    return {
      messages: [],
      selected: null,
    };
  },
  computed: {
    highlightedJson() {
      const msg = this.messages[this.selected];
      if (!msg) return '';
      return hljs.highlight(msg.formatted, { language: 'json' }).value;
    },
  },
  methods: {
    add(direction, data) {
      const label = direction === 'disconnect'
        ? `DISCONNECT (${data.code}) ${data.reason}`
        : this.messageLabel(data);
      const formatted = JSON.stringify(data, null, 2);
      const time = new Date().toLocaleTimeString();
      this.messages.push({ direction, label, formatted, time });
      if (this.messages.length > 200) {
        const overflow = this.messages.length - 200;
        this.messages.splice(0, overflow);
        if (this.selected !== null) {
          this.selected = Math.max(0, this.selected - overflow);
        }
      }
      this.$nextTick(() => {
        const list = this.$refs.list;
        if (list) list.scrollTop = list.scrollHeight;
      });
    },
    messageLabel(data) {
      const meta = data?.meta;
      if (!meta) {
        if (data?.ackCode) return `ack: ${data.ackCode}`;
        return JSON.stringify(data).substring(0, 80);
      }
      const directive = meta.directive || meta.platformDirective;
      const compId = meta.componentID !== undefined ? ` #${meta.componentID}` : '';
      const msgCode = meta.messageCode ? ` \u2192 ${meta.messageCode}` : '';
      if (directive) return `${directive}${compId}${msgCode}`;
      if (meta.messageCode) return `${meta.messageCode}${compId}`;
      return JSON.stringify(data).substring(0, 80);
    },
    navigate(delta) {
      if (!this.messages.length) return;
      if (this.selected === null) {
        this.selected = delta > 0 ? 0 : this.messages.length - 1;
      } else {
        this.selected = Math.max(0, Math.min(this.messages.length - 1, this.selected + delta));
      }
      this.$nextTick(() => {
        const list = this.$refs.list;
        const row = list?.children[this.selected];
        if (row) row.scrollIntoView({ block: 'nearest' });
      });
    },
    clear() {
      this.messages = [];
      this.selected = null;
    },
  },
  template: `
    <div class="ws-messages">
      <div class="ws-message-list" ref="list" tabindex="0"
           @keydown.up.prevent="navigate(-1)"
           @keydown.down.prevent="navigate(1)">
        <div v-for="(msg, i) in messages" :key="i"
             class="ws-message-row" :class="[msg.direction, { selected: selected === i }]"
             @click="selected = i">
          <span class="ws-arrow" v-html="msg.direction === 'sent' ? '&#8593;' : msg.direction === 'disconnect' ? '&#10005;' : '&#8595;'"></span>
          <span class="ws-label">{{ msg.label }}</span>
          <span class="ws-time">{{ msg.time }}</span>
        </div>
      </div>
      <div class="ws-message-detail">
        <pre v-if="selected !== null && messages[selected]"><code v-html="highlightedJson"></code></pre>
        <div v-else class="ws-no-selection">Select a message to view details</div>
      </div>
    </div>
  `,
};

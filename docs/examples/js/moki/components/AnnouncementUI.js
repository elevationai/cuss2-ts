/**
 * AnnouncementUI - Shows a log of played announcements
 */
export default {
  props: {
    componentId: { type: Number, required: true },
    logs: { type: Array, default: () => [] },
  },

  template: `
    <div class="announcement-ui">
      <div class="announcement-label">Announcements</div>
      <div class="announcement-log" ref="logContainer">
        <div v-if="logs.length === 0" class="announcement-empty">
          No announcements played yet
        </div>
        <div v-for="(entry, index) in logs" :key="index" class="announcement-entry">
          <span class="announcement-time">{{ entry.time }}</span>
          <span class="announcement-text">{{ entry.text }}</span>
        </div>
      </div>
    </div>
  `,

  watch: {
    logs: {
      handler() {
        this.$nextTick(() => {
          const container = this.$refs.logContainer;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        });
      },
      deep: true,
    },
  },
};

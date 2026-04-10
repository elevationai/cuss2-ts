export default {
  name: 'PrinterUI',
  props: {
    componentId: { type: [Number, String], required: true },
    status: { type: String, default: '' },
    media: { type: String, default: null },
  },
  emits: ['printer-action'],
  data() {
    return {
      isPortrait: false,
      toggles: [
        { label: 'Paper Jam', onAction: 'paperjam', offAction: 'ready', statusMatch: 'MEDIA_JAMMED' },
        { label: 'Paper Empty', onAction: 'paperempty', offAction: 'ready', statusMatch: 'MEDIA_EMPTY' },
        { label: 'Paper Low', onAction: 'paperlow', offAction: 'ready', statusMatch: 'MEDIA_LOW' },
        { label: 'Paper Full', onAction: 'paperfull', offAction: 'ready', statusMatch: 'MEDIA_FULL' },
        { label: 'Cutter Jam', onAction: 'cutterjam', offAction: 'ready', statusMatch: 'HARDWARE_ERROR' },
        { label: 'Media Present', onAction: 'mediapresent', offAction: 'mediataken', statusMatch: 'MEDIA_PRESENT' },
      ],
    };
  },
  methods: {
    isActive(toggle) {
      return this.status === toggle.statusMatch;
    },
    handleToggle(toggle) {
      const action = this.isActive(toggle) ? toggle.offAction : toggle.onAction;
      this.$emit('printer-action', { componentId: this.componentId, action });
    },
    checkOrientation(e) {
      const img = e.target;
      this.isPortrait = img.naturalHeight > img.naturalWidth;
    },
    openMedia() {
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(`<html><head><title>Print #${this.componentId}</title><style>body{margin:0;background:#1a1a2e;display:flex;justify-content:center}img{max-width:100%}</style></head><body><img src="${this.media}"></body></html>`);
        w.document.close();
      }
    },
  },
  template: `
    <div class="printer-ui">
      <div class="printer-toggles">
        <div v-for="toggle in toggles" :key="toggle.onAction" class="action-param-row">
          <span class="action-param-label">{{ toggle.label }}</span>
          <toggle-switch
            :value="isActive(toggle)"
            @toggle="handleToggle(toggle)"></toggle-switch>
        </div>
      </div>
      <div v-if="media" class="printer-media" :class="{ rotated: isPortrait }" @click="openMedia" title="Click to view full size">
        <img :src="media" @load="checkOrientation" ref="mediaImg" />
      </div>
    </div>
  `,
};

import { exampleData } from '../data.js';

export default {
  name: 'DataReaderUI',
  props: {
    componentId: { type: [Number, String], required: true },
    readerType: { type: String, required: true },
    component: { type: Object, required: true },
  },
  emits: ['send-data', 'media-inserted'],
  data() {
    return {
      textareaValue: '',
      selectedExample: '',
      selectedDsType: '',
    };
  },
  computed: {
    examples() {
      return exampleData[this.readerType] || {};
    },
    exampleKeys() {
      return Object.keys(this.examples);
    },
    availableDsTypes() {
      const characteristics = this.component?.componentCharacteristics;
      if (!Array.isArray(characteristics)) return [];
      const types = new Set();
      for (const char of characteristics) {
        if (Array.isArray(char.dsTypesList)) {
          for (const t of char.dsTypesList) types.add(t);
        }
      }
      return [...types];
    },
  },
  watch: {
    textareaValue(newVal, oldVal) {
      const hadData = !!oldVal.trim();
      const hasData = !!newVal.trim();
      if (hadData !== hasData) {
        this.$emit('media-inserted', { componentId: this.componentId, inserted: hasData });
      }
    },
    availableDsTypes: {
      handler(types) {
        if (types.length > 0 && !this.selectedDsType) {
          this.selectedDsType = types[0];
        }
      },
      immediate: true,
    },
  },
  methods: {
    onExampleSelect() {
      if (this.selectedExample && this.examples[this.selectedExample]) {
        const example = this.examples[this.selectedExample];
        this.textareaValue = example.data;
        if (example.type) {
          const match = this.availableDsTypes.find(t => this.formatLabel(t) === example.type);
          if (match) this.selectedDsType = match;
        }
        this.$nextTick(() => this.$refs.textarea?.focus());
      }
    },
    selectDsType(dsType) {
      this.selectedDsType = dsType;
    },
    onEnter(event) {
      if (!this.textareaValue.trim()) return;
      event.preventDefault();
      this.$emit('send-data', {
        componentId: this.componentId,
        data: this.textareaValue.trim(),
        dsType: this.selectedDsType,
      });
      this.textareaValue = '';
      this.selectedExample = '';
    },
    formatLabel(dsType) {
      return dsType.replace(/^DS_TYPES_/, '');
    },
  },
  template: `
    <div class="data-reader-container">
      <select v-model="selectedExample" @change="onExampleSelect" class="data-reader-select">
        <option value="">Select example data...</option>
        <option v-for="key in exampleKeys" :key="key" :value="key">{{ key }}</option>
      </select>
      <div v-if="availableDsTypes.length" class="data-reader-types">
        <button v-for="dsType in availableDsTypes" :key="dsType"
                class="data-reader-type-chip"
                :class="{ selected: selectedDsType === dsType }"
                @click="selectDsType(dsType)">
          {{ formatLabel(dsType) }}
        </button>
      </div>
      <textarea ref="textarea" v-model="textareaValue"
                class="data-reader-textarea"
                placeholder="Enter data or select an example above. Press Enter to send."
                @keydown.enter.exact="onEnter"
                rows="3"></textarea>
    </div>
  `,
};

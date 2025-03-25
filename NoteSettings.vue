<template>
  <div class="settings-panel bg-gray-800 border border-blue-700 rounded-md p-4 w-64">
    <h3 class="text-blue-300 text-sm mb-3 border-b border-blue-900 pb-1">
      <span class="text-cyan-400">⚙</span> NOTE SETTINGS
    </h3>
    
    <div class="mb-3">
      <label class="block text-xs text-blue-400 mb-1">BACKGROUND</label>
      <div class="flex space-x-2">
        <button 
          v-for="color in backgroundColors" 
          :key="color.value"
          @click="$emit('update:bgColor', color.value)"
          class="w-6 h-6 rounded-full border border-blue-700"
          :style="{ backgroundColor: color.value }"
          :class="{ 'ring-2 ring-cyan-400': modelValue === color.value }"
        ></button>
      </div>
    </div>
    
    <div class="mb-3">
      <label class="block text-xs text-blue-400 mb-1">CATEGORY</label>
      <select 
        :value="categoryId"
        @input="$emit('update:categoryId', ($event.target as HTMLSelectElement).value)"
        class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
      >
        <option value="">No Category</option>
        <option v-for="category in categories" :key="category.id" :value="category.id">
          {{ category.name }}
        </option>
      </select>
    </div>
    
    <div class="mb-3">
      <label class="block text-xs text-blue-400 mb-1">PRIORITY</label>
      <select 
        :value="priority"
        @input="$emit('update:priority', ($event.target as HTMLSelectElement).value)"
        class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
      >
        <option value="low">LOW</option>
        <option value="medium">MEDIUM</option>
        <option value="high">HIGH</option>
        <option value="critical">CRITICAL</option>
      </select>
    </div>
    
    <div class="mb-3">
      <label class="block text-xs text-blue-400 mb-1">OPACITY</label>
      <input 
        type="range" 
        :value="opacity"
        @input="$emit('update:opacity', Number(($event.target as HTMLInputElement).value))"
        min="50" 
        max="100" 
        class="w-full accent-blue-500"
      />
    </div>
    
    <button 
      @click="$emit('close')"
      class="w-full bg-blue-900 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded border border-blue-600 text-xs mt-2"
    >
      APPLY
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

interface Category {
  id: string;
  name: string;
  color: string;
}

export default defineComponent({
  name: 'NoteSettings',
  props: {
    modelValue: {
      type: String,
      default: '#1a1a2e'
    },
    priority: {
      type: String,
      default: 'medium'
    },
    opacity: {
      type: Number,
      default: 100
    },
    categoryId: {
      type: String,
      default: ''
    },
    categories: {
      type: Array as () => Category[],
      default: () => []
    }
  },
  emits: ['update:bgColor', 'update:priority', 'update:opacity', 'update:categoryId', 'close'],
  setup() {
    const backgroundColors = [
      { name: 'Dark Blue', value: '#1a1a2e' },
      { name: 'Navy', value: '#0f3460' },
      { name: 'Purple', value: '#231942' },
      { name: 'Teal', value: '#1a3a3a' },
      { name: 'Dark Red', value: '#3a1a1a' }
    ];

    return {
      backgroundColors
    };
  }
});
</script>


<template>
  <div class="theme-settings bg-gray-800 border border-blue-700 rounded-md p-4 w-64">
    <h3 class="text-blue-300 text-sm mb-3 border-b border-blue-900 pb-1">
      <span class="text-cyan-400">🎨</span> 主题设置
    </h3>
    
    <div class="mb-3">
      <div 
        v-for="theme in themes" 
        :key="theme.id"
        class="flex items-center mb-2 p-2 rounded cursor-pointer"
        :class="{ 'bg-gray-700': selectedTheme === theme.id }"
        @click="selectTheme(theme.id)"
      >
        <div 
          class="w-6 h-6 rounded mr-2 flex items-center justify-center"
          :style="{ 
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.border,
            borderWidth: '1px'
          }"
        >
          <div 
            v-if="selectedTheme === theme.id"
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: theme.colors.accent }"
          ></div>
        </div>
        <span class="text-sm">{{ theme.name }}</span>
      </div>
    </div>
    
    <div v-if="showCustomTheme" class="border-t border-blue-900 pt-3">
      <h4 class="text-xs text-blue-400 mb-2">自定义主题</h4>
      
      <div class="mb-2">
        <label class="block text-xs text-blue-400 mb-1">背景色</label>
        <div class="flex">
          <input 
            v-model="customTheme.colors.background" 
            type="color"
            class="w-8 h-8 rounded mr-2 bg-transparent border-0"
          />
          <input 
            v-model="customTheme.colors.background" 
            type="text"
            class="flex-1 bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      
      <div class="mb-2">
        <label class="block text-xs text-blue-400 mb-1">前景色</label>
        <div class="flex">
          <input 
            v-model="customTheme.colors.foreground" 
            type="color"
            class="w-8 h-8 rounded mr-2 bg-transparent border-0"
          />
          <input 
            v-model="customTheme.colors.foreground" 
            type="text"
            class="flex-1 bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      
      <div class="mb-2">
        <label class="block text-xs text-blue-400 mb-1">主色调</label>
        <div class="flex">
          <input 
            v-model="customTheme.colors.primary" 
            type="color"
            class="w-8 h-8 rounded mr-2 bg-transparent border-0"
          />
          <input 
            v-model="customTheme.colors.primary" 
            type="text"
            class="flex-1 bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      
      <div class="mb-2">
        <label class="block text-xs text-blue-400 mb-1">强调色</label>
        <div class="flex">
          <input 
            v-model="customTheme.colors.accent" 
            type="color"
            class="w-8 h-8 rounded mr-2 bg-transparent border-0"
          />
          <input 
            v-model="customTheme.colors.accent" 
            type="text"
            class="flex-1 bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      
      <button 
        @click="applyCustomTheme" 
        class="w-full bg-blue-900 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded border border-blue-600 text-xs mt-2"
      >
        应用自定义主题
      </button>
    </div>
    
    <div class="mt-3 flex justify-between">
      <button 
        @click="toggleCustomTheme" 
        class="flex-1 mr-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded border border-gray-600 text-xs"
      >
        {{ showCustomTheme ? '隐藏自定义' : '自定义主题' }}
      </button>
      <button 
        @click="$emit('close')"
        class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded border border-gray-600 text-xs"
      >
        关闭
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { defaultThemes, Theme, applyTheme } from '../services/theme-service';

export default defineComponent({
  name: 'ThemeSettings',
  props: {
    modelValue: {
      type: String,
      default: 'default'
    }
  },
  emits: ['update:modelValue', 'close'],
  setup(props, { emit }) {
    const themes = ref(defaultThemes);
    const selectedTheme = ref(props.modelValue);
    const showCustomTheme = ref(false);
    
    // Custom theme state
    const customTheme = ref<Theme>({
      id: 'custom',
      name: '自定义主题',
      colors: {
        background: '#0a0a1a',
        foreground: '#e2e8f0',
        primary: '#1a1a2e',
        secondary: '#16213e',
        accent: '#00b7c2',
        border: '#3a506b'
      }
    });
    
    // Select a theme
    const selectTheme = (themeId: string) => {
      selectedTheme.value = themeId;
      emit('update:modelValue', themeId);
      
      // Apply the selected theme
      const theme = themes.value.find(t => t.id === themeId);
      if (theme) {
        applyTheme(theme);
      }
    };
    
    // Toggle custom theme editor
    const toggleCustomTheme = () => {
      showCustomTheme.value = !showCustomTheme.value;
    };
    
    // Apply custom theme
    const applyCustomTheme = () => {
      // Add custom theme to themes if not exists
      if (!themes.value.some(t => t.id === 'custom')) {
        themes.value.push(customTheme.value);
      } else {
        // Update existing custom theme
        const index = themes.value.findIndex(t => t.id === 'custom');
        themes.value[index] = { ...customTheme.value };
      }
      
      // Select and apply custom theme
      selectTheme('custom');
    };
    
    // Watch for prop changes
    watch(() => props.modelValue, (newValue) => {
      selectedTheme.value = newValue;
    });
    
    return {
      themes,
      selectedTheme,
      showCustomTheme,
      customTheme,
      selectTheme,
      toggleCustomTheme,
      applyCustomTheme
    };
  }
});
</script>


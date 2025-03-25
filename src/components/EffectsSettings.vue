<template>
  <div class="effects-settings bg-gray-800 border border-blue-700 rounded-md p-4 w-80">
    <h3 class="text-blue-300 text-sm mb-3 border-b border-blue-900 pb-1">
      <span class="text-cyan-400">✨</span> 视觉效果设置
    </h3>
    
    <div class="mb-4">
      <div class="mb-3">
        <label class="flex items-center text-sm">
          <input 
            type="checkbox" 
            v-model="config.enableGlow" 
            class="mr-2 accent-blue-500"
          />
          启用发光效果
        </label>
        
        <div v-if="config.enableGlow" class="mt-2 pl-6">
          <div class="mb-2">
            <label class="block text-xs text-blue-400 mb-1">发光颜色</label>
            <input 
              type="color" 
              v-model="config.glowColor" 
              class="w-full h-6 rounded"
            />
          </div>
          
          <div>
            <label class="block text-xs text-blue-400 mb-1">发光强度: {{ config.glowIntensity }}</label>
            <input 
              type="range" 
              v-model.number="config.glowIntensity" 
              min="1" 
              max="10" 
              class="w-full accent-blue-500"
            />
          </div>
        </div>
      </div>
      
      <div class="mb-3">
        <label class="flex items-center text-sm">
          <input 
            type="checkbox" 
            v-model="config.enableParticles" 
            class="mr-2 accent-blue-500"
          />
          启用粒子效果
        </label>
        
        <div v-if="config.enableParticles" class="mt-2 pl-6">
          <div class="mb-2">
            <label class="block text-xs text-blue-400 mb-1">粒子类型</label>
            <select 
              v-model="config.particleType" 
              class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs"
            >
              <option value="stars">星星</option>
              <option value="dots">点状</option>
              <option value="lines">线条</option>
            </select>
          </div>
          
          <div>
            <label class="block text-xs text-blue-400 mb-1">粒子密度: {{ config.particleDensity }}</label>
            <input 
              type="range" 
              v-model.number="config.particleDensity" 
              min="10" 
              max="100" 
              class="w-full accent-blue-500"
            />
          </div>
        </div>
      </div>
      
      <div class="mb-3">
        <label class="flex items-center text-sm">
          <input 
            type="checkbox" 
            v-model="config.enableAnimations" 
            class="mr-2 accent-blue-500"
          />
          启用动画效果
        </label>
        
        <div v-if="config.enableAnimations" class="mt-2 pl-6">
          <label class="block text-xs text-blue-400 mb-1">动画速度: {{ config.animationSpeed }}</label>
          <input 
            type="range" 
            v-model.number="config.animationSpeed" 
            min="1" 
            max="10" 
            class="w-full
            min="1" 
            max="10" 
            class="w-full accent-blue-500"
          />
        </div>
      </div>
      
      <div class="mb-3">
        <label class="flex items-center text-sm">
          <input 
            type="checkbox" 
            v-model="config.enableSounds" 
            class="mr-2 accent-blue-500"
          />
          启用声音效果
        </label>
        
        <div v-if="config.enableSounds" class="mt-2 pl-6">
          <label class="block text-xs text-blue-400 mb-1">音量: {{ config.soundVolume }}%</label>
          <input 
            type="range" 
            v-model.number="config.soundVolume" 
            min="0" 
            max="100" 
            class="w-full accent-blue-500"
          />
        </div>
      </div>
    </div>
    
    <div class="flex justify-between">
      <button 
        @click="resetToDefaults" 
        class="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded border border-gray-600 text-xs"
      >
        重置默认
      </button>
      
      <div>
        <button 
          @click="$emit('close')" 
          class="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded border border-gray-600 text-xs mr-2"
        >
          取消
        </button>
        <button 
          @click="saveChanges" 
          class="bg-blue-700 hover:bg-blue-600 text-blue-100 px-3 py-1 rounded border border-blue-600 text-xs"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted } from 'vue';
import { EffectsConfig, defaultEffectsConfig } from '../services/effects-service';

export default defineComponent({
  name: 'EffectsSettings',
  emits: ['close', 'update:config'],
  setup(props, { emit }) {
    // 配置
    const config = reactive<EffectsConfig>({ ...defaultEffectsConfig });
    
    // 重置为默认值
    const resetToDefaults = () => {
      Object.assign(config, defaultEffectsConfig);
    };
    
    // 保存更改
    const saveChanges = () => {
      emit('update:config', { ...config });
      emit('close');
    };
    
    return {
      config,
      resetToDefaults,
      saveChanges
    };
  }
});
</script>

<style scoped>
/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #1a1a2e;
}

::-webkit-scrollbar-thumb {
  background: #3a506b;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4a6b8a;
}

/* 自定义范围输入样式 */
input[type="range"] {
  -webkit-appearance: none;
  height: 6px;
  background: #1a1a2e;
  border-radius: 3px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: #00b7c2;
  border-radius: 50%;
  cursor: pointer;
}
</style>


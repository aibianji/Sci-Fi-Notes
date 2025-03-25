<template>
  <div class="effects-settings bg-gray-800 border border-blue-700 rounded-md p-4 w-80">
    <h3 class="text-blue-300 text-sm mb-3 border-b border-blue-900 pb-1">
      <span class="text-cyan-400">✨</span> 视觉效果设置
    </h3>
    
    <div class="mb-4">
      <h4 class="text-xs text-blue-400 mb-2">背景效果</h4>
      
      <div class="mb-2">
        <label class="block text-sm mb-1">背景类型</label>
        <select 
          v-model="config.background.type" 
          class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
          @change="updateConfig"
        >
          <option value="none">无背景</option>
          <option value="stars">星空</option>
          <option value="grid">网格</option>
          <option value="matrix">矩阵</option>
          <option value="custom">自定义图片</option>
        </select>
      </div>
      
      <div v-if="config.background.type === 'custom'" class="mb-2">
        <label class="block text-sm mb-1">自定义背景图片</label>
        <div class="flex">
          <input 
            v-model="config.background.customImage" 
            type="text"
            placeholder="输入图片URL..."
            class="flex-1 bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
          />
          <button 
            @click="selectBackgroundImage" 
            class="ml-2 bg-blue-900 hover:bg-blue-800 text-blue-200 px-2 py-1 rounded border border-blue-600 text-xs"
          >
            浏览...
          </button>
        </div>
      </div>
      
      <div class="mb-2">
        <label class="block text-sm mb-1">背景不透明度: {{ config.background.opacity }}</label>
        <input 
          v-model="config.background.opacity" 
          type="range" 
          min="0.1" 
          max="1" 
          step="0.1"
          class="w-full"
          @change="updateConfig"
        />
      </div>
      
      <div v-if="config.background.type !== 'none' && config.background.type !== 'custom'" class="mb-2">
        <label class="block text-sm mb-1">动画速度: {{ config.background.animationSpeed }}</label>
        <input 
          v-model="config.background.animationSpeed" 
          type="range" 
          min="0.5" 
          max="2" 
          step="0.1"
          class="w-full"
          @change="updateConfig"
        />
      </div>
    </div>
    
    <div class="mb-4">
      <h4 class="text-xs text-blue-400 mb-2">粒子效果</h4>
      
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm">启用粒子</label>
        <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
          <input 
            type="checkbox" 
            v-model="config.particles.enabled" 
            class="sr-only"
            @change="updateConfig"
          />
          <span 
            class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
            :class="config.particles.enabled ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
          ></span>
        </div>
      </div>
      
      <div v-if="config.particles.enabled" class="space-y-2">
        <div>
          <label class="block text-sm mb-1">粒子数量: {{ config.particles.count }}</label>
          <input 
            v-model="config.particles.count" 
            type="range" 
            min="10" 
            max="200" 
            step="10"
            class="w-full"
            @change="updateConfig"
          />
        </div>
        
        <div>
          <label class="block text-sm mb-1">粒子颜色</label>
          <div class="flex">
            <input 
              v-model="config.particles.color" 
              type="color"
              class="w-8 h-8 rounded mr-2 bg-transparent border-0"
              @change="updateConfig"
            />
            <input 
              v-model="config.particles.color" 
              type="text"
              class="flex-1 bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
              @change="updateConfig"
            />
          </div>
        </div>
        
        <div>
          <label class="block text-sm mb-1">粒子大小: {{ config.particles.size }}</label>
          <input 
            v-model="config.particles.size" 
            type="range" 
            min="1" 
            max="5" 
            step="0.5"
            class="w-full"
            @change="updateConfig"
          />
        </div>
        
        <div>
          <label class="block text-sm mb-1">粒子速度: {{ config.particles.speed }}</label>
          <input 
            v-model="config.particles.speed" 
            type="range" 
            min="0.5" 
            max="3" 
            step="0.5"
            class="w-full"
            @change="updateConfig"
          />
        </div>
      </div>
    </div>
    
    <div class="mb-4">
      <h4 class="text-xs text-blue-400 mb-2">全息效果</h4>
      
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm">启用全息效果</label>
        <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
          <input 
            type="checkbox" 
            v-model="config.hologram.enabled" 
            class="sr-only"
            @change="updateConfig"
          />
          <span 
            class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
            :class="config.hologram.enabled ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
          ></span>
        </div>
      </div>
      
      <div v-if="config.hologram.enabled" class="space-y-2">
        <div>
          <label class="block text-sm mb-1">扫描线不透明度: {{ config.hologram.scanlineOpacity }}</label>
          <input 
            v-model="config.hologram.scanlineOpacity" 
            type="range" 
            min="0.05" 
            max="0.3" 
            step="0.05"
            class="w-full"
            @change="updateConfig"
          />
        </div>
        
        <div>
          <label class="block text-sm mb-1">扫描线速度: {{ config.hologram.scanlineSpeed }}</label>
          <input 
            v-model="config.hologram.scanlineSpeed" 
            type="range" 
            min="0.5" 
            max="2" 
            step="0.1"
            class="w-full"
            @change="updateConfig"
          />
        </div>
        
        <div>
          <label class="block text-sm mb-1">故障强度: {{ config.hologram.glitchIntensity }}</label>
          <input 
            v-model="config.hologram.glitchIntensity" 
            type="range" 
            min="0.1" 
            max="0.5" 
            step="0.1"
            class="w-full"
            @change="updateConfig"
          />
        </div>
        
        <div>
          <label class="block text-sm mb-1">辉光颜色</label>
          <div class="flex">
            <input 
              v-model="config.hologram.glowColor" 
              type="color"
              class="w-8 h-8 rounded mr-2 bg-transparent border-0"
              @change="updateConfig"
            />
            <input 
              v-model="config.hologram.glowColor" 
              type="text"
              class="flex-1 bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
              @change="updateConfig"
            />
          </div>
        </div>
        
        <div>
          <label class="block text-sm mb-1">辉光强度: {{ config.hologram.glowIntensity }}</label>
          <input 
            v-model="config.hologram.glowIntensity" 
            type="range" 
            min="0.1" 
            max="1" 
            step="0.1"
            class="w-full"
            @change="updateConfig"
          />
        </div>
      </div>
    </div>
    
    <div class="mb-4">
      <h4 class="text-xs text-blue-400 mb-2">其他效果</h4>
      
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm">启用模糊效果</label>
        <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
          <input 
            type="checkbox" 
            v-model="config.enableBlur" 
            class="sr-only"
            @change="updateConfig"
          />
          <span 
            class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
            :class="config.enableBlur ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
          ></span>
        </div>
      </div>
      
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm">启用辉光效果</label>
        <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
          <input 
            type="checkbox" 
            v-model="config.enableGlow" 
            class="sr-only"
            @change="updateConfig"
          />
          <span 
            class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
            :class="config.enableGlow ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
          ></span>
        </div>
      </div>
      
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm">启用反射效果</label>
        <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
          <input 
            type="checkbox" 
            v-model="config.enableReflections" 
            class="sr-only"
            @change="updateConfig"
          />
          <span 
            class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
            :class="config.enableReflections ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
          ></span>
        </div>
      </div>
      
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm">启用音效</label>
        <div class="relative inline-block w-10 h-5 rounded-full bg-gray-700">
          <input 
            type="checkbox" 
            v-model="config.enableSoundEffects" 
            class="sr-only"
            @change="updateConfig"
          />
          <span 
            class="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all duration-200 transform"
            :class="config.enableSoundEffects ? 'bg-blue-500 translate-x-5' : 'bg-gray-400'"
          ></span>
        </div>
      </div>
    </div>
    
    <div class="flex justify-between">
      <button 
        @click="resetConfig" 
        class="flex-1 mr-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded border border-gray-600 text-xs"
      >
        重置效果
      </button>
      <button 
        @click="$emit('close')" 
        class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded border border-gray-600 text-xs"
      >
        关闭
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { open } from '@tauri-apps/api/dialog';
import { effectsConfig, defaultEffectsConfig, saveEffectsConfig, EffectsConfig } from '../services/effects-service';

export default defineComponent({
  name: 'EffectsSettings',
  emits: ['close', 'update:config'],
  setup(props, { emit }) {
    const config = ref<EffectsConfig>({ ...effectsConfig.value });
    
    // 更新配置
    const updateConfig = () => {
      // 更新全局配置
      effectsConfig.value = { ...config.value };
      
      // 保存配置到本地存储
      saveEffectsConfig();
      
      // 通知父组件
      emit('update:config', config.value);
    };
    
    // 重置配置
    const resetConfig = () => {
      config.value = { ...defaultEffectsConfig };
      updateConfig();
    };
    
    // 选择背景图片
    const selectBackgroundImage = async () => {
      try {
        const selected = await open({
          filters: [{
            name: '图片文件',
            extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp']
          }]
        });
        
        if (selected) {
          config.value.background.customImage = selected as string;
          updateConfig();
        }
      } catch (e) {
        console.error('Failed to select background image:', e);
      }
    };
    
    onMounted(() => {
      // 确保配置是最新的
      config.value = { ...effectsConfig.value };
    });
    
    return {
      config,
      updateConfig,
      resetConfig,
      selectBackgroundImage
    };
  }
});
</script>


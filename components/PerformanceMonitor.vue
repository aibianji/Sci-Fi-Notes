<template>
  <div 
    v-if="visible" 
    class="performance-monitor bg-gray-900 border border-blue-800 rounded-md p-2 text-xs text-blue-400 fixed bottom-6 right-2 z-50 opacity-80 hover:opacity-100"
  >
    <div class="flex justify-between items-center mb-1">
      <span class="font-bold">性能监控</span>
      <button @click="visible = false" class="text-red-400 hover:text-red-300">×</button>
    </div>
    <div class="grid grid-cols-2 gap-x-4 gap-y-1">
      <div>FPS:</div>
      <div :class="getFpsColor(fps)">{{ fps.toFixed(1) }}</div>
      
      <div>内存:</div>
      <div>{{ memoryUsage }}</div>
      
      <div>便签数:</div>
      <div>{{ noteCount }}</div>
      
      <div>渲染时间:</div>
      <div>{{ renderTime }}ms</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount, watch } from 'vue';

export default defineComponent({
  name: 'PerformanceMonitor',
  props: {
    noteCount: {
      type: Number,
      default: 0
    }
  },
  setup() {
    const visible = ref(false);
    const fps = ref(0);
    const memoryUsage = ref('0 MB');
    const renderTime = ref(0);
    
    let frameCount = 0;
    let lastTime = performance.now();
    let frameId: number;
    
    // 计算FPS
    const calculateFps = () => {
      frameCount++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime;
      
      if (elapsed >= 1000) {
        fps.value = frameCount / (elapsed / 1000);
        frameCount = 0;
        lastTime = currentTime;
        
        // 更新内存使用情况（如果浏览器支持）
        if (window.performance && (performance as any).memory) {
          const memory = (performance as any).memory;
          const memoryMB = Math.round(memory.usedJSHeapSize / (1024 * 1024));
          memoryUsage.value = `${memoryMB} MB`;
        }
      }
      
      frameId = requestAnimationFrame(calculateFps);
    };
    
    // 测量渲染时间
    const measureRenderTime = () => {
      const start = performance.now();
      
      // 在下一帧结束时测量
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          renderTime.value = Math.round(performance.now() - start);
        });
      });
    };
    
    // 根据FPS返回颜色类
    const getFpsColor = (value: number): string => {
      if (value >= 55) return 'text-green-400';
      if (value >= 30) return 'text-yellow-400';
      return 'text-red-400';
    };
    
    // 监听键盘快捷键切换显示
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        visible.value = !visible.value;
      }
    };
    
    // 监听便签数量变化
    watch(() => props.noteCount, () => {
      measureRenderTime();
    });
    
    onMounted(() => {
      // 启动FPS计算
      frameId = requestAnimationFrame(calculateFps);
      
      // 添加键盘监听
      window.addEventListener('keydown', handleKeyDown);
      
      // 初始测量
      measureRenderTime();
    });
    
    onBeforeUnmount(() => {
      // 清理
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', handleKeyDown);
    });
    
    return {
      visible,
      fps,
      memoryUsage,
      renderTime,
      getFpsColor
    };
  }
});
</script>


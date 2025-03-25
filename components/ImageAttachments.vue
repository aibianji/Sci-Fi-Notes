<template>
  <div class="image-attachments bg-gray-800 border border-blue-700 rounded-md p-4 w-80">
    <h3 class="text-blue-300 text-sm mb-3 border-b border-blue-900 pb-1">
      <span class="text-cyan-400">🖼️</span> 图像附件
    </h3>
    
    <div class="mb-4">
      <div class="flex space-x-2 mb-3">
        <button 
          @click="captureScreenshot" 
          class="flex-1 bg-blue-900 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded border border-blue-600 text-xs flex items-center justify-center"
        >
          <span class="mr-1">📷</span> 截图
        </button>
        <button 
          @click="selectImage" 
          class="flex-1 bg-blue-900 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded border border-blue-600 text-xs flex items-center justify-center"
        >
          <span class="mr-1">📁</span> 选择图片
        </button>
      </div>
      
      <div v-if="images.length === 0" class="text-center text-xs text-blue-400 my-4">
        没有图像附件
      </div>
      
      <div v-else class="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
        <div 
          v-for="image in images" 
          :key="image.id"
          class="relative group bg-gray-900 rounded overflow-hidden border border-blue-900"
        >
          <img 
            :src="getImageUrl(image)" 
            :alt="image.name"
            class="w-full h-24 object-cover"
            @click="previewImage(image)"
          />
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button 
              @click.stop="deleteImage(image)" 
              class="text-red-400 hover:text-red-300 bg-gray-900 bg-opacity-70 rounded-full w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
          <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-xs text-white p-1 truncate">
            {{ image.name }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图像预览 -->
    <div 
      v-if="previewedImage" 
      class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
      @click="previewedImage = null"
    >
      <div 
        class="relative max-w-3xl max-h-screen p-2"
        @click.stop
      >
        <img 
          :src="getImageUrl(previewedImage)" 
          :alt="previewedImage.name"
          class="max-w-full max-h-[calc(100vh-4rem)] object-contain"
        />
        <div class="absolute top-2 right-2 flex space-x-2">
          <button 
            @click="saveImageToFile(previewedImage)" 
            class="bg-blue-900 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded border border-blue-600 text-xs"
          >
            保存
          </button>
          <button 
            @click="previewedImage = null" 
            class="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded border border-gray-600 text-xs"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
    
    <!-- 截图区域选择 -->
    <div 
      v-if="selectingArea" 
      class="fixed inset-0 bg-black bg-opacity-30 cursor-crosshair z-50"
      @mousedown="startAreaSelection"
      @mousemove="updateAreaSelection"
      @mouseup="finishAreaSelection"
    >
      <div 
        v-if="selectionArea.active" 
        class="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20"
        :style="{
          left: `${selectionArea.x}px`,
          top: `${selectionArea.y}px`,
          width: `${selectionArea.width}px`,
          height: `${selectionArea.height}px`
        }"
      ></div>
      <div class="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-3 rounded">
        拖动鼠标选择截图区域，按 ESC 取消
      </div>
    </div>
    
    <div class="flex justify-between">
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
import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue';
import { 
  NoteImage, 
  captureScreen, 
  selectImageFile, 
  saveImage, 
  loadImage,
  deleteImage as deleteImageFile,
  saveImageToFile as saveImageToFileService,
  CaptureArea
} from '../services/image-service';
import { sendDesktopNotification } from '../services/windows-service';

export default defineComponent({
  name: 'ImageAttachments',
  props: {
    noteId: {
      type: String,
      required: true
    },
    modelValue: {
      type: Array as () => NoteImage[],
      default: () => []
    }
  },
  emits: ['close', 'update:modelValue'],
  setup(props, { emit }) {
    const images = ref<NoteImage[]>(props.modelValue);
    const previewedImage = ref<NoteImage | null>(null);
    const selectingArea = ref(false);
    const selectionArea = ref({
      active: false,
      startX: 0,
      startY: 0,
      x: 0,
      y: 0,
      width: 0,
      height: 0
    });
    
    // 图像 URL 缓存
    const imageUrlCache = new Map<string, string>();
    
    // 获取图像 URL
    const getImageUrl = (image: NoteImage): string => {
      if (imageUrlCache.has(image.id)) {
        return imageUrlCache.get(image.id)!;
      }
      
      // 创建一个占位 URL
      return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=`;
    };
    
    // 加载图像
    const loadImages = async () => {
      for (const image of images.value) {
        if (!imageUrlCache.has(image.id)) {
          const data = await loadImage(image.path);
          if (data) {
            const blob = new Blob([data], { type: image.type });
            const url = URL.createObjectURL(blob);
            imageUrlCache.set(image.id, url);
          }
        }
      }
    };
    
    // 截取屏幕
    const captureScreenshot = async () => {
      // 全屏截图
      selectingArea.value = true;
    };
    
    // 开始区域选择
    const startAreaSelection = (e: MouseEvent) => {
      selectionArea.value = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        x: e.clientX,
        y: e.clientY,
        width: 0,
        height: 0
      };
    };
    
    // 更新区域选择
    const updateAreaSelection = (e: MouseEvent) => {
      if (!selectionArea.value.active) return;
      
      const { startX, startY } = selectionArea.value;
      
      // 计算选择区域
      const x = Math.min(startX, e.clientX);
      const y = Math.min(startY, e.clientY);
      const width = Math.abs(e.clientX - startX);
      const height = Math.abs(e.clientY - startY);
      
      selectionArea.value = {
        ...selectionArea.value,
        x,
        y,
        width,
        height
      };
    };
    
    // 完成区域选择
    const finishAreaSelection = async () => {
      if (!selectionArea.value.active) return;
      
      const area: CaptureArea = {
        x: selectionArea.value.x,
        y: selectionArea.value.y,
        width: selectionArea.value.width,
        height: selectionArea.value.height
      };
      
      selectingArea.value = false;
      selectionArea.value.active = false;
      
      // 如果选择的区域太小，则取消
      if (area.width < 10 || area.height < 10) {
        return;
      }
      
      // 截取选定区域
      const imageData = await captureScreen(area);
      if (imageData) {
        const timestamp = new Date();
        const fileName = `screenshot_${timestamp.getTime()}.png`;
        
        const savedImage = await saveImage(
          props.noteId,
          imageData,
          fileName,
          'image/png'
        );
        
        if (savedImage) {
          // 添加到图像列表
          images.value.push(savedImage);
          
          // 创建 URL
          const blob = new Blob([imageData], { type: 'image/png' });
          const url = URL.createObjectURL(blob);
          imageUrlCache.set(savedImage.id, url);
          
          // 通知父组件
          emit('update:modelValue', images.value);
          
          sendDesktopNotification('截图成功', '截图已添加到便签');
        }
      }
    };
    
    // 取消区域选择
    const cancelAreaSelection = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectingArea.value) {
        selectingArea.value = false;
        selectionArea.value.active = false;
      }
    };
    
    // 选择图像文件
    const selectImage = async () => {
      const result = await selectImageFile();
      if (result) {
        const { data, name, type } = result;
        
        const savedImage = await saveImage(
          props.noteId,
          data,
          name,
          type
        );
        
        if (savedImage) {
          // 添加到图像列表
          images.value.push(savedImage);
          
          // 创建 URL
          const blob = new Blob([data], { type });
          const url = URL.createObjectURL(blob);
          imageUrlCache.set(savedImage.id, url);
          
          // 通知父组件
          emit('update:modelValue', images.value);
          
          sendDesktopNotification('图像已添加', `${name} 已添加到便签`);
        }
      }
    };
    
    // 删除图像
    const deleteImage = async (image: NoteImage) => {
      // 从文件系统删除
      await deleteImageFile(image);
      
      // 从列表中删除
      images.value = images.value.filter(img => img.id !== image.id);
      
      // 释放 URL
      if (imageUrlCache.has(image.id)) {
        URL.revokeObjectURL(imageUrlCache.get(image.id)!);
        imageUrlCache.delete(image.id);
      }
      
      // 通知父组件
      emit('update:modelValue', images.value);
      
      sendDesktopNotification('图像已删除', `${image.name} 已从便签中删除`);
    };
    
    // 预览图像
    const previewImage = (image: NoteImage) => {
      previewedImage.value = image;
    };
    
    // 保存图像到文件
    const saveImageToFile = async (image: NoteImage) => {
      const data = await loadImage(image.path);
      if (data) {
        const success = await saveImageToFileService(data, image.name);
        if (success) {
          sendDesktopNotification('图像已保存', `${image.name} 已保存到文件`);
        }
      }
    };
    
    // 清理
    const cleanup = () => {
      // 释放所有 URL
      for (const url of imageUrlCache.values()) {
        URL.revokeObjectURL(url);
      }
      imageUrlCache.clear();
    };
    
    onMounted(() => {
      loadImages();
      window.addEventListener('keydown', cancelAreaSelection);
    });
    
    onBeforeUnmount(() => {
      cleanup();
      window.removeEventListener('keydown', cancelAreaSelection);
    });
    
    return {
      images,
      previewedImage,
      selectingArea,
      selectionArea,
      getImageUrl,
      captureScreenshot,
      startAreaSelection,
      updateAreaSelection,
      finishAreaSelection,
      selectImage,
      deleteImage,
      previewImage,
      saveImageToFile
    };
  }
});
</script>


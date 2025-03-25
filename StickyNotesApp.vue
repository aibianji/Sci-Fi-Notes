<template>
  <!-- 添加到现有模板中 -->
  <div class="relative">
    <button 
      @click="showEffectsSettings = !showEffectsSettings" 
      class="bg-blue-900 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded border border-blue-600 text-sm flex items-center"
    >
      <span class="mr-1">✨</span> 效果
    </button>
    <EffectsSettings 
      v-if="showEffectsSettings" 
      @close="showEffectsSettings = false"
      @update:config="updateEffectsConfig"
      class="absolute top-full right-0 mt-2 z-30"
    />
  </div>
  
  <div class="relative">
    <button 
      @click="showVoiceSettings = !showVoiceSettings" 
      class="bg-blue-900 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded border border-blue-600 text-sm flex items-center"
    >
      <span class="mr-1">🎤</span> 语音
    </button>
    <VoiceCommandSettings 
      v-if="showVoiceSettings" 
      @close="showVoiceSettings = false"
      @update:config="updateVoiceConfig"
      class="absolute top-full right-0 mt-2 z-30"
    />
  </div>
  
  <div class="relative">
    <button 
      @click="showAISettings = !showAISettings" 
      class="bg-blue-900 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded border border-blue-600 text-sm flex items-center"
    >
      <span class="mr-1">🤖</span> AI
    </button>
    <AISettings 
      v-if="showAISettings" 
      @close="showAISettings = false"
      @update:config="updateAIConfig"
      @use-content="useGeneratedContent"
      class="absolute top-full right-0 mt-2 z-30"
    />
  </div>
  
  <div class="relative">
    <button 
      @click="showMarkdownSettings = !showMarkdownSettings" 
      class="bg-blue-900 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded border border-blue-600 text-sm flex items-center"
    >
      <span class="mr-1">📝</span> Markdown
    </button>
    <MarkdownSettings 
      v-if="showMarkdownSettings" 
      @close="showMarkdownSettings = false"
      @update:config="updateMarkdownConfig"
      @insert-markdown="insertMarkdown"
      class="absolute top-full right-0 mt-2 z-30"
    />
  </div>
  
  <div class="relative">
    <button 
      @click="showSyncSettings = !showSyncSettings" 
      class="bg-blue-900 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded border border-blue-600 text-sm flex items-center"
    >
      <span class="mr-1">🔄</span> 同步
    </button>
    <SyncSettings 
      v-if="showSyncSettings" 
      @close="showSyncSettings = false"
      @update:config="updateSyncConfig"
      @sync="syncData"
      class="absolute top-full right-0 mt-2 z-30"
    />
  </div>
  
  <div class="relative">
    <button 
      @click="showAdvancedSearch = !showAdvancedSearch" 
      class="bg-blue-900 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded border border-blue-600 text-sm flex items-center"
    >
      <span class="mr-1">🔍</span> 高级搜索
    </button>
    <AdvancedSearch 
      v-if="showAdvancedSearch" 
      :notes="notes"
      :categories="categories"
      @close="showAdvancedSearch = false"
      @select-note="selectNote"
      class="absolute top-full right-0 mt-2 z-30"
    />
  </div>
</template>


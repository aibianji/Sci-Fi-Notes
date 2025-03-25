<template>
  <div class="category-manager bg-gray-800 border border-blue-700 rounded-md p-4 w-64">
    <h3 class="text-blue-300 text-sm mb-3 border-b border-blue-900 pb-1">
      <span class="text-cyan-400">⊞</span> CATEGORIES
    </h3>
    
    <div class="mb-3">
      <div class="flex items-center mb-2">
        <input 
          v-model="newCategory" 
          type="text" 
          placeholder="New category..."
          class="flex-1 bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs focus:outline-none focus:border-blue-500"
          @keydown.enter="addCategory"
        />
        <button 
          @click="addCategory" 
          class="ml-2 bg-blue-900 hover:bg-blue-800 text-blue-200 px-2 py-1 rounded border border-blue-600 text-xs"
        >
          +
        </button>
      </div>
      
      <div class="max-h-40 overflow-y-auto">
        <div 
          v-for="category in categories" 
          :key="category.id"
          class="flex items-center justify-between mb-1 p-1 rounded hover:bg-gray-700"
        >
          <div class="flex items-center">
            <span 
              class="w-3 h-3 rounded-full mr-2"
              :style="{ backgroundColor: category.color }"
            ></span>
            <span class="text-xs">{{ category.name }}</span>
          </div>
          <div class="flex items-center">
            <button 
              @click="editCategory(category)" 
              class="text-xs text-blue-400 hover:text-blue-300 mr-1"
            >
              ✎
            </button>
            <button 
              @click="deleteCategory(category.id)" 
              class="text-xs text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="editingCategory" class="mt-3 border-t border-blue-900 pt-2">
      <h4 class="text-xs text-blue-400 mb-2">EDIT CATEGORY</h4>
      <input 
        v-model="editingCategory.name" 
        type="text" 
        class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs mb-2 focus:outline-none focus:border-blue-500"
      />
      
      <div class="flex space-x-2 mb-2">
        <button 
          v-for="color in categoryColors" 
          :key="color"
          @click="editingCategory.color = color"
          class="w-5 h-5 rounded-full border border-blue-700"
          :style="{ backgroundColor: color }"
          :class="{ 'ring-1 ring-cyan-400': editingCategory.color === color }"
        ></button>
      </div>
      
      <div class="flex space-x-2">
        <button 
          @click="saveCategory" 
          class="flex-1 bg-blue-900 hover:bg-blue-800 text-blue-200 px-2 py-1 rounded border border-blue-600 text-xs"
        >
          SAVE
        </button>
        <button 
          @click="cancelEdit" 
          class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded border border-gray-600 text-xs"
        >
          CANCEL
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

interface Category {
  id: string;
  name: string;
  color: string;
}

export default defineComponent({
  name: 'CategoryManager',
  props: {
    modelValue: {
      type: Array as () => Category[],
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const categories = ref<Category[]>(props.modelValue);
    const newCategory = ref('');
    const editingCategory = ref<Category | null>(null);
    
    const categoryColors = [
      '#3a506b', // blue
      '#5e60ce', // purple
      '#00b4d8', // cyan
      '#2a9d8f', // teal
      '#e76f51', // orange
      '#e63946', // red
      '#ffbe0b', // yellow
      '#588157'  // green
    ];
    
    const addCategory = () => {
      if (newCategory.value.trim()) {
        const category: Category = {
          id: Date.now().toString(),
          name: newCategory.value.trim(),
          color: categoryColors[Math.floor(Math.random() * categoryColors.length)]
        };
        
        categories.value.push(category);
        emit('update:modelValue', categories.value);
        newCategory.value = '';
      }
    };
    
    const deleteCategory = (id: string) => {
      categories.value = categories.value.filter(c => c.id !== id);
      emit('update:modelValue', categories.value);
    };
    
    const editCategory = (category: Category) => {
      editingCategory.value = { ...category };
    };
    
    const saveCategory = () => {
      if (editingCategory.value) {
        const index = categories.value.findIndex(c => c.id === editingCategory.value?.id);
        if (index !== -1) {
          categories.value[index] = { ...editingCategory.value };
          emit('update:modelValue', categories.value);
        }
        editingCategory.value = null;
      }
    };
    
    const cancelEdit = () => {
      editingCategory.value = null;
    };
    
    return {
      categories,
      newCategory,
      editingCategory,
      categoryColors,
      addCategory,
      deleteCategory,
      editCategory,
      saveCategory,
      cancelEdit
    };
  }
});
</script>


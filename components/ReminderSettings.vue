<template>
  <div class="reminder-settings bg-gray-800 border border-blue-700 rounded-md p-4 w-64">
    <h3 class="text-blue-300 text-sm mb-3 border-b border-blue-900 pb-1">
      <span class="text-cyan-400">⏰</span> 提醒设置
    </h3>
    
    <div v-if="reminders.length === 0" class="text-center text-xs text-blue-400 my-2">
      没有设置提醒
    </div>
    
    <div v-else class="mb-3 max-h-40 overflow-y-auto">
      <div 
        v-for="reminder in reminders" 
        :key="reminder.id"
        class="flex items-center justify-between mb-2 p-1 rounded hover:bg-gray-700"
      >
        <div class="flex items-center">
          <input 
            type="checkbox" 
            :checked="reminder.isActive"
            @change="toggleReminder(reminder.id)"
            class="mr-2 accent-blue-500"
          />
          <div class="text-xs">
            <div>{{ formatTime(reminder.time) }}</div>
            <div class="text-blue-400">{{ reminder.title }}</div>
          </div>
        </div>
        <button 
          @click="deleteReminder(reminder.id)" 
          class="text-xs text-red-400 hover:text-red-300"
        >
          ×
        </button>
      </div>
    </div>
    
    <div class="border-t border-blue-900 pt-3">
      <h4 class="text-xs text-blue-400 mb-2">添加提醒</h4>
      
      <div class="mb-2">
        <input 
          v-model="newReminder.title" 
          type="text" 
          placeholder="提醒标题..."
          class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs mb-2 focus:outline-none focus:border-blue-500"
        />
      </div>
      
      <div class="mb-2">
        <input 
          v-model="newReminder.date" 
          type="date" 
          class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs mb-2 focus:outline-none focus:border-blue-500"
        />
      </div>
      
      <div class="mb-3">
        <input 
          v-model="newReminder.time" 
          type="time" 
          class="w-full bg-gray-900 text-blue-100 border border-blue-800 rounded p-1 text-xs mb-2 focus:outline-none focus:border-blue-500"
        />
      </div>
      
      <button 
        @click="addReminder" 
        class="w-full bg-blue-900 hover:bg-blue-800 text-blue-200 px-3 py-1 rounded border border-blue-600 text-xs"
        :disabled="!isValidReminder"
      >
        添加提醒
      </button>
    </div>
    
    <button 
      @click="$emit('close')"
      class="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded border border-gray-600 text-xs mt-3"
    >
      关闭
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { Reminder } from '../services/reminder-service';

export default defineComponent({
  name: 'ReminderSettings',
  props: {
    noteId: {
      type: String,
      required: true
    },
    modelValue: {
      type: Array as () => Reminder[],
      default: () => []
    }
  },
  emits: ['update:modelValue', 'close'],
  setup(props, { emit }) {
    const reminders = ref<Reminder[]>(props.modelValue);
    
    // New reminder form
    const newReminder = ref({
      title: '',
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5)
    });
    
    // Validate new reminder
    const isValidReminder = computed(() => {
      return newReminder.value.title.trim() !== '' && 
             newReminder.value.date !== '' && 
             newReminder.value.time !== '';
    });
    
    // Add a new reminder
    const addReminder = () => {
      if (!isValidReminder.value) return;
      
      const reminderTime = new Date(`${newReminder.value.date}T${newReminder.value.time}`);
      
      const reminder: Reminder = {
        id: Date.now().toString(),
        noteId: props.noteId,
        title: newReminder.value.title.trim(),
        time: reminderTime,
        isActive: true
      };
      
      reminders.value.push(reminder);
      emit('update:modelValue', reminders.value);
      
      // Reset form
      newReminder.value = {
        title: '',
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5)
      };
    };
    
    // Toggle reminder active state
    const toggleReminder = (id: string) => {
      const index = reminders.value.findIndex(r => r.id === id);
      if (index !== -1) {
        reminders.value[index].isActive = !reminders.value[index].isActive;
        emit('update:modelValue', reminders.value);
      }
    };
    
    // Delete a reminder
    const deleteReminder = (id: string) => {
      reminders.value = reminders.value.filter(r => r.id !== id);
      emit('update:modelValue', reminders.value);
    };
    
    // Format reminder time for display
    const formatTime = (date: Date): string => {
      const d = new Date(date);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };
    
    return {
      reminders,
      newReminder,
      isValidReminder,
      addReminder,
      toggleReminder,
      deleteReminder,
      formatTime
    };
  }
});
</script>


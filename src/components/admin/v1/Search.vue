<template>
  <div class="search-container">
    <va-input
      v-model="searchQuery"
      label="Busca"
      placeholder="Digite o nome"
      class="search-input"
      @keydown.enter="emitSearch"
    />
    <va-button 
      @click="emitSearch"
      style="margin-top: 18px; margin-left: 10px;" 
    >
      Buscar
    </va-button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['search']);
const searchQuery = ref('');

function emitSearch() {
  emit('search', searchQuery.value);
}
</script>
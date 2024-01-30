<template>
  <div style="margin-left: 20px; margin-right: 20px;">
    <VaDataTable class="table-crud" :items="items" :columns="columns" striped>
      <template #cell(actions)="{ rowIndex }">
        <VaButton preset="plain" icon="edit" @click="openModalToEditItemById(rowIndex)" />
        <VaButton preset="plain" icon="delete" class="ml-3" @click="deleteItemById(rowIndex)" />
      </template>
    </VaDataTable>

    <VaModal
      class="modal-crud"
      :model-value="!!editedItem"
      title="Editar"
      size="small"
      @ok="editItem"
      @cancel="resetEditedItem"
    >
      <VaInput v-model="editedItem.name" class="my-6" label="Name" />
      <VaInput v-model="editedItem.email" class="my-6" label="Email" />
    </VaModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/'
});

const items = ref([]);
const columns = ref([
  { key: "id", sortable: true },
  { key: "name", sortable: true },
  { key: "email", sortable: true },
  { key: "actions", width: 80 },
]);

const editedItemId = ref(null);
const editedItem = ref(null);

const resetEditedItem = () => {
  editedItem.value = null;
  editedItemId.value = null;
};

const fetchData = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.get('/admin/v1/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    items.value = response.data.users;
  } catch (error) {
    console.error('Erro ao obter lista de usuários', error);
  }
};

const deleteItemById = async (id) => {
  try {
    const token = localStorage.getItem('token');
    await api.delete(`/admin/v1/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    items.value = items.value.filter(item => item.id !== id);
  } catch (error) {
    console.error('Erro ao excluir usuário', error);
    items.value = items.value.filter(item => item.id !== id);
  }
};

const editItem = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.patch(`/admin/v1/users/${editedItemId.value}`, editedItem.value, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 200) {
      const updatedUser = response.data;
      items.value = items.value.map(item => (item.id === editedItemId.value ? updatedUser : item));
      resetEditedItem();
    }
  } catch (error) {
    console.error('Erro ao editar usuário', error);
  }
};

const openModalToEditItemById = (id) => {
  editedItemId.value = id;
  editedItem.value = { ...items.value.find(item => item.id === id) };
};

onMounted(() => {
  fetchData();
});
</script>

<style lang="scss" scoped>
.table-crud {
  --va-form-element-default-width: 0;

  .va-input {
    display: block;
  }

  &__slot {
    th {
      vertical-align: middle;
    }
  }
}

.modal-crud {
  .va-input {
    display: block;
  }
}
</style>

<template>
  <div style="margin-left: 20px; margin-right: 20px;">
    <VaDataTable
      class="table-crud" 
      :items="users" 
      :columns="columns" 
      striped
    >
      <template #cell(actions)="{ row }">
          <VaButton 
            v-if="row"
            preset="plain" 
            icon="edit" 
            @click="openModalToEditUser(row)" 
          />
          <VaButton 
            preset="plain"
            icon="delete"
            @click="() => deleteUser(row)"
          />
      </template>
    </VaDataTable>

    <VaModal
      class="modal-crud"
      :model-value="!!editedUser"
      title="Editar"
      size="small"
      @ok="editUser"
      @cancel="resetEditedUser"
    >
      <VaInput 
        v-model="editedUser.name" 
        class="my-6" 
        label="Nome" 
      />
      <VaInput 
        v-model="editedUser.login" 
        class="my-6" 
        label="Email" 
      />
    </VaModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/'
});

const users = ref([]);
const columns = ref([
  { key: "id", sortable: true },
  { key: "name", sortable: true },
  { key: "login", sortable: true },
  { key: "actions", width: 80 },
]);

const editedUserId = ref(null);
const editedUser = ref(null);

const resetEditedUser = () => {
  editedUser.value = null;
  editedUserId.value = null;
};

const fetchData = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.get('/admin/v1/users', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const sortedUsers = response.data.users.sort((a, b) => a.id - b.id);
    users.value = sortedUsers;

    users.value = response.data.users;
  } catch (error) {
    console.error('Erro ao obter lista de usuários', error);
  }
};

const deleteUser = async (row) => {
  try {    
    const token = localStorage.getItem('token');
    await api.delete(`/admin/v1/users/${row.itemKey.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    users.value = users.value.filter(u => u.id !== row.itemKey.id);   
  } catch (error) {
    console.error('Erro ao excluir usuário', error);
  }
};

const editUser = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.patch(`/admin/v1/users/${editedUserId.value}`, editedUser.value, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 200) {
      const updatedUser = response.data.user;
      users.value = users.value.map(user => (user.id === updatedUser.id ? updatedUser : user));
      resetEditedUser();
    } else {
      console.error('Erro ao editar usuário:', response.status, response.data);
    }
  } catch (error) {
    console.error('Erro ao editar usuário', error);
  }
};

const openModalToEditUser = (row) => {
  console.log('Objeto recebido em openModalToEditUser:', row); 
  if (row && row.itemKey && row.itemKey.id) {
    editedUserId.value = row.itemKey.id;
    editedUser.value = { ...row.itemKey };
  } else {
    console.error('Objeto ou ID indefinido:', row);
  }
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

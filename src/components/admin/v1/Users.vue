<template>
  <div style="margin-left: 20px; margin-right: 20px;">

    <h1 style="color: #B50025; margin-top: 20px;">
      <strong>Adicionar novo usuário:</strong>
    </h1>
    <div style="margin-top: 20px;">
      <VaModal
        class="modal-crud"
        :model-value="!!editedUser"
        title="Adicionar novo Usuário"
        size="small"
        @ok="createUser"
        @cancel="resetEditedUser"
      />

      <va-input 
        v-model="newUser.name" 
        label="Nome" 
        placeholder="Digite o usuário"
        class="my-6" 
      />

      <va-input 
        v-model="newUser.login"
        label="Email" 
        placeholder="Digite o email"
        class="ml-2 mr-2"
      />

      <va-input 
        v-model="newUser.password"
        label="Senha" 
        placeholder="Digite a senha"
        type="password"
        class="ml-2 mr-2"
      />

      <va-button style="margin-top: 18px;" @click="createUser">
        Adicionar
      </va-button>
    </div>

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
      <VaInput 
        v-model="editedUser.password" 
        class="my-6" 
        label="Password" 
        type="password"
      />
    </VaModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
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

const newUser = reactive({
  name: '',
  login: '',
  password: ''
});

const editedUserId = ref(null);
const editedUser = ref(null);

const resetEditedUser = () => {
  newUser.name = '';
  newUser.login = '';
  newUser.password = '';
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

const createUser = async () => {
  if (!newUser.name || !newUser.login || !newUser.password) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  try {
    const token = localStorage.getItem('token');    
    const response = await api.post('/admin/v1/users', {
      user: { 
        name: newUser.name, 
        login: newUser.login,
        password: newUser.password
      }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 200) {      
      users.value = [...users.value, response.data.user];       
      resetEditedUser();
    }
  } catch (error) {
    console.error('Erro ao criar usuário', error.response || error);
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

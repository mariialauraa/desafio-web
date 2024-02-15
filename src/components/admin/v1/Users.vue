<template>
  <div style="margin-left: 20px; margin-right: 20px;">

    <div v-if="$store.alert.message" :class="['alert', $store.alert.type]">
      {{ $store.alert.message }}
    </div>

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
        placeholder="Digite o nome"
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
      />

      <va-button 
        class="ml-2" 
        style="margin-top: 18px;" 
        @click="createUser"
      >
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
            @click="() => promptDeleteUser(row)"
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

    <VaModal
      ref="deleteConfirmationModal"
      @ok="confirmDeletion"
      ok-text="Deletar"
      cancel-text="Cancelar"
      stateful
      class="va-modal-md"
    >
      <h3 class="va-h3">Confirmação</h3>
      <p>Tem certeza que deseja deletar este usuário?</p>
    </VaModal>

    <div class="mt-4">
      <VaPagination
        v-model="currentPage"
        :pages="totalPages"
        :visible-pages="3"
        size="medium"
        @input="changePage($event)"
        class="my-pagination justify-center"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import axios from 'axios';
import { useAlertStore } from '@/stores/alertStore';
import { VaPagination } from 'vuestic-ui';

const api = axios.create({
  baseURL: 'http://localhost:3000/'
});

const $store = useAlertStore();

const usersPerPage = 10; 
const currentPage = ref(1);
const totalPages = ref(0);

const users = ref([]);
const columns = ref([
  { key: "id", label: "id", sortable: true },
  { key: "name", label: "nome", sortable: true },
  { key: "login", label: "email", sortable: true },
  { key: "actions", label: "ações", width: 80 },
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

const deleteConfirmationModal = ref(null);
const userToDelete = ref(null);

const promptDeleteUser = (row) => {
  userToDelete.value = row;
  deleteConfirmationModal.value.show();
};

const fetchData = async (page = 1) => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.get(`/admin/v1/users?page=${page}&limit=${usersPerPage}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    users.value = response.data.users;
    if (response.data.meta) {
      totalPages.value = response.data.meta.total_pages;
    } else {
      console.error('Dados de paginação não encontrados na resposta da API');
    }
  } catch (error) {
    console.error('Erro ao obter lista de usuários', error);
  }
};

const createUser = async () => {
  if (!newUser.name || !newUser.login || !newUser.password) {
    $store.setAlert('Por favor, preencha todos os campos.', 'error');
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
      resetEditedUser();
      fetchData(currentPage.value); 
      $store.setAlert('Usuário criado com sucesso.', 'success');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Erro desconhecido ao criar a conta.';
    if (errorMessage.includes('Login já está em uso')) {
      $store.setAlert('Usuário duplicado. O usuário já existe.', 'error');
    } else {
      $store.setAlert(errorMessage, 'error');
    }   
  }
};

const confirmDeletion = async () => {
  const loggedInUser = JSON.parse(localStorage.getItem('user'));

  if (userToDelete.value) {
    if (userToDelete.value.itemKey.id === loggedInUser.id) {
      $store.setAlert('Não é possível deletar sua própria conta.', 'error');
      return; 
    }

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/admin/v1/users/${userToDelete.value.itemKey.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      users.value = users.value.filter(u => u.id !== userToDelete.value.itemKey.id);
      userToDelete.value = null; 
      $store.setAlert('Usuário deletado com sucesso', 'success');
    } catch (error) {
      $store.setAlert('Erro ao excluir usuário', 'error');
    }
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
      $store.setAlert('Usuário editado com sucesso', 'success');
    }
  } catch (error) {
    $store.setAlert('Erro ao editar usuário', 'error');
  }
};

const openModalToEditUser = (row) => {
  if (row && row.itemKey && row.itemKey.id) {
    editedUserId.value = row.itemKey.id;
    editedUser.value = { ...row.itemKey };
  } else {
    console.error('Objeto ou ID indefinido:', row);
  }
};

onMounted(() => {
  fetchData(currentPage.value);
});

const changePage = (newPage) => {
  currentPage.value = newPage;
  fetchData(newPage);
};

watch(currentPage, (newVal) => {
  fetchData(newVal);
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
.alert {
  position: absolute; 
  right: 5px;
  z-index: auto; 
  background-color: red; 
  color: white;
  text-align: center;
  font-weight: bold;
  padding: 10px;
  border-radius: 5px;
  margin: 20px; 
  width: 25%; 
}

.alert.success {
  background-color: #4CAF50; 
}

.alert.error {
  background-color: #f44336; 
}
</style>
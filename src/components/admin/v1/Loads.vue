<template>
  <div class="container">

    <div v-if="$store.alert.message" :class="['alert', $store.alert.type]">
      {{ $store.alert.message }}
    </div>

    <h1 style="color: #B50025;">
      <strong>Adicionar nova Carga:</strong>
    </h1>

    <div class="menu-add">
      <VaModal
        class="modal-crud"
        :model-value="!!editedLoad"
        title="Adicionar nova Carga"
        size="small"
        @ok="createLoad"
        @cancel="resetEditedLoad"
      />

      <va-input 
        v-model="newLoad.code" 
        label="Código" 
        placeholder="Digite o código"
        class="my-6" 
      />

      <VaDateInput 
        v-model="newLoad.delivery_date"
        label="Data" 
        placeholder="Selecione a data"
        class="ml-2 mr-2"
      />

      <va-button 
        style="margin-top: 18px;" 
        @click="createLoad"
      >        
        Adicionar
      </va-button>
    </div>

    <VaDataTable
      class="table-crud" 
      :items="loads" 
      :columns="columns" 
      striped
    >
      <template #cell(actions)="{ row }">
          <VaButton 
            v-if="row"
            preset="plain" 
            icon="edit" 
            @click="openModalToEditLoad(row)" 
          />
          <VaButton 
            preset="plain"
            icon="delete"
            @click="() => promptDeleteLoad(row)"
          />
      </template>

      <template #cell(orders)="{ row }">
        <VaButton
          preset="plain"
          icon="list"
          @click="viewOrders(row)"
        />
      </template>
    </VaDataTable>

    <VaModal
      class="modal-crud"
      :model-value="!!editedLoad"
      title="Editar"
      size="small"
      @ok="editLoad"
      @cancel="resetEditedLoad"
    >
      <VaInput 
        v-model="editedLoad.code" 
        class="my-6" 
        label="Código" 
      />
      <input
        v-model="editedLoad.delivery_date"
        type="date"
        class="date-field my-6"
      />
    </VaModal>

    <VaModal
      ref="deleteConfirmationModal"
      @ok="confirmDeletion"
      ok-text="Deletar"
      cancel-text="Cancelar"
      size="small"
      stateful
    >
      <h3 class="va-h3">Confirmação</h3>
      <p>Tem certeza que deseja deletar esta carga?</p>
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
import { useRouter } from 'vue-router';

const api = axios.create({
  baseURL: 'http://localhost:3000/'
});

const $store = useAlertStore();

const router = useRouter();

const loadsPerPage = 10; 
const currentPage = ref(1);
const totalPages = ref(0);

const loads = ref([]);
const columns = ref([
{ key: "id", label: "id", sortable: true },
  { key: "code", label: "código", sortable: true },
  { key: "delivery_date", label: "data de entrega", sortable: true },
  { key: "actions", label: "ações", width: 80 },
  { key: "orders", label: "listas", width: 80 },
]);

const newLoad = reactive({
  code: '',
  delivery_date: null
});

const editedLoadId = ref(null);
const editedLoad = ref(null);

const resetEditedLoad = () => {
  newLoad.code = '';
  newLoad.delivery_date = null;
  editedLoad.value = null;
  editedLoadId.value = null;
};

const deleteConfirmationModal = ref(null);
const loadToDelete = ref(null);

const promptDeleteLoad = (row) => {
  loadToDelete.value = row; 
  deleteConfirmationModal.value.show(); 
};

const formatDate = (dateString) => {
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
};

const fetchData = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.get(`/admin/v1/loads?page=${currentPage.value}&limit=${loadsPerPage}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const formattedLoads = response.data.loads.map(load => ({
      ...load,
      delivery_date: formatDate(load.delivery_date),

    }));
    loads.value = formattedLoads;
    if (response.data.meta) {
      totalPages.value = response.data.meta.total_pages;
    } else {
      console.error('Dados de paginação não encontrados na resposta da API');
    }
  } catch (error) {
    console.error('Erro ao obter lista de cargas', error);
  }
};

const createLoad = async () => {
  if (!newLoad.code || !newLoad.delivery_date) {
    $store.setAlert('Por favor, preencha todos os campos.', 'error');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await api.post('/admin/v1/loads', {
      code: newLoad.code, 
      delivery_date: newLoad.delivery_date 
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 200) {
      resetEditedLoad();
      fetchData(currentPage.value);
      $store.setAlert('Carga criada com sucesso.', 'success');
    }
  } catch (error) {
    if (error.response && error.response.status === 422) {
      const errors = error.response.data.errors.fields;

      if (errors.code && errors.code.includes('já está em uso')) {
        $store.setAlert('Carga duplicada. O código já existe.', 'error');
        return;
      }

      if (errors.delivery_date && errors.delivery_date.includes('deve ser uma data futura')) {
        $store.setAlert('A data de entrega deve ser uma data futura.', 'error');
        return;
      }
    }
    $store.setAlert('Erro ao criar carga', 'error');
  }
};

const confirmDeletion = async () => {
  if (loadToDelete.value) {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/admin/v1/loads/${loadToDelete.value.itemKey.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loads.value = loads.value.filter(u => u.id !== loadToDelete.value.itemKey.id);
      loadToDelete.value = null; 
      $store.setAlert('Carga deletada com sucesso', 'success');
    } catch (error) {
      $store.setAlert('Erro ao excluir carga', 'error');
    }
  }
};

const editLoad = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.patch(`/admin/v1/loads/${editedLoadId.value}`, {
      ...editedLoad.value,
      delivery_date: formatDate(editedLoad.value.delivery_date) 
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 200) {
      const updatedLoad = {
        ...response.data.load,
        delivery_date: formatDate(response.data.load.delivery_date) 
      };
      loads.value = loads.value.map(load => (load.id === updatedLoad.id ? updatedLoad : load));
      resetEditedLoad();
      $store.setAlert('Carga editada com sucesso', 'success');
    } 
  } catch (error) {
    if (error.response && error.response.status === 422) {
      const errors = error.response.data.errors.fields;

      if (errors.code && errors.code.includes('já está em uso')) {
        $store.setAlert('Carga duplicada. O código já existe.', 'error');
        return;
      }

      if (errors.delivery_date && errors.delivery_date.includes('deve ser uma data futura')) {
        $store.setAlert('A data de entrega deve ser uma data futura.', 'error');
        return;
      }
    }
    $store.setAlert('Erro ao editar carga', 'error');
  }
};

const openModalToEditLoad = (row) => {
  if (row && row.itemKey && row.itemKey.id) {
    editedLoadId.value = row.itemKey.id;
    editedLoad.value = { ...row.itemKey };
  } else {
    console.error('Objeto ou ID indefinido:', row);
  }
};

const viewOrders = (row) => {
  if (row && row.itemKey && row.itemKey.id) {
    const loadId = row.itemKey.id;
    router.push({ name: 'orders', query: { load_id: loadId } });
  } else {
    console.error('ID de carga não encontrado:', row);
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

.container {
  max-height: 100vh; 
  margin-top: 20px;
  margin-left: 20px;
  margin-right: 20px;
}

.menu-add {
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  margin-bottom: 20px;
}

.date-field {
  width: 100%;
  padding: 9px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px; 
  margin-top: 1rem;
}

.date-field:hover {
  border-color: #B71C1C; 
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

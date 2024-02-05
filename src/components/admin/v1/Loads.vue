<template>
  <div style="margin-left: 20px; margin-right: 20px; margin-top: 20px;">

    <div v-if="$store.alert.message" :class="['alert', $store.alert.type]">
      {{ $store.alert.message }}
    </div>

    <h1 style="color: #B50025;">
      <strong>Adicionar nova carga:</strong>
    </h1>
    <div style="margin-top: 20px;">
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
      <VaDateInput  
        v-model="editedLoad.delivery_date" 
        class="my-6" 
        label="Data" 
      />
    </VaModal>

    <VaModal
      ref="deleteConfirmationModal"
      @ok="confirmDeletion"
      ok-text="Deletar"
      cancel-text="Cancelar"
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

const api = axios.create({
  baseURL: 'http://localhost:3000/'
});

const $store = useAlertStore();

const loadsPerPage = 10; 
const currentPage = ref(1);
const totalPages = ref(0);

const loads = ref([]);
const columns = ref([
{ key: "id", label: "id", sortable: true },
  { key: "code", label: "código", sortable: true },
  { key: "delivery_date", label: "data de entrega", sortable: true },
  { key: "actions", label: "ações", width: 80 },
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

const fetchData = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.get(`/admin/v1/loads?page=${currentPage.value}&limit=${loadsPerPage}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const sortedLoads = response.data.loads.sort((a, b) => a.id - b.id);
    loads.value = sortedLoads;
    if (response.data.meta) {
      totalPages.value = response.data.meta.total_pages;
    } else {
      console.error('Dados de paginação não encontrados na resposta da API');
    }
  } catch (error) {
    console.error('Erro ao obter lista de cargas', error);
  }
};

const changePage = (newPage) => {
  currentPage.value = newPage;
  fetchData(newPage);
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
    const response = await api.patch(`/admin/v1/loads/${editedLoadId.value}`, editedLoad.value, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 200) {
      const updatedLoad = response.data.load;
      loads.value = loads.value.map(load => (load.id === updatedLoad.id ? updatedLoad : load));
      resetEditedLoad();
      $store.setAlert('Carga editada com sucesso', 'success');
    } 
  } catch (error) {
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

onMounted(() => {
  fetchData(currentPage.value);
});

watch(currentPage, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    fetchData(newVal);
  }
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

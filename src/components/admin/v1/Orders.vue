<template>
  <div class="container">

    <div v-if="$store.alert.message" :class="['alert', $store.alert.type]">
      {{ $store.alert.message }}
    </div>

    <h1 style="color: #B50025;">
      <strong>Criar nova Lista para Carga {{ loadCode }}:</strong>
    </h1>
    <div class="menu-add">
      <VaModal
        class="modal-crud"
        :model-value="!!editedOrder"
        title="Adicionar nova Lista"
        size="small"
        @ok="createOrder"
        @cancel="resetEditedOrder"
      />

      <va-input 
        v-model="newOrder.code" 
        label="Código" 
        placeholder="Digite o código"
        class="my-6" 
      />

      <va-input 
        v-model="newOrder.bay"
        label="Baia" 
        placeholder="Digite a baia"
        class="ml-2 mr-2"
      />

      <va-button 
        style="margin-top: 18px;" 
        @click="createOrder"
      >
        Adicionar
      </va-button>
    </div>

    <VaDataTable
      class="table-crud" 
      :items="orders" 
      :columns="columns" 
      striped
    >
      <template #cell(actions)="{ row }">
          <VaButton 
            v-if="row"
            preset="plain" 
            icon="edit" 
            @click="openModalToEditOrder(row)" 
          />
          <VaButton 
            preset="plain"
            icon="delete"
            @click="() => promptDeleteOrder(row)"
          />
      </template>

      <template #cell(order_products)="{ row }">
        <div class="center-cell">
          <VaButton
            preset="plain"
            icon="list"
            @click="viewOrderProducts(row)"
          />
        </div>
      </template>
    </VaDataTable>

    <VaModal
      class="modal-crud"
      :model-value="!!editedOrder"
      title="Editar"
      size="small"
      @ok="editOrder"
      @cancel="resetEditedOrder"
    >
      <VaInput 
        v-model="editedOrder.code" 
        class="my-6" 
        label="Código" 
      />
      <VaInput 
        v-model="editedOrder.bay" 
        class="my-6" 
        label="Baia" 
        style="margin-top: 10px;" 
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
      <p>Tem certeza que deseja excluir esta lista?</p>
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

    <div class="return-button-container">
      <VaButton 
        preset="primary"
        class="mr-6 mb-2 mt-2"
        @click="goBack"
        size="large"
      >
        Voltar
      </VaButton>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useAlertStore } from '@/stores/alertStore';
import { VaPagination } from 'vuestic-ui';
import { useRouter } from 'vue-router';

const api = axios.create({
  baseURL: 'http://localhost:3000/'
});

const $store = useAlertStore();

const router = useRouter();

const goBack = () => {
  router.go(-1); 
};

const route = useRoute();
const loadId = ref(null);
const loadCode = route.query.load_code;

const ordersPerPage = 10; 
const currentPage = ref(1);
const totalPages = ref(0);

const orders = ref([]);
const columns = ref([
  { key: "id", label: "id", sortable: true },
  { key: "code", label: "código da lista", sortable: true },
  { key: "bay", label: "baia", sortable: true },
  { key: "actions", label: "ações", width: 80 },
  { key: "order_products", label: "produtos da lista", width: 80 },
]);

const newOrder = reactive({
  code: '',
  bay: ''
});

const editedOrderId = ref(null);
const editedOrder = ref(null);

const resetEditedOrder = () => {
  newOrder.code = '';
  newOrder.bay = '';
  editedOrder.value = null;
  editedOrderId.value = null;
};

const deleteConfirmationModal = ref(null);
const orderToDelete = ref(null);

const promptDeleteOrder = (row) => {
  orderToDelete.value = row; 
  deleteConfirmationModal.value.show(); 
};

const fetchData = async (loadId) => {
  try {
    const token = localStorage.getItem('token'); 
    const response = await api.get
      (`/admin/v1/orders?page=${currentPage.value}&limit=${ordersPerPage.value}&load_id=${loadId}`, {
      headers: { Authorization: `Bearer ${token}` } 
    });
    orders.value = response.data.orders; 
    if (response.data.meta) {
      totalPages.value = response.data.meta.total_pages; 
    } else {
      console.error('Dados de paginação não encontrados na resposta da API');
    }
  } catch (error) {
    console.error('Erro ao obter listas:', error);
  }
};

const createOrder = async () => {
  if (!newOrder.code || !newOrder.bay || !loadId.value) {
    $store.setAlert('Por favor, preencha todos os campos.', 'error');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await api.post(`/admin/v1/orders?load_id=${loadId.value}`, {
      order: {
        code: newOrder.code, 
        bay: newOrder.bay
      }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 200) {
      resetEditedOrder();
      fetchData(loadId.value);
      $store.setAlert('Lista criada com sucesso.', 'success');
    }
  } catch (error) {
    if (error.response && error.response.status === 422) {
      const errors = error.response.data.errors.fields;
      if (errors.code && errors.code.includes('já está em uso')) {
        $store.setAlert('Lista duplicada. A lista já existe.', 'error');
        return;
      }
    }
    $store.setAlert('Erro ao criar lista', 'error');
  }
};

const confirmDeletion = async () => {
  if (orderToDelete.value) {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/admin/v1/orders/${orderToDelete.value.itemKey.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      orders.value = orders.value.filter(u => u.id !== orderToDelete.value.itemKey.id);
      orderToDelete.value = null; 
      $store.setAlert('Lista excluida com sucesso', 'success');
    } catch (error) {
      $store.setAlert('Erro ao excluir lista', 'error');
    }
  }
};

const editOrder = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.patch(`/admin/v1/orders/${editedOrderId.value}`, editedOrder.value, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 200) {
      const updatedOrder = response.data.order;
      orders.value = orders.value.map(order => (order.id === updatedOrder.id ? updatedOrder : order));
      resetEditedOrder();
      $store.setAlert('Lista editada com sucesso', 'success');
    } 
  } catch (error) {
    $store.setAlert('Erro ao editar lista', 'error');
  }
};

const openModalToEditOrder = (row) => { 
  if (row && row.itemKey && row.itemKey.id) {
    editedOrderId.value = row.itemKey.id;
    editedOrder.value = { ...row.itemKey };
  } else {
    console.error('Objeto ou ID indefinido:', row);
  }
};

const viewOrderProducts = (row) => {
  if (row && row.itemKey && row.itemKey.id) {
    const orderId = row.itemKey.id;
    const orderCode = row.itemKey.code;
    router.push({ name: 'order_products', query: { order_id: orderId, order_code: orderCode } });
  } else {
    console.error('ID da lista não encontrado:', row);
  }
};

onMounted(() => {
  loadId.value = route.query.load_id; 
  if (loadId.value) {
    fetchData(loadId.value); 
  }
});

const changePage = (newPage) => {
  currentPage.value = newPage;
  fetchData(loadId.value);
};

watch(currentPage, (newVal) => {
  fetchData(loadId.value, newVal);
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
  margin-left: 20px;
  margin-right: 20px;
  margin-top: 20px;
}

.menu-add {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  margin-bottom: 20px;
  margin-left: -10px;
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
.va-button {
  color: #B71C1C;
}

.center-cell {
  display: flex;
  justify-content: center; 
  align-items: center; 
  height: 100%; 
}
</style>
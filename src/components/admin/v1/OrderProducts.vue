<template>
  <div class="container">

    <div v-if="$store.alert.message" :class="['alert', $store.alert.type]">
      {{ $store.alert.message }}
    </div>

    <h1 style="color: #B50025;">
      <strong>Adicionar novo produto a lista:</strong>
    </h1>
    <div class="menu-add">
      <VaModal
        class="modal-crud"
        :model-value="!!editedOrderProduct"
        title="Editar"
        size="small"
        @ok="createOrderProduct"
        @cancel="resetEditedOrderProduct"
      />

      <va-input 
        v-model="newOrderProduct.product_id" 
        label="ID do produto" 
        placeholder="Digite id do produto"
        class="my-6" 
      />

      <va-input 
        v-model="newOrderProduct.quantity" 
        label="Quantidade" 
        placeholder="Digite a quantidade"
        class="ml-2 mr-2"
      />

      <VaButtonToggle
        v-model="newOrderProduct.box"
        preset="secondary"
        border-color="primary"
        :options="boxOptions"
        style="margin-top: 18px;" 
      />

      <va-button 
        style="margin-top: 18px;" 
        @click="createOrderProduct"
      >
        Adicionar
      </va-button>
    </div>

    <VaDataTable
      class="table-crud" 
      :items="order_products" 
      :columns="columns" 
      striped
    >
      <template #cell(box)="{ row }">
        <div>{{ formatBox(row.itemKey.box) }}</div>
      </template>

      <template #cell(actions)="{ row }">
          <VaButton 
            v-if="row"
            preset="plain" 
            icon="edit" 
            @click="openModalToEditOrderProduct(row)" 
          />
          <VaButton 
            preset="plain"
            icon="delete"
            @click="() => promptDeleteOrderProduct(row)"
          />
      </template>
    </VaDataTable>

    <VaModal
      class="modal-crud"
      :model-value="!!editedOrderProduct"
      title="Editar"
      size="small"
      @ok="editOrderProduct"
      @cancel="resetEditedOrderProduct"
    >
      <VaInput 
        v-model="editedOrderProduct.product_id" 
        class="my-6" 
        label="ID do produto" 
      />
      <VaInput 
        v-model="editedOrderProduct.quantity" 
        class="my-6" 
        label="Quantidade" 
        style="margin-top: 20px;" 
      />
      <VaButtonToggle
        v-model="editedOrderProduct.box"
        preset="secondary"
        border-color="primary"
        :options="boxOptions"
        style="margin-top: 20px;" 
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
      <p>Tem certeza que deseja excluir este produto da lista?</p>
    </VaModal>

    <div class="return-button-container">
      <VaButton 
        preset="primary"
        class="mr-6 mb-2 mt-4"
        @click="goBack"
      >
        Voltar
      </VaButton>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useAlertStore } from '@/stores/alertStore';
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
const orderId = ref(null);

const order_products = ref([]);
const columns = ref([
  { key: "id", label: "id", sortable: true },
  { key: "product_id", label: "ID do produto", sortable: true },
  { key: "quantity", label: "quantidade", sortable: true },
  { key: "box", label: "caixa", sortable: true },
  { key: "actions", label: "ações", width: 80 },
]);

const newOrderProduct = reactive({
  product_id: '',
  quantity: '',
  box: false
});

const boxOptions = [
  { label: 'caixa', value: true },
  { label: 'und.', value: false },
];

const formatBox = (value) => {
  return value ? 'Sim' : 'Não';
}

const editedOrderProductId = ref(null);
const editedOrderProduct = ref(null);

const resetEditedOrderProduct = () => {
  newOrderProduct.product_id = '';
  newOrderProduct.quantity = '';
  newOrderProduct.box = false;
  editedOrderProduct.value = null;
  editedOrderProductId.value = null;
};

const deleteConfirmationModal = ref(null);
const order_productToDelete = ref(null);

const promptDeleteOrderProduct = (row) => {
  order_productToDelete.value = row; 
  deleteConfirmationModal.value.show(); 
};

const fetchData = async (orderId) => {
  try {
    const token = localStorage.getItem('token'); 
    const response = await api.get(`/admin/v1/order_products?order_id=${orderId}`, {
      headers: { Authorization: `Bearer ${token}` } 
    });
    order_products.value = response.data.order_products; 
  } catch (error) {
    console.error('Erro ao obter produtos da lista:', error);
  }
};

const createOrderProduct = async () => {
  if (!newOrderProduct.product_id || !newOrderProduct.quantity || newOrderProduct.box === undefined || !orderId.value) {
    $store.setAlert('Por favor, preencha todos os campos.', 'error');
    return;
  }
  try {
    const token = localStorage.getItem('token');
    const response = await api.post(`/admin/v1/order_products?order_id=${orderId.value}`, {
      order_product: {
        product_id: newOrderProduct.product_id, 
        quantity: newOrderProduct.quantity, 
        box: newOrderProduct.box
      }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 200) {
      resetEditedOrderProduct();
      fetchData(orderId.value);
      $store.setAlert('Produto criado com sucesso.', 'success');
    }
  } catch (error) {
    if (error.response && error.response.status === 422) {
      const errors = error.response.data.errors.fields;
      if (errors.product_id && errors.product_id.includes('já está em uso')) {
        $store.setAlert('Produto duplicado. O produto já existe.', 'error');
        return;
      }
    }
    $store.setAlert('Erro ao criar produto da lista', 'error');
  }
};

const confirmDeletion = async () => {
  if (order_productToDelete.value) {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/admin/v1/order_products/${order_productToDelete.value.itemKey.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      order_products.value = order_products.value.filter
        (u => u.id !== order_productToDelete.value.itemKey.id);
      order_productToDelete.value = null; 
      $store.setAlert('Produto da lista excluido com sucesso', 'success');
    } catch (error) {
      $store.setAlert('Erro ao excluir produto da lista', 'error');
    }
  }
};

const editOrderProduct = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.patch(`/admin/v1/order_products/${editedOrderProductId.value}`,
      editedOrderProduct.value, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 200) {
      const updatedOrderProduct = response.data.order_product;
      order_products.value = order_products.value.map(order_product => 
        (order_product.id === updatedOrderProduct.id ? updatedOrderProduct : order_product));
      resetEditedOrderProduct();
      $store.setAlert('Produto da lista editado com sucesso', 'success');
    } 
  } catch (error) {
    $store.setAlert('Erro ao editar produto da lista', 'error');
  }
};

const openModalToEditOrderProduct = (row) => { 
  if (row && row.itemKey && row.itemKey.id) {
    editedOrderProductId.value = row.itemKey.id;
    editedOrderProduct.value = { ...row.itemKey };
  } else {
    console.error('Objeto ou ID indefinido:', row);
  }
};

onMounted(() => {
  orderId.value = route.query.order_id; 
  if (orderId.value) {
    fetchData(orderId.value); 
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
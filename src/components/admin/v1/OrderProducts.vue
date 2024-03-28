<template>
  <div class="container">

    <div v-if="$store.alert.message" :class="['alert', $store.alert.type]">
      {{ $store.alert.message }}
    </div>

    <h1 style="color: #B50025;">
      <strong>Adicionar Produto a Lista:</strong>
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

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <va-select
          v-model="newOrderProduct.product_id"
          :options="allProducts"
          label="Produto" 
          placeholder="Selecione um produto"         
          track-by="value"
          text-by="label"
          searchable
        />
      </div>

        <VaCounter
          v-model="newOrderProduct.quantity"
          manual-input
          label="Quantidade"
          :min="1"
          :max="999"
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
      :wrapper-size="460"
      :item-size="46"
      virtual-scroller
      sticky-header
      striped
    >
      <template #cell(quantity)="{ value }">
        <strong>{{ String(value).padStart(2, '0') }}</strong>
      </template>
      
      <template #cell(box)="{ row }">
        <VaCheckbox :readonly="true" v-model="row.itemKey.box"></VaCheckbox>
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

      <div class="flex-row my-6">
        <VaCounter
          v-model="editedOrderProduct.quantity"
          manual-input
          label="Quantidade"
          :min="1"
          :max="999"
          style="margin-top: 20px;" 
        />
        <VaButtonToggle
          v-model="editedOrderProduct.box"
          preset="secondary"
          border-color="primary"
          :options="boxOptions"
          style="margin-top: 38px;" 
        />
      </div>
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
        size="large"
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
const allProducts = ref([]);

const columns = ref([
  { key: "product_id", label: "ID do produto", sortable: false },
  { key: "product_name", label: "Nome do produto", sortable: true },
  { key: "quantity", label: "quantidade", sortable: false },
  { key: "box", label: "caixa", sortable: true },
  { key: "actions", label: "ações", width: 80 },
]);

const newOrderProduct = reactive({
  product_id: '',
  quantity: 1,
  box: false
});

const boxOptions = [
  { label: 'caixa', value: true },
  { label: 'und.', value: false },
];

const editedOrderProductId = ref(null);
const editedOrderProduct = ref(null);

const resetEditedOrderProduct = () => {
  newOrderProduct.product_id = '';
  newOrderProduct.quantity = 1;
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

const fetchAllProducts = async () => {
  try {
    const allProductsTemp = [];
    let page = 1;

    while (true) { 
      const token = localStorage.getItem('token');
      const response = await api.get(`/admin/v1/products?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const products = response.data.products;
      if (products && products.length > 0) {
        allProductsTemp.push(...products.map(product => ({
          label: product.name,
          value: product.id
        })));
        page += 1; 
      } else {
        break; 
      }
    }

    allProducts.value = allProductsTemp; 
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
  }
};

const fetchData = async (orderId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.get(`/admin/v1/order_products?order_id=${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // Mapeia os dados para adicionar ao nível superior
    const orderProductsWithName = response.data.map(order_product => ({
      ...order_product,
      product_id: order_product.product.id,
      product_name: order_product.product.name
    }));
    order_products.value = orderProductsWithName;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      order_products.value = [];
    } else {
      console.error('Erro ao obter produtos da lista:', error);
    }
  }
};

const createOrderProduct = async () => {
  if (!newOrderProduct.product_id || !newOrderProduct.quantity || newOrderProduct.box === undefined || !orderId.value) {
    $store.setAlert('Por favor, preencha todos os campos.', 'error');
    return;
  }
  try {
    const token = localStorage.getItem('token');
    const payload = {
      product_id: newOrderProduct.product_id.value,
      quantity: newOrderProduct.quantity,
      box: newOrderProduct.box
    };
    const response = await api.post(`/admin/v1/order_products?order_id=${orderId.value}`, {
      order_product: payload
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 200) {
      resetEditedOrderProduct();
      fetchData(orderId.value);
      $store.setAlert('Produto adicionado com sucesso.', 'success');
    }
  } catch (error) {
    if (error.response && error.response.status === 422) {
      const errors = error.response.data.errors.fields;
      if (errors.product_id && errors.product_id.includes('já está em uso')) {
        $store.setAlert('Produto duplicado. O produto já existe.', 'error');
        return;
      }
    }
    $store.setAlert('Erro ao criar produto na lista.', 'error');
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
      $store.setAlert('Produto excluido da lista com sucesso.', 'success');
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
      $store.setAlert('Produto da lista editado com sucesso.', 'success');
    } 
  } catch (error) {
    $store.setAlert('Erro ao editar produto da lista.', 'error');
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
  fetchAllProducts();

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

.flex-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
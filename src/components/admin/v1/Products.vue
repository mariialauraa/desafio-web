<template>
  <div class="container">

    <div v-if="$store.alert.message" :class="['alert', $store.alert.type]">
      {{ $store.alert.message }}
    </div>

    <h1 style="color: #B50025;">
      <strong>Adicionar novo Produto:</strong>
    </h1>
    <div class="add-product-section">
      <VaModal
        class="modal-crud"
        :model-value="!!editedProduct"
        title="Adicionar novo Produto"
        size="small"
        @ok="createProduct"
        @cancel="resetEditedProduct"
      />

      <va-input 
        v-model="newProduct.name" 
        label="Nome" 
        placeholder="Digite o produto"
        class="my-6" 
      />

      <va-input 
        v-model="newProduct.ballast"
        label="Lastro" 
        placeholder="Digite o lastro"
        class="ml-2 mr-2"
      />

      <va-button 
        style="margin-top: 18px;" 
        @click="createProduct"
      >
        Adicionar
      </va-button>

      <search @search="onSearch" />
    </div>

    <VaDataTable
      class="table-crud" 
      :items="products" 
      :columns="columns" 
      striped
    >
      <template #cell(actions)="{ row }">
          <VaButton 
            v-if="row"
            preset="plain" 
            icon="edit" 
            @click="openModalToEditProduct(row)" 
          />
          <VaButton 
            preset="plain"
            icon="delete"
            @click="() => promptDeleteProduct(row)"
          />
      </template>
    </VaDataTable>

    <VaModal
      class="modal-crud"
      :model-value="!!editedProduct"
      title="Editar"
      size="small"
      @ok="editProduct"
      @cancel="resetEditedProduct"
    >
      <VaInput 
        v-model="editedProduct.name" 
        class="my-6" 
        label="Nome" 
      />
      <VaInput 
        v-model="editedProduct.ballast" 
        class="my-6" 
        label="Lastro" 
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
      <p>Tem certeza que deseja deletar este produto?</p>
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
import Search from '@/components/admin/v1/Search.vue'
import { useAlertStore } from '@/stores/alertStore';
import { VaPagination } from 'vuestic-ui';

const api = axios.create({
  baseURL: 'http://localhost:3000/'
});

const $store = useAlertStore();

const productsPerPage = 10; 
const currentPage = ref(1);
const totalPages = ref(0);
const searchQuery = ref('');
const products = ref([]);

const onSearch = (query) => {
  searchQuery.value = query; 
  currentPage.value = 1; 
  fetchData(); 
};

const columns = ref([
  { key: "id", label: "id", sortable: true },
  { key: "name", label: "produto", sortable: true },
  { key: "ballast", label: "lastro", sortable: true },
  { key: "actions", label: "ações", width: 80 },
]);

const newProduct = reactive({
  name: '',
  ballast: ''
});

const editedProductId = ref(null);
const editedProduct = ref(null);

const resetEditedProduct = () => {
  newProduct.name = '';
  newProduct.ballast = '';
  editedProduct.value = null;
  editedProductId.value = null;
};

const deleteConfirmationModal = ref(null);
const productToDelete = ref(null);

const promptDeleteProduct = (row) => {
  productToDelete.value = row; 
  deleteConfirmationModal.value.show(); 
};

const fetchData = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.get(
      `/admin/v1/products?page=${currentPage.value}&limit=${productsPerPage}` +
      `${searchQuery.value ? `&search[name]=${encodeURIComponent(searchQuery.value)}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

    products.value = response.data.products;
    if (response.data.meta) {
      totalPages.value = response.data.meta ? response.data.meta.total_pages : 0;
    } else {
      console.error('Dados de paginação não encontrados na resposta da API');
    }
  } catch (error) {
    console.error('Erro ao obter lista de produtos', error);
  }
};

const createProduct = async () => {
  if (!newProduct.name || !newProduct.ballast) {
    $store.setAlert('Por favor, preencha todos os campos.', 'error');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await api.post('/admin/v1/products', {
      name: newProduct.name, 
      ballast: newProduct.ballast 
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 200) {           
      resetEditedProduct();
      fetchData(currentPage.value);
      $store.setAlert('Produto criado com sucesso.', 'success');
    }
  } catch (error) {
    if (error.response && error.response.status === 422) {
      const errors = error.response.data.errors.fields;
      if (errors.name && errors.name.includes('já está em uso')) {
        $store.setAlert('Produto duplicado. O produto já existe.', 'error');
        return;
      }
    }
    $store.setAlert('Erro ao criar produto', 'error');
  }
};

const confirmDeletion = async () => {
  if (productToDelete.value) {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/admin/v1/products/${productToDelete.value.itemKey.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      products.value = products.value.filter(u => u.id !== productToDelete.value.itemKey.id);
      productToDelete.value = null; 
      $store.setAlert('Produto deletado com sucesso', 'success');
    } catch (error) {
      $store.setAlert('Erro ao excluir produto', 'error');
    }
  }
};

let originalProduct = {}; 

const editProduct = async () => {
  try {
    const isProductEdited = Object.keys(editedProduct.value).some(key => {
      return editedProduct.value[key] !== originalProduct[key];
    });    
    if (!isProductEdited) {
      $store.setAlert('Você precisa editar algo antes de salvar.', 'warning');
      return;
    }
    const token = localStorage.getItem('token');
    const response = await api.patch(`/admin/v1/products/${editedProductId.value}`, editedProduct.value, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 200) {
      const updatedProduct = response.data.product;
      products.value = products.value.map(product => (product.id === updatedProduct.id ? updatedProduct : product));
      resetEditedProduct();
      originalProduct = {}; 
      $store.setAlert('Produto editado com sucesso', 'success');
    } 
  } catch (error) {
    $store.setAlert('Erro ao editar produto', 'error');
  }
};

const openModalToEditProduct = (row) => {
  if (row && row.itemKey && row.itemKey.id) {
    editedProductId.value = row.itemKey.id;
    editedProduct.value = { ...row.itemKey };
    originalProduct = { ...row.itemKey }; 
  } else {
    console.error('Objeto ou ID indefinido:', row);
  }
};

onMounted(fetchData);

watch(currentPage, () => {
  fetchData(); 
});

const changePage = (newPage) => {
  currentPage.value = newPage;
  fetchData();
};
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

.add-product-section {
  display: flex;
  align-items: center; 
  justify-content: start; 
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
</style>
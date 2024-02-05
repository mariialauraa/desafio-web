<template>
  <div style="margin-left: 20px; margin-right: 20px; margin-top: 20px;">

    <h1 style="color: #B50025;">
      <strong>Adicionar novo produto:</strong>
    </h1>
    <div style="margin-top: 20px;">
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

      <va-button style="margin-top: 18px;" @click="createProduct">
        Adicionar
      </va-button>
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
      />
    </VaModal>

    <VaModal
      ref="deleteConfirmationModal"
      @ok="confirmDeletion"
      @cancel="cancelDeletion"
      ok-text="Deletar"
      cancel-text="Cancelar"
      stateful
    >
      <h3 class="va-h3">Confirmação</h3>
      <p>Tem certeza que deseja deletar este produto?</p>
    </VaModal>
  </div>

  <div class="mt-4 ml-3">
    <VaButton
      :disabled="currentPage <= 1"
      @click="changePage(currentPage - 1)"
    >
      &lt;
    </VaButton>

    <VaButton
      :disabled="products.lenght < productsPerPage || currentPage >= totalPages"
      @click="changePage(currentPage + 1)"
    >
      &gt;
    </VaButton>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/'
});

const productsPerPage = 10; 
const currentPage = ref(1);
const totalPages = ref(0);

const products = ref([]);
const columns = ref([
  { key: "id", sortable: true },
  { key: "name", sortable: true },
  { key: "ballast", sortable: true },
  { key: "actions", width: 80 },
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
    const response = await api.get(`/admin/v1/products?page=${currentPage.value}&limit=${productsPerPage}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const sortedProducts = response.data.products.sort((a, b) => a.id - b.id);
    products.value = sortedProducts;
    totalPages.value = Math.ceil(response.data.total / productsPerPage); 
  } catch (error) {
    console.error('Erro ao obter lista de produtos', error);
  }
};

const changePage = (newPage) => {
  currentPage.value = newPage;
  fetchData(newPage);
};

const createProduct = async () => {
  if (!newProduct.name || !newProduct.ballast) {
    alert('Por favor, preencha todos os campos.');
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
    }
  } catch (error) {
    console.error('Erro ao criar produto', error.response || error);
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
    } catch (error) {
      console.error('Erro ao excluir produto', error);
    }
  }
};

const editProduct = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.patch(`/admin/v1/products/${editedProductId.value}`, editedProduct.value, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 200) {
      const updatedProduct = response.data.product;
      products.value = products.value.map(product => (product.id === updatedProduct.id ? updatedProduct : product));
      resetEditedProduct();
    } else {
      console.error('Erro ao editar produto:', response.status, response.data);
    }
  } catch (error) {
    console.error('Erro ao editar produto', error);
  }
};

const openModalToEditProduct = (row) => {
  console.log('Objeto recebido em openModalToEditProduct:', row); 
  if (row && row.itemKey && row.itemKey.id) {
    editedProductId.value = row.itemKey.id;
    editedProduct.value = { ...row.itemKey };
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
</style>

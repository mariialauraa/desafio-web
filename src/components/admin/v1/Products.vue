<template>
  <div style="margin-left: 20px; margin-right: 20px;">
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
            @click="() => deleteProduct(row)"
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/'
});

const products = ref([]);
const columns = ref([
  { key: "id", sortable: true },
  { key: "name", sortable: true },
  { key: "ballast", sortable: true },
  { key: "actions", width: 80 },
]);

const editedProductId = ref(null);
const editedProduct = ref(null);

const resetEditedProduct = () => {
  editedProduct.value = null;
  editedProductId.value = null;
};

const fetchData = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.get('/admin/v1/products', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const sortedProducts = response.data.products.sort((a, b) => a.id - b.id);
    products.value = sortedProducts;

    products.value = response.data.products;
  } catch (error) {
    console.error('Erro ao obter lista de produtos', error);
  }
};

const deleteProduct = async (row) => {
  try {    
    const token = localStorage.getItem('token');
    await api.delete(`/admin/v1/products/${row.itemKey.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    products.value = products.value.filter(u => u.id !== row.itemKey.id);   
  } catch (error) {
    console.error('Erro ao excluir produto', error);
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

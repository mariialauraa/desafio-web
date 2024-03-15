<template>
  <VaLayout
    :top="{ fixed: true, order: 2 }" 
    :left="{ fixed: true, absolute: breakpoints.smDown, order: 1, overlay: breakpoints.smDown && isSidebarVisible }" 
    @left-overlay-click="isSidebarVisible = false"
  >
    <template #top>
      <VaNavbar shadowed class="custom-navbar-height">
        <template #left>
          <VaButton 
            preset="secondary" 
            :icon="isSidebarVisible ? 'menu_open' : 'menu'" 
            @click="isSidebarVisible = !isSidebarVisible"
          />
          <VaNavbarItem class="font-bold text-lg ml-2">
            <img src="/logo-easypallet.png" alt="Easy Pallet Logo" width="90" height="50">
          </VaNavbarItem>
        </template>

        <template #right>
          <div class="user-info">
            <VaNavbarItem class="font-bold text-lg user-name">
              <strong>Bem-vindo {{ userName }}!</strong>
            </VaNavbarItem>
            <VaButton 
              @click="logout" 
              size="large" 
              preset="primary" 
              style="margin-left: auto;"
            >
              <VaIcon name="logout"/>
              <span>Sair</span>
            </VaButton>
          </div>  
        </template>        
      </VaNavbar>
    </template>

    <template #left>
      <VaSidebar 
        color="canvaA" 
        v-model="isSidebarVisible" 
        class="custom-sidebar" 
        hoverable 
        minimized-width="64px"
      >
        <VaSidebarItem 
          v-for="(item, index) in menu" 
          :key="index" 
          :active="isActive(item.title)" 
          @click="setActive(item.title)" 
          active-color="canvaB"
        >
          <VaSidebarItemContent>
            <VaIcon :name="item.icon" />
            <VaSidebarItemTitle>
              {{ item.title }}
            </VaSidebarItemTitle>
          </VaSidebarItemContent>
        </VaSidebarItem>
      </VaSidebar>
    </template>

    <template #content>
      <main>
        <div class="page-transition" v-show="page === 1">
          <Dashboard />
        </div>
        <div class="page-transition" v-show="page === 2">
          <Loads />
        </div>
        <div class="page-transition" v-show="page === 3">
          <Products />
        </div>
        <div class="page-transition" v-show="page === 4">
          <Users />
        </div>
      </main>
    </template>
  </VaLayout>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useBreakpoint } from 'vuestic-ui';
import Dashboard from '@/components/Dashboard.vue';
import Products from '@/components/admin/v1/Products.vue';
import Users from '@/components/admin/v1/Users.vue';
import Loads from '@/components/admin/v1/Loads.vue';
import AuthService from '@/services/authService';
import router from '@/router';

const userName = ref('Convidado');
const breakpoints = useBreakpoint();
const isSidebarVisible = ref(breakpoints.smUp);
const page = ref(1);
const activeItem = ref('Home');

// Determina se um item está ativo com base no título do item
function isActive(item) {
  return item === activeItem.value;
}

// Define o item ativo e muda a página com base na ação do item
function setActive(item) {
  activeItem.value = item;
  const menuItem = menu.find(menuItem => menuItem.title === item);
  if (menuItem) {
    menuItem.action();
  }
}

// Atualiza o nome do usuário e a visibilidade da barra lateral
watchEffect(() => {
  const user = JSON.parse(localStorage.getItem('user'));
  userName.value = user ? user.name : 'Convidado';
  isSidebarVisible.value = breakpoints.smUp;
});

const logout = async () => {
  try {
    await AuthService.logout();
    router.push('/login');
  } catch (error) {
    console.error('Erro durante o logout:', error);
  }
};

const menu = [
  { icon: 'home', title: 'Home', action: () => page.value = 1 },
  { icon: 'local_shipping', title: 'Cargas', action: () => page.value = 2 },
  { icon: 'inventory', title: 'Produtos', action: () => page.value = 3 },
  { icon: 'person', title: 'Usuários', action: () => page.value = 4 },
  { icon: 'logout', title: 'Sair', action: logout },
];
</script>

<style>
.user-info {
  display: flex;
  align-items: center;
}

.user-info .user-name {
  color: #B50025;
  margin-right: 10px;
}
.page-transition {
  transition: opacity 0.5s ease;
  opacity: 1;
}
.page-transition.leave-active {
  opacity: 0;
}
</style>
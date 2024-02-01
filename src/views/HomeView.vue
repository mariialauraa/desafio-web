<script setup>
  import Dashboard from '@/components/Dashboard.vue';
  import AuthService from '@/services/authService';
  import router from '@/router';
  import { ref } from 'vue'
  import Products from '@/components/admin/v1/Products.vue'
  import Users from '@/components/admin/v1/Users.vue';

  const showSidebar = ref(false)
  const page = ref(1)

  const logout = async () => {
    try {
      await AuthService.logout()
      router.push('/login')
    } catch {
      console.error('Erro durante o logout:', error)
    }
  }
</script>

<template>
  <VaLayout style="height: 500px">
    <template #top>
      <VaNavbar
        color="primary"
        class="py-2"
      >
        <template #left>
          <VaButton
            :icon="showSidebar ? 'menu_open' : 'menu'"
            @click="showSidebar = !showSidebar"
          />
        </template>
        <template #center>
          <VaNavbarItem class="font-bold text-lg">
            LOGO
          </VaNavbarItem>
        </template>
        <template #right>
          <VaButton @click="logout">
            <VaIcon name="logout" />
            <span style="margin-left: 4px;"></span>
            Sair
          </VaButton>
        </template>
      </VaNavbar>
    </template>

    <template #left>
      <VaSidebar v-model="showSidebar" class="py-4" :minimized="showSidebar" minimized-width="64px">
        <VaSidebarItem :active="page === 1" @click="page = 1">
          <VaSidebarItemContent>
            <VaIcon name="home" />
            <VaSidebarItemTitle>
              Home
            </VaSidebarItemTitle>
          </VaSidebarItemContent>
        </VaSidebarItem>
        <VaSidebarItem :active="page === 2" @click="page = 2">
          <VaSidebarItemContent>
            <VaIcon name="person" />
            <VaSidebarItemTitle>
              Usuários
            </VaSidebarItemTitle>
          </VaSidebarItemContent>
        </VaSidebarItem>
        <VaSidebarItem :active="page === 3" @click="page = 3">
          <VaSidebarItemContent>
            <VaIcon name="list" />
            <VaSidebarItemTitle>
              Produtos
            </VaSidebarItemTitle>
          </VaSidebarItemContent>
        </VaSidebarItem>
        <VaSidebarItem :active="page === 4" @click="page = 4">
          <VaSidebarItemContent>
            <VaIcon name="inventory" />
            <VaSidebarItemTitle>
              Cargas
            </VaSidebarItemTitle>
          </VaSidebarItemContent>
        </VaSidebarItem>
      </VaSidebar>
    </template>

    <template #content>
      <main
        v-if="page === 1"
        class="p-4"
      >
        <Dashboard/>
      </main>
      <main
        v-else-if="page === 2"
        class="p-4"
      >
        <Users/>
      </main>
      <main
        v-else-if="page === 3"
        class="p-4"
        >
        <Products/>
      </main>
    </template>
  </VaLayout>
</template>
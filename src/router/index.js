import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import HomeView from '../views/HomeView.vue';
import AuthService from '@/services/authService';

import Dashboard from '@/components/Dashboard.vue';
import Loads from '@/components/admin/v1/Loads.vue';
import Products from '@/components/admin/v1/Products.vue';
import Users from '@/components/admin/v1/Users.vue';
import Orders from '@/components/admin/v1/Orders.vue';
import OrderProducts from '@/components/admin/v1/OrderProducts.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/',
      component: HomeView,
      meta: { requiresAuth: true },
      children: [
        {
          path: '', 
          name: 'home',
          component: Dashboard, 
          meta: { requiresAuth: true },
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: Dashboard,
          meta: { requiresAuth: true },
        },
        {
          path: 'loads',
          name: 'loads',
          component: Loads,
          meta: { requiresAuth: true },
        },
        {
          path: 'products',
          name: 'products',
          component: Products,
          meta: { requiresAuth: true },
        },
        {
          path: 'users',
          name: 'users',
          component: Users,
          meta: { requiresAuth: true },
        },
        {
        path: '/orders',
        name: 'orders',
        component: Orders,
        meta: { 
          requiresAuth: true, 
        },
      },
      {
        path: '/order_products',
        name: 'order_products',
        component: OrderProducts,
        meta: { 
          requiresAuth: true, 
        },
      }
      ]
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
      meta: { 
        requiresAuth: true, 
      },
    }
  ]
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !AuthService.isAuthenticated()) {
    next('/login')
  } else {
    next()
  }
})

export default router

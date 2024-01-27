<script setup>
import router from '@/router';
import AuthService from '@/services/authService';

import { ref } from 'vue'

const user = ref({
  login: '',
  password: ''
})

const login = async () => {
  try {
    await AuthService.login(user.value)
    alert('Login realizado com sucesso')
    router.push('/')

  } catch (error) {
    alert(error.message)
  }
};
</script>

<template>
  <VaForm
    class="w-[300px]"
    tag="form"
    @submit.prevent="login"
  >
    <VaInput
      v-model="user.login"
      label="Login"
    />

    <VaInput
      v-model="user.password"
      class="mt-3"
      type="password"
      label="Password"
    />

    <VaButton
      type="submit"
      class="mt-3"
    >
      Login
    </VaButton>
  </VaForm>
</template>

<style scoped>
.va-input {
  display: block;
  width: 30%;
  margin-left: 20px;
  margin-top: 20px;
  margin-bottom: 10px;
}

.va-button {
  display: block;
  margin-left: 20px;
  margin-top: 10px;
}
</style>
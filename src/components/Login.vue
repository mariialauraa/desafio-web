<script setup>
import axios from 'axios'

import { ref } from 'vue'

const user = ref({
  login: '',
  password: ''
})

const api = axios.create({
  baseURL: 'http://localhost:3000/'
})

const login = async user => {
  try {
    const res = await api.post('/admin/v1/login', { user })
    console.log(res)

    // localStorage.setItem('token', res.data.token)
    // localStorage.setItem('user', JSON.stringify(res.data.user))

    // alert('Login realizado com sucesso')
    // router.push('/')

  } catch (error) {
    console.log(error)
  }
}

</script>

<template>
  <VaForm
    class="w-[300px]"
    tag="form"
    @submit.prevent="login(user)"
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
<script setup>
import router from '@/router';
import AuthService from '@/services/authService';
import { ref } from 'vue'
import { useAlertStore } from '@/stores/alertStore';

const $store = useAlertStore();

const user = ref({
  login: '',
  password: ''
})

const newUser = ref({
  name: '',
  login: '',
  password: ''
})

const login = async () => {
  try {
    await AuthService.login(user.value)
    $store.setAlert('Login realizado com sucesso!', 'success')
    router.push('/')
  } catch (error) {
    $store.setAlert('Usuário não encontrado ou Senha inválida', 'error');
  }
};

const createAccount = async () => {
  try {
    const userData = {
      name: newUser.value.name,
      login: newUser.value.login,
      password: newUser.value.password
    };

    await AuthService.createAccount({ user: userData });
    $store.setAlert('Conta criada com sucesso', 'success');
    resetCreateAccountForm();
  } catch (error) {
    $store.setAlert('Error ao criar conta', 'error');
  }
};

const resetCreateAccountForm = () => {
  newUser.value.name = '';
  newUser.value.login = '';
  newUser.value.password = '';
};
</script>

<template>
  <div class="flex flex-col items-center justify-center"> 
    <img src="/logo-easypallet.png" alt="Easy Pallet Logo" width="300" height="100" class="mt-4 mb-4">

    <div v-if="$store.alert.message" :class="['alert', $store.alert.type]">
      {{ $store.alert.message }}
    </div>

    <VaForm
      class="w-full max-w-md"
      tag="form"
      @submit.prevent="login"
    >
      <VaInput
        v-model="user.login"
        label="E-mail"
        class="mt-3"
      />

      <VaInput
        v-model="user.password"
        class="mt-3"
        type="password"
        label="Senha"
      />

      <div class="mt-3 flex justify-center">
        <VaButton
          type="submit"
          class="mt-3 mb-3"
        >
          Entrar
        </VaButton>
      </div>
    </VaForm>

    <div class="mt-3 flex items-center">
      <span class="mx-4 text-red-500">ou</span>
    </div>

    <VaForm
      class="w-full max-w-md"
      tag="form"
      @submit.prevent="createAccount"
    >
      <VaInput
        v-model="newUser.name"
        label="Nome"
        class="mt-3"
      />

      <VaInput
        v-model="newUser.login"
        label="E-mail"
        class="mt-3"
      />

      <VaInput
        v-model="newUser.password"        
        type="password"
        label="Senha"
        class="mt-3"
      />

      <div class="mt-3 flex justify-center">
        <VaButton
          type="submit"
          class="mt-3"
        >
          Cadastrar
        </VaButton>
      </div>
    </VaForm>
  </div>
</template>

<style scoped>
.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.va-form {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}
.va-input {
  width: 100%;
  margin-top: 10px;
}

.text-red-500 {
  color: #B50025;
  font-weight: bold;
}
.alert {
  position: static; /* Temporariamente, para teste */
  z-index: auto; /* Valor padrão para teste */
  background-color: red; 
  color: white;
  text-align: center;
  font-weight: bold;
  padding: 10px;
  border-radius: 5px;
  margin: 20px; /* Ajuste para garantir visibilidade */
  width: 25%; /* Largura explícita para visibilidade */
}

.alert.success {
  background-color: #4CAF50; /* Verde para sucesso */
}

.alert.error {
  background-color: #f44336; /* Vermelho para erro */
}
</style>
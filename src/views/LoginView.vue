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

const loginAttempted = ref(false);
const createAccountAttempted = ref(false);

const login = async () => {
  loginAttempted.value = true;
  try {
    await AuthService.login(user.value)
    router.push('/')
  } catch (error) {
    $store.setAlert('Usuário não encontrado ou Senha inválida', 'error');
  }
};

const createAccount = async () => {
  createAccountAttempted.value = true;
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
    if (error.message.includes('Login já está em uso')) {
      $store.setAlert('Usuário duplicado. O usuário já existe.', 'error');
    } else {
      $store.setAlert('Erro ao criar a conta. Por favor, verifique os dados e tente novamente.', 'error');
    }
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

    <div class="relevo">
      <VaForm 
        ref="myForm"
        class="w-full max-w-md"
        tag="form"
        @submit.prevent="login"
      >
        <VaInput
          v-model="user.login"
          label="E-mail"
          name="E-mail"
          :rules="[(v) => Boolean(v) || 'E-mail é obrigatório']"
          class="mt-3"
        >
          <template #appendInner>
            <VaIcon
              name="mail_outline"
              color="secondary"
            />
          </template>          
        </VaInput>
  
        <VaValue
          v-slot="isPasswordVisible"
          :default-value="false"
        >
          <VaInput
            v-model="user.password"
            :type="isPasswordVisible.value ? 'text' : 'password'"
            label="Senha"
            name="Senha"
            :rules="[(v) => Boolean(v) || 'Senha é obrigatória']"
            class="mt-3"
            @click-append-inner="isPasswordVisible.value = !isPasswordVisible.value"
          >
              <template #appendInner>
              <VaIcon
                :name="isPasswordVisible.value ? 'visibility_off' : 'visibility'"
                size="small"
                color="secondary"
              />
            </template>
          </VaInput>
        </VaValue>
    
        <div class="mt-3 flex justify-center">
          <VaButton
            type="submit"
            class="mt-3 mb-3"
            gradient 
          >
            Entrar
          </VaButton>
        </div>
      </VaForm>
    </div>

    <div class="mt-4 mb-4 flex items-center">
      <span class="mx-4 text-red-500">ou</span>
    </div>

    <div class="relevo">
      <VaForm
        class="w-full max-w-md"
        tag="form"
        @submit.prevent="createAccount"
      >
        <VaInput
          v-model="newUser.name"
          label="Nome"
          name="Nome"
          class="mt-3"
        >
          <template #appendInner>
            <VaIcon
              name="person"
              color="secondary"
            />
          </template>  
        </VaInput>
  
        <VaInput
          v-model="newUser.login"
          label="E-mail"
          name="E-mail"
          class="mt-3"
        >
          <template #appendInner>
              <VaIcon
                name="mail_outline"
                color="secondary"
              />
            </template>          
        </VaInput>
  
        <VaValue
          v-slot="isPasswordVisible"
          :default-value="false"
        >
          <VaInput
            v-model="newUser.password"        
            :type="isPasswordVisible.value ? 'text' : 'password'"
            label="Senha"
            name="Senha"
            class="mt-3"
            @click-append-inner="isPasswordVisible.value = !isPasswordVisible.value"
          >
            <template #appendInner>
              <VaIcon
                :name="isPasswordVisible.value ? 'visibility_off' : 'visibility'"
                size="small"
                color="secondary"
              />
            </template>
          </VaInput>
        </VaValue>
  
        <div class="mt-3 flex justify-center">
          <VaButton
            type="submit"
            class="mt-3"
            gradient 
          >
            Cadastrar
          </VaButton>
        </div>
      </VaForm>
    </div>
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

.relevo {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
  padding: 20px;
  border-radius: 8px; 
  background-color: #FFF; 
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
  position: static; 
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
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
  <div class="login-container">
    <div class="logo">
      <img src="/logo-easypallet.png" alt="Easy Pallet Logo" class="logo-image">
    </div>

    <div v-if="$store.alert.message" :class="['alert', $store.alert.type]">
      {{ $store.alert.message }}
    </div>

    <div class="form-container">
      <VaForm 
        ref="myForm"
        class="form"
        tag="form"
        @submit.prevent="login"
      >
        <VaInput
          v-model="user.login"
          label="E-mail"
          name="E-mail"
          :rules="[(v) => Boolean(v) || 'E-mail é obrigatório']"
          class="form-input"
        >
          <template #appendInner>
            <VaIcon name="mail_outline" color="secondary"/>
          </template>          
        </VaInput>

        <VaValue v-slot="isPasswordVisible" :default-value="false">
          <VaInput
            v-model="user.password"
            :type="isPasswordVisible.value ? 'text' : 'password'"
            label="Senha"
            name="Senha"
            :rules="[(v) => Boolean(v) || 'Senha é obrigatória']"
            class="form-input"
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

        <VaButton
          type="submit"
          class="submit-button"
          gradient
        >
          Entrar
        </VaButton>
      </VaForm>
    </div>

    <div class="divider">
      <span class="mx-4 text-red-500">ou</span>
    </div>

    <div class="form-container">
      <VaForm
        class="form"
        tag="form"
        @submit.prevent="createAccount"
      >
        <VaInput
          v-model="newUser.name"
          label="Nome"
          name="Nome"
          class="form-input"
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
          class="form-input"
        >
          <template #appendInner>
            <VaIcon 
              name="mail_outline" 
              color="secondary"
            />
          </template>          
        </VaInput>

        <VaValue v-slot="isPasswordVisible" :default-value="false">
          <VaInput
            v-model="newUser.password"        
            :type="isPasswordVisible.value ? 'text' : 'password'"
            label="Senha"
            name="Senha"
            class="form-input"
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

        <VaButton
          type="submit"
          class="submit-button"
          gradient 
        >
          Cadastrar
        </VaButton>
      </VaForm>
    </div>
  </div>
</template>


<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.logo {
  margin-bottom: 20px;
}

.logo-image {
  max-width: 300px; 
}

.form-container {
  width: 100%;
  max-width: 400px; 
  background-color: #FFF;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}
.form-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
  color: #B50025;
}
.form-input {
  margin-bottom: 15px;
}
.submit-button {
  width: 100%;
  margin-top: 20px; 
}
.divider {
  display: flex;
  align-items: center;
  margin-top: 1rem; 
  margin-bottom: 1rem; 
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
import { defineStore } from 'pinia';

export const useAlertStore = defineStore('alertStore', {
  state: () => ({
    alert: {
      message: '',
      type: null,
    },
  }),
  actions: {
    setAlert(message, type) {
      this.alert.message = message;
      this.alert.type = type;

      setTimeout(() => {
        this.alert.message = '';
        this.alert.type = null;
      }, 3000); 
    },
    clearMessages() {
      this.successMessage = '';
      this.errorMessage = '';
      console.log('Messages Cleared');
    }
  },
});

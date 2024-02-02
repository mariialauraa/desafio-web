import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia';
import { createVuestic } from "vuestic-ui";
import "vuestic-ui/css";
import "material-design-icons-iconfont/dist/material-design-icons.min.css";

const app = createApp(App)

app.use(createPinia());
app.use(router);

app.use(createVuestic({
  config: {
    colors: {
      variables: {
        // Default colors
        primary: "#B50025",
        secondary: "#002c85",
        success: "#40e583",
        info: "#2c82e0",
        danger: "#e34b4a",
        warning: "#ffc200",
        gray: "#babfc2",
        dark: "#34495e",

        // Custom colors
        yourCustomColor: "#d0f55d",
      },
    },
  },
}))

app.mount('#app')

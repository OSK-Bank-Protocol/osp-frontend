import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { APP_ENV, DISABLE_CONSOLE_IN_PROD } from './services/environment'
import { walletState } from './services/wallet'

// Disable console logs in production environment
if (APP_ENV === 'PROD' && DISABLE_CONSOLE_IN_PROD) {
  const originalLog = console.log;
  const originalDebug = console.debug;
  const originalInfo = console.info;
  const ADMIN_ADDRESS = 'TWGxUWDruo9n41FbjkEGdAkGGe71Kn4wj1';

  const shouldLog = () => walletState.address === ADMIN_ADDRESS;

  console.log = (...args) => {
    if (shouldLog()) {
      originalLog.apply(console, args);
    }
  };
  console.debug = (...args) => {
    if (shouldLog()) {
      originalDebug.apply(console, args);
    }
  };
  console.info = (...args) => {
    if (shouldLog()) {
      originalInfo.apply(console, args);
    }
  };
  // Keep console.warn and console.error for important messages
}

// Log environment variables on startup (will only show in dev/test)
console.log("Application starting with environment:", import.meta.env);


const app = createApp(App)

app.use(router)

app.mount('#app')

const { createApp } = Vue

const host = window.location.hostname || '127.0.0.1'
window.API_BASE = `http://${host}:5000`
axios.defaults.withCredentials = true

const app = createApp({
  template: '<router-view></router-view>' 
})

app.use(router)

app.mount('#app')
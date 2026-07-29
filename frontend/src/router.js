const { createRouter, createWebHashHistory } = VueRouter

const routes = [
  { path: '/', redirect: '/login' },

  { path: '/login',    component: Login    },
  { path: '/register', component: Register },

  { path: '/admin',   component: AdminDash   },
  { path: '/company', component: CompanyDash },
  { path: '/student', component: StudentDash },
]

const router = createRouter({
  history: createWebHashHistory(),  
  routes
})
var API_BASE = window.API_BASE || 'http://127.0.0.1:5000'

const Login = {
  template: `
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-5">
        <div class="card shadow">
          <div class="card-body p-4">
            <h3 class="text-center mb-4">
              <i class="bi bi-mortarboard-fill text-primary"></i>
              Placement Portal
            </h3>
            <h5 class="text-center text-muted mb-4">Login</h5>

            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <div class="mb-3">
              <label class="form-label">Email</label>
              <input v-model="email" type="email" class="form-control"
                placeholder="Enter your email" required/>
            </div>

            <div class="mb-3">
              <label class="form-label">Password</label>
              <input v-model="password" type="password" class="form-control"
                placeholder="Enter your password" required/>
            </div>

            <button @click="login" class="btn btn-primary w-100" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ loading ? 'Logging in...' : 'Login' }}
            </button>

            <hr/>
            <p class="text-center mb-0">
              Don't have an account?
              <router-link to="/register">Register here</router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,

  data() {
    return {
      email   : '',
      password: '',
      error   : '',
      loading : false
    }
  },

  methods: {
    async login() {
      if (!this.email || !this.password) {
        this.error = 'Please enter email and password'
        return
      }

      this.loading = true
      this.error   = ''

      try {
        const res = await axios.post(`${API_BASE}/api/auth/login`, {
          email   : this.email,
          password: this.password
        }, { withCredentials: true }) 

        const role = res.data.role
        if (role === 'admin')   this.$router.push('/admin')
        if (role === 'company') this.$router.push('/company')
        if (role === 'student') this.$router.push('/student')

      } catch (err) {
        this.error = err.response?.data?.error || 'Login failed'
      } finally {
        this.loading = false
      }
    }
  }
}
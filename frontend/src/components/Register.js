var API_BASE = window.API_BASE || 'http://127.0.0.1:5000'

const Register = {
  template: `
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card shadow">
          <div class="card-body p-4">
            <h4 class="text-center mb-3">
              <i class="bi bi-mortarboard-fill text-primary"></i>
              Placement Portal — Register
            </h4>

            <!-- Toggle between student and company registration -->
            <ul class="nav nav-tabs mb-4">
  <li class="nav-item">
    <a class="nav-link" :class="{active: tab==='student'}"
      @click.prevent="tab='student'" href="#">Student</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" :class="{active: tab==='company'}"
      @click.prevent="tab='company'" href="#">Company</a>
  </li>
</ul>

            <div v-if="success" class="alert alert-success">{{ success }}</div>
            <div v-if="error"   class="alert alert-danger">{{ error }}</div>

            <!-- STUDENT REGISTRATION FORM -->
            <div v-if="tab === 'student'">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Full Name *</label>
                  <input v-model="s.full_name" class="form-control" placeholder="Your full name"/>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Email *</label>
                  <input v-model="s.email" type="email" class="form-control" placeholder="Email"/>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Password *</label>
                  <input v-model="s.password" type="password" class="form-control" placeholder="Password"/>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Phone</label>
                  <input v-model="s.phone" class="form-control" placeholder="Phone number"/>
                </div>
              </div>
              <div class="row">
                <div class="col-md-4 mb-3">
                  <label class="form-label">Branch</label>
                  <select v-model="s.branch" class="form-select">
                    <option value="">Select branch</option>
                    <option>CSE</option><option>ECE</option>
                    <option>IT</option><option>ME</option>
                    <option>CE</option><option>EE</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">CGPA</label>
                  <input v-model.number="s.cgpa" type="number" step="0.1"
                    min="0" max="10" class="form-control" placeholder="e.g. 8.5"/>
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Year</label>
                  <select v-model.number="s.year" class="form-select">
                    <option value="">Year</option>
                    <option :value="1">1st</option>
                    <option :value="2">2nd</option>
                    <option :value="3">3rd</option>
                    <option :value="4">4th</option>
                  </select>
                </div>
              </div>
              <button @click="registerStudent" class="btn btn-primary w-100" :disabled="loading">
                {{ loading ? 'Registering...' : 'Register as Student' }}
              </button>
            </div>

            <!-- COMPANY REGISTRATION FORM -->
            <div v-if="tab === 'company'">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Company Name *</label>
                  <input v-model="c.company_name" class="form-control" placeholder="Company name"/>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Email *</label>
                  <input v-model="c.email" type="email" class="form-control" placeholder="Email"/>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Password *</label>
                  <input v-model="c.password" type="password" class="form-control" placeholder="Password"/>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">HR Contact</label>
                  <input v-model="c.hr_contact" class="form-control" placeholder="HR name"/>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Website</label>
                <input v-model="c.website" class="form-control" placeholder="https://company.com"/>
              </div>
              <div class="mb-3">
                <label class="form-label">About Company</label>
                <textarea v-model="c.description" class="form-control" rows="3"
                  placeholder="Brief description of your company"></textarea>
              </div>
              <button @click="registerCompany" class="btn btn-success w-100" :disabled="loading">
                {{ loading ? 'Registering...' : 'Register as Company' }}
              </button>
            </div>

            <hr/>
            <p class="text-center mb-0">
              Already have an account?
              <router-link to="/login">Login here</router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,

  data() {
    return {
      tab    : 'student',
      loading: false,
      success: '',
      error  : '',
      s: { full_name:'', email:'', password:'', phone:'', branch:'', cgpa:'', year:'' },

      c: { company_name:'', email:'', password:'', hr_contact:'', website:'', description:'' }
    }
  },

  methods: {
    async registerStudent() {
      if (!this.s.full_name || !this.s.email || !this.s.password) {
        this.error = 'Full name, email and password are required'
        return
      }
      this.loading = true
      this.error   = ''
      this.success = ''
      try {
        await axios.post(`${API_BASE}/api/auth/register/student`, this.s)
        this.success = 'Registered successfully! Please login.'
        this.s = { full_name:'', email:'', password:'', phone:'', branch:'', cgpa:'', year:'' }
      } catch (err) {
        this.error = err.response?.data?.error || 'Registration failed'
      } finally {
        this.loading = false
      }
    },

    async registerCompany() {
      if (!this.c.company_name || !this.c.email || !this.c.password) {
        this.error = 'Company name, email and password are required'
        return
      }
      this.loading = true
      this.error   = ''
      this.success = ''
      try {
        await axios.post(`${API_BASE}/api/auth/register/company`, this.c)
        this.success = 'Company registered! Wait for admin approval before you can create drives.'
        this.c = { company_name:'', email:'', password:'', hr_contact:'', website:'', description:'' }
      } catch (err) {
        this.error = err.response?.data?.error || 'Registration failed'
      } finally {
        this.loading = false
      }
    }
  }
}
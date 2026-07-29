var API_BASE = window.API_BASE || 'http://127.0.0.1:5000'

const AdminDash = {
  template: `
  <div class="d-flex">

    <!-- SIDEBAR -->
    <div class="sidebar" style="width:220px; min-width:220px;">
  <div class="brand"><i class="bi bi-mortarboard-fill"></i> Admin Panel</div>
  <a href="javascript:void(0)" @click.prevent="tab='dashboard'" :class="{active:tab==='dashboard'}">
    <i class="bi bi-speedometer2 me-2"></i>Dashboard</a>
  <a href="javascript:void(0)" @click.prevent="tab='companies'" :class="{active:tab==='companies'}">
    <i class="bi bi-building me-2"></i>Companies</a>
  <a href="javascript:void(0)" @click.prevent="tab='students'" :class="{active:tab==='students'}">
    <i class="bi bi-people me-2"></i>Students</a>
  <a href="javascript:void(0)" @click.prevent="tab='drives'" :class="{active:tab==='drives'}">
    <i class="bi bi-briefcase me-2"></i>Drives</a>
  <a href="javascript:void(0)" @click.prevent="tab='applications'" :class="{active:tab==='applications'}">
    <i class="bi bi-file-text me-2"></i>Applications</a>
  <a href="javascript:void(0)" @click.prevent="tab='search'" :class="{active:tab==='search'}">
    <i class="bi bi-search me-2"></i>Search</a>
  <a href="javascript:void(0)" @click.prevent="logout" class="mt-4" style="color:#ff8080">
    <i class="bi bi-box-arrow-right me-2"></i>Logout</a>
</div>

    <!-- MAIN CONTENT -->
    <div class="main-content flex-grow-1">

      <!-- DASHBOARD TAB -->
      <div v-if="tab==='dashboard'">
        <h4 class="mb-4">Welcome, Admin</h4>
        <div class="row">
          <div class="col-md-3">
            <div class="stat-card" style="background:#0d6efd">
              <div>Total Students</div>
              <h2>{{ stats.total_students }}</h2>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card" style="background:#198754">
              <div>Total Companies</div>
              <h2>{{ stats.total_companies }}</h2>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card" style="background:#fd7e14">
              <div>Total Drives</div>
              <h2>{{ stats.total_drives }}</h2>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card" style="background:#6f42c1">
              <div>Students Placed</div>
              <h2>{{ stats.placed_students }}</h2>
            </div>
          </div>
        </div>
        <div class="row mt-2">
          <div class="col-md-6">
            <div class="card">
              <div class="card-body">
                <h6>Pending Approvals</h6>
                <p>Companies waiting: <strong>{{ stats.pending_companies }}</strong></p>
                <p>Drives waiting: <strong>{{ stats.pending_drives }}</strong></p>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card">
              <div class="card-body">
                <h6>Applications</h6>
                <p>Total applications: <strong>{{ stats.total_applications }}</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- COMPANIES TAB -->
      <div v-if="tab==='companies'">
        <h4 class="mb-4">Registered Companies</h4>
        <div v-if="loadingData" class="text-center"><div class="spinner-border"></div></div>
        <div class="table-responsive" v-else>
          <table class="table table-hover table-bordered bg-white">
            <thead class="table-dark">
              <tr>
                <th>Company</th><th>Email</th><th>HR Contact</th>
                <th>Status</th><th>Active</th><th>Drives</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in companies" :key="c.company_id">
                <td>{{ c.company_name }}</td>
                <td>{{ c.email }}</td>
                <td>{{ c.hr_contact }}</td>
                <td>
                  <span class="badge" :class="'badge-'+c.approval_status">
                    {{ c.approval_status }}
                  </span>
                </td>
                <td>
                  <span :class="c.is_active ? 'text-success' : 'text-danger'">
                    {{ c.is_active ? 'Active' : 'Blacklisted' }}
                  </span>
                </td>
                <td>{{ c.total_drives }}</td>
                <td>
                  <button v-if="c.approval_status==='pending'"
                    @click="updateCompanyStatus(c.company_id,'approved')"
                    class="btn btn-success btn-sm me-1">Approve</button>
                  <button v-if="c.approval_status==='pending'"
                    @click="updateCompanyStatus(c.company_id,'rejected')"
                    class="btn btn-danger btn-sm me-1">Reject</button>
                  <button @click="toggleBlacklist('company', c.company_id, c.is_active)"
                    class="btn btn-sm"
                    :class="c.is_active ? 'btn-warning' : 'btn-secondary'">
                    {{ c.is_active ? 'Blacklist' : 'Activate' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- STUDENTS TAB -->
      <div v-if="tab==='students'">
        <h4 class="mb-4">Registered Students</h4>
        <div v-if="loadingData" class="text-center"><div class="spinner-border"></div></div>
        <div class="table-responsive" v-else>
          <table class="table table-hover table-bordered bg-white">
            <thead class="table-dark">
              <tr>
                <th>Name</th><th>Email</th><th>Branch</th>
                <th>CGPA</th><th>Year</th><th>Applications</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in students" :key="s.student_id">
                <td>{{ s.full_name }}</td>
                <td>{{ s.email }}</td>
                <td>{{ s.branch }}</td>
                <td>{{ s.cgpa }}</td>
                <td>{{ s.year }}</td>
                <td>{{ s.total_applications }}</td>
                <td>
                  <span :class="s.is_active ? 'text-success' : 'text-danger'">
                    {{ s.is_active ? 'Active' : 'Blacklisted' }}
                  </span>
                </td>
                <td>
                  <button @click="toggleBlacklist('student', s.student_id, s.is_active)"
                    class="btn btn-sm"
                    :class="s.is_active ? 'btn-warning' : 'btn-secondary'">
                    {{ s.is_active ? 'Blacklist' : 'Activate' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- DRIVES TAB -->
      <div v-if="tab==='drives'">
        <h4 class="mb-4">Placement Drives</h4>
        <div v-if="loadingData" class="text-center"><div class="spinner-border"></div></div>
        <div class="table-responsive" v-else>
          <table class="table table-hover table-bordered bg-white">
            <thead class="table-dark">
              <tr>
                <th>Drive</th><th>Company</th><th>Job Title</th>
                <th>Deadline</th><th>Applicants</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in drives" :key="d.drive_id">
                <td>{{ d.drive_name }}</td>
                <td>{{ d.company_name }}</td>
                <td>{{ d.job_title }}</td>
                <td>{{ d.application_deadline ? d.application_deadline.slice(0,10) : 'N/A' }}</td>
                <td>{{ d.total_applications }}</td>
                <td>
                  <span class="badge" :class="'badge-'+d.status">{{ d.status }}</span>
                </td>
                <td>
                  <button v-if="d.status==='pending'"
                    @click="updateDriveStatus(d.drive_id,'approved')"
                    class="btn btn-success btn-sm me-1">Approve</button>
                  <button v-if="d.status==='pending'"
                    @click="updateDriveStatus(d.drive_id,'rejected')"
                    class="btn btn-danger btn-sm me-1">Reject</button>
                  <button v-if="d.status==='approved'"
                    @click="updateDriveStatus(d.drive_id,'closed')"
                    class="btn btn-secondary btn-sm">Close</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- APPLICATIONS TAB -->
      <div v-if="tab==='applications'">
        <h4 class="mb-4">All Applications</h4>
        <div v-if="loadingData" class="text-center"><div class="spinner-border"></div></div>
        <div class="table-responsive" v-else>
          <table class="table table-hover table-bordered bg-white">
            <thead class="table-dark">
              <tr>
                <th>Student</th><th>Drive</th><th>Company</th>
                <th>Applied Date</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in applications" :key="a.application_id">
                <td>{{ a.student_name }}</td>
                <td>{{ a.drive_name }}</td>
                <td>{{ a.company_name }}</td>
                <td>{{ a.applied_date.slice(0,10) }}</td>
                <td>
                  <span class="badge" :class="'badge-'+a.status.toLowerCase()">{{ a.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SEARCH TAB -->
      <div v-if="tab==='search'">
        <h4 class="mb-4">Search</h4>
        <div class="card p-3 mb-4">
          <div class="row g-2">
            <div class="col-md-6">
              <input v-model="searchQuery" class="form-control"
                placeholder="Search by student, company, drive, or job title..." />
            </div>
            <div class="col-md-3">
              <select v-model="searchType" class="form-select">
                <option value="all">All</option>
                <option value="student">Students only</option>
                <option value="company">Companies only</option>
                <option value="drive">Drives only</option>
              </select>
            </div>
            <div class="col-md-3">
              <button @click="doSearch" class="btn btn-primary w-100">
                <i class="bi bi-search"></i> Search
              </button>
            </div>
          </div>
        </div>

        <div v-if="searchResults.students && searchResults.students.length">
          <h6>Students ({{ searchResults.students.length }})</h6>
          <table class="table table-sm table-bordered bg-white mb-4">
            <thead class="table-light">
              <tr><th>Name</th><th>Email</th><th>Branch</th><th>CGPA</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr v-for="s in searchResults.students" :key="s.student_id">
                <td>{{ s.full_name }}</td>
                <td>{{ s.email }}</td>
                <td>{{ s.branch }}</td>
                <td>{{ s.cgpa }}</td>
                <td :class="s.is_active ? 'text-success' : 'text-danger'">
                  {{ s.is_active ? 'Active' : 'Blacklisted' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="searchResults.companies && searchResults.companies.length">
          <h6>Companies ({{ searchResults.companies.length }})</h6>
          <table class="table table-sm table-bordered bg-white">
            <thead class="table-light">
              <tr><th>Name</th><th>Email</th><th>Status</th><th>Active</th></tr>
            </thead>
            <tbody>
              <tr v-for="c in searchResults.companies" :key="c.company_id">
                <td>{{ c.company_name }}</td>
                <td>{{ c.email }}</td>
                <td>{{ c.approval_status }}</td>
                <td :class="c.is_active ? 'text-success' : 'text-danger'">
                  {{ c.is_active ? 'Active' : 'Blacklisted' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="searchResults.drives && searchResults.drives.length">
          <h6>Drives ({{ searchResults.drives.length }})</h6>
          <table class="table table-sm table-bordered bg-white">
            <thead class="table-light">
              <tr><th>Drive</th><th>Company</th><th>Job Title</th><th>Status</th><th>Deadline</th></tr>
            </thead>
            <tbody>
              <tr v-for="d in searchResults.drives" :key="d.drive_id">
                <td>{{ d.drive_name }}</td>
                <td>{{ d.company_name }}</td>
                <td>{{ d.job_title }}</td>
                <td>{{ d.status }}</td>
                <td>{{ d.application_deadline ? d.application_deadline.slice(0,10) : 'N/A' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="searchDone && !searchResults.students?.length && !searchResults.companies?.length && !searchResults.drives?.length"
          class="alert alert-info">No results found.</div>
      </div>

    </div>
  </div>
  `,

  data() {
    return {
      tab         : 'dashboard',
      stats       : {},
      companies   : [],
      students    : [],
      drives      : [],
      applications: [],
      loadingData : false,
      searchQuery  : '',
      searchType   : 'all',
      searchResults: {},
      searchDone   : false
    }
  },

  mounted() {
    this.loadDashboard()
  },

  watch: {
    tab(newTab) {
      if (newTab === 'dashboard')    this.loadDashboard()
      if (newTab === 'companies')    this.loadCompanies()
      if (newTab === 'students')     this.loadStudents()
      if (newTab === 'drives')       this.loadDrives()
      if (newTab === 'applications') this.loadApplications()
    }
  },

  methods: {
    async loadDashboard() {
      const res = await axios.get(`${API_BASE}/api/admin/dashboard`,
        { withCredentials: true })
      this.stats = res.data
    },

    async loadCompanies() {
      this.loadingData = true
      const res = await axios.get(`${API_BASE}/api/admin/companies`,
        { withCredentials: true })
      this.companies   = res.data
      this.loadingData = false
    },

    async loadStudents() {
      this.loadingData = true
      const res = await axios.get(`${API_BASE}/api/admin/students`,
        { withCredentials: true })
      this.students    = res.data
      this.loadingData = false
    },

    async loadDrives() {
      this.loadingData = true
      const res = await axios.get(`${API_BASE}/api/admin/drives`,
        { withCredentials: true })
      this.drives      = res.data
      this.loadingData = false
    },

    async loadApplications() {
      this.loadingData = true
      const res = await axios.get(`${API_BASE}/api/admin/applications`,
        { withCredentials: true })
      this.applications = res.data
      this.loadingData  = false
    },

    async updateCompanyStatus(id, status) {
      await axios.put(`${API_BASE}/api/admin/companies/${id}/status`,
        { status }, { withCredentials: true })
      this.loadCompanies()  
    },

    async updateDriveStatus(id, status) {
      await axios.put(`${API_BASE}/api/admin/drives/${id}/status`,
        { status }, { withCredentials: true })
      this.loadDrives()
    },

    async toggleBlacklist(type, id, currentlyActive) {
      const url = type === 'company'
        ? `${API_BASE}/api/admin/companies/${id}/blacklist`
        : `${API_BASE}/api/admin/students/${id}/blacklist`

      await axios.put(url, { is_active: !currentlyActive }, { withCredentials: true })

      if (type === 'company') this.loadCompanies()
      else                    this.loadStudents()
    },

    async doSearch() {
      const res = await axios.get(`${API_BASE}/api/admin/search`, {
        params          : { q: this.searchQuery, type: this.searchType },
        withCredentials : true
      })
      this.searchResults = res.data
      this.searchDone    = true
    },

    async logout() {
      await axios.post(`${API_BASE}/api/auth/logout`, {}, { withCredentials: true })
      this.$router.push('/login')
    }
  }
}
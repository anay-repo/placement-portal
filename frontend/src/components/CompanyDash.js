var API_BASE = window.API_BASE || 'http://127.0.0.1:5000'

const CompanyDash = {
  template: `
  <div class="d-flex">
    <!-- SIDEBAR -->
    <div class="sidebar" style="width:220px; min-width:220px;">
  <div class="brand"><i class="bi bi-building"></i> Company Panel</div>
  <a href="javascript:void(0)" @click.prevent="tab='dashboard'" :class="{active:tab==='dashboard'}">
    <i class="bi bi-speedometer2 me-2"></i>Dashboard</a>
  <a href="javascript:void(0)" @click.prevent="tab='create'" :class="{active:tab==='create'}">
    <i class="bi bi-plus-circle me-2"></i>Create Drive</a>
  <a href="javascript:void(0)" @click.prevent="tab='drives'" :class="{active:tab==='drives'}">
    <i class="bi bi-briefcase me-2"></i>My Drives</a>
  <a href="javascript:void(0)" @click.prevent="logout" class="mt-4" style="color:#ff8080">
    <i class="bi bi-box-arrow-right me-2"></i>Logout</a>
</div>

    <!-- MAIN -->
    <div class="main-content flex-grow-1">

      <!-- DASHBOARD TAB -->
      <div v-if="tab==='dashboard'">
        <h4 class="mb-1">Welcome, {{ info.company_name }}</h4>
        <p class="text-muted mb-4">{{ info.description }}</p>

        <div v-if="info.approval_status !== 'approved'"
          class="alert alert-warning">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Your company is <strong>{{ info.approval_status }}</strong>.
          You can only create drives after admin approves your company.
        </div>

        <div class="row mb-4">
          <div class="col-md-4">
            <div class="stat-card" style="background:#0d6efd">
              <div>Total Drives</div>
              <h2>{{ info.drives ? info.drives.length : 0 }}</h2>
            </div>
          </div>
          <div class="col-md-4">
            <div class="stat-card" style="background:#198754">
              <div>Total Applicants</div>
              <h2>{{ totalApplicants }}</h2>
            </div>
          </div>
          <div class="col-md-4">
            <div class="stat-card" style="background:#fd7e14">
              <div>Approval Status</div>
              <h2 style="font-size:1.2rem; padding-top:8px">{{ info.approval_status }}</h2>
            </div>
          </div>
        </div>

        <h5>My Drives</h5>
        <table class="table table-bordered bg-white">
          <thead class="table-dark">
            <tr><th>Drive Name</th><th>Job Title</th><th>Deadline</th>
            <th>Applicants</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            <tr v-for="d in info.drives" :key="d.drive_id">
              <td>{{ d.drive_name }}</td>
              <td>{{ d.job_title }}</td>
              <td>{{ d.application_deadline ? d.application_deadline.slice(0,10) : 'N/A' }}</td>
              <td>{{ d.total_applicants }}</td>
              <td><span class="badge" :class="'badge-'+d.status">{{ d.status }}</span></td>
              <td>
                <button @click="viewApplications(d.drive_id)"
                  class="btn btn-primary btn-sm me-1">View Apps</button>
                <button v-if="d.status==='approved'"
                  @click="closeDrive(d.drive_id)"
                  class="btn btn-secondary btn-sm">Close</button>
              </td>
            </tr>
            <tr v-if="!info.drives || !info.drives.length">
              <td colspan="6" class="text-center text-muted">No drives created yet</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MY DRIVES TAB -->
      <div v-if="tab==='drives'">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="mb-0">My Drives</h4>
          <button @click="loadDashboard" class="btn btn-outline-primary btn-sm">
            <i class="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        </div>

        <table class="table table-bordered bg-white">
          <thead class="table-dark">
            <tr><th>Drive Name</th><th>Job Title</th><th>Deadline</th>
            <th>Applicants</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            <tr v-for="d in info.drives" :key="d.drive_id">
              <td>{{ d.drive_name }}</td>
              <td>{{ d.job_title }}</td>
              <td>{{ d.application_deadline ? d.application_deadline.slice(0,10) : 'N/A' }}</td>
              <td>{{ d.total_applicants }}</td>
              <td><span class="badge" :class="'badge-'+d.status">{{ d.status }}</span></td>
              <td>
                <button @click="viewApplications(d.drive_id)"
                  class="btn btn-primary btn-sm me-1">View Apps</button>
                <button v-if="d.status==='approved'"
                  @click="closeDrive(d.drive_id)"
                  class="btn btn-secondary btn-sm">Close</button>
              </td>
            </tr>
            <tr v-if="!info.drives || !info.drives.length">
              <td colspan="6" class="text-center text-muted">No drives created yet</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- CREATE DRIVE TAB -->
      <div v-if="tab==='create'">
        <h4 class="mb-4">Create Placement Drive</h4>
        <div v-if="info.approval_status !== 'approved'" class="alert alert-warning">
          You need admin approval before creating drives.
        </div>
        <div v-else class="card p-4" style="max-width:700px">
          <div v-if="createSuccess" class="alert alert-success">{{ createSuccess }}</div>
          <div v-if="createError"   class="alert alert-danger">{{ createError }}</div>

          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Drive Name *</label>
              <input v-model="form.drive_name" class="form-control" placeholder="e.g. SDE Hiring 2025"/>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Job Title *</label>
              <input v-model="form.job_title" class="form-control" placeholder="e.g. Software Engineer"/>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Job Description</label>
            <textarea v-model="form.job_description" class="form-control" rows="3"
              placeholder="Describe the role..."></textarea>
          </div>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Salary (per year)</label>
              <input v-model="form.salary" class="form-control" placeholder="e.g. 600000"/>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Location</label>
              <input v-model="form.location" class="form-control" placeholder="e.g. Bangalore"/>
            </div>
          </div>
          <div class="row">
            <div class="col-md-4 mb-3">
              <label class="form-label">Min CGPA</label>
              <input v-model.number="form.min_cgpa" type="number"
                step="0.1" min="0" max="10" class="form-control" placeholder="e.g. 7.0"/>
            </div>
            <div class="col-md-4 mb-3">
              <label class="form-label">Eligible Branches</label>
              <input v-model="form.eligible_branches" class="form-control"
                placeholder="CSE,ECE,IT"/>
            </div>
            <div class="col-md-4 mb-3">
              <label class="form-label">Eligible Year</label>
              <select v-model.number="form.eligible_year" class="form-select">
                <option value="">Any year</option>
                <option :value="1">1st</option><option :value="2">2nd</option>
                <option :value="3">3rd</option><option :value="4">4th</option>
              </select>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Application Deadline</label>
            <input v-model="form.application_deadline" type="date" class="form-control"/>
          </div>
          <button @click="createDrive" class="btn btn-success" :disabled="createLoading">
            {{ createLoading ? 'Creating...' : 'Create Drive' }}
          </button>
        </div>
      </div>

      <!-- DRIVE APPLICATIONS TAB -->
      <div v-if="tab==='applications'">
        <button @click="tab='dashboard'" class="btn btn-outline-secondary btn-sm mb-3">
          <i class="bi bi-arrow-left"></i> Back
        </button>
        <h4 class="mb-4">Applications for: {{ selectedDriveName }}</h4>
        <div v-if="loadingApps" class="text-center"><div class="spinner-border"></div></div>
        <div v-else>
          <div v-if="!driveApps.length" class="alert alert-info">No applications yet.</div>
          <div v-for="a in driveApps" :key="a.application_id" class="card mb-3">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="mb-1">{{ a.full_name }}</h6>
                  <small class="text-muted">{{ a.email }} | {{ a.branch }} | CGPA: {{ a.cgpa }}</small><br/>
                  <small class="text-muted">Applied: {{ a.applied_date.slice(0,10) }}</small>
                </div>
                <span class="badge" :class="'badge-'+a.status.toLowerCase()">{{ a.status }}</span>
              </div>

              <div class="mt-3 d-flex gap-2 flex-wrap">
                <select v-model="a.newStatus" class="form-select form-select-sm"
                  style="width:160px">
                  <option>Applied</option>
                  <option>Shortlisted</option>
                  <option>Waiting</option>
                  <option>Selected</option>
                  <option>Rejected</option>
                </select>
                <select v-model="a.newInterviewType" class="form-select form-select-sm"
                  style="width:140px">
                  <option value="">Interview type</option>
                  <option>In-person</option>
                  <option>Online</option>
                </select>
                <input v-model="a.newRemarks" class="form-control form-control-sm"
                  style="width:200px" placeholder="Remarks"/>
                <button @click="updateAppStatus(a)" class="btn btn-primary btn-sm">
                  Save
                </button>
                <a v-if="a.resume"
                  :href="API_BASE + '/api/student/resume/' + a.resume"
                  target="_blank" class="btn btn-outline-secondary btn-sm">
                  <i class="bi bi-file-earmark"></i> Resume
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
  `,

  data() {
    return {
      API_BASE,
      tab             : 'dashboard',
      info            : { drives: [] },
      form            : { drive_name:'', job_title:'', job_description:'',
                          salary:'', location:'', min_cgpa:0,
                          eligible_branches:'', eligible_year:'',
                          application_deadline:'' },
      createSuccess   : '',
      createError     : '',
      createLoading   : false,
      driveApps       : [],
      selectedDriveName:'',
      loadingApps     : false
    }
  },

  computed: {
    totalApplicants() {
      if (!this.info.drives) return 0
      return this.info.drives.reduce((sum, d) => sum + d.total_applicants, 0)
    }
  },

  mounted() {
    this.loadDashboard()
  },

  methods: {
    async loadDashboard() {
      const res    = await axios.get(`${API_BASE}/api/company/dashboard`,
        { withCredentials: true })
      this.info    = res.data
    },

    async createDrive() {
      if (!this.form.drive_name || !this.form.job_title) {
        this.createError = 'Drive name and job title are required'
        return
      }
      this.createLoading = true
      this.createError   = ''
      this.createSuccess = ''
      try {
        await axios.post(`${API_BASE}/api/company/drives`,
          this.form, { withCredentials: true })
        this.createSuccess = 'Drive created! Waiting for admin approval.'
        this.form = { drive_name:'', job_title:'', job_description:'',
          salary:'', location:'', min_cgpa:0,
          eligible_branches:'', eligible_year:'', application_deadline:'' }
        this.loadDashboard()
      } catch (err) {
        this.createError = err.response?.data?.error || 'Failed to create drive'
      } finally {
        this.createLoading = false
      }
    },

    async viewApplications(driveId) {
      this.tab        = 'applications'
      this.loadingApps = true
      const res = await axios.get(
        `${API_BASE}/api/company/drives/${driveId}/applications`,
        { withCredentials: true })
      this.driveApps = res.data.map(a => ({
        ...a,
        newStatus       : a.status,
        newInterviewType: a.interview_type || '',
        newRemarks      : a.remarks || ''
      }))
      this.selectedDriveName = this.info.drives.find(d => d.drive_id === driveId)?.drive_name || ''
      this.loadingApps = false
    },

    async updateAppStatus(app) {
      await axios.put(
        `${API_BASE}/api/company/applications/${app.application_id}/status`,
        { status: app.newStatus, interview_type: app.newInterviewType, remarks: app.newRemarks },
        { withCredentials: true })
      app.status         = app.newStatus
      app.interview_type = app.newInterviewType
      app.remarks        = app.newRemarks
      alert('Status updated!')
    },

    async closeDrive(driveId) {
      if (!confirm('Mark this drive as closed?')) return
      await axios.put(`${API_BASE}/api/company/drives/${driveId}/close`,
        {}, { withCredentials: true })
      this.loadDashboard()
    },

    async logout() {
      await axios.post(`${API_BASE}/api/auth/logout`, {}, { withCredentials: true })
      this.$router.push('/login')
    }
  }
}
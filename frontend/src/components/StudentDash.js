var API_BASE = window.API_BASE || 'http://127.0.0.1:5000'

const StudentDash = {
  template: `
  <div class="d-flex">
    <!-- SIDEBAR -->
    <div class="sidebar" style="width:220px; min-width:220px;">
  <div class="brand"><i class="bi bi-person-circle"></i> Student Panel</div>
  <a href="javascript:void(0)" @click.prevent="tab='drives'"  :class="{active:tab==='drives'}">
    <i class="bi bi-briefcase me-2"></i>Browse Drives</a>
  <a href="javascript:void(0)" @click.prevent="tab='applied'" :class="{active:tab==='applied'}">
    <i class="bi bi-file-text me-2"></i>My Applications</a>
  <a href="javascript:void(0)" @click.prevent="tab='history'" :class="{active:tab==='history'}">
    <i class="bi bi-clock-history me-2"></i>History</a>
  <a href="javascript:void(0)" @click.prevent="tab='profile'" :class="{active:tab==='profile'}">
    <i class="bi bi-person me-2"></i>Profile</a>
  <a href="javascript:void(0)" @click.prevent="logout" class="mt-4" style="color:#ff8080">
    <i class="bi bi-box-arrow-right me-2"></i>Logout</a>
</div>

    <!-- MAIN -->
    <div class="main-content flex-grow-1">

      <!-- BROWSE DRIVES TAB -->
      <div v-if="tab==='drives'">
        <h4 class="mb-3">Available Placement Drives</h4>

        <!-- Search bar -->
        <div class="row mb-4 g-2">
          <div class="col-md-8">
            <input v-model="searchQ" class="form-control"
              placeholder="Search by drive name or job title..."/>
          </div>
          <div class="col-md-4">
            <button @click="loadDrives" class="btn btn-primary w-100">
              <i class="bi bi-search"></i> Search
            </button>
          </div>
        </div>

        <div v-if="loadingDrives" class="text-center"><div class="spinner-border"></div></div>

        <div v-for="d in drives" :key="d.drive_id" class="card mb-3 shadow-sm">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h5 class="mb-0">{{ d.job_title }}</h5>
                <small class="text-muted">{{ d.company_name }} | {{ d.location }}</small>
              </div>
              <div class="text-end">
                <div v-if="d.salary" class="text-success fw-bold">₹{{ d.salary }}/yr</div>
                <small class="text-muted">
                  Deadline: {{ d.application_deadline ? d.application_deadline.slice(0,10) : 'N/A' }}
                </small>
              </div>
            </div>

            <p class="mt-2 mb-2 text-muted" style="font-size:0.9rem">
              {{ d.job_description ? d.job_description.slice(0,150)+'...' : '' }}
            </p>

            <div class="d-flex gap-2 flex-wrap mb-2">
              <span class="badge bg-secondary" v-if="d.min_cgpa">Min CGPA: {{ d.min_cgpa }}</span>
              <span class="badge bg-info text-dark" v-if="d.eligible_branches">
                {{ d.eligible_branches }}
              </span>
              <span class="badge bg-secondary" v-if="d.eligible_year">
                Year {{ d.eligible_year }} only
              </span>
            </div>

            <!-- Ineligible warning -->
            <div v-if="!d.eligible" class="alert alert-warning py-1 px-2 mb-2"
              style="font-size:0.85rem">
              <i class="bi bi-exclamation-triangle me-1"></i>
              Not eligible: {{ d.ineligible_reasons.join(', ') }}
            </div>

            <!-- Apply button -->
            <div>
              <button v-if="!d.already_applied && d.eligible"
                @click="applyDrive(d.drive_id)"
                class="btn btn-success btn-sm">
                <i class="bi bi-check-circle me-1"></i>Apply Now
              </button>
              <span v-else-if="d.already_applied"
                class="badge bg-success">
                <i class="bi bi-check2"></i> Applied
              </span>
              <span v-else-if="!d.eligible" class="badge bg-secondary">Not Eligible</span>
            </div>
          </div>
        </div>

        <div v-if="!loadingDrives && !drives.length" class="alert alert-info">
          No approved drives available right now.
        </div>
      </div>

      <!-- MY APPLICATIONS TAB -->
      <div v-if="tab==='applied'">
        <div class="d-flex justify-content-between mb-4">
          <h4 class="mb-0">My Applications</h4>
          <button @click="exportCSV" class="btn btn-outline-primary btn-sm" :disabled="exportInProgress">
            <i class="bi bi-download me-1"></i>{{ exportInProgress ? 'Preparing CSV...' : 'Export as CSV' }}
          </button>
        </div>

        <div v-if="exportMsg" class="alert alert-info">{{ exportMsg }}</div>
        <div v-if="exportReady" class="mb-3">
          <a :href="API_BASE + '/api/student/download-csv'" class="btn btn-success btn-sm">
            <i class="bi bi-file-earmark-arrow-down me-1"></i>Download Ready CSV
          </a>
        </div>
        <div v-if="loadingApps" class="text-center"><div class="spinner-border"></div></div>

        <div v-if="!loadingApps && !myApps.length" class="alert alert-info">
          You haven't applied to any drive yet.
        </div>

        <div v-for="a in myApps" :key="a.application_id" class="card mb-3">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h6 class="mb-0">{{ a.job_title }}</h6>
                <small class="text-muted">{{ a.company_name }} — {{ a.drive_name }}</small>
              </div>
              <span class="badge" :class="'badge-'+a.status.toLowerCase()">{{ a.status }}</span>
            </div>
            <div class="mt-2" style="font-size:0.85rem; color:#666">
              <span v-if="a.salary">Salary: ₹{{ a.salary }}/yr &nbsp;|&nbsp;</span>
              <span v-if="a.location">Location: {{ a.location }} &nbsp;|&nbsp;</span>
              Applied: {{ a.applied_date.slice(0,10) }}
            </div>
            <div v-if="a.interview_type || a.interview_date"
              class="mt-1" style="font-size:0.85rem">
              <span v-if="a.interview_type">Interview: {{ a.interview_type }}</span>
              <span v-if="a.interview_date"> | Date: {{ a.interview_date.slice(0,10) }}</span>
            </div>
            <div v-if="a.remarks" class="mt-1 text-muted" style="font-size:0.85rem">
              Remarks: {{ a.remarks }}
            </div>
          </div>
        </div>
      </div>

      <!-- HISTORY TAB -->
      <div v-if="tab==='history'">
        <h4 class="mb-4">Placement History</h4>
        <div v-if="loadingApps" class="text-center"><div class="spinner-border"></div></div>
        <div v-else>
          <div v-if="!myApps.length" class="alert alert-info">No placement history yet.</div>
          <table v-else class="table table-bordered bg-white">
            <thead class="table-dark">
              <tr>
                <th>#</th><th>Company</th><th>Drive</th><th>Job Title</th>
                <th>Interview</th><th>Status</th><th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(a, i) in myApps" :key="a.application_id">
                <td>{{ i+1 }}</td>
                <td>{{ a.company_name }}</td>
                <td>{{ a.drive_name }}</td>
                <td>{{ a.job_title }}</td>
                <td>{{ a.interview_type || 'N/A' }}</td>
                <td><span class="badge" :class="'badge-'+a.status.toLowerCase()">{{ a.status }}</span></td>
                <td>{{ a.remarks || 'None' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="myApps.length" class="mt-2">
          <a :href="API_BASE + '/api/student/download-csv'"
            class="btn btn-outline-success btn-sm">
            <i class="bi bi-download me-1"></i>Download CSV
          </a>
        </div>
      </div>

      <!-- PROFILE TAB -->
      <div v-if="tab==='profile'">
        <h4 class="mb-4">My Profile</h4>
        <div class="card p-4" style="max-width:600px">
          <div v-if="profileSuccess" class="alert alert-success">{{ profileSuccess }}</div>
          <div v-if="profileError"   class="alert alert-danger">{{ profileError }}</div>

          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Full Name</label>
              <input v-model="profile.full_name" class="form-control"/>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Email</label>
              <input :value="profile.email" class="form-control" disabled/>
            </div>
          </div>
          <div class="row">
            <div class="col-md-4 mb-3">
              <label class="form-label">Branch</label>
              <select v-model="profile.branch" class="form-select">
                <option>CSE</option><option>ECE</option>
                <option>IT</option><option>ME</option>
                <option>CE</option><option>EE</option>
              </select>
            </div>
            <div class="col-md-4 mb-3">
              <label class="form-label">CGPA</label>
              <input v-model.number="profile.cgpa" type="number"
                step="0.1" min="0" max="10" class="form-control"/>
            </div>
            <div class="col-md-4 mb-3">
              <label class="form-label">Year</label>
              <select v-model.number="profile.year" class="form-select">
                <option :value="1">1st</option><option :value="2">2nd</option>
                <option :value="3">3rd</option><option :value="4">4th</option>
              </select>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Phone</label>
            <input v-model="profile.phone" class="form-control"/>
          </div>
          <button @click="saveProfile" class="btn btn-primary mb-4">
            Save Profile
          </button>

          <hr/>
          <h6>Upload Resume (PDF or DOCX)</h6>
          <div class="mb-2">
            <span v-if="profile.resume_filename" class="text-success">
              <i class="bi bi-check-circle me-1"></i>
              Current: {{ profile.resume_filename }}
            </span>
            <span v-else class="text-muted">No resume uploaded</span>
          </div>
          <input type="file" class="form-control mb-2" accept=".pdf,.docx"
            @change="onFileChange"/>
          <button @click="uploadResume" class="btn btn-outline-primary btn-sm"
            :disabled="!resumeFile">
            <i class="bi bi-upload me-1"></i>Upload Resume
          </button>
        </div>
      </div>

    </div>
  </div>
  `,

  data() {
    return {
      API_BASE,
      tab           : 'drives',
      drives        : [],
      myApps        : [],
      profile       : {},
      searchQ       : '',
      loadingDrives : false,
      loadingApps   : false,
      profileSuccess: '',
      profileError  : '',
      resumeFile    : null,
      exportMsg     : '',
      exportInProgress: false,
      exportReady     : false
    }
  },

  mounted() {
    this.loadDrives()
    this.loadApplications()
    this.loadProfile()
  },

  watch: {
    tab(newTab) {
      if (newTab === 'drives')  this.loadDrives()
      if (newTab === 'applied' || newTab === 'history') this.loadApplications()
      if (newTab === 'profile') this.loadProfile()
    }
  },

  methods: {
    async loadDrives() {
      this.loadingDrives = true
      const res = await axios.get(`${API_BASE}/api/student/drives`,
        { params: { search: this.searchQ }, withCredentials: true })
      this.drives        = res.data
      this.loadingDrives = false
    },

    async loadApplications() {
      this.loadingApps = true
      const res = await axios.get(`${API_BASE}/api/student/applications`,
        { withCredentials: true })
      this.myApps      = res.data
      this.loadingApps = false
    },

    async loadProfile() {
      const res    = await axios.get(`${API_BASE}/api/student/profile`,
        { withCredentials: true })
      this.profile = res.data
    },

    async applyDrive(driveId) {
      try {
        await axios.post(`${API_BASE}/api/student/drives/${driveId}/apply`,
          {}, { withCredentials: true })
        alert('Applied successfully!')
        this.loadDrives()       
        this.loadApplications() 
      } catch (err) {
        alert(err.response?.data?.error || 'Could not apply')
      }
    },

    async saveProfile() {
      this.profileSuccess = ''
      this.profileError   = ''
      try {
        await axios.put(`${API_BASE}/api/student/profile`,
          this.profile, { withCredentials: true })
        this.profileSuccess = 'Profile updated successfully!'
      } catch (err) {
        this.profileError = 'Failed to update profile'
      }
    },

    onFileChange(e) {
      this.resumeFile = e.target.files[0]
    },

    async uploadResume() {
      if (!this.resumeFile) return
      const formData = new FormData()
      formData.append('resume', this.resumeFile)
      try {
        const res = await axios.post(`${API_BASE}/api/student/upload-resume`,
          formData, {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        this.profile.resume_filename = res.data.filename
        this.profileSuccess = 'Resume uploaded!'
      } catch (err) {
        this.profileError = err.response?.data?.error || 'Upload failed'
      }
    },

    async exportCSV() {
      if (this.exportInProgress) return
      this.exportInProgress = true
      this.exportReady = false
      try {
        const res = await axios.post(`${API_BASE}/api/student/export-csv`,
          {}, { withCredentials: true })
        this.exportMsg = res.data.message || 'Export started. Preparing file...'

        const taskId = res.data.task_id
        if (!taskId) {
          this.exportMsg = 'Export started, but task id was missing. Please try again.'
          return
        }

        const maxAttempts = 20
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          const statusRes = await axios.get(`${API_BASE}/api/student/export-status/${taskId}`,
            { withCredentials: true })
          const status = statusRes.data?.status

          if (status === 'SUCCESS') {
            this.exportMsg = 'CSV export completed successfully. Click the Download Ready CSV button.'
            this.exportReady = true
            alert('CSV export is complete! You can download it now.')
            return
          }

          if (status === 'FAILURE') {
            this.exportMsg = 'Export failed while generating CSV. Please try again.'
            return
          }
        }

        this.exportMsg = 'Export is taking longer than expected. Please click Download CSV from History tab in a few seconds.'
      } catch (err) {
        this.exportMsg = 'Export failed. Please try again.'
      } finally {
        this.exportInProgress = false
      }
    },

    async logout() {
      await axios.post(`${API_BASE}/api/auth/logout`, {}, { withCredentials: true })
      this.$router.push('/login')
    }
  }
}
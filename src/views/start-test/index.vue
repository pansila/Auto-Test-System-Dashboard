<template>
  <div class="page-container">
    <el-form ref="form" v-loading="listLoading" :model="form" label-width="120px">
      <el-form-item label="Test Suite">
        <el-row :gutter="10" type="flex">
          <el-col>
            <el-select v-model="form.test_suite_idx" placeholder="Please select a test suite to run" style="width: 50%" @change="onTestSuiteChange">
              <el-option v-for="(t, i) in test_suite_list" :key="t" :label="t" :value="i" />
            </el-select>
          </el-col>
        </el-row>
      </el-form-item>
      <el-form-item label="Test Endpoints">
        <el-select v-model="form.endpoints" placeholder="Please select test endpoints to run" multiple style="width: 50%">
          <el-option v-for="e in endpoints" :key="e.address" :label="e.name" :value="e.endpoint_uid" />
        </el-select>
      </el-form-item>
      <el-form-item label="Priority">
        <el-radio-group v-model="form.priority">
          <el-radio label="1">Low</el-radio>
          <el-radio label="2">Medium</el-radio>
          <el-radio label="3">High</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="Parallization">
        <el-radio-group v-model="form.parallelization">
          <el-tooltip content="Run on any of selected endpoints"><el-radio label="0">Any</el-radio></el-tooltip>
          <el-tooltip content="Run on all selected endpoints"><el-radio label="1">All</el-radio></el-tooltip>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="Test Cases">
        <el-select v-model="form.test_cases" placeholder="Please select test cases to run" multiple style="width: 50%" @change="onTestCaseChange">
          <el-option v-for="t in test_cases" :key="t" :label="t | replaceSpace" :value="t" />
        </el-select>
        <el-checkbox v-model="form.test_cases_all" style="margin-left: 5px">All Test Cases</el-checkbox>
      </el-form-item>
      <el-form-item label="Variables">
        <el-table :data="variables" border fit style="width: 100%">
          <el-table-column label="Name" min-width="50px" header-align="center">
            <template slot-scope="scope">
              <span style="margin-left: 10px">{{ scope.row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Value" min-width="100px" header-align="center">
            <template slot-scope="scope">
              <template v-if="scope.row.edit">
                <el-input v-model="scope.row.value" class="edit-input" size="small" />
                <el-button class="cancel-btn" size="small" icon="el-icon-refresh" type="warning" @click="cancelEdit(scope.row)">cancel</el-button>
              </template>
              <span v-else style="margin-left: 10px">{{ scope.row.value }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Action" align="center">
            <template slot-scope="scope">
              <el-button v-if="scope.row.edit" type="success" size="small" icon="el-icon-circle-check-outline" @click="confirmEdit(scope.row)">OK</el-button>
              <el-button v-else type="primary" size="small" icon="el-icon-edit" @click="scope.row.edit=!scope.row.edit">Edit</el-button>
              <el-button size="small" @click="handleReset(scope.$index, scope.row)">Reset</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
      <el-form-item label="Upload Files">
        <el-upload
          class="upload-demo"
          action="http://abc.com"
          :on-remove="handleRemove"
          :before-remove="beforeRemove"
          multiple
          :auto-upload="false"
          :limit="3"
          :on-exceed="handleExceed"
          :on-change="onUploadFileChange"
        >
          <el-button size="small" type="primary">Upload</el-button>
        </el-upload>
      </el-form-item>
      <el-form-item style="width: 50%" label="Tester">
        <el-input :value="email" disabled />
      </el-form-item>
      <el-form-item label="CC">
        <el-select v-model="form.cc" placeholder="Others to notify" multiple style="width: 50%">
          <el-option v-for="u in coworkers" :key="u.email" :label="e.name" :value="e.email" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">Start</el-button>
        <el-button @click="onReset">Reset</el-button>
      </el-form-item>
    </el-form>
    <el-dialog title="Test Status" :visible.sync="testStatusDialogVisible" width="760px">
      <div ref="testsuite_status" />
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { fetchTests, fetchEndpoints, startTest, uploadFiles } from '@/api/testSuite'
import io from 'socket.io-client'
import { Terminal } from 'xterm'
import 'xterm/css/xterm.css'
import 'xterm/lib/xterm.js'
import { FitAddon } from 'xterm-addon-fit'
import { getToken } from '@/utils/auth'

export default {
  name: 'StartTest',
  filters: {
    replaceSpace(data) {
      return data.replace(/-/g, ' ').replace(/_/g, ' ')
    }
  },
  data() {
    return {
      tests: [],
      endpoints: [],
      fileList: [],
      coworkers: [],
      listLoading: false,
      resource_id: undefined,
      term: undefined,
      termBuffer: '',
      socket: undefined,
      testStatusDialogVisible: false,
      socketURL: process.env.NODE_ENV === 'development' ? 'ws://127.0.0.1:5000' : '',
      task_id: null,
      form: {
        tester: '',
        cc: [],
        priority: '2',
        parallelization: '0',
        test_suite_idx: null,
        endpoints: [],
        test_cases: [],
        test_cases_all: true
      }
    }
  },
  computed: {
    ...mapGetters([
      'email',
      'organization_team'
    ]),
    test_cases() {
      if (this.tests.length > 0 && this.form.test_suite_idx >= 0) {
        return this.tests[this.form.test_suite_idx].test_cases
      }
      return []
    },
    variables() {
      const variables = []
      if (this.tests.length > 0 && this.form.test_suite_idx >= 0) {
        const vars = this.tests[this.form.test_suite_idx].variables
        for (const v in vars) {
          if (v !== 'task_id' &&
              v !== 'address_daemon' &&
              v !== 'port_daemon' &&
              v !== 'port_test' &&
              v !== 'remote_daemon_address' &&
              v !== 'remote_test_address'
          ) {
            variables.push({ name: v, value: vars[v], edit: false, originalValue: vars[v] })
          }
        }
      }
      return variables
    },
    // append path if found duplicate test suites to tell them apart
    test_suite_list() {
      const tss = []
      for (let i = 0; i < this.tests.length; i++) {
        if (i === 0) {
          tss.push(this.tests[i].test_suite)
          continue
        }
        let j
        for (j = 0; j < i; j++) {
          if (this.tests[i].test_suite === this.tests[j].test_suite) {
            tss.push(this.tests[i].test_suite + ` (${this.tests[i].path})`)
            break
          }
        }
        if (j === i) {
          tss.push(this.tests[i].test_suite)
        }
      }
      return tss
    }
  },
  watch: {
    async organization_team(newValue, oldValue) {
      const [organization_n, team_n] = newValue
      const [organization_o, team_o] = oldValue || [undefined, undefined]
      await this.fetchData()
      if (this.socket) {
        this.socket.emit('leave', {
          'X-Token': getToken(),
          organization: organization_o,
          team: team_o
        })
        this.socket.emit('join', {
          'X-Token': getToken(),
          organization: organization_n,
          team: team_n
        })
      }
    }
  },
  async created() {
    await this.fetchData()
    this.socket = io.connect(this.socketURL)
    this.socket.on('disconnect', () => {
      this.leave_room()
    })
    this.socket.on('connect', () => {
      this.join_room(this.task_id)
    })
  },
  destroyed() {
    this.leave_room()
    this.socket.close()
  },
  methods: {
    join_room(task_id) {
      if (!this.organization_team) return
      const [organization, team] = this.organization_team
      if (this.term) this.term.reset()
      this.socket.off('console log')
      this.socket.on('console log', (data) => {
        if (task_id === data.task_id) {
          if (this.term) {
            if (this.termBuffer) {
              this.term.write(this.termBuffer)
              this.termBuffer = null
            }
            this.term.write(data.message)
          } else {
            this.termBuffer += data.message
          }
        }
      })
      this.socket.emit('join', {
        'X-Token': getToken(),
        organization,
        team,
        task_id
      })
    },
    leave_room() {
      if (this.organization_team) {
        const [organization, team] = this.organization_team
        this.socket.emit('leave', {
          'X-Token': getToken(),
          organization,
          team
        })
        this.socket.off('console log')
      }
    },
    initTerminal(task_id) {
      this.task_id = task_id
      if (this.term) {
        this.join_room(task_id)
        return
      }
      const terminalContainer = this.$refs['testsuite_status']
      this.term = new Terminal()
      const fitAddon = new FitAddon()
      this.term.loadAddon(fitAddon)
      this.term.open(terminalContainer)
      fitAddon.fit()
      this.term._initialized = true
      this.join_room(task_id)
    },
    async onSubmit() {
      /** upload files **/
      const [organization, team] = this.organization_team
      for (const idx in this.fileList) {
        const file = this.fileList[idx]
        const formData = new FormData()
        formData.append('organization', organization)
        formData.append('team', team)
        formData.append('file', file.raw)
        if (this.resource_id) {
          formData.append('resource_id', this.resource_id)
        }
        try {
          const resp = await uploadFiles(formData)
          this.resource_id = resp.data.resource_id
        } catch (error) {
          this.$message({
            message: 'Failed to upload files',
            type: 'error'
          })
          this.resource_id = undefined
          return
        }
      }

      /** start the test **/
      const task_data = {}

      task_data.test_suite = this.tests[this.form.test_suite_idx].test_suite
      task_data.path = this.tests[this.form.test_suite_idx].path
      task_data.endpoint_list = this.form.endpoints
      if (this.form.parallelization === '0') {
        task_data.parallelization = false
      } else {
        task_data.parallelization = true
      }
      task_data.priority = this.form.priority
      if (this.form.test_cases && this.form.test_cases.length !== 0) {
        task_data.test_cases = this.form.test_cases
      }
      const vars = this.variables
      task_data.variables = {}
      vars.forEach(v => {
        if (v.value !== v.originalValue) {
          try {
            task_data.variables[v.name] = JSON.parse(v.value)
          } catch (error) {
            console.error(error)
          }
        }
      })
      task_data.upload_dir = this.resource_id
      task_data.tester = this.email
      task_data.cc = this.form.cc
      task_data.organization = organization
      task_data.team = team

      let res
      try {
        res = await startTest(task_data)
      } catch (error) {
        this.$message({
          message: 'Failed to schedule the test',
          type: 'error'
        })
        return
      }
      this.$message({
        message: 'Schedule the test successfully',
        type: 'success'
      })
      this.resource_id = undefined
      if (this.term) {
        this.term.reset()
      }
      if (res.data.running.length > 0) {
        this.testStatusDialogVisible = true
        this.$nextTick(() => this.initTerminal(res.data.running[0]))
      } else {
        this.$store.dispatch('settings/changeSetting', {
          key: 'taskqueue_update',
          value: Math.random()
        })
      }
    },
    async onReset() {
      await this.fetchData()
    },
    async fetchData() {
      if (!this.organization_team) return
      const [organization, team] = this.organization_team
      const tests = await fetchTests({ organization, team })
      if (!tests) {
        console.error('no tests found')
      }
      this.tests = tests
      this.tests.forEach(test => {
        for (const k in test.variables) {
          test.variables[k] = JSON.stringify(test.variables[k])
        }
      })
      if (this.tests.length > 0) {
        this.form.test_suite_idx = 0
      } else {
        this.form.test_suite_idx = null
      }

      const ret = await fetchEndpoints({ organization, team })
      this.endpoints = ret.items.filter(item => {
        if (!item.name) {
          return false
        }
        return true
      })
    },
    onTestSuiteChange(test_suite_idx) {
    },
    onTestCaseChange(test_cases) {
      if (test_cases.length > 0) {
        this.form.test_cases_all = false
      } else {
        this.form.test_cases_all = true
      }
    },
    cancelEdit(row) {
      row.edit = false
      row.value = row.oldValue || row.originalValue
    },
    confirmEdit(row) {
      row.edit = false
      row.oldValue = row.value
      this.$message({
        message: 'The value has been edited',
        type: 'success'
      })
    },
    handleReset(index, row) {
      row.edit = false
      row.value = row.originalValue
      this.$message({
        message: 'The value has been restored to the original value',
        type: 'warning'
      })
    },
    handleRemove(file, fileList) {
      this.fileList = fileList
    },
    handleExceed(files, fileList) {
      this.$message.warning(`Limit to 3 files, selected ${files.length} files, All ${files.length + fileList.length} files`)
    },
    beforeRemove(file, fileList) {
      return this.$confirm(`Are you sure to delte ${file.name}?`)
    },
    onUploadFileChange(file, fileList) {
      this.fileList = fileList
    }
  }
}
</script>

<style scoped>
  .page-container{
    margin: 30px;
  }
  .edit-input {
    padding-right: 100px;
  }
  .cancel-btn {
    position: absolute;
    right: 15px;
    top: 10px;
  }
</style>

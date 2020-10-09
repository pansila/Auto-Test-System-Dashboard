<template>
  <div class="page-container">
    <el-form ref="form" v-loading="listLoading" :model="form" label-width="120px">
      <el-form-item :label="$t('testTable.test_suite')">
        <el-row :gutter="10" type="flex">
          <el-col>
            <el-select v-model="form.test_suite_idx" :placeholder="$t('task.test_suite_placeholder')" style="width: 50%" @change="onTestSuiteChange">
              <el-option v-for="(t, i) in test_suite_list" :key="t" :label="t" :value="i" />
            </el-select>
          </el-col>
        </el-row>
      </el-form-item>
      <el-form-item :label="$t('route.testEndpoint')">
        <el-select v-model="form.endpoints" :placeholder="$t('task.test_endpoint_placeholder')" multiple style="width: 50%">
          <el-option v-for="e in endpoints" :key="e.address" :label="e.name" :value="e.endpoint_uid" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('task.priority')">
        <el-radio-group v-model="form.priority">
          <el-radio label="1">{{ $t('task.priority_low') }}</el-radio>
          <el-radio label="2">{{ $t('task.priority_medium') }}</el-radio>
          <el-radio label="3">{{ $t('task.priority_high') }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="$t('task.parallization')">
        <el-radio-group v-model="form.parallelization">
          <el-tooltip :content="$t('task.parallel_any_tip')"><el-radio label="0">{{ $t('task.parallel_any') }}</el-radio></el-tooltip>
          <el-tooltip :content="$t('task.parallel_all_tip')"><el-radio label="1">{{ $t('task.parallel_all') }}</el-radio></el-tooltip>
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="$t('task.test_cases')">
        <el-select v-model="form.test_cases" placeholder="Please select test cases to run" multiple style="width: 50%" @change="onTestCaseChange">
          <el-option v-for="t in test_cases" :key="t" :label="t | replaceSpace" :value="t" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('task.variables')">
        <variable-table :data="variables" :border="true" @change="onVariableTableChange" />
      </el-form-item>
      <el-form-item :label="$t('task.upload_files')">
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
          <el-button size="small" type="primary">{{ $t('task.upload') }}</el-button>
        </el-upload>
      </el-form-item>
      <el-form-item style="width: 30%" :label="$t('task.tester')">
        <el-input :value="email" disabled />
      </el-form-item>
      <el-form-item :label="$t('task.cc')">
        <el-select v-model="form.cc" :placeholder="$t('task.cc_placeholder')" multiple style="width: 50%">
          <el-option v-for="u in coworkers" :key="u.email" :label="e.name" :value="e.email" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">{{ $t('task.start') }}</el-button>
        <el-button @click="onReset">{{ $t('task.reset') }}</el-button>
      </el-form-item>
    </el-form>
    <el-dialog title="Test Status" :visible.sync="testStatusDialogVisible" width="760px">
      <el-tabs @tab-click="tab_click">
        <el-tab-pane label="Test Report">
          <div ref="robot_log" />
        </el-tab-pane>
        <el-tab-pane label="Test Log">
          <div ref="runtime_log" />
        </el-tab-pane>
      </el-tabs>
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
import VariableTable from './variable_table'

const ALL_TEST_CASES = 'testTable.all_test_cases'

export default {
  name: 'StartTest',
  components: {
    VariableTable
  },
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
      robotlog_term: undefined,
      runtimelog_term: undefined,
      termBuffer_robotlog: '',
      termBuffer_runtimelog: '',
      socket: undefined,
      testStatusDialogVisible: false,
      socketURL: process.env.NODE_ENV === 'development' ? 'ws://127.0.0.1:5000' : '',
      task_id: null,
      variablesChanged: {},
      form: {
        tester: '',
        cc: [],
        priority: '2',
        parallelization: '0',
        test_suite_idx: null,
        endpoints: [],
        test_cases: [this.$t(ALL_TEST_CASES)],
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
        return [this.$t(ALL_TEST_CASES)].concat(this.tests[this.form.test_suite_idx].test_cases)
      }
      return []
    },
    variables() {
      if (this.form.test_suite_idx !== null && this.form.test_suite_idx >= 0) {
        return this.tests[this.form.test_suite_idx].variables
      }
      return {}
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
      await this.fetchData()
      if (this.socket) {
        oldValue && this.leave_room(oldValue)
        this.join_room()
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
      this.join_room()
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

      if (task_id) {
        if (this.robotlog_term) this.robotlog_term.reset()
        if (this.runtimelog_term) this.runtimelog_term.reset()

        this.socket.off('test report')
        this.socket.on('test report', (data) => {
          if (task_id === data.task_id) {
            if (this.robotlog_term) {
              if (this.termBuffer_robotlog) {
                this.robotlog_term.write(this.termBuffer_robotlog)
                this.termBuffer_robotlog = null
              }
              this.robotlog_term.write(data.message)
            } else {
              this.termBuffer_robotlog += data.message
            }
          }
        })
        this.socket.off('test log')
        this.socket.on('test log', (data) => {
          if (task_id === data.task_id) {
            if (this.runtimelog_term) {
              if (this.termBuffer_runtimelog) {
                this.runtimelog_term.write(this.termBuffer_runtimelog)
                this.termBuffer_runtimelog = null
              }
              this.runtimelog_term.write(data.message)
            } else {
              this.termBuffer_runtimelog += data.message
            }
          }
        })
      }

      this.socket.emit('join', {
        'X-Token': getToken(),
        organization,
        team,
        task_id
      })
    },
    leave_room(organization_team) {
      const [organization, team] = organization_team || this.organization_team || [undefined, undefined]
      this.socket.emit('leave', {
        'X-Token': getToken(),
        organization,
        team
      })
      this.socket.off('test log')
      this.socket.off('test report')
    },
    tab_click() {
      this.$nextTick(() => this.initTerminal2())
    },
    initTerminal1() {
      if (this.robotlog_term) {
        this.join_room(this.task_id)
      } else {
        const container1 = this.$refs['robot_log']
        this.robotlog_term = new Terminal()
        const fitAddon1 = new FitAddon()
        this.robotlog_term.loadAddon(fitAddon1)
        this.robotlog_term.open(container1)
        fitAddon1.fit()
        this.robotlog_term._initialized = true
        this.join_room(this.task_id)
      }
    },
    initTerminal2() {
      if (!this.runtimelog_term) {
        const container2 = this.$refs['runtime_log']
        this.runtimelog_term = new Terminal()
        const fitAddon2 = new FitAddon()
        this.runtimelog_term.loadAddon(fitAddon2)
        this.runtimelog_term.open(container2)
        fitAddon2.fit()
        this.runtimelog_term._initialized = true
      }
    },
    async onSubmit() {
      /** upload files **/
      if (this.tests.length === 0) return
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
        const all_idx = this.form.test_cases.indexOf(this.$t(ALL_TEST_CASES))
        if (all_idx < 0) {
          task_data.test_cases = this.form.test_cases
        }
      }
      task_data.variables = this.variablesChanged || undefined
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
      this.robotlog_term && this.robotlog_term.reset()
      this.runtimelog_term && this.runtimelog_term.reset()
      if (res.data.running.length > 0) {
        this.testStatusDialogVisible = true
        this.task_id = res.data.running[0]
        this.$nextTick(() => this.initTerminal1())
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
      this.form.test_cases = [this.$t(ALL_TEST_CASES)]
      this.form.test_cases_all = true
      this.variablesChanged = {}
    },
    onTestCaseChange(test_cases) {
      const all_idx = test_cases.indexOf(this.$t(ALL_TEST_CASES))
      if (test_cases.length === 0) {
        this.form.test_cases = [this.$t(ALL_TEST_CASES)]
        this.form.test_cases_all = true
        return
      }
      if (test_cases.length > 0 && all_idx >= 0) {
        if (!this.form.test_cases_all) {
          this.form.test_cases = [this.$t(ALL_TEST_CASES)]
          this.form.test_cases_all = true
        } else {
          test_cases.splice(all_idx, 1)
          this.form.test_cases = test_cases
          this.form.test_cases_all = false
        }
      } else {
        this.form.test_cases = test_cases
      }
    },
    onVariableTableChange(newVal) {
      const { name, value } = newVal
      this.variablesChanged[name] = value
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
</style>

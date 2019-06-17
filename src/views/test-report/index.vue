<template>
  <div class="page-container">
    <div class="filter-container">
      <el-cascader
        v-model="organization_team"
        class="filter-item"
        placeholder="Organization / Team"
        :options="organizations"
        @change="onOrgTeamChange"
      />
      <el-input v-model="listQuery.title" placeholder="title" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter" />
      <el-select v-model="listQuery.priority" placeholder="priority" clearable style="width: 120px" class="filter-item">
        <el-option v-for="item in priorityOptions" :key="item.key" :label="item.name" :value="item.key" />
      </el-select>
      <el-select v-model="listQuery.endpoint" placeholder="endpoint" clearable class="filter-item" style="width: 240px">
        <el-option v-for="item in endpoints" :key="item.address" :label="item.name + ' (' + item.address + ')'" :value="item.address" />
      </el-select>
      <el-select v-model="listQuery.sort" style="width: 160px" class="filter-item" @change="handleFilter">
        <el-option v-for="item in sortOptions" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>
      <el-date-picker
        v-model="listQuery.start_date"
        type="date"
        placeholder="Start Date"
        :picker-options="pickerOptions1"
        class="filter-item"
      />
      <el-date-picker
        v-model="listQuery.end_date"
        align="right"
        type="date"
        placeholder="End Date"
        :picker-options="pickerOptions2"
        class="filter-item"
      />
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">{{ 'search' }}</el-button>
    </div>

    <el-table
      v-loading="listLoading"
      :data="tasks"
      border
      fit
      style="width: 100%"
    >
      <el-table-column label="Test Suite" min-width="100" header-align="center">
        <template slot-scope="scope">
          <span class="link-type" @click="onTestDetail(scope.row)">{{ scope.row.test_suite }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Test Comment" min-width="100" header-align="center">
        <template slot-scope="scope">
          <template v-if="scope.row.edit">
            <el-input v-model="scope.row.comment" class="edit-input" size="small" />
            <el-button class="cancel-btn" size="small" icon="el-icon-refresh" type="warning" @click="cancelEdit(scope.row)">cancel</el-button>
          </template>
          <span v-else style="margin-left: 10px">{{ scope.row.comment }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Run Date" width="195" align="center">
        <template slot-scope="scope">
          {{ scope.row.run_date | dateFilter }}
        </template>
      </el-table-column>
      <el-table-column label="Tester" width="180" align="center">
        <template slot-scope="scope">
          {{ scope.row.tester }}
        </template>
      </el-table-column>
      <el-table-column label="priority" width="80px">
        <template slot-scope="scope">
          <svg-icon v-for="n in +scope.row.priority" :key="n" icon-class="star" class="meta-item__icon" />
        </template>
      </el-table-column>
      <el-table-column label="Status" width="100" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status | statusFilter">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Action" width="320" align="center">
        <template slot-scope="scope">
          <el-button v-if="scope.row.edit" type="success" size="small" icon="el-icon-circle-check-outline" @click="confirmEdit(scope.row)">OK</el-button>
          <el-button v-else size="small" icon="el-icon-edit" @click="scope.row.edit=!scope.row.edit">Edit</el-button>
          <el-button size="small" @click="handleDownload(scope.$index, scope.row)">Download</el-button>
          <el-button type="primary" size="small" @click="handleRetrigger(scope.$index, scope.row)">Retrigger</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="fetchTaskList" />

    <el-dialog title="Update" :visible.sync="dialogFormVisible">
      <el-form ref="form" v-loading="listFormLoading" :model="form" label-width="120px">
        <el-form-item label="Test Suite">
          <el-select v-model="form.test_suite_idx" placeholder="Please select a test suite to run">
            <el-option v-for="(t, i) in tests" :key="t.test_suite" :label="t.test_suite | replaceSpace" :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item label="Test Endpoints">
          <el-select v-model="form.endpoints" placeholder="Please select test endpoints to run" multiple>
            <el-option v-for="e in endpoints" :key="e.address" :label="e.name + ' (' + e.address + ')'" :value="e.address" />
          </el-select>
        </el-form-item>
        <el-form-item label="Parallization">
          <el-radio-group v-model="form.parallelization">
            <el-radio label="0">Run on any of selected endpoints</el-radio>
            <el-radio label="1">Run on all selected endpoints</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Test Cases">
          <el-select v-model="form.test_cases" placeholder="Please select test cases to run" multiple @change="onTestCaseChange">
            <el-option v-for="t in test_cases" :key="t" :label="t | replaceSpace" :value="t" />
          </el-select>
          <el-checkbox v-model="form.test_cases_all">All Test Cases</el-checkbox>
        </el-form-item>
        <el-form-item label="Variables">
          <el-table :data="variables" border fit style="width: 100%">
            <el-table-column label="Name" min-width="50px">
              <template slot-scope="scope">
                <span style="margin-left: 10px">{{ scope.row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Value" min-width="100px">
              <template slot-scope="scope">
                <template v-if="scope.row.edit">
                  <el-input v-model="scope.row.value" class="edit-input" size="small" />
                  <el-button class="cancel-btn" size="small" icon="el-icon-refresh" type="warning" @click="cancelVariableEdit(scope.row)">cancel</el-button>
                </template>
                <span v-else style="margin-left: 10px">{{ scope.row.value }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Action">
              <template slot-scope="scope">
                <el-button v-if="scope.row.edit" type="success" size="small" icon="el-icon-circle-check-outline" @click="confirmVariableEdit(scope.row)">OK</el-button>
                <el-button v-else type="primary" size="small" icon="el-icon-edit" @click="scope.row.edit=!scope.row.edit">Edit</el-button>
                <el-button size="small" @click="handleVariableReset(scope.$index, scope.row)">Reset</el-button>
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
            :file-list="fileList"
          >
            <el-button size="small" type="primary">Upload</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="Tester">
          <el-input v-model="email" disabled />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">{{ 'cancel' }}</el-button>
        <el-button type="primary" @click="onSubmit">{{ 'confirm' }}</el-button>
      </div>
    </el-dialog>
    <el-dialog title="Download" :visible.sync="downloadDialogVisible">
      <el-card class="box-card" shadow="never">
        <el-tree :data="test_results || []" :render-content="renderContent" @node-click="onDownloadScript" />
      </el-card>
      <div slot="footer" class="dialog-footer">
        <el-button @click="downloadDialogVisible = false">{{ 'Close' }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination
import { fetchTasks, fetchTest, fetchTests, fetchEndpoints, updateTask, startTest, uploadFiles, getTaskResourceList, fetchTestResultFiles, fetchTestResultFile } from '@/api/testSuite'
import { fetchJoinedOrganizationTeams } from '@/api/user'
import waves from '@/directive/waves' // Waves directive
import fileDownload from 'js-file-download'

export default {
  name: 'TestReport',
  components: { Pagination },
  directives: { waves },
  filters: {
    replaceSpace(data) {
      return data.replace(/-/g, ' ')
    },
    statusFilter(status) {
      const statusMap = {
        successful: 'success',
        failed: 'danger',
        running: 'message',
        waiting: 'warning',
        cancelled: 'warning',
        aborted: 'danger'
      }
      return statusMap[status]
    },
    dateFilter(time) {
      const date = new Date()
      date.setTime(time)
      return date.toLocaleString({ year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric' })
    }
  },
  data() {
    return {
      tests: [],
      tasks: [],
      endpoints: [],
      variables_retrigger: [],
      total: 0,
      listLoading: false,
      listFormLoading: false,
      priorityOptions: [{ key: 1, name: 'Low' }, { key: 2, name: 'Medium' }, { key: 3, name: 'High' }],
      sortOptions: [{ label: 'Date Ascending', key: '+run_date' }, { label: 'Date Descending', key: '-run_date' }],
      dialogFormVisible: false,
      downloadDialogVisible: false,
      test_results: [],
      currentTask: null,
      fileList: [],
      resource_id: undefined,
      organization_team: null,
      organizations: [],
      form: {
        tester: '',
        parallelization: '0',
        test_suite_idx: 0,
        endpoints: [],
        test_cases: [],
        test_cases_all: true
      },
      listQuery: {
        page: 1,
        limit: 10,
        priority: undefined,
        title: undefined,
        type: undefined,
        sort: '-run_date',
        start_date: undefined,
        end_date: undefined
      },
      pickerOptions1: {
        disabledDate(time) {
          return time.getTime() > Date.now()
        },
        shortcuts: [{
          text: 'Today',
          onClick(picker) {
            picker.$emit('pick', new Date())
          }
        }, {
          text: 'Yesterday',
          onClick(picker) {
            const date = new Date()
            date.setTime(date.getTime() - 3600 * 1000 * 24)
            picker.$emit('pick', date)
          }
        }, {
          text: 'A Week Ago',
          onClick(picker) {
            const date = new Date()
            date.setTime(date.getTime() - 3600 * 1000 * 24 * 7)
            picker.$emit('pick', date)
          }
        }]
      },
      pickerOptions2: {
        disabledDate(time) {
          return time.getTime() > Date.now()
        },
        shortcuts: [{
          text: 'Today',
          onClick(picker) {
            picker.$emit('pick', new Date())
          }
        }]
      }
    }
  },
  computed: {
    ...mapGetters([
      'email'
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
        for (const v in this.variables_retrigger) {
          for (const vv in variables) {
            if (variables[vv].name === v) {
              variables[vv].value = this.variables_retrigger[v]
              variables[vv].originalValue = this.variables_retrigger[v]
            }
          }
        }
      }
      return variables
    }
  },
  async created() {
    this.organizations = await fetchJoinedOrganizationTeams()
  },
  methods: {
    async onSubmit() {
      /** upload files **/
      this.listFormLoading = true

      const formData = new FormData()
      if (this.resource_id) {
        formData.append('resource_id', this.resource_id)
      }
      for (const idx in this.fileList) {
        const file = this.fileList[idx]
        if (file.url) {
          formData.append('file', file.url)
        } else {
          formData.append('file', file.raw)
        }
      }
      try {
        const data = await uploadFiles(formData)
        if (data.status === 0) {
          this.resource_id = data.data
        } else {
          this.$message({
            message: `Failed to upload files, status: ${data.status}`,
            type: 'error'
          })
          this.resource_id = undefined
          this.listFormLoading = false
          return
        }
      } catch (error) {
        this.resource_id = undefined
        this.listFormLoading = false
        return
      }
      this.listFormLoading = false

      /** start the test **/
      const task_data = {}
      this.listFormLoading = true

      task_data.test_suite = this.tests[this.form.test_suite_idx].test_suite
      task_data.endpoint_list = this.form.endpoints
      if (this.form.parallelization === '0') {
        task_data.parallelization = false
      } else {
        task_data.parallelization = true
      }
      if (!this.form.test_cases_all) {
        task_data.test_cases = this.form.test_cases
      }
      const vars = this.variables
      task_data.variables = {}
      for (const idx in vars) {
        task_data.variables[vars[idx].name] = vars[idx].value
      }
      task_data.upload_dir = this.resource_id
      task_data.tester = this.form.tester

      try {
        await startTest(task_data)
        this.listFormLoading = false
        this.dialogFormVisible = false
      } catch (error) {
        this.listFormLoading = false
      }
      this.resource_id = undefined
    },
    async fetchTaskList() {
      const [organization, team] = this.organization_team
      this.listQuery.organization = organization
      this.listQuery.team = team
      try {
        const data = await fetchTasks(this.listQuery)
        this.tasks = data.items
        this.tasks.forEach(item => {
          this.$set(item, 'edit', false)
          item.oldComment = item.comment
        })
        this.total = data.total
      } catch (error) {
        console.error(error)
      }
    },
    async fetchTestList() {
      this.listLoading = true
      try {
        this.tests = await fetchTests(this.listQuery)
      } catch (error) {
        console.error(error)
      }

      const [organization, team] = this.organization_team
      try {
        this.endpoints = await fetchEndpoints({ organization, team })
      } catch (error) {
        console.error(error)
      }
      this.listLoading = false
    },
    onTestCaseChange(test_cases) {
      if (test_cases.length > 0) {
        this.form.test_cases_all = false
      } else {
        this.form.test_cases_all = true
      }
    },
    cancelVariableEdit(row) {
      row.edit = false
      row.value = row.oldValue ? row.oldValue : row.originalValue
    },
    confirmVariableEdit(row) {
      row.edit = false
      row.oldValue = row.value
      this.$message({
        message: 'The value has been edited',
        type: 'success'
      })
    },
    handleVariableReset(index, row) {
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
    },
    handleFilter() {
      this.listQuery.page = 1
      const start_date = this.listQuery.start_date

      if (start_date) {
        const end_date = this.listQuery.end_date
        const now = new Date()

        if (start_date.getTime() === end_date.getTime()) {
          end_date.setTime(end_date.getTime() + 3600 * 1000 * 24 - 1)
        } else if (end_date.getDay() === now.getDay() &&
          end_date.getMonth() === now.getMonth() &&
          end_date.getFullYear() === now.getFullYear()) {
          start_date.setHours(0)
          start_date.setMinutes(0)
          start_date.setSeconds(0)
        }
      } else {
        this.listQuery.end_date = undefined
      }
      this.fetchTaskList()
    },
    cancelEdit(row) {
      row.edit = false
      row.comment = row.oldComment
    },
    async confirmEdit(row) {
      row.edit = false
      row.oldComment = row.comment
      this.$message({
        message: 'The value has been edited',
        type: 'success'
      })

      this.listLoading = true
      try {
        await updateTask(row)
      } catch (error) {
        console.error(error)
      }
      this.listLoading = false
    },
    renderContent(h, { node, data, store }) {
      return (
        <span>{node.label}</span>
      )
    },
    getScriptPath(path, tree, node) {
      return tree.every(e => {
        if (e.$treeNodeId === node.$treeNodeId) {
          path.push(e.label)
          return false
        }
        if (e.children) {
          const ret = this.getScriptPath(path, e.children, node)
          if (!ret) {
            path.unshift(e.label)
          }
          return ret
        }
        return true
      })
    },
    async onDownloadScript(data, node) {
      if (data.type === 'directory') {
        return
      }
      const path = []
      this.getScriptPath(path, this.test_results, data)
      const [organization, team] = this.organization_team
      const resp = await fetchTestResultFile({ file: path.join('/'), task_id: this.currentTask.id, organization, team })
      fileDownload(resp, data.label)
    },
    async handleDownload(index, row) {
      const task = this.tasks[index]
      const [organization, team] = this.organization_team
      const resp = await fetchTestResultFiles({ task_id: task.id, organization, team })
      this.test_results = resp.data.files.children
      this.currentTask = task
      this.downloadDialogVisible = true
    },
    async handleRetrigger(index, row) {
      const task = this.tasks[index]
      const [organization, team] = this.organization_team
      let test

      this.listFormLoading = true
      this.fileList = []
      try {
        const fileList = await getTaskResourceList({ task_id: task.id, organization, team })
        for (const i in fileList) {
          this.$set(this.fileList, i, { name: fileList[i], url: process.env.BASE_API + `/taskresource/${task.id}?file=` + fileList[i] })
        }
      } catch (error) {
        this.$message({
          message: 'Resource files have been deleted',
          type: 'error'
        })
      }

      try {
        await this.fetchTestList()
        test = await fetchTest(task.test_suite, { organization, team })
        this.listFormLoading = false
      } catch (error) {
        this.listFormLoading = false
        return
      }

      for (const i in this.tests) {
        if (this.tests[i].test_suite === task.test_suite) {
          this.form.test_suite_idx = +i
          break
        }
      }
      this.form.endpoints = task.endpoint_list
      this.form.test_cases_all = task.testcases.length === 0 || test.test_cases.length === task.testcases.length
      if (!this.form.test_cases_all) {
        this.form.test_cases = task.test_cases
      }
      this.form.tester = task.tester
      this.form.parallelization = task.parallelization === true ? '1' : '0'
      this.variables_retrigger = task.variables

      this.dialogFormVisible = true
    },
    onTestDetail(row) {
      const [organization, team] = this.organization_team
      this.$router.push({
        path: 'test-detail',
        query: {
          task_id: row.id,
          organization,
          team
        }
      })
    },
    async onOrgTeamChange() {
      await this.fetchTaskList()

      const [organization, team] = this.organization_team
      this.endpoints = await fetchEndpoints({ organization, team })
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

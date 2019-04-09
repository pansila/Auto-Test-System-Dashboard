<template>
  <div class="page-container">
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
            <el-button class="cancel-btn" size="small" icon="el-icon-refresh" type="warning" @click="cancelEdit(scope.row)">cancel</el-button>
          </template>
          <span v-else style="margin-left: 10px">{{ scope.row.value }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Action">
        <template slot-scope="scope">
          <el-button v-if="scope.row.edit" type="success" size="small" icon="el-icon-circle-check-outline" @click="confirmEdit(scope.row)">OK</el-button>
          <el-button v-else type="primary" size="small" icon="el-icon-edit" @click="scope.row.edit=!scope.row.edit">Edit</el-button>
          <el-button size="small" @click="handleReset(scope.$index, scope.row)">Reset</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { fetchList, fetchEndpoints, startTest, uploadFiles } from '@/api/testSuite'

export default {
  name: 'StartTest',
  filters: {
    replaceSpace(data) {
      return data.replace(/-/g, ' ')
    }
  },
  data() {
    return {
      uploadURL: process.env.BASE_API + '/taskresource/',
      tests: [],
      endpoints: [],
      fileList: [],
      listLoading: false,
      resource_id: undefined,
      form: {
        tester: '',
        parallelization: '0',
        test_suite_idx: 0,
        endpoints: [],
        test_cases: [],
        test_cases_all: true
      }
    }
  },
  computed: {
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
    }
  },
  watch: {
  },
  created() {
    this.fetchData()
  },
  methods: {
    async onSubmit() {
      /** upload files **/
      this.listLoading = true

      for (const idx in this.fileList) {
        const file = this.fileList[idx]
        const formData = new FormData()
        formData.append('file', file.raw)
        if (this.resource_id) {
          formData.append('resource_id', this.resource_id)
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
            this.listLoading = false
            return
          }
        } catch (error) {
          this.resource_id = undefined
          this.listLoading = false
          return
        }
      }
      this.listLoading = false

      /** start the test **/
      const task_data = {}
      this.listLoading = true

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
        this.listLoading = false
      } catch (error) {
        this.listLoading = false
      }
      this.resource_id = undefined
    },
    fetchData() {
      fetchList(this.listQuery).then(data => {
        this.tests = data
      })
      fetchEndpoints().then(data => {
        this.endpoints = data
      })
    },
    onTestSuiteChange(test_suite_idx) {
      console.log(test_suite_idx)
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
      row.value = row.oldValue ? row.oldValue : row.originalValue
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

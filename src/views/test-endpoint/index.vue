<template>
  <div class="page-container">
    <div class="filter-container">
      <el-row :gutter="10" type="flex" justify="space-between">
        <el-col style="width: auto;">
          <el-row :gutter="10" type="flex">
            <el-col style="width: auto;">
              <el-input v-model="listQuery.title" placeholder="title" style="width: 200px;" class="filter-item" />
            </el-col>
            <el-col style="width: auto;">
              <el-button v-waves class="filter-item" icon="el-icon-search" @click="handleFilter">{{ 'search' }}</el-button>
            </el-col>
            <el-col style="width: auto;">
              <el-checkbox-group v-model="filterGroup">
                <el-checkbox-button key="Unauthorized" label="Unauthorized">Unauthorized</el-checkbox-button>
                <el-checkbox-button key="Forbidden" label="Forbidden">Forbidden</el-checkbox-button>
              </el-checkbox-group>
            </el-col>
          </el-row>
        </el-col>
        <el-col style="width: auto;">
          <el-button @click="onDownloadEndpoint">{{ 'Download Endpint' }}</el-button>
        </el-col>
      </el-row>
    </div>

    <el-table
      v-loading="listLoading"
      :data="endpoints"
      border
      fit
      style="width: 100%"
    >
      <el-table-column label="Endpoint" min-width="100" header-align="center">
        <template slot-scope="scope">
          {{ scope.row.name }}
        </template>
      </el-table-column>
      <el-table-column label="UUID" min-width="100" header-align="center" align="center">
        <template slot-scope="scope">
          <a @click="clickToCopy(scope.row.endpoint_uid)">
            {{ scope.row.endpoint_uid }}
          </a>
        </template>
      </el-table-column>
      <el-table-column label="Last Run" width="195" align="center">
        <template slot-scope="scope">
          {{ scope.row.last_run | dateFilter }}
        </template>
      </el-table-column>
      <el-table-column label="Status" min-width="40" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status | statusFilter">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Action" width="220" align="center">
        <template slot-scope="scope">
          <div v-if="is_endpoint_authorized(scope.row)">
            <el-button type="primary" size="small" @click="handleUpdateEndpoint(scope.$index, scope.row)">Edit</el-button>
            <el-button size="small" @click="handleRemove(scope.$index, scope.row)">Remove</el-button>
          </div>
          <div v-else>
            <el-button type="primary" size="small" @click="handleAuthorize(scope.$index, scope.row)">Authorize</el-button>
            <el-button size="small" @click="handleForbid(scope.$index, scope.row)">Forbid</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="fetchEndpointList" />

    <el-dialog title="Edit Endpoint Configurations" :visible.sync="dialogFormVisible">
      <JsonEditor v-show="false" :data="endpoint_config" />
      <el-form ref="form" v-loading="listFormLoading" :model="form" label-width="140px">
        <el-form-item label="Name">
          <el-input v-model="form.endpoint_name" />
        </el-form-item>
        <el-form-item label="Supported Tests">
          <el-select v-model="form.tests" placeholder="Please select test cases this endpoint supports" multiple>
            <el-option v-for="t in test_suite_list" :key="t" :label="t | replaceSpace" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="Enable/Disable">
          <el-checkbox v-model="form.enable" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">{{ 'cancel' }}</el-button>
        <el-button type="primary" @click="onSubmit">{{ 'confirm' }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination
import { testEndpoint, updateEndpoint, deleteEndpoint, fetchTests, fetchEndpoints, authorizeEndpoint, forbidEndpoint, downloadFile, fetchEndpointConfig } from '@/api/testSuite'
import waves from '@/directive/waves' // Waves directive
import { setTimeout } from 'timers'
import fileDownload from 'js-file-download'
import JsonEditor from '@/components/JsonEditor'

export default {
  name: 'TestReport',
  components: { Pagination, JsonEditor },
  directives: { waves },
  filters: {
    replaceSpace(data) {
      return data.replace(/-/g, ' ')
    },
    statusFilter(status) {
      const statusMap = {
        Online: 'success',
        Offline: 'danger'
      }
      return statusMap[status]
    },
    dateFilter(time) {
      if (time === 0) return undefined
      const date = new Date()
      date.setTime(time)
      return date.toLocaleString({ year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric' })
    }
  },
  data() {
    return {
      tests: [],
      endpoints: [],
      total: 0,
      listLoading: false,
      listFormLoading: false,
      dialogFormVisible: false,
      endpoint_config: '',
      form: {
        endpoint_name: '',
        enable: false,
        tests: [],
        uid: null
      },
      listQuery: {
        page: 1,
        limit: 10,
        title: undefined,
        organization: null,
        team: null
      },
      filterGroup: []
    }
  },
  computed: {
    ...mapGetters([
      'organization_team'
    ]),
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
    async organization_team(value) {
      await this.fetchEndpointList()
    },
    async filterGroup() {
      await this.fetchEndpointList()
    }
  },
  async created() {
    await this.fetchEndpointList()
  },
  methods: {
    is_endpoint_authorized(endpoint) {
      if (endpoint.status !== 'Unauthorized' && endpoint.status !== 'Forbidden') {
        return true
      }
      return false
    },
    async fetchEndpointList() {
      if (!this.organization_team) return
      const [organization, team] = this.organization_team
      this.listQuery.organization = organization
      this.listQuery.team = team
      this.listQuery.unauthorized = false
      this.listQuery.forbidden = false
      for (const q of this.filterGroup) {
        if (q === 'Unauthorized') this.listQuery.unauthorized = true
        if (q === 'Forbidden') this.listQuery.forbidden = true
      }

      this.listLoading = true
      try {
        const ret = await fetchEndpoints(this.listQuery)
        this.endpoints = ret.items
        this.total = ret.total
      } catch (error) {
        console.error(error)
      }
      this.listLoading = false
    },
    async fetchTestList() {
      this.listLoading = true
      try {
        this.tests = await fetchTests(this.listQuery)
      } catch (error) {
        console.error(error)
      }
      this.listLoading = false
    },
    async getEndpointConfig(uuid) {
      const [organization, team] = this.organization_team
      this.listLoading = true
      try {
        this.endpoint_config = await fetchEndpointConfig({ organization, team, uuid })
      } catch (error) {
        console.error(error)
      }
      this.listLoading = false
    },
    async onTestConnectivity() {
      this.listFormLoading = true
      const { endpoint_address } = this.form
      try {
        const [organization, team] = this.organization_team
        const res = await testEndpoint({ organization, team, address: endpoint_address.trim() })
        const message = 'Endpoint is ' + (res.data.status ? 'online' : 'offline')
        this.$message({
          message,
          type: 'information'
        })
      } catch (error) {
        console.error(error)
      }
      this.listFormLoading = false
    },
    async onSubmit() {
      this.listFormLoading = true
      try {
        const [organization, team] = this.organization_team
        await updateEndpoint(Object.assign({ organization, team }, this.form))
        await this.fetchEndpointList()
        this.dialogFormVisible = false
      } catch (error) {
        console.error(error)
      }
      this.listFormLoading = false
    },
    async handleRemove(index, row) {
      this.listFormLoading = true
      try {
        const [organization, team] = this.organization_team
        await deleteEndpoint({
          endpoint_uid: this.endpoints[index].endpoint_uid,
          organization,
          team
        })
        setTimeout(this.fetchEndpointList, 2000)
      } catch (error) {
        console.error(error)
      }
      this.listFormLoading = false
    },
    handleFilter() {
      this.listQuery.page = 1
      this.fetchEndpointList()
    },
    async handleUpdateEndpoint(index, row) {
      if (!this.organization_team) {
        this.$message({
          message: 'Please select an organization/team first',
          type: 'warning'
        })
        return
      }
      await this.fetchTestList()
      await this.getEndpointConfig(this.endpoints[index].endpoint_uid)

      this.addEndpoint = false
      this.form.endpoint_name = this.endpoints[index].name
      this.form.endpoint_address = this.endpoints[index].address
      this.form.tests = this.endpoints[index].tests
      this.form.enable = this.endpoints[index].enable
      this.form.uid = this.endpoints[index].endpoint_uid

      this.dialogFormVisible = true
    },
    async handleAuthorize(index, row) {
      this.listFormLoading = true
      try {
        const [organization, team] = this.organization_team
        await authorizeEndpoint({
          endpoint_uid: this.endpoints[index].endpoint_uid,
          organization,
          team
        })
        setTimeout(this.fetchEndpointList, 2000)
      } catch (error) {
        console.error(error)
      }
      this.listFormLoading = false
    },
    async handleForbid(index, row) {
      this.listFormLoading = true
      try {
        const [organization, team] = this.organization_team
        await forbidEndpoint({
          endpoint_uid: this.endpoints[index].endpoint_uid,
          organization,
          team
        })
        setTimeout(this.fetchEndpointList, 2000)
      } catch (error) {
        console.error(error)
      }
      this.listFormLoading = false
    },
    async onDownloadEndpoint() {
      const random_num = Math.random().toString(10).substring(2) // bypass the web cache
      const resp = await downloadFile({ file: 'get-endpoint.py', random_num })
      fileDownload(resp, 'get-endpoint.py')
    },
    clickToCopy(uuid) {
      navigator.clipboard.writeText(uuid)
      this.$message('UUID has been copied to clipboard')
    }
  }
}
</script>

<style scoped>
  .page-container{
    margin: 30px;
  }
</style>

<template>
  <div class="page-container">
    <div class="filter-container">
      <el-input v-model="listQuery.title" placeholder="title" style="width: 200px;" class="filter-item" />
      <el-button v-waves class="filter-item" icon="el-icon-search" @click="handleFilter">{{ 'search' }}</el-button>
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-plus" @click="handleAddEndpoint()">Add Endpoint</el-button>
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
      <el-table-column label="Address" min-width="100" header-align="center">
        <template slot-scope="scope">
          {{ scope.row.address }}
        </template>
      </el-table-column>
      <el-table-column label="Last Run" width="195" align="center">
        <template slot-scope="scope">
          {{ scope.row.last_run | dateFilter }}
        </template>
      </el-table-column>
      <el-table-column label="Status" width="100" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status | statusFilter">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Action" width="220" align="center">
        <template slot-scope="scope">
          <el-button size="small" @click="handleRemove(scope.$index, scope.row)">Remove</el-button>
          <el-button type="primary" size="small" @click="handleAddEndpoint(scope.$index, scope.row)">Edit</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="fetchEndpointList" />

    <el-dialog title="Edit Endpoint Configurations" :visible.sync="dialogFormVisible">
      <el-form ref="form" v-loading="listFormLoading" :model="form" label-width="120px">
        <el-form-item label="Name">
          <el-input v-model="form.endpoint_name" />
        </el-form-item>
        <el-form-item label="Address">
          <el-input v-model="form.endpoint_address" />
        </el-form-item>
        <el-form-item label="Supported Tests">
          <el-select v-model="form.tests" placeholder="Please select test cases this endpoint supports" multiple>
            <el-option v-for="t in tests" :key="t.test_suite" :label="t.test_suite | replaceSpace" :value="t.test_suite" />
          </el-select>
        </el-form-item>
        <el-form-item label="Enable/Disable">
          <el-checkbox v-model="form.enable" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button v-if="addEndpoint" @click="onTestConnectivity">Test</el-button>
        <el-button @click="dialogFormVisible = false">{{ 'cancel' }}</el-button>
        <el-button type="primary" @click="onSubmit">{{ 'confirm' }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination
import { updateEndpoint, deleteEndpoint, fetchTests, fetchEndpoints } from '@/api/testSuite'
import waves from '@/directive/waves' // Waves directive
import { setTimeout } from 'timers'

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
      addEndpoint: false,
      tests: [],
      endpoints: [],
      total: 0,
      listLoading: false,
      listFormLoading: false,
      dialogFormVisible: false,
      form: {
        endpoint_name: '',
        endpoint_address: '',
        enable: false,
        tests: []
      },
      listQuery: {
        page: 1,
        limit: 10,
        title: undefined,
        organization: null,
        team: null
      }
    }
  },
  computed: {
    ...mapGetters([
      'organization_team'
    ])
  },
  watch: {
    async organization_team(value) {
      await this.fetchEndpointList()
    }
  },
  async created() {
    await this.fetchEndpointList()
  },
  methods: {
    async fetchEndpointList() {
      const [organization, team] = this.organization_team
      this.listQuery.organization = organization
      this.listQuery.team = team

      this.listLoading = true
      try {
        this.endpoints = await fetchEndpoints(this.listQuery)
        this.total = this.endpoints.length
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
    onTestConnectivity() {
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
          address: this.endpoints[index].address,
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
    async handleAddEndpoint(index, row) {
      if (!this.organization_team) {
        this.$message({
          message: 'Please select an organization/team first',
          type: 'warning'
        })
        return
      }
      await this.fetchTestList()
      if (index === undefined) {
        this.addEndpoint = true
        this.form.endpoint_name = ''
        this.form.endpoint_address = ''
        this.form.enable = false
        this.form.tests = []
      } else {
        this.addEndpoint = false
        this.form.endpoint_name = this.endpoints[index].name
        this.form.endpoint_address = this.endpoints[index].address
        this.form.tests = this.endpoints[index].tests
        this.form.enable = this.endpoints[index].enable
      }
      this.dialogFormVisible = true
    }
  }
}
</script>

<style scoped>
  .page-container{
    margin: 30px;
  }
</style>

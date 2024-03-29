<template>
  <div>
    <el-table
      :data="list"
      style="width: 100%;padding-top: 15px;"
      stripe
    >
      <el-table-column label="Test Suite" min-width="200">
        <template slot-scope="scope">
          {{ scope.row.test_suite }}
        </template>
      </el-table-column>
      <el-table-column label="Run Date" width="195" align="center">
        <template slot-scope="scope">
          {{ scope.row.run_date | dateFilter }}
        </template>
      </el-table-column>
      <el-table-column label="Tester" width="200" align="center">
        <template slot-scope="scope">
          {{ scope.row.tester }}
        </template>
      </el-table-column>
      <el-table-column label="Status" width="100" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status | statusFilter">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="fetchData" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { fetchTasks } from '@/api/testSuite'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination

export default {
  components: { Pagination },
  filters: {
    statusFilter(status) {
      const statusMap = {
        successful: 'success',
        failed: 'danger'
      }
      return statusMap[status]
    },
    dateFilter(time) {
      const date = new Date(time)
      return date.toLocaleString()
    }
  },
  data() {
    return {
      list: null,
      total: 0,
      listQuery: {
        page: 1,
        limit: 10,
        sort: '-run_date'
      }
    }
  },
  computed: {
    ...mapGetters([
      'organization_team'
    ])
  },
  watch: {
    async organization_team(newVal) {
      await this.fetchData()
    }
  },
  async created() {
    await this.fetchData()
  },
  methods: {
    async fetchData() {
      if (!this.organization_team) return
      const [organization, team] = this.organization_team
      this.listQuery.organization = organization
      this.listQuery.team = team
      const data = await fetchTasks(this.listQuery)
      this.list = data.items
      this.total = data.total
    }
  }
}
</script>

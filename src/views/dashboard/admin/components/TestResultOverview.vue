<template>
  <div>
    <el-table
      v-loading="listLoading"
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
      const date = new Date()
      date.setTime(time)
      return date.toLocaleString({ year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric' })
    }
  },
  data() {
    return {
      list: null,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 10,
        sort: '-run_date'
      }
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.listLoading = true
      const data = await fetchTasks(this.listQuery)
      this.listLoading = false
      this.list = data.items
      this.total = data.total
    }
  }
}
</script>

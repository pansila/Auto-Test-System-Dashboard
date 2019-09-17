<template>
  <div>
    <el-badge :value="list.length" style="line-height: 25px;margin-top: -5px;" @click.native="dialogTableShow">
      <svg-icon icon-class="list" />
    </el-badge>

    <el-dialog :visible.sync="dialogTableVisible" width="80%" append-to-body>
      <div slot="title">
        <span style="padding-right: 10px;">Running Tests</span>
      </div>
      <el-table
        :data="list"
        stripe
      >
        <el-table-column label="Test Suite" min-width="200">
          <template slot-scope="scope">
            {{ scope.row.task }}
          </template>
        </el-table-column>
        <el-table-column label="Priority" min-width="200" align="center">
          <template slot-scope="scope">
            <svg-icon v-for="n in +scope.row.priority" :key="n" icon-class="star" />
          </template>
        </el-table-column>
        <el-table-column label="Run Date" width="195" align="center">
          <template slot-scope="scope">
            {{ (scope.row.run_date || scope.row.schedule_date) | dateFilter }}
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
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { fetchQueuingTests } from '@/api/testSuite'

export default {
  name: 'TaskBox',
  filters: {
    statusFilter(status) {
      const statusMap = {
        Running: 'success',
        Waiting: 'warning'
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
      listLoading: true,
      listQuery: {
        organization: undefined,
        team: undefined
      },
      list: [],
      dialogTableVisible: false
    }
  },
  computed: {
    ...mapGetters([
      'organization_team',
      'taskqueue_update'
    ])
  },
  watch: {
    async organization_team(newVal) {
      await this.fetchQueuingTestList()
    },
    async taskqueue_update(newVal) {
      await this.fetchQueuingTestList()
    }
  },
  async created() {
    await this.fetchQueuingTestList()
  },
  methods: {
    async fetchQueuingTestList() {
      if (!this.organization_team) return
      const [organization, team] = this.organization_team
      this.listQuery.organization = organization
      this.listQuery.team = team

      this.listLoading = true
      try {
        const taskqueues = await fetchQueuingTests(this.listQuery)
        taskqueues.sort((a, b) => {
          return b.priority - a.priority
        })
        this.list = []
        taskqueues.forEach(q => {
          this.list.push.apply(this.list, q.tasks)
        })
      } catch (error) {
        console.error(error)
      }
      this.listLoading = false
    },
    async dialogTableShow() {
      this.dialogTableVisible = true
      await this.fetchQueuingTestList()
    }
  }
}
</script>

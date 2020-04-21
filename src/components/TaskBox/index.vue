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
        @row-click="testClicked"
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
    <el-dialog title="Test Status" :visible.sync="testStatusDialogVisible" width="760px">
      <div ref="testsuite_status" />
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { fetchQueuingTests } from '@/api/testSuite'
import io from 'socket.io-client'
import { Terminal } from 'xterm'
import 'xterm/css/xterm.css'
import 'xterm/lib/xterm.js'
import { FitAddon } from 'xterm-addon-fit'
import { getToken } from '@/utils/auth'

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
      dialogTableVisible: false,
      term: undefined,
      socket: undefined,
      testStatusDialogVisible: false,
      socketURL: process.env.NODE_ENV === 'development' ? 'ws://127.0.0.1:5000' : ''
    }
  },
  computed: {
    ...mapGetters([
      'organization_team',
      'taskqueue_update'
    ])
  },
  watch: {
    async organization_team(newValue, oldValue) {
      const [organization_n, team_n] = newValue
      const [organization_o, team_o] = oldValue || [undefined, undefined]
      await this.fetchQueuingTestList()
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
    },
    async taskqueue_update(newVal) {
      this.dialogTableVisible = true
      await this.fetchQueuingTestList()
    }
  },
  async created() {
    await this.fetchQueuingTestList()
    this.socket = io.connect(this.socketURL)
    this.socket.on('connect', () => {
      this.join_room()
    })
    this.socket.on('disconnect', () => {
      this.leave_room()
    })
  },
  destroyed() {
    this.leave_room()
    this.socket.close()
  },
  methods: {
    enter_room(task_id) {
      if (!this.organization_team) return
      this.socket.on('console log', (data) => {
        if (this.term) {
          if (task_id === data.task_id) {
            this.term.write(data.message)
          }
        }
      })
      const [organization, team] = this.organization_team
      this.socket.emit('enter', {
        'X-Token': getToken(),
        organization,
        team,
        task_id
      })
    },
    join_room() {
      if (!this.organization_team) return
      const [organization, team] = this.organization_team
      this.socket.on('task finished', async() => {
        await this.fetchQueuingTestList()
      })
      this.socket.on('task started', async() => {
        await this.fetchQueuingTestList()
      })
      this.socket.emit('join', {
        'X-Token': getToken(),
        organization,
        team
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
      if (this.term) {
        this.enter_room(task_id)
        return
      }
      const terminalContainer = this.$refs['testsuite_status']
      this.term = new Terminal()
      const fitAddon = new FitAddon()
      this.term.loadAddon(fitAddon)
      this.term.open(terminalContainer)
      fitAddon.fit()
      this.term._initialized = true

      this.enter_room(task_id)
    },
    testClicked(row) {
      if (row.status !== 'Running') return
      this.socket.off('console log')
      if (this.term) {
        this.term.reset()
      }
      this.testStatusDialogVisible = true
      this.$nextTick(() => this.initTerminal(row.task_id))
    },
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

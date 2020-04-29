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
      robotlog_term: undefined,
      runtimelog_term: undefined,
      termBuffer_robotlog: '',
      termBuffer_runtimelog: '',
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
      await this.fetchQueuingTestList()
      if (this.socket) {
        oldValue && this.leave_room(oldValue)
        this.join_room()
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
      const [organization, team] = this.organization_team
      this.robotlog_term && this.robotlog_term.reset()
      this.runtimelog_term && this.runtimelog_term.reset()
      this.socket.off('test report')
      this.socket.on('test report', (data) => {
        if (task_id === data.task_id) {
          if (this.robotlog_term) {
            if (this.termBuffer_robotlog) {
              this.robotlog_term.write(this.termBuffer_robotlog)
              this.termBuffer_robotlog = ''
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
              this.termBuffer_runtimelog = ''
            }
            this.runtimelog_term.write(data.message)
          } else {
            this.termBuffer_runtimelog += data.message
          }
        }
      })
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
    leave_room(organization_team) {
      const [organization, team] = organization_team || this.organization_team
      this.socket.emit('leave', {
        'X-Token': getToken(),
        organization,
        team
      })
      this.socket.off('task finished')
      this.socket.off('task started')
      this.socket.off('test report')
      this.socket.off('test log')
    },
    tab_click() {
      this.$nextTick(() => this.initTerminal2())
    },
    initTerminal1(task_id) {
      if (this.robotlog_term) {
        this.enter_room(task_id)
        return
      }
      const terminalContainer = this.$refs['robot_log']
      this.robotlog_term = new Terminal()
      const fitAddon = new FitAddon()
      this.robotlog_term.loadAddon(fitAddon)
      this.robotlog_term.open(terminalContainer)
      fitAddon.fit()
      this.robotlog_term._initialized = true

      this.enter_room(task_id)
    },
    initTerminal2() {
      if (!this.runtimelog_term) {
        const container = this.$refs['runtime_log']
        this.runtimelog_term = new Terminal()
        const fitAddon = new FitAddon()
        this.runtimelog_term.loadAddon(fitAddon)
        this.runtimelog_term.open(container)
        fitAddon.fit()
        this.runtimelog_term._initialized = true
      }
    },
    testClicked(row) {
      if (row.status !== 'Running') return
      this.socket.off('test report')
      this.robotlog_term && this.robotlog_term.reset()
      this.testStatusDialogVisible = true
      this.$nextTick(() => this.initTerminal1(row.task_id))
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

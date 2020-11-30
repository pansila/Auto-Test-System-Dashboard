<script>
import Sortable from 'sortablejs'
import { mapGetters } from 'vuex'
import { fetchQueuingTests, updateTaskQueue, cancelTask } from '@/api/testSuite'
import { addAttrs, treeToArray, traverseTreeEvery, cleanParentAttr } from '@/utils/tree-data'

export default {
  name: 'DragTable',
  data() {
    return {
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 10,
        title: undefined
      },
      sortable: null,
      indent: 20,
      taskqueues: [],
      list: [],
      notMove: null,
      columns: [
        {
          label: 'Endpoint',
          id: 'endpoint',
          align: 'left',
          headerAlign: 'center',
          expand: true
        },
        {
          label: 'UUID',
          minWidth: 80,
          id: 'endpoint_uid'
        },
        {
          label: 'Test Suite',
          minWidth: 120,
          id: 'task'
        },
        {
          label: 'Waiting Tests',
          width: 120,
          id: 'waiting'
        },
        {
          label: 'Priority',
          width: 100,
          align: 'left',
          headerAlign: 'center',
          id: 'priority'
        },
        {
          label: 'Status',
          width: 100,
          id: 'status'
        },
        {
          label: 'Action',
          width: 100,
          id: 'action'
        }
      ]
    }
  },
  computed: {
    ...mapGetters([
      'organization_team'
    ])
  },
  watch: {
    async organization_team(newVal) {
      await this.fetchQueuingTestList()
      this.$nextTick(() => {
        this.setSort()
      })
    }
  },
  async created() {
    await this.fetchQueuingTestList()
    this.$nextTick(() => {
      this.setSort()
    })
  },
  methods: {
    async fetchQueuingTestList() {
      if (!this.organization_team) return
      const [organization, team] = this.organization_team
      this.listQuery.organization = organization
      this.listQuery.team = team

      this.listLoading = true
      try {
        this.taskqueues = await fetchQueuingTests(this.listQuery)
        addAttrs(this.taskqueues, { expand: true })
        this.list = treeToArray(this.taskqueues)
      } catch (error) {
        console.error(error)
      }
      this.listLoading = false
    },
    setSort() {
      const el = this.$el.querySelectorAll('.el-table__body-wrapper > table > tbody')[0]
      this.sortable = Sortable.create(el, {
        ghostClass: 'sortable-ghost', // Class name for the drop placeholder,
        filter: '.row-filter',
        setData: function(dataTransfer) {
          dataTransfer.setData('Text', '')
        },
        onEnd: evt => {
          if (evt.oldIndex === evt.newIndex) return

          let targetRow
          let ret
          ret = traverseTreeEvery(this.taskqueues, 'tasks', (item, index) => {
            if (item._id === this.list[evt.oldIndex]._id) {
              targetRow = item._parent.tasks.splice(index, 1)[0]
              return false
            }
            return true
          })
          if (ret) {
            console.error('Can\'t find a row matching the change reqeust')
            return
          }

          const offset = evt.oldIndex > evt.newIndex
          let newFriend
          if (evt.newIndex - offset < 0) {
            newFriend = this.list[0]
          } else {
            newFriend = this.list[evt.newIndex - offset]
          }
          const parent = newFriend._parent || newFriend
          ret = traverseTreeEvery(this.taskqueues, 'tasks', (item, index) => {
            if (item._id === parent._id) {
              targetRow.priority = parent.priority
              if (newFriend === parent) {
                if (item.tasks.length > 0 && item.tasks[0].status === 'Running') {
                  item.tasks.splice(1, 0, targetRow)
                } else {
                  item.tasks.unshift(targetRow)
                }
                return false
              }
              return item.tasks.every((task, idx) => {
                if (task._id === newFriend._id) {
                  item.tasks.splice(idx + 1, 0, targetRow)
                  return false
                }
                return true
              })
            }
            return true
          })
          if (ret) {
            console.error('Can\'t find a new position to insert')
            return
          }
          // work around out of order issue
          this.list = []
          this.$nextTick(async() => {
            cleanParentAttr(this.taskqueues)
            try {
              this.listLoading = true
              const [organization, team] = this.organization_team
              await updateTaskQueue({ organization, team, taskqueues: this.taskqueues })
              await this.fetchQueuingTestList()
            } catch (error) {
              console.error(error)
            }
            this.listLoading = false
          })
        }
      })
    },
    statusFilter(status) {
      const statusMap = {
        Online: 'success',
        Offline: 'danger',
        Running: 'message',
        Waiting: 'warning'
      }
      return statusMap[status]
    },
    generateTableSpread(scope) {
      const el_plus = <i style={{ 'padding-right': '5px' }} class='el-icon-arrow-down' />
      const el_minus = <i style={{ 'padding-right': '5px' }} class='el-icon-arrow-up' />

      return [
        <span style={{ 'padding-left': scope.row._level * this.indent + 'px' }}/>,
        <span v-show={this.showSpreadIcon(scope.row)} class='tree-ctrl' onClick={e => this.toggleExpanded(scope.$index)}>
          {scope.row._expand ? el_minus : el_plus}
        </span>
      ]
    },
    dragFilter({ row }) {
      if (row.status === 'Running') return 'row-filter children'
      return row._parent ? 'row-no-filter children' : 'row-filter'
    },
    showRow({ row }) {
      const parent = row._parent
      const show = parent ? parent._expand && parent._show : true
      row._show = show
      return show
        ? 'animation:treeTableShow 1s;-webkit-animation:treeTableShow 1s;'
        : 'display:none;'
    },
    showSpreadIcon(record) {
      return (record.tasks && record.tasks.length > 0)
    },
    toggleExpanded(trIndex) {
      const record = this.list[trIndex]
      const expand = !record._expand
      record._expand = expand
    },
    async onTaskCancel(task) {
      const [organization, team] = this.organization_team
      await this.$confirm('Confirm to cancel the task?', 'Warning', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning'
      })

      const ret = traverseTreeEvery(this.taskqueues, 'tasks', (item, index) => {
        if (item._id === task._id) {
          item._parent.tasks.splice(index, 1)
          task._parent = null
          return false
        }
        return true
      })
      if (ret) {
        console.error('task not found in the task queue')
        return
      }

      try {
        task.organization = organization
        task.team = team
        await cancelTask(task)
        this.$message({
          type: 'success',
          message: 'Cancel succeeded!'
        })
      } catch (error) {
        console.error(error)
      }

      this.list = []
      this.$nextTick(async() => {
        cleanParentAttr(this.taskqueues)
        await updateTaskQueue({ organization, team, taskqueues: this.taskqueues })
        setTimeout(this.fetchQueuingTestList, 1000)
      })
    }
  },
  render: function(h) {
    return (<div style='margin: 30px'>
      <el-table data={this.list} row-style={this.showRow} row-class-name={this.dragFilter} row-key='_id' border fit style='width: 100%'>
        {this.columns.map(item => {
          return <el-table-column
            key={item.key}
            label={item.label}
            width={item.width}
            min-width={item.minWidth}
            align={item.align || 'center'}
            header-align={item.headerAlign}
            { ...{
              scopedSlots: {
                default: scope => {
                  const ret = []
                  if (item.expand) {
                    ret.push(this.generateTableSpread(scope))
                  }
                  if (item.id === 'status') {
                    ret.push(<el-tag type={this.statusFilter(scope.row[item.id])}>{scope.row[item.id]}</el-tag>)
                  } else if (item.id === 'priority') {
                    for (let i = 0; i < +scope.row['priority']; i++) {
                      ret.push(<svg-icon icon-class='star' class='meta-item__icon'></svg-icon>)
                    }
                  } else if (item.id === 'action') {
                    if (scope.row.status === 'Waiting' || scope.row.status === 'Running') {
                      ret.push(<el-button size='small' style='margin-right: 10px' onClick={e => this.onTaskCancel(scope.row)}>Cancel</el-button>)
                    }
                  } else {
                    ret.push(<span>{scope.row[item.id]}</span>)
                  }
                  return ret
                }
              }
            } }
          >
          </el-table-column>
        })}
      </el-table>
    </div>)
  }
}
</script>

<style>
.sortable-ghost{
  opacity: .8;
  color: #fff!important;
  background: #42b983!important;
}
.children{
  opacity: .8;
  background: #d2e3f8!important;
}
</style>

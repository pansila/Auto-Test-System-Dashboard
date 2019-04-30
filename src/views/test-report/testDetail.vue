<script>
import { fetchTestDetail } from '@/api/testSuite'
import { processRobotResult, processRobotResultStat } from './eval.js'
import convert from 'xml-js'

export default {
  name: 'RobotResult',
  data() {
    return {
      data: '',
      indent: 20,
      defaultExpandAll: false,
      listLoading: false,
      columns: [
        {
          label: 'Step Name',
          key: 'name',
          expand: true,
          align: 'left',
          minWidth: '50',
          headerAlign: 'center'
        },
        {
          label: 'Step Content',
          key: 'content',
          align: 'left',
          minWidth: '200',
          headerAlign: 'center'
        },
        {
          label: 'Status',
          width: '100',
          key: 'status'
        },
        {
          label: 'Duration',
          minWidth: '30',
          key: 'duration'
        }
      ],
      statColumns: [
        {
          label: 'Test Suite',
          key: 'suite'
        },
        {
          label: 'Total',
          key: 'total'
        },
        {
          label: 'Pass',
          key: 'pass'
        },
        {
          label: 'Fail',
          key: 'fail'
        },
        {
          label: 'Pass/Fail',
          key: 'ratio'
        }
      ]
    }
  },
  computed: {
    children() {
      return this.defaultChildren
    },
    statData() {
      if (!this.data) return []
      const data = convert.xml2js(this.data, { addParent: true })
      return processRobotResultStat(data)
    },
    tableData() {
      if (!this.data) return []
      const data = convert.xml2js(this.data, { addParent: true })
      return processRobotResult(data)
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.listLoading = true
      try {
        this.data = await fetchTestDetail(this.$route.query.task_id)
      } catch (error) {
        console.error(error)
      }
      this.listLoading = false
    },
    statusFilter(status) {
      const statusMap = {
        PASS: 'success',
        FAIL: 'danger'
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
    generateStepName(scope, item) {
      if (scope.row[item.key] === 'doc') {
        return <el-tag type='info'>{scope.row[item.key].toUpperCase()}</el-tag>
      } else if (scope.row[item.key] === 'msg') {
        return <el-tag type='info'>{scope.row['level'].toUpperCase()}</el-tag>
      } else {
        return <el-tag>{scope.row[item.key] ? scope.row[item.key].toUpperCase() : null}</el-tag>
      }
    },
    generateContent(scope, item) {
      const lines = scope.row[item.key].split('\n')
      const ret = []

      if (scope.row['content_head']) {
        ret.push(<span>{scope.row['content_head']}</span>)
      }
      if (scope.row['boldInfo']) {
        ret.push(<b>{scope.row['boldInfo']}</b>)
      }
      lines.forEach(line => {
        ret.push(<span>{line}</span>)
        ret.push(<br />)
      })

      if (lines.length) {
        ret.splice(-1)
      }

      return ret
    },
    generateDuration(scope, item) {
      if (scope.row['start_time']) {
        return <el-tooltip content={scope.row['start_time'] + ' ~ ' + scope.row['end_time']} placement='bottom'>
          <span>{scope.row[item.key]}</span>
        </el-tooltip>
      } else {
        return []
      }
    },
    showRow({ row }) {
      const parent = row.parent
      const show = parent ? parent._expand && parent._show : true
      row._show = show
      return show
        ? 'animation:treeTableShow 1s;-webkit-animation:treeTableShow 1s;'
        : 'display:none;'
    },
    showSpreadIcon(record) {
      return (record.elements !== undefined)
    },
    toggleExpanded(trIndex) {
      const record = this.tableData[trIndex]
      const expand = !record._expand
      record._expand = expand
    }
  },
  render: function(h) {
    return (<div style='margin: 30px'>
      <el-table data={this.statData} border fit>
        {this.statColumns.map(item => {
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
                  if (item.key === 'ratio') {
                    return <el-progress text-inside={true} stroke-width={18} percentage={100 * scope.row['pass'] / scope.row['total'] | 0}></el-progress>
                  }
                  return <span>{scope.row[item.key]}</span>
                }
              }
            } }
          >
          </el-table-column>
        })}
      </el-table>
      <br/>
      <el-table data={this.tableData} row-style={this.showRow} border>
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
                    ret.push(this.generateStepName(scope, item))
                  } else if (item.key === 'status' && scope.row[item.key]) {
                    ret.push(<el-tag type={this.statusFilter(scope.row[item.key])}>{scope.row[item.key]}</el-tag>)
                  } else if (item.key === 'content') {
                    ret.push(this.generateContent(scope, item))
                  } else {
                    ret.push(this.generateDuration(scope, item))
                  }
                  return ret
                }
              }
            } }
          >
          </el-table-column>
        })}
      </el-table>
    </div>
    )
  }
}
</script>

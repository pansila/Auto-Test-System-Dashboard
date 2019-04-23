import treeToArray, { addAttrs } from '@/components/TreeTable/eval.js'

export default {
  name: 'RobotResult',
  props: {
    data: {
      type: Array,
      required: true,
      default: () => []
    },
    columns: {
      type: Array,
      default: () => []
    },
    defaultExpandAll: {
      type: Boolean,
      default: false
    },
    defaultChildren: {
      type: String,
      default: 'children'
    },
    indent: {
      type: Number,
      default: 20
    }
  },
  render: function(h) {
    return (
      <el-table data={this.tableData} row-style={this.showRow} border>
        {this.columns.map(item => {
          return <el-table-column
            key={item.key}
            label={item.label}
            width={item.width}
            align={item.align || 'center'}
            header-align={item.headerAlign}
            { ...{
              scopedSlots: {
                default: scope => {
                  const ret = []
                  if (this.$scopedSlots[item.key]) {
                    return this.$scopedSlots[item.key]({ scope: scope })
                  }
                  if (item.expand) {
                    ret.push(this.generateTableSpread(scope))
                  }
                  if (item.checkbox) {
                    ret.push(this.generateTableCheckbox(scope))
                  }
                  ret.push(scope.row[item.key])
                  return ret
                }
              }
            } }
          >
          </el-table-column>
        })}
      </el-table>
    )
  },
  computed: {
    children() {
      return this.defaultChildren
    },
    tableData() {
      const data = this.data
      if (this.data.length === 0) {
        return []
      }
      addAttrs(data, {
        expand: this.defaultExpandAll,
        children: this.defaultChildren
      })

      const retval = treeToArray(data, this.defaultChildren)
      return retval
    }
  },
  methods: {
    showRow({ row }) {
      const parent = row._parent
      const show = parent ? parent._expand && parent._show : true
      row._show = show
      return show
        ? 'animation:treeTableShow 1s;-webkit-animation:treeTableShow 1s;'
        : 'display:none;'
    },
    generateTableSpread(scope) {
      const el_plus = <i class='el-icon-plus' />
      const el_minus = <i class='el-icon-minus' />

      return [
        <span style={'padding-left:' + scope.row._level * this.indent + 'px'} />,
        <span v-show={this.showSpreadIcon(scope.row)} class='tree-ctrl' onClick={e => this.toggleExpanded(scope.$index)}>
          {scope.row._expand ? el_minus : el_plus}
        </span>
      ]
    },
    generateTableCheckbox(scope) {
      const el_checkbox_true = <el-checkbox
        value={scope.row._select}
        style={{ 'padding-left': scope.row._level * this.indent + 'px' }}
        indeterminate={scope.row._select}
        onChange={e => { scope.row._select = e; this.handleCheckAllChange(scope.row) }}
      />
      const el_checkbox_false = <el-checkbox
        value={scope.row._select}
        style={{ 'padding-left': scope.row._level * this.indent + 'px' }}
        onChange={e => { scope.row._select = e; this.handleCheckAllChange(scope.row) }}
      />

      return (scope.row[this.defaultChildren] && scope.row[this.defaultChildren].length > 0) ? el_checkbox_true : el_checkbox_false
    },
    showSpreadIcon(record) {
      return record[this.children] && record[this.children].length > 0
    },
    toggleExpanded(trIndex) {
      const record = this.tableData[trIndex]
      const expand = !record._expand
      record._expand = expand
    },
    handleCheckAllChange(row) {
      this.selectRecursion(row, row._select, this.defaultChildren)
      this.isIndeterminate = row._select
    },
    selectRecursion(row, select, children = 'children') {
      if (select) {
        this.$set(row, '_expand', true)
        this.$set(row, '_show', true)
      }
      const sub_item = row[children]
      if (sub_item && sub_item.length > 0) {
        sub_item.map(child => {
          child._select = select
          this.selectRecursion(child, select, children)
        })
      }
    }
  }
}

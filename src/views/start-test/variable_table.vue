<template>
  <el-table :data="entries" :border="border" fit style="width: 100%">
    <el-table-column :label="$t('testTable.name')" min-width="50px" header-align="center">
      <template slot-scope="scope">
        <span style="margin-left: 10px">{{ scope.row.name }}</span>
      </template>
    </el-table-column>
    <el-table-column :label="$t('testTable.value')" min-width="100px" header-align="center">
      <template slot-scope="scope">
        <template v-if="scope.row.edit">
          <el-row type="flex" justify="space-between" :gutter="10">
            <el-col :span="16">
              <el-input v-model="scope.row.value" size="small" />
            </el-col>
            <el-col :span="8">
              <el-button type="success" size="small" @click="confirmEdit(scope.row)">{{ $t('task.ok') }}</el-button>
              <el-button size="small" @click="cancelEdit(scope.row)">{{ $t('task.cancel') }}</el-button>
              <el-button size="small" @click="handleReset(scope.$index, scope.row)">{{ $t('task.reset') }}</el-button>
            </el-col>
          </el-row>
        </template>
        <template v-else>
          <template v-if="typeof scope.row.value === 'object'">
            <variable-table :data="scope.row.value" :border="false" @change="onChange(scope.row.name)" />
          </template>
          <template v-else>
            <span style="margin-left: 10px" @click="scope.row.edit=!scope.row.edit">{{ scope.row.value }}</span>
          </template>
        </template>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
export default {
  name: 'VariableTable',
  components: {
    'VariableTable': this
  },
  props: {
    data: {
      default: null,
      type: [Object, Array]
    },
    border: {
      default: false,
      type: Boolean
    }
  },
  computed: {
    entries() {
      const _entries = []
      for (const k in this.data) {
        _entries.push({
          name: k,
          value: this.data[k],
          originalValue: this.data[k],
          edit: false
        })
      }
      return _entries
    }
  },
  mounted() {
    console.log(this.data)
  },
  methods: {
    cancelEdit(row) {
      row.edit = false
      row.value = row.oldValue || row.originalValue
    },
    confirmEdit(row) {
      const { name, value } = row
      row.edit = false
      row.oldValue = row.value
      this.$message({
        message: 'The value has been edited',
        type: 'success'
      })
      this.data[name] = value
      this.$emit('change', { name, value })
    },
    handleReset(index, row) {
      row.edit = false
      row.value = row.originalValue
      const { name, value } = row
      this.$message({
        message: 'The value has been restored to the original value',
        type: 'warning'
      })
      this.data[name] = value
      this.$emit('change', { name, value })
    },
    onChange(name) {
      this.$emit('change', { name, value: this.data[name] })
    }
  }
}
</script>

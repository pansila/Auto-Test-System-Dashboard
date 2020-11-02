<template>
  <div>
    <el-table :data="entries" :border="border" fit style="width: 100%">
      <el-table-column :label="$t('testTable.name')" min-width="50px" header-align="center">
        <template slot-scope="scope">
          <template v-if="scope.row.edit1">
            <el-input v-model="scope.row.name" v-focus size="small" @focusout.native="focusOut(scope.row)" />
          </template>
          <template v-else>
            <div @click="scope.row.edit1=!scope.row.edit1">
              <span style="margin-left: 10px">{{ scope.row.name }}</span>
            </div>
          </template>
        </template>
      </el-table-column>
      <el-table-column :label="$t('testTable.value')" min-width="100px" header-align="center">
        <template slot-scope="scope">
          <template v-if="scope.row.edit2">
            <el-input v-model="scope.row.value" v-focus size="small" @focusout.native="focusOut(scope.row)" />
          </template>
          <template v-else>
            <template v-if="typeof scope.row.value === 'object'">
              <variable-table :data="scope.row.value" :border="false" @change="onChange(scope.row.name)" />
            </template>
            <template v-else>
              <div @click="scope.row.edit2=!scope.row.edit2">
                <span style="margin-left: 10px">{{ scope.row.value }}</span>
              </div>
            </template>
          </template>
        </template>
      </el-table-column>
    </el-table>
    <div class="trailer" @mouseover="addRowShow = true" @mouseleave="addRowShow = false">
      <br>
      <el-divider v-if="addRowShow">
        <i class="el-icon-circle-plus-outline" style="cursor: pointer" @click="addRow" />
      </el-divider>
    </div>
  </div>
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
  data() {
    return {
      addRowShow: false,
      forceUpdate: 0
    }
  },
  computed: {
    entries() {
      const _entries = []
      this.forceUpdate
      for (const k in this.data) {
        _entries.push({
          name: k,
          value: this.data[k],
          oldName: k,
          edit1: false,
          edit2: false
        })
      }
      return _entries.sort()
    }
  },
  methods: {
    onChange(name) {
      this.$emit('change', { name, value: this.data[name] })
    },
    addRow() {
      let name = 'name'
      const value = 'value'
      if (Array.isArray(this.data)) {
        this.data.push(value)
        name = this.data.length - 1
      } else {
        this.data[name] = value
      }
      this.forceUpdate++
      this.$emit('change', { name, value })
    },
    focusOut(row) {
      const { name, value } = row
      row.edit1 = false
      row.edit2 = false
      if (row.originalValue !== row.value) {
        this.$message({
          message: 'The value has been edited',
          type: 'success'
        })
      }
      delete this.data[row.oldName]
      if (name) {
        this.data[name] = value
        this.$emit('change', { name, value })
      }
      this.$emit('change', { name: row.oldName, value: undefined })
      this.forceUpdate++
    }
  }
}
</script>

<style scoped>
.trailer {
  line-height:16px;
  margin: 0 0 5px 0;
}
</style>

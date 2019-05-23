<template>
  <el-form>
    <el-form-item>
      <el-alert
        title="Be noted that the operation is not reversible"
        type="warning"
      />
    </el-form-item>
    <el-form-item label="Password">
      <el-input v-model="password" type="password" />
    </el-form-item>
    <el-form-item>
      <el-button type="danger" @click="submit">Delete</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  data() {
    return {
      password: ''
    }
  },
  methods: {
    async submit() {
      this.$message({
        message: 'Account has been deleted successfully',
        type: 'success',
        duration: 5 * 1000
      })
    }
  }
}
</script>

<template>
  <el-form>
    <el-form-item label="Original Password">
      <el-input v-model="oldPassword" type="password" />
    </el-form-item>
    <el-form-item label="New Password">
      <el-input v-model="newPassword1" type="password" />
    </el-form-item>
    <el-form-item label="Confirm New Password">
      <el-input v-model="newPassword2" type="password" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submit">Update</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  data() {
    return {
      oldPassword: '',
      newPassword1: '',
      newPassword2: ''
    }
  },
  methods: {
    async submit() {
      this.$message({
        message: 'Password has been updated successfully',
        type: 'success',
        duration: 5 * 1000
      })
    }
  }
}
</script>

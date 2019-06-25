<template>
  <el-form :model="form" :rules="passwordRules">
    <el-form-item label="Original Password" prop="oldPassword">
      <el-input v-model="form.oldPassword" type="password" />
    </el-form-item>
    <el-form-item label="New Password" prop="newPassword1">
      <el-input v-model="form.newPassword1" type="password" />
    </el-form-item>
    <el-form-item label="Confirm New Password" prop="newPassword2">
      <el-input v-model="form.newPassword2" type="password" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submit">Update</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { updatePassword } from '@/api/user'

export default {
  data() {
    const validatePassword1 = (rule, value, callback) => {
      if (!value || value.length < 6) {
        callback(new Error('The password can not be less than 6 digits'))
      } else {
        callback()
      }
    }
    const validatePassword2 = (rule, value, callback) => {
      if (!value || value.length < 6) {
        callback(new Error('The password can not be less than 6 digits'))
      } else {
        if (this.form.newPassword1 !== this.form.newPassword2) {
          callback(new Error('The password should be the same as above'))
        } else {
          callback()
        }
      }
    }
    return {
      form: {
        oldPassword: '',
        newPassword1: '',
        newPassword2: ''
      },
      passwordRules: {
        oldPassword: [{ required: true, trigger: 'blur', validator: validatePassword1 }],
        newPassword1: [{ required: true, trigger: 'blur', validator: validatePassword1 }],
        newPassword2: [{ required: true, trigger: 'blur', validator: validatePassword2 }]
      }
    }
  },
  methods: {
    async submit() {
      try {
        this.form.newPassword = this.form.newPassword1
        await updatePassword(this.form)
        this.$message({
          message: 'Password has been updated successfully',
          type: 'success',
          duration: 5 * 1000
        })
      } catch (error) {
        console.error(error)
      }
    }
  }
}
</script>

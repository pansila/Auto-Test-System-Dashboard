<template>
  <el-form :model="user" :rules="accountRules">
    <el-form-item :label="$t('login.username')" prop="name">
      <el-input v-model.trim="user.name" />
    </el-form-item>
    <el-form-item :label="$t('login.email')" prop="email">
      <el-input v-model.trim="user.email" />
    </el-form-item>
    <el-form-item :label="$t('profile.introduction')">
      <el-input v-model="user.introduction" type="textarea" />
    </el-form-item>
    <el-form-item :label="$t('profile.region')">
      <el-input v-model.trim="user.region" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submit">{{ $t('permission.update') }}</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { updateAccount } from '@/api/user'
import { validUsername, validEmail } from '@/utils/validate'

export default {
  props: {
    user: {
      type: Object,
      default: () => {
        return {
          name: '',
          email: '',
          introduction: '',
          region: ''
        }
      }
    }
  },
  data() {
    const validateUsername = (rule, value, callback) => {
      if (!validUsername(value)) {
        callback(new Error('Please enter the correct user name'))
      } else {
        callback()
      }
    }
    const validateEmail = (rule, value, callback) => {
      if (!validEmail(value)) {
        callback(new Error('Please enter the correct email'))
      } else {
        callback()
      }
    }
    return {
      accountRules: {
        name: [{ required: true, trigger: 'blur', validator: validateUsername }],
        email: [{ required: true, trigger: 'blur', validator: validateEmail }]
      }
    }
  },
  methods: {
    async submit() {
      try {
        await updateAccount(this.user)
        this.$message({
          message: 'User information has been updated successfully',
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

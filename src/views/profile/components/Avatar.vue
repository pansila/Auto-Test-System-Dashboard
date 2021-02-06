<template>
  <el-form>
    <el-form-item>
      <el-radio v-model="radio" label="0">{{ $t('profile.autoAvatar') }}</el-radio>
      <el-row type="flex" justify="left" class="radio-indent">
        <el-input v-model="user.email" style="width: 50%" disabled />
      </el-row>
    </el-form-item>
    <el-form-item>
      <el-radio v-model="radio" label="1">{{ $t('profile.customAvatar') }}</el-radio>
      <el-upload
        class="avatar-uploader radio-indent"
        action="#"
        :http-request="uploadUserAvatar"
        :headers="tokenHeader"
        :on-success="handleAvatarSuccess"
        :show-file-list="false"
        :before-upload="beforeAvatarUpload"
      >
        <img v-if="imageUrl" :src="imageUrl" class="avatar">
        <i v-else class="el-icon-plus avatar-uploader-icon" />
      </el-upload>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submit">{{ $t('permission.update') }}</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { useAvatar, uploadAvatar } from '@/api/user'
import { getToken } from '@/utils/auth'

export default {
  props: {
    user: {
      type: Object,
      default: () => {
        return {
          email: ''
        }
      }
    }
  },
  data() {
    return {
      radio: '0',
      imageUrl: '',
      avatar_url: process.env.VUE_APP_BASE_API + '/user/avatar',
      tokenHeader: {
        'X-Token': getToken()
      }
    }
  },
  methods: {
    async submit() {
      if (this.radio === '1') {
        try {
          await useAvatar({ type: 'custom' })
        } catch (error) {
          console.error(error)
          return
        }
      } else {
        try {
          await useAvatar({ type: 'default' })
        } catch (error) {
          console.error(error)
          return
        }
      }
      this.$message({
        message: 'Avatar has been updated successfully',
        type: 'success',
        duration: 5 * 1000
      })
    },
    handleAvatarSuccess(res, file) {
      this.imageUrl = URL.createObjectURL(file.raw)
    },
    beforeAvatarUpload(file) {
      const isAllowed = file.type === 'image/jpeg' || file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isAllowed) {
        this.$message.error('Avatar format should be JPG or PNG')
      }
      if (!isLt2M) {
        this.$message.error('Avatar size should be less than 2MB')
      }
      return isAllowed && isLt2M
    },
    async uploadUserAvatar(data) {
      const formData = new FormData()
      formData.append('file', data.file)
      await uploadAvatar(formData)
    }
  }
}
</script>

<style>
  .avatar-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .avatar-uploader .el-upload:hover {
    border-color: #409EFF;
  }
  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    line-height: 178px;
    text-align: center;
  }
  .avatar {
    width: 178px;
    height: 178px;
    display: block;
  }
  .radio-indent {
    padding-left: 27px;
  }
</style>

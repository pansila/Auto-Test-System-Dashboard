<template>
  <div class="app-container">
    <el-form ref="registerForm" :model="registerForm" :rules="registerRules" class="register-form" label-position="left">

      <div class="title-container">
        <h3 class="title">{{ $t('login.register') }}</h3>
      </div>

      <el-form-item prop="email">
        <span class="svg-container">
          <svg-icon icon-class="email" />
        </span>
        <el-input
          ref="email"
          v-model="registerForm.email"
          :placeholder="$t('login.email')"
          name="email"
          type="text"
          tabindex="1"
          auto-complete="on"
        />
      </el-form-item>

      <el-form-item prop="username">
        <span class="svg-container">
          <svg-icon icon-class="user" />
        </span>
        <el-input
          ref="username"
          v-model="registerForm.username"
          :placeholder="$t('login.username')"
          name="username"
          type="text"
          tabindex="2"
          auto-complete="on"
        />
      </el-form-item>

      <el-tooltip v-model="capsTooltip1" content="Caps lock is On" placement="right" manual>
        <el-form-item prop="password1">
          <span class="svg-container">
            <svg-icon icon-class="password" />
          </span>
          <el-input
            :key="passwordType1"
            ref="password1"
            v-model="registerForm.password1"
            :type="passwordType1"
            :placeholder="$t('login.password')"
            name="password1"
            tabindex="3"
            auto-complete="on"
            @keyup.native="checkCapslock1"
            @blur="capsTooltip1 = false"
          />
          <span class="show-pwd" @click="showPwd(1)">
            <svg-icon :icon-class="passwordType1 === 'password' ? 'eye' : 'eye-open'" />
          </span>
        </el-form-item>
      </el-tooltip>

      <el-tooltip v-model="capsTooltip2" content="Caps lock is On" placement="right" manual>
        <el-form-item prop="password2">
          <span class="svg-container">
            <svg-icon icon-class="password" />
          </span>
          <el-input
            :key="passwordType2"
            ref="password2"
            v-model="registerForm.password2"
            :type="passwordType2"
            :placeholder="$t('login.confirmPassword')"
            name="password2"
            tabindex="4"
            auto-complete="on"
            @keyup.native="checkCapslock2"
            @blur="capsTooltip2 = false"
            @keyup.enter.native="handleRegister"
          />
          <span class="show-pwd" @click="showPwd(2)">
            <svg-icon :icon-class="passwordType2 === 'password' ? 'eye' : 'eye-open'" />
          </span>
        </el-form-item>
      </el-tooltip>

      <el-button :loading="loading" type="primary" style="width:100%;margin-bottom:30px;" @click.native.prevent="handleRegister">{{ $t('login.createAccount') }}</el-button>

      <el-row type="flex" justify="end">
        <el-col :span="12">
          <el-button type="text" style="width: 100%" @click="gotoLogin">{{ $t('login.logIn2') }}</el-button>
        </el-col>
      </el-row>

    </el-form>

  </div>
</template>

<script>
import { validUsername, validEmail } from '@/utils/validate'
import { checkEmail } from '@/api/user'

export default {
  name: 'Register',
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
    const validatePassword1 = (rule, value, callback) => {
      if (value.length < 6) {
        callback(new Error('The password can not be less than 6 digits'))
      } else {
        callback()
      }
    }
    const validatePassword2 = (rule, value, callback) => {
      if (value.length < 6) {
        callback(new Error('The password can not be less than 6 digits'))
      } else {
        if (this.registerForm.password1 !== this.registerForm.password2) {
          callback(new Error('The password should be the same as above'))
        } else {
          callback()
        }
      }
    }
    return {
      registerForm: {
        username: '',
        email: '',
        password1: '',
        password2: ''
      },
      registerRules: {
        username: [{ required: true, trigger: 'blur', validator: validateUsername }],
        email: [{ required: true, trigger: 'blur', validator: validateEmail }],
        password1: [{ required: true, trigger: 'blur', validator: validatePassword1 }],
        password2: [{ required: true, trigger: 'blur', validator: validatePassword2 }]
      },
      passwordType1: 'password',
      passwordType2: 'password',
      capsTooltip1: false,
      capsTooltip2: false,
      loading: false,
      showDialog: false,
      redirect: undefined
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        this.redirect = route.query && route.query.redirect
      },
      immediate: true
    }
  },
  created() {
    // window.addEventListener('storage', this.afterQRScan)
  },
  mounted() {
    if (this.registerForm.email === '') {
      this.$refs.email.focus()
    } else if (this.registerForm.username === '') {
      this.$refs.username.focus()
    } else if (this.registerForm.password === '') {
      this.$refs.password.focus()
    }
  },
  destroyed() {
    // window.removeEventListener('storage', this.afterQRScan)
  },
  methods: {
    async validateEmailOnline(value) {
      try {
        await checkEmail(value)
        return true
      } catch {
        return false
      }
    },
    checkCapslock1({ shiftKey, key } = {}) {
      if (key && key.length === 1) {
        if (shiftKey && (key >= 'a' && key <= 'z') || !shiftKey && (key >= 'A' && key <= 'Z')) {
          this.capsTooltip1 = true
        } else {
          this.capsTooltip1 = false
        }
      }
      if (key === 'CapsLock' && this.capsTooltip1 === true) {
        this.capsTooltip1 = false
      }
    },
    checkCapslock2({ shiftKey, key } = {}) {
      if (key && key.length === 1) {
        if (shiftKey && (key >= 'a' && key <= 'z') || !shiftKey && (key >= 'A' && key <= 'Z')) {
          this.capsTooltip2 = true
        } else {
          this.capsTooltip2 = false
        }
      }
      if (key === 'CapsLock' && this.capsTooltip2 === true) {
        this.capsTooltip2 = false
      }
    },
    showPwd(idx) {
      if (idx === 1) {
        if (this.passwordType1 === 'password') {
          this.passwordType1 = ''
        } else {
          this.passwordType1 = 'password'
        }
        this.$nextTick(() => {
          this.$refs.password1.focus()
        })
      } else if (idx === 2) {
        if (this.passwordType2 === 'password') {
          this.passwordType2 = ''
        } else {
          this.passwordType2 = 'password'
        }
        this.$nextTick(() => {
          this.$refs.password2.focus()
        })
      }
    },
    handleRegister() {
      this.$refs.registerForm.validate(async(valid) => {
        if (valid) {
          this.loading = true
          const unused = await this.validateEmailOnline(this.registerForm.email)
          if (!unused) {
            this.$message({
              message: 'Email has been registered',
              type: 'error'
            })
            this.loading = false
            return false
          }
          this.registerForm.password = this.registerForm.password1
          try {
            await this.$store.dispatch('user/register', this.registerForm)
            this.$router.push({ path: '/' })
          } catch (error) {
            console.error(error)
          }
          this.loading = false
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    gotoLogin() {
      this.$router.push('/login')
    }
  }
}
</script>

<style lang="scss">
$bg:#283443;
$light_gray:#fff;
$cursor: #fff;

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
  .app-container .el-input input {
    color: $cursor;
  }
}

/* reset element-ui css */
.app-container {
  .el-input {
    display: inline-block;
    height: 47px;
    width: 85%;

    input {
      background: transparent;
      border: 0px;
      -webkit-appearance: none;
      border-radius: 0px;
      padding: 12px 5px 12px 15px;
      color: $light_gray;
      height: 47px;
      caret-color: $cursor;

      &:-webkit-autofill {
        box-shadow: 0 0 0px 1000px $bg inset !important;
        -webkit-text-fill-color: $cursor !important;
      }
    }
  }

  .el-form-item {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    color: #454545;
  }
}
</style>

<style lang="scss" scoped>
$bg:#2d3a4b;
$dark_gray:#889aa4;
$light_gray:#eee;

.app-container {
  min-height: 100%;
  width: 100%;
  background-color: $bg;
  overflow: hidden;

  .register-form {
    position: relative;
    width: 520px;
    max-width: 100%;
    padding: 160px 35px 0;
    margin: 0 auto;
    overflow: hidden;
  }

  .tips {
    font-size: 14px;
    color: #fff;
    margin-bottom: 10px;

    span {
      &:first-of-type {
        margin-right: 16px;
      }
    }
  }

  .svg-container {
    padding: 6px 5px 6px 15px;
    color: $dark_gray;
    vertical-align: middle;
    width: 30px;
    display: inline-block;
  }

  .title-container {
    position: relative;

    .title {
      font-size: 26px;
      color: $light_gray;
      margin: 0px auto 40px auto;
      text-align: center;
      font-weight: bold;
    }
  }

  .show-pwd {
    position: absolute;
    right: 10px;
    top: 7px;
    font-size: 16px;
    color: $dark_gray;
    cursor: pointer;
    user-select: none;
  }

  .thirdparty-button {
    position: absolute;
    right: 0;
    bottom: 6px;
  }

  @media only screen and (max-width: 470px) {
    .thirdparty-button {
      display: none;
    }
  }
}
</style>

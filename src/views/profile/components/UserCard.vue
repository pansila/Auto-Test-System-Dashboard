<template>
  <el-card style="margin-bottom:20px;">
    <div slot="header" class="clearfix">
      <span>{{ $t('profile.aboutMe') }}</span>
    </div>

    <div class="user-profile">
      <div class="box-center">
        <pan-thumb :image="avatar_url" :height="'100px'" :width="'100px'" :hoverable="false">
          <div>Hello</div>
          {{ user.name }}
        </pan-thumb>
      </div>
      <div class="box-center">
        <div class="user-name text-center">{{ user.name }}</div>
        <div class="user-role text-center text-muted">{{ user.role | uppercaseFirst }}</div>
      </div>
    </div>

    <div class="user-bio">
      <div class="user-education user-bio-section">
        <div class="user-bio-section-header"><svg-icon icon-class="email" /><span>{{ user.email }}</span></div>
      </div>

      <div class="user-education user-bio-section">
        <div class="user-bio-section-header"><i class="el-icon-time" /><span>{{ $t('profile.joinedOn') + ' ' + new Date(user.registered_on).toLocaleDateString() }}</span></div>
      </div>

      <div class="user-education user-bio-section">
        <div class="user-bio-section-header"><svg-icon icon-class="education" /><span>{{ $t('profile.introduction') }}</span></div>
        <div class="user-bio-section-body">
          <div class="text-muted">
            {{ user.introduction }}
          </div>
        </div>
      </div>

      <div class="user-skills user-bio-section">
        <div class="user-bio-section-header"><svg-icon icon-class="skill" /><span>{{ $t('profile.reputation') }}</span></div>
        <div class="user-bio-section-body">
          <div class="progress-item">
            <el-row type="flex" justify="center">
              <el-tag>Test Master</el-tag>
            </el-row>
            <el-progress :percentage="70" />
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script>
import PanThumb from '@/components/PanThumb'

export default {
  components: { PanThumb },
  props: {
    user: {
      type: Object,
      default: () => {
        return {
          name: '',
          email: '',
          avatar: '',
          role: '',
          introduction: '',
          registered_on: ''
        }
      }
    }
  },
  data() {
    return {
      avatar_url: process.env.VUE_APP_BASE_API + '/user/avatar'
    }
  }
}
</script>

<style lang="scss" scoped>
.box-center {
  margin: 0 auto;
  display: table;
}

.text-muted {
  color: #777;
}

.user-profile {
  .user-name {
    font-weight: bold;
  }

  .box-center {
    padding-top: 10px;
  }

  .user-role {
    padding-top: 10px;
    font-weight: 400;
    font-size: 14px;
  }

  .box-social {
    padding-top: 30px;

    .el-table {
      border-top: 1px solid #dfe6ec;
    }
  }

  .user-follow {
    padding-top: 20px;
  }
}

.user-bio {
  margin-top: 20px;
  color: #606266;

  span {
    padding-left: 4px;
  }

  .user-bio-section {
    font-size: 14px;
    padding-bottom: 15px;

    .user-bio-section-header {
      border-bottom: 1px solid #dfe6ec;
      padding-bottom: 10px;
      font-weight: bold;
    }

    .user-bio-section-body {
      margin-top: 10px;
    }
  }
}
</style>

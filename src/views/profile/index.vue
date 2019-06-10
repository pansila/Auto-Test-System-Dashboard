<template>
  <div class="app-container">
    <div v-if="user">
      <el-row :gutter="20">

        <el-col :span="6" :xs="24">
          <user-card :user="user" />
        </el-col>

        <el-col :span="18" :xs="24">
          <el-card>
            <el-tabs v-model="activeTab">
              <el-tab-pane label="Timeline" name="timeline">
                <timeline />
              </el-tab-pane>
              <el-tab-pane label="Account" name="account">
                <account :user="user" />
              </el-tab-pane>
              <el-tab-pane label="Password" name="password">
                <password :user="user" />
              </el-tab-pane>
              <el-tab-pane label="Avatar" name="avatar">
                <avatar :user="user" />
              </el-tab-pane>
              <el-tab-pane label="Organization" name="organization">
                <organization :user="user" />
              </el-tab-pane>
              <el-tab-pane label="Team" name="team">
                <team :user="user" />
              </el-tab-pane>
              <el-tab-pane label="Delete Account" name="delete">
                <delete :user="user" />
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </el-col>

      </el-row>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import UserCard from './components/UserCard'
import Timeline from './components/Timeline'
import Account from './components/Account'
import Password from './components/Password'
import Avatar from './components/Avatar'
import Organization from './components/Organization'
import Team from './components/Team'
import Delete from './components/Delete'

export default {
  name: 'Profile',
  components: { Avatar, UserCard, Timeline, Account, Password, Organization, Team, Delete },
  data() {
    return {
      user: {},
      activeTab: 'timeline'
    }
  },
  computed: {
    ...mapGetters([
      'name',
      'avatar',
      'roles',
      'email',
      'introduction',
      'registered_on'
    ])
  },
  created() {
    this.getUser()
  },
  methods: {
    getUser() {
      this.user = {
        name: this.name,
        role: this.roles.join(' | '),
        email: this.email,
        avatar: this.avatar,
        introduction: this.introduction,
        registered_on: this.registered_on
      }
    }
  }
}
</script>

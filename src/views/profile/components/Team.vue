<template>
  <div>
    <span v-if="!joined_organizations || joined_organizations.length === 0">{{ $t('profile.organizationJoinFirst') }}</span>
    <el-card v-else class="box-card">
      <div slot="header" class="clearfix">
        <span>{{ $t('profile.teamsJoined') }}</span>
        <el-button style="float: right" type="primary" plain size="medium" @click="onJoinTeam">{{ $t('profile.joinTeam') }}</el-button>
        <el-button style="float: right; margin-right: 5px;" type="primary" plain size="medium" @click="onNewTeam">{{ $t('profile.newTeam') }}</el-button>
        <el-select v-model="organization" placeholder="Please choose a organization" style="float: right; margin-right: 5px;">
          <el-option
            v-for="org in joined_organizations"
            :key="org.label"
            :label="org.label"
            :value="org.value"
          />
        </el-select>
      </div>
      <el-table
        v-loading="listLoading"
        :data="teams"
        row-key="value"
        fit
        style="width: 100%"
      >
        <el-table-column :label="$t('profile.team')" min-width="100">
          <template slot-scope="scope">
            <el-row type="flex" justify="left" align="middle" :gutter="5">
              <el-col style="width: auto">
                <img :src="scope.row.avatarUrl" class="user-avatar">
              </el-col>
              <el-col>
                <span class="link-type" @click="onTeam(scope.row)">{{ scope.row.label }}</span>
              </el-col>
            </el-row>
          </template>
        </el-table-column>
        <el-table-column :label="$t('profile.owner')" min-width="100">
          <template slot-scope="scope">
            <span class="link-type" @click="onUser(scope.row)">{{ scope.row.owner }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('profile.team_id')" min-width="100">
          <template slot-scope="scope">
            <span>{{ scope.row.value }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('profile.action')" width="220">
          <template slot-scope="scope">
            <el-button v-if="scope.row.owner_email === user.email" type="danger" plain size="small" @click="onTeamDelete(scope.$index, scope.row)">{{ $t('permission.delete') }}</el-button>
            <el-button v-else type="danger" plain size="small" @click="onQuit(scope.$index, scope.row)">{{ $t('permission.quit') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog :title="$t('profile.newTeam')" :visible.sync="dialogNewTeamVisible">
      <el-form ref="form" label-width="120px">
        <el-form-item :label="$t('profile.teamName')">
          <el-input v-model="team_name" :placeholder="$t('profile.placeholderNewTeam')" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogNewTeamVisible = false">{{ 'cancel' }}</el-button>
        <el-button type="primary" @click="onNewTeamSubmit">{{ 'confirm' }}</el-button>
      </div>
    </el-dialog>
    <el-dialog :title="$t('profile.joinTeam')" :visible.sync="dialogJoinTeamVisible">
      <el-form ref="form" label-width="120px">
        <el-form-item :label="$t('profile.teamName')">
          <el-select v-model="team_join" :placeholder="$t('profile.placeholderJoinTeam')">
            <el-option
              v-for="team in all_teams"
              :key="team.label"
              :label="team.label"
              :value="team.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogJoinTeamVisible = false">{{ 'cancel' }}</el-button>
        <el-button type="primary" @click="onJoinTeamSubmit">{{ 'confirm' }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { newTeam, joinTeam, fetchJoinedTeams, fetchAllTeams, quitTeam, deleteTeam, fetchJoinedOrganizations, fetchJoinedOrganizationTeams, getTeamAvatar } from '@/api/user'

export default {
  props: {
    eventHub: {
      type: Object,
      required: true
    },
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
      dialogNewTeamVisible: false,
      dialogJoinTeamVisible: false,
      listLoading: false,
      joined_organizations: [],
      organization: null,
      joined_teams: [],
      all_teams: [],
      team_name: '',
      team_join: null,
      avatar_url: process.env.VUE_APP_BASE_API + '/team/avatar',
      form: {
      }
    }
  },
  computed: {
    ...mapGetters([
      'email'
    ]),
    teams() {
      return this.joined_teams.filter(team => {
        if (team.organization_id === this.organization) {
          return true
        }
        return false
      })
    },
    organizations: {
      get() {
        return this.$store.state.settings.organizations
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'organizations',
          value: val
        })
      }
    }
  },
  watch: {
    async organization(val) {
      if (val) {
        try {
          const ret = await fetchAllTeams({ organization_id: val })
          if (ret.code !== 20000) return
          this.all_teams = ret.data.teams
        } catch (e) {
          this.all_teams = []
        }
      } else {
        this.all_teams = []
      }
    }
  },
  async created() {
    await this.getTeams()
    this.eventHub.$on('ORGANIZATION_LEAVE', async(organization_id) => {
      if (organization_id === this.organization) {
        this.organization = null
      }
      await this.getTeams()
    })
    this.eventHub.$on('ORGANIZATION_ENTER', async() => {
      await this.getTeams()
    })
  },
  methods: {
    async getTeams() {
      let ret = await fetchJoinedOrganizations()
      if (ret.code !== 20000) return
      this.joined_organizations = ret.data.organizations

      ret = await fetchJoinedOrganizationTeams()
      if (ret.code !== 20000) return
      this.organizations = ret.data.organization_team

      ret = await fetchJoinedTeams()
      if (ret.code !== 20000) return
      this.joined_teams = await Promise.all(ret.data.teams.map(async team => {
        const ret = await getTeamAvatar(team.value)
        if (ret.code !== 20000) return
        team.avatarUrl = `data:${ret.data.type};base64,` + ret.data.data
        return team
      }))
    },
    async onNewTeamSubmit() {
      try {
        await newTeam({ name: this.team_name, organization_id: this.organization })
        this.$message({
          message: 'Team has been created successfully',
          type: 'success',
          duration: 5 * 1000
        })
      } catch (error) {
        console.error(error)
      }
      await this.getTeams()
      this.dialogNewTeamVisible = false
    },
    async onJoinTeamSubmit() {
      try {
        await joinTeam({ team_id: this.team_join, organization_id: this.organization })
        this.$message({
          message: 'Join the team successfully',
          type: 'success',
          duration: 5 * 1000
        })
      } catch (error) {
        console.error(error)
      }
      await this.getTeams()
      this.dialogJoinTeamVisible = false
    },
    onNewTeam() {
      if (!this.organization) {
        this.$message({
          message: 'Please choose an organization first',
          type: 'warning'
        })
        return
      }
      for (const i in this.joined_organizations) {
        if (this.joined_organizations[i].value === this.organization &&
            this.joined_organizations[i].owner_email !== this.email) {
          this.$message({
            message: 'Your are not the organization owner',
            type: 'warning'
          })
          return
        }
      }
      this.dialogNewTeamVisible = true
    },
    onJoinTeam() {
      if (!this.organization) {
        this.$message({
          message: 'Please choose an organization first',
          type: 'warning'
        })
        return
      }
      this.dialogJoinTeamVisible = true
    },
    onTeam() {
    },
    onUser() {
    },
    async onQuit(idx, row) {
      try {
        await quitTeam({ 'team_id': this.teams[idx].value })
      } catch (error) {
        console.error(error)
        return
      }
      this.$message({
        message: 'Quit the team successfully',
        type: 'success',
        duration: 5 * 1000
      })
      await this.getTeams()
    },
    async onTeamDelete(idx, row) {
      try {
        await deleteTeam({ 'team_id': this.teams[idx].value })
      } catch (error) {
        console.error(error)
        return
      }
      this.$message({
        message: 'Delete the team successfully',
        type: 'success',
        duration: 5 * 1000
      })
      await this.getTeams()
    }
  }
}
</script>

<style>
  .text {
    font-size: 14px;
  }

  .item {
    margin-bottom: 18px;
  }

  .clearfix:before,
  .clearfix:after {
    display: table;
    content: "";
  }
  .clearfix:after {
    clear: both
  }

  .box-card {
    width: 100%;
  }

  .user-avatar {
    cursor: pointer;
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }
</style>

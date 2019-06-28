<template>
  <div>
    <span v-if="!joined_organizations || joined_organizations.length === 0">Please join an organization first</span>
    <el-card v-else class="box-card">
      <div slot="header" class="clearfix">
        <span>Teams Joined</span>
        <el-button style="float: right" type="primary" plain size="medium" @click="onJoinTeam">Join Team</el-button>
        <el-button style="float: right; margin-right: 5px;" type="primary" plain size="medium" @click="onNewTeam">New Team</el-button>
        <el-select v-model="organization" placeholder="Please choose a organization" style="float: right; margin-right: 5px;">
          <el-option
            v-for="org in owned_organizations"
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
        <el-table-column label="Team" min-width="100">
          <template slot-scope="scope">
            <el-row type="flex" justify="left" align="middle" :gutter="5">
              <el-col style="width: auto">
                <img :src="avatar_url + '/' + scope.row.value" class="user-avatar">
              </el-col>
              <el-col>
                <span class="link-type" @click="onTeam(scope.row)">{{ scope.row.label }}</span>
              </el-col>
            </el-row>
          </template>
        </el-table-column>
        <el-table-column label="Owner" min-width="100">
          <template slot-scope="scope">
            <span class="link-type" @click="onUser(scope.row)">{{ scope.row.owner }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Action" width="220">
          <template slot-scope="scope">
            <el-button v-if="scope.row.owner_email === user.email" type="danger" plain size="small" @click="onTeamDelete(scope.$index, scope.row)">Delete</el-button>
            <el-button v-else type="danger" plain size="small" @click="onQuit(scope.$index, scope.row)">Quit</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog title="Create A New Team" :visible.sync="dialogNewTeamVisible">
      <el-form ref="form" label-width="120px">
        <el-form-item label="Team Name">
          <el-input v-model="org_name" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogNewTeamVisible = false">{{ 'cancel' }}</el-button>
        <el-button type="primary" @click="onNewTeamSubmit">{{ 'confirm' }}</el-button>
      </div>
    </el-dialog>
    <el-dialog title="Join An Team" :visible.sync="dialogJoinTeamVisible">
      <el-form ref="form" label-width="120px">
        <el-form-item label="Team Name">
          <el-select v-model="org_join" placeholder="Please choose a team to join">
            <el-option
              v-for="org in all_teams"
              :key="org.label"
              :label="org.label"
              :value="org.value"
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
import { newTeam, joinTeam, fetchJoinedTeams, fetchAllTeams, quitTeam, deleteTeam, fetchJoinedOrganizations, fetchJoinedOrganizationTeams } from '@/api/user'

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
      dialogNewTeamVisible: false,
      dialogJoinTeamVisible: false,
      listLoading: false,
      joined_organizations: [],
      organization: null,
      joined_teams: [],
      all_teams: [],
      org_name: '',
      org_join: null,
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
    },
    owned_organizations() {
      return this.joined_organizations.filter(org => {
        return org.owner_email === this.email
      })
    }
  },
  async created() {
    await this.getTeams()
  },
  methods: {
    async getTeams() {
      this.joined_organizations = await fetchJoinedOrganizations()
      this.joined_teams = await fetchJoinedTeams()
      this.all_teams = await fetchAllTeams()
      this.organizations = await fetchJoinedOrganizationTeams()
    },
    async onNewTeamSubmit() {
      try {
        await newTeam({ name: this.org_name, organization_id: this.organization })
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
        await joinTeam({ id: this.org_join, organization_id: this.organization })
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

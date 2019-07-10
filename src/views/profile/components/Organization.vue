<template>
  <div>
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>Organizations Joined</span>
        <el-button style="float: right" type="primary" plain size="medium" @click="onJoinOrganization">Join Organization</el-button>
        <el-button style="float: right; margin-right: 5px;" type="primary" plain size="medium" @click="onNewOrganization">New Organization</el-button>
      </div>
      <el-table
        v-loading="listLoading"
        :data="joined_organizations"
        row-key="value"
        fit
        style="width: 100%"
      >
        <el-table-column label="Organization" min-width="100">
          <template slot-scope="scope">
            <el-row type="flex" justify="left" align="middle" :gutter="5">
              <el-col style="width: auto">
                <img :src="avatar_url + '/' + scope.row.value" class="user-avatar">
              </el-col>
              <el-col>
                <span class="link-type" @click="onOrganization(scope.row)">{{ scope.row.label }}</span>
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
            <el-button v-if="scope.row.owner_email === user.email" type="danger" plain size="small" @click="onDelete(scope.$index, scope.row)">Delete</el-button>
            <el-button v-else type="danger" plain size="small" @click="onQuit(scope.$index, scope.row)">Quit</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog title="Create A New Organization" :visible.sync="dialogNewOrgVisible">
      <el-form ref="form" label-width="120px">
        <el-form-item label="Organization Name">
          <el-input v-model="org_name" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogNewOrgVisible = false">{{ 'cancel' }}</el-button>
        <el-button type="primary" @click="onNewOrgSubmit">{{ 'confirm' }}</el-button>
      </div>
    </el-dialog>
    <el-dialog title="Join An Organization" :visible.sync="dialogJoinOrgVisible">
      <el-form ref="form" label-width="120px">
        <el-form-item label="Organization Name">
          <el-select v-model="org_join" placeholder="Please choose a organization to join">
            <el-option
              v-for="org in all_organizations"
              :key="org.label"
              :label="org.label"
              :value="org.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogJoinOrgVisible = false">{{ 'cancel' }}</el-button>
        <el-button type="primary" @click="onJoinOrgSubmit">{{ 'confirm' }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { newOrganization, joinOrganization, fetchJoinedOrganizations, fetchJoinedOrganizationTeams, fetchAllOrganizations, quitOrganization, deleteOrganization } from '@/api/user'

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
      dialogNewOrgVisible: false,
      dialogJoinOrgVisible: false,
      listLoading: false,
      joined_organizations: [],
      all_organizations: [],
      org_name: '',
      org_join: null,
      avatar_url: process.env.VUE_APP_BASE_API + '/organization/avatar',
      form: {
      }
    }
  },
  computed: {
    organization_team: {
      get() {
        return this.$store.state.settings.organization_team
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'organization_team',
          value: val
        })
      }
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
  async created() {
    await this.getOrganizations()
  },
  methods: {
    async getOrganizations() {
      this.joined_organizations = await fetchJoinedOrganizations()
      this.all_organizations = await fetchAllOrganizations()
      this.organizations = await fetchJoinedOrganizationTeams()
    },
    async onNewOrgSubmit() {
      try {
        await newOrganization({ name: this.org_name })
        this.$message({
          message: 'Organization has been created successfully',
          type: 'success',
          duration: 5 * 1000
        })
      } catch (error) {
        console.error(error)
      }
      await this.getOrganizations()
      this.dialogNewOrgVisible = false
      this.eventHub.$emit('ORGANIZATION_ENTER')
    },
    async onJoinOrgSubmit() {
      try {
        await joinOrganization({ organization_id: this.org_join })
        this.$message({
          message: 'Join the organization successfully',
          type: 'success',
          duration: 5 * 1000
        })
      } catch (error) {
        console.error(error)
      }
      await this.getOrganizations()
      this.dialogJoinOrgVisible = false
      this.eventHub.$emit('ORGANIZATION_ENTER')
    },
    onNewOrganization() {
      this.dialogNewOrgVisible = true
    },
    onJoinOrganization() {
      this.dialogJoinOrgVisible = true
    },
    onOrganization() {
    },
    onUser() {
    },
    async onQuit(idx, row) {
      const organization_id = row.value
      try {
        await quitOrganization({ 'organization_id': organization_id })
      } catch (error) {
        console.error(error)
        return
      }
      this.$message({
        message: 'Quit the organization successfully',
        type: 'success',
        duration: 5 * 1000
      })

      if (this.organization_team) {
        const [organization] = this.organization_team
        if (organization === organization_id) {
          this.organization_team = null
        }
      }
      await this.getOrganizations()
      this.eventHub.$emit('ORGANIZATION_LEAVE', organization_id)
    },
    async onDelete(idx, row) {
      const organization_id = row.value
      try {
        await deleteOrganization({ 'organization_id': organization_id })
      } catch (error) {
        console.error(error)
        return
      }
      this.$message({
        message: 'Delete the organization successfully',
        type: 'success',
        duration: 5 * 1000
      })

      if (this.organization_team) {
        const [organization] = this.organization_team
        if (organization === organization_id) {
          this.organization_team = null
        }
      }
      await this.getOrganizations()
      this.eventHub.$emit('ORGANIZATION_LEAVE', organization_id)
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

<template>
  <div>
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>{{ $t('profile.organizationsJoined') }}</span>
        <el-button style="float: right" type="primary" plain size="medium" @click="onJoinOrganization">{{ $t('profile.joinOrganization') }}</el-button>
        <el-button style="float: right; margin-right: 5px;" type="primary" plain size="medium" @click="onNewOrganization">{{ $t('profile.newOrganization') }}</el-button>
      </div>
      <el-table
        v-loading="listLoading"
        :data="joined_organizations"
        row-key="value"
        fit
        style="width: 100%"
      >
        <el-table-column :label="$t('profile.organization')" min-width="100">
          <template slot-scope="scope">
            <el-row type="flex" justify="left" align="middle" :gutter="5">
              <el-col style="width: auto">
                <img :src="scope.row.avatarUrl" class="user-avatar">
              </el-col>
              <el-col>
                <span class="link-type" @click="onOrganization(scope.row)">{{ scope.row.label }}</span>
              </el-col>
            </el-row>
          </template>
        </el-table-column>
        <el-table-column :label="$t('profile.owner')" min-width="100">
          <template slot-scope="scope">
            <span class="link-type" @click="onUser(scope.row)">{{ scope.row.owner }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('profile.organization_id')" min-width="100">
          <template slot-scope="scope">
            <span>{{ scope.row.value }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('profile.action')" width="220">
          <template v-if="scope.row.personal === false" slot-scope="scope">
            <el-button v-if="scope.row.owner_email === user.email" type="danger" plain size="small" @click="onDelete(scope.$index, scope.row)">{{ $t('permission.delete') }}</el-button>
            <el-button v-else type="danger" plain size="small" @click="onQuit(scope.$index, scope.row)">{{ $t('permission.quit') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog :title="$t('profile.newOrganization')" :visible.sync="dialogNewOrgVisible">
      <el-form ref="form" label-width="120px">
        <el-form-item :label="$t('profile.organizationName')">
          <el-input v-model="org_name" :placeholder="$t('profile.placeholderNewOrganization')" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogNewOrgVisible = false">{{ $t('permission.cancel') }}</el-button>
        <el-button type="primary" @click="onNewOrgSubmit">{{ $t('permission.confirm') }}</el-button>
      </div>
    </el-dialog>
    <el-dialog :title="$t('profile.joinOrganization')" :visible.sync="dialogJoinOrgVisible">
      <el-form ref="form" label-width="120px">
        <el-form-item :label="$t('profile.organizationName')">
          <el-select v-model="org_join" :placeholder="$t('profile.placeholderJoinOrganization')">
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
        <el-button @click="dialogJoinOrgVisible = false">{{ $t('permission.cancel') }}</el-button>
        <el-button type="primary" @click="onJoinOrgSubmit">{{ $t('permission.confirm') }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { newOrganization, joinOrganization, fetchJoinedOrganizations, fetchJoinedOrganizationTeams, fetchAllOrganizations, quitOrganization, deleteOrganization, getOrganizationAvatar } from '@/api/user'

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
      let ret = await fetchJoinedOrganizations()
      if (ret.code !== 20000) return
      this.joined_organizations = await Promise.all(ret.data.organizations.map(async organization => {
        const ret = await getOrganizationAvatar(organization.value)
        if (ret.code !== 20000) return
        organization.avatarUrl = `data:${ret.data.type};base64,` + ret.data.data
        return organization
      }))

      ret = await fetchAllOrganizations()
      if (ret.code !== 20000) return
      this.all_organizations = ret.data.organizations

      ret = await fetchJoinedOrganizationTeams()
      if (ret.code !== 20000) return
      this.organizations = ret.data.organization_team
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
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
        :data="organizations"
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
            <el-button type="danger" plain size="small" @click="onQuit(scope.$index, scope.row)">Quit</el-button>
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
import { newOrganization, joinOrganization, fetchJoinedOrganizations, fetchAllOrganizations, quitOrganization } from '@/api/user'

export default {
  data() {
    return {
      dialogNewOrgVisible: false,
      dialogJoinOrgVisible: false,
      listLoading: false,
      organizations: [],
      all_organizations: [],
      org_name: '',
      org_join: null,
      avatar_url: process.env.VUE_APP_BASE_API + '/organization/avatar',
      form: {
      }
    }
  },
  async created() {
    await this.getOrganizations()
  },
  methods: {
    async getOrganizations() {
      this.organizations = await fetchJoinedOrganizations()
      this.all_organizations = await fetchAllOrganizations()
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
    },
    async onJoinOrgSubmit() {
      try {
        await joinOrganization({ id: this.org_join })
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
      try {
        await quitOrganization({ 'organization_id': this.organizations[idx].value })
        this.$message({
          message: 'Quit the organization successfully',
          type: 'success',
          duration: 5 * 1000
        })
      } catch (error) {
        console.error(error)
      }
      await this.getOrganizations()
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

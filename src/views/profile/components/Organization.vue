<template>
  <div>
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>Organizations Joined</span>
        <el-button style="float: right" type="primary" size="medium" @click="onNewOrganization">New Organization</el-button>
      </div>
      <el-table
        v-loading="listLoading"
        :data="organizations"
        fit
        style="width: 100%"
      >
        <el-table-column label="Organization" min-width="100">
          <template slot-scope="scope">
            <el-row type="flex" justify="left" align="middle" :gutter="5">
              <el-col style="width: auto">
                <img :src="avatar_url + '/' + scope.row.id" class="user-avatar">
              </el-col>
              <el-col>
                <span class="link-type" @click="onTestDetail(scope.row)">{{ scope.row.name }}</span>
              </el-col>
            </el-row>
          </template>
        </el-table-column>
        <el-table-column label="Owner" min-width="100">
          <template slot-scope="scope">
            <span class="link-type" @click="onTestDetail(scope.row)">{{ scope.row.owner }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Action" width="220">
          <template slot-scope="scope">
            <el-button type="danger" plain size="small" @click="onQuit(scope.$index, scope.row)">Quit</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog title="Create A New Organization" :visible.sync="dialogFormVisible">
      <el-form ref="form" :model="form" label-width="120px">
        <el-form-item label="Organization Name">
          <el-input v-model="org_name" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">{{ 'cancel' }}</el-button>
        <el-button type="primary" @click="onSubmit">{{ 'confirm' }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { newOrganization, fetchOrganizations, quitOrganization } from '@/api/user'

export default {
  data() {
    return {
      dialogFormVisible: false,
      listLoading: false,
      organizations: [],
      org_name: '',
      avatar_url: process.env.VUE_APP_BASE_API + '/organization/avatar'
    }
  },
  async created() {
    await this.getOrganizations()
  },
  methods: {
    async getOrganizations() {
      this.organizations = await fetchOrganizations()
    },
    async onSubmit() {
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
      this.dialogFormVisible = false
    },
    onNewOrganization() {
      this.dialogFormVisible = true
    },
    async onQuit(idx, row) {
      await quitOrganization(row.name)
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

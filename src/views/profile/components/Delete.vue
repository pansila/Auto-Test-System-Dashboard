<template>
  <div>
    <el-table
      v-show="organizations && organizations.length > 0"
      :data="organizations"
      style="width: 100%; padding-top: 15px; padding-bottom: 40px;"
      stripe
    >
      <el-table-column label="Organization/Team">
        <template slot-scope="scope">
          {{ scope.row.label }}
        </template>
      </el-table-column>
      <el-table-column label="Transfer Ownership">
        <template slot-scope="scope">
          <el-select v-model="new_owners[scope.row.label]" placeholder="Choose one to transfer Ownership">
            <el-option
              v-for="user in users[scope.row.label]"
              :key="user.value"
              :label="user.label"
              :value="user.value"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="Action">
        <template slot-scope="scope">
          <el-button size="small" @click="onTransfer(scope.row)">Transfer</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-form :model="form" :rules="passwordRules">
      <el-form-item>
        <el-alert
          title="Be noted that the operation is not reversible"
          type="warning"
        />
      </el-form-item>
      <el-form-item label="Password" prop="password">
        <el-input v-model="form.password" type="password" />
      </el-form-item>
      <el-form-item>
        <el-button type="danger" @click="dialogVisible = true">Delete</el-button>
      </el-form-item>
    </el-form>
    <el-dialog
      title="Warning"
      :visible.sync="dialogVisible"
      width="30%"
    >
      <span v-if="organizations && organizations.length > 0">There is at least one organization owned by you, they will be deleted as well. Otherwise please specify a new owner first, are you sure to delete anyway?</span>
      <span v-else>All assets will be deleted as well, are you sure to proceed?</span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="onDeleteConfirm">Confirm</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { deleteAccount, fetchJoinedOrganizations, fetchOrganizationUsers, transferOwnership } from '@/api/user'

export default {
  data() {
    const validatePassword = (rule, value, callback) => {
      if (!value || value.length < 6) {
        callback(new Error('The password can not be less than 6 digits'))
      } else {
        callback()
      }
    }
    return {
      organizations: [],
      users: {},
      new_owners: [],
      dialogVisible: false,
      form: {
        password: ''
      },
      passwordRules: {
        password: [{ required: true, trigger: 'blur', validator: validatePassword }]
      }
    }
  },
  computed: {
    ...mapGetters([
      'email'
    ])
  },
  async created() {
    const organizations = await fetchJoinedOrganizations()
    this.organizations = organizations.filter(org => {
      if (org.owner_email === this.email) return true
      return false
    })
    this.organizations.forEach(async(org) => {
      this.users[org.label] = await fetchOrganizationUsers({ organization_id: org.value })
      this.users[org.label] = this.users[org.label].filter(user => {
        if (user.email !== this.email) return true
        return false
      })
    })
  },
  methods: {
    async onDeleteConfirm() {
      try {
        await deleteAccount(this.form)
      } catch (error) {
        console.error(error)
        return
      }
      this.$message({
        message: 'Account has been deleted successfully',
        type: 'success',
        duration: 5 * 1000
      })
      this.dialogVisible = false

      await this.$store.dispatch('user/logout')
      this.$router.push(`/login?redirect=${this.$route.fullPath}`)
    },
    async onTransfer(organization) {
      try {
        await transferOwnership({ organization_id: organization.value, new_owner: this.new_owners[organization.label] })
        this.$message({
          message: 'Ownership has been transferred successfully',
          type: 'success'
        })
      } catch (error) {
        console.error(error)
      }
    }
  }
}
</script>

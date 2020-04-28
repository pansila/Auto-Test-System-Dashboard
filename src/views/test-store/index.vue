<template>
  <div class="page-container">
    <div class="filter-container">
      <el-row :gutter="10" type="flex" justify="space-between">
        <el-col style="width: auto;">
          <el-input v-model="listQuery.title" placeholder="title" style="width: 200px;" class="filter-item" />
          <el-button class="filter-item" icon="el-icon-search" @click="handleFilter">{{ 'search' }}</el-button>
          <el-upload
            ref="upload"
            class="upload-demo filter-item"
            action="http://abc.com"
            :on-remove="handleRemove"
            :before-remove="beforeRemove"
            :multiple="false"
            :limit="1"
            :file-list="fileList"
            :on-exceed="handleExceed"
            :on-change="onUploadFileChange"
            :on-error="onUploadError"
            :on-success="onUploadSuccess"
            :show-file-list="false"
            :http-request="onPackageUpload"
            style="display: inline-flex;"
          >
            <el-button type="primary">Upload</el-button>
          </el-upload>
        </el-col>
        <el-col style="width: auto;">
          <el-radio-group v-model="extenstionFilter">
            <el-radio-button key="test_suite" label="Test Suite">Test Suite</el-radio-button>
            <el-radio-button key="test_library" label="Test Library">Test Library</el-radio-button>
            <el-radio-button key="plugin" label="Plugin">System Plugin</el-radio-button>
          </el-radio-group>
        </el-col>
        <el-col style="width: auto;">
          <el-checkbox-button key="proprietary" v-model="proprietary" label="Proprietary">Proprietary</el-checkbox-button>
        </el-col>
      </el-row>
    </div>
    <div style="display: flex; flex-wrap: wrap;">
      <el-table
        :data="packages"
        @row-click="rowClicked"
      >
        <el-table-column label="Name" min-width="100">
          <template slot-scope="scope">
            {{ scope.row.name | replaceSpace }}
          </template>
        </el-table-column>
        <el-table-column label="Summary" min-width="200">
          <template slot-scope="scope">
            {{ scope.row.summary }}
          </template>
        </el-table-column>
        <el-table-column label="Latest version">
          <template slot-scope="scope">
            {{ scope.row.versions[0] }}
          </template>
        </el-table-column>
        <el-table-column label="Stars" min-width="50">
          <template slot-scope="scope">
            <svg-icon v-for="n in +scope.row.stars" :key="n" icon-class="star" />
          </template>
        </el-table-column>
        <el-table-column label="Downloads">
          <template slot-scope="scope">
            {{ scope.row.download_times }}
          </template>
        </el-table-column>
        <el-table-column label="Upload Date">
          <template slot-scope="scope">
            {{ scope.row.upload_date | dateFilter }}
          </template>
        </el-table-column>
      </el-table>
      <!-- <el-card v-for="(o, index) in 10" :key="o" body-style="padding: 0px;" style="margin-right: 20px; margin-bottom: 20px;" @click="console('purchases')">
        <img :src="'http://lorempixel.com/210/140/technics/' + (index + 1)" class="image">
        <div style="padding: 14px;">
          <div>
            <span>Essential Test Library</span>
          </div>
          <div style="margin-top: 8px;">
            <svg-icon v-for="c in 5" :key="c" icon-class="star" />
            <span>103</span>
          </div>
        </div>
      </el-card> -->
    </div>
    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="fetchPackageList" />
    <el-dialog title="Package Description" :visible.sync="descriptionVisible" width="800px" :modal="true">
      <el-container>
        <el-header>
          <el-row type="flex" justify="space-between">
            <el-col style="width: auto;">
              <el-row style="margin-bottom: 10px;">
                <el-col style="width: auto;">
                  <span>Rate Me:</span>
                </el-col>
                <el-col style="width: auto;">
                  <el-rate v-model="stars" @change="onStarChange" />
                </el-col>
              </el-row>
              <div>
                <span>Version:</span>
                <el-select v-model="version" size="mini" @change="onVersionChange">
                  <el-option v-for="v in versions" :key="v" :label="v" :value="v" />
                </el-select>
              </div>
            </el-col>
            <el-col style="width: auto;">
              <el-button type="primary" @click="remove">Remove</el-button>
              <el-button type="primary" @click="uninstall">Uninstall</el-button>
              <el-button type="primary" @click="install">Install</el-button>
            </el-col>
          </el-row>
        </el-header>
        <el-main>
          <el-divider />
          <div ref="package_description" />
        </el-main>
      </el-container>
    </el-dialog>
  </div>
</template>

<script>
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination
import { mapGetters } from 'vuex'
import { fetchPackages, uploadPackage, updatePackage, getPackageInfo, installPackage, uninstallPackage, removePackage } from '@/api/testSuite'
import Viewer from 'tui-editor/dist/tui-editor-Viewer'
import 'tui-editor/dist/tui-editor.css' // editor ui
import 'tui-editor/dist/tui-editor-contents.css' // editor content

export default {
  name: 'DragTable',
  components: { Pagination },
  filters: {
    replaceSpace(data) {
      return data.replace(/-/g, ' ').replace(/_/g, ' ')
    },
    dateFilter(time) {
      const date = new Date(time)
      return date.toLocaleString()
    }
  },
  data() {
    return {
      currentDate: new Date(),
      listLoading: true,
      fileList: [],
      listQuery: {
        page: 1,
        limit: 10,
        title: undefined
      },
      indent: 20,
      packages: [],
      total: 0,
      list: null,
      notMove: null,
      proprietary: false,
      descriptionVisible: false,
      extenstionFilter: 'Test Suite',
      current_package: null,
      viewer: null,
      stars: 0,
      version: null,
      versions: null
    }
  },
  computed: {
    ...mapGetters([
      'organization_team'
    ])
  },
  watch: {
    async organization_team(newVal) {
      await this.fetchPackageList()
    },
    async proprietary(newVal) {
      await this.fetchPackageList()
    },
    async extenstionFilter(val) {
      await this.fetchPackageList()
    }
  },
  async created() {
    await this.fetchPackageList()
  },
  methods: {
    async fetchPackageList() {
      const [organization, team] = this.organization_team || [null, null]
      this.listQuery.organization = organization
      this.listQuery.team = team
      this.listQuery.package_type = this.extenstionFilter
      this.listQuery.proprietary = this.proprietary

      this.listLoading = true
      try {
        const ret = await fetchPackages(this.listQuery)
        this.packages = ret.items
        this.total = ret.total
      } catch (error) {
        console.error(error)
      }
      this.listLoading = false
    },
    handleRemove(file, fileList) {
      this.fileList = fileList
    },
    handleExceed(files, fileList) {
      this.$message.warning(`Please wait for uploading done.`)
    },
    beforeRemove(file, fileList) {
      return this.$confirm(`Are you sure to delete ${file.name}?`)
    },
    onUploadError(err, file, fileList) {
      console.error(err)
    },
    onUploadSuccess(res, file, fileList) {
      this.$refs.upload.clearFiles()
    },
    onUploadFileChange(file, fileList) {
      if (!this.organization_team) {
        this.fileList = []
        return false
      }
      this.fileList = fileList.filter(file => {
        const isLt50M = file.size / 1024 / 1024 < 50
        if (!isLt50M) {
          this.$message.error('File size should not be larger than 50MB')
          return false
        }
        return true
      })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.fetchPackageList()
    },
    async onPackageUpload(options) {
      if (!this.organization_team) {
        this.$message.error('Please select an organization or team first.')
        return
      }
      const [organization, team] = this.organization_team
      const file = options.file
      const formData = new FormData()
      formData.append('organization', organization)
      formData.append('team', team)
      formData.append('proprietary', this.proprietary)
      formData.append('package_type', this.extenstionFilter)
      formData.append('file', file)
      try {
        await uploadPackage(formData)
      } catch (error) {
        this.$message.error('Failed to upload the package, please try uploading again')
        return
      }
      this.$message({
        message: 'Upload the package successfully',
        type: 'success'
      })
    },
    rowClicked(row) {
      this.descriptionVisible = true
      this.current_package = row
      this.stars = row.stars
      this.versions = row.versions
      this.version = this.versions[0] || ''
      this.$nextTick(() => {
        if (this.viewer) {
          this.viewer.setValue(row.description)
          return
        }
        this.viewer = new Viewer({
          el: this.$refs.package_description,
          initialValue: row.description,
          usageStatistics: false
        })
      })
    },
    async onStarChange() {
      const [organization, team] = this.organization_team || [null, null]
      let ret
      try {
        ret = await updatePackage({
          organization, team,
          stars: this.stars,
          proprietary: this.proprietary,
          name: this.current_package.name,
          package_type: this.current_package.package_type
        })
      } catch (error) {
        console.error(error)
        return
      }
      this.stars = ret.data.stars
    },
    async onVersionChange() {
      const [organization, team] = this.organization_team || [null, null]
      let ret
      try {
        ret = await getPackageInfo({
          organization, team,
          proprietary: this.proprietary,
          version: this.version,
          name: this.current_package.name,
          package_type: this.current_package.package_type
        })
      } catch (error) {
        console.error(error)
        return
      }
      this.viewer.setValue(ret.data.description)
    },
    async install() {
      if (!this.current_package) return
      const [organization, team] = this.organization_team || [null, null]
      const data = { organization, team,
        proprietary: this.proprietary,
        name: this.current_package.name,
        package_type: this.current_package.package_type,
        version: this.version
      }
      try {
        await installPackage(data)
      } catch (error) {
        console.error(error)
        this.$message.error('Failed to install the package')
        return
      }
      this.$message({
        message: 'Install the package successfully',
        type: 'success'
      })
    },
    async uninstall() {
      if (!this.current_package) return
      const [organization, team] = this.organization_team
      const data = { organization, team,
        proprietary: this.proprietary,
        name: this.current_package.name,
        package_type: this.current_package.package_type,
        version: this.version
      }
      try {
        await uninstallPackage(data)
      } catch (error) {
        this.$message.error('Failed to uninstall the package')
        return
      }
      this.$message({
        message: 'Uninstall the package successfully',
        type: 'success'
      })
    },
    async remove() {
      if (!this.current_package) return
      const [organization, team] = this.organization_team
      const data = { organization, team,
        proprietary: this.proprietary,
        name: this.current_package.name,
        package_type: this.current_package.package_type,
        version: this.version
      }
      try {
        await removePackage(data)
      } catch (error) {
        this.$message.error('Failed to uninstall the package')
        return
      }
      this.$message({
        message: 'Uninstall the package successfully',
        type: 'success'
      })
    }
  }
}
</script>

<style>
.page-container{
  margin: 30px;
}
.el-divider--horizontal{
  margin: 0px;
}
</style>

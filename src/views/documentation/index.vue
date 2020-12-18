<template>
  <div class="app-container">
    <div class="button-container">
      <el-col style="width: auto;">
        <el-button v-if="viewMode" @click="onEdit">Edit</el-button>
        <template v-else>
          <el-button type="primary" @click="onDocSave">Save</el-button>
          <el-button @click="onDocNew">New</el-button>
          <el-button :icon="docLocked ? 'el-icon-unlock' : 'el-icon-lock'" @click="onLock">{{ docLocked ? 'Unlock' : 'Lock' }}</el-button>
          <el-button type="danger" @click="onDelete">Delete</el-button>
          <el-button @click="onUpload">Upload</el-button>
          <el-button @click="onCancelEdit">Cancel</el-button>
        </template>
      </el-col>
      <el-col style="width: auto;">
        <el-checkbox key="proprietary" v-model="proprietary" label="Proprietary" border>Proprietary</el-checkbox>
      </el-col>
    </div>
    <el-card v-show="viewMode" class="viewer-container">
      <div slot="header" class="clearfix">
        <span>{{ fileName }}</span>
        <el-button style="float: right; padding: 3px 0" type="text" @click="onHistory">History</el-button>
      </div>
      <Viewer ref="viewer" />
    </el-card>
    <Editor
      v-show="!viewMode"
      ref="editor"
      height="600px"
      initial-edit-type="wysiwyg"
      preview-style="vertical"
    />

    <el-dialog title="Please rpecify the path to create the document" :visible.sync="newDocDialogVisible">
      <el-col :span="4">
        <el-select v-model="pathRoot">
          <el-option
            v-for="item in paths"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-col>
      <el-col :span="18" style="margin-left: 10px">
        <el-input v-model="pathNew" placeholder="Please input the path of new page" />
      </el-col>
      <div slot="footer" class="dialog-footer">
        <el-button @click="newDocDialogVisible = false">{{ 'Cancel' }}</el-button>
        <el-button type="primary" @click="docNewPage">{{ 'Confirm' }}</el-button>
      </div>
    </el-dialog>

    <el-dialog title="Page Change History" :visible.sync="historyDialogVisible">
      <div style="height: 100%;">
        <el-steps direction="vertical" :active="0" space="90px">
          <el-step v-for="m in history" :key="m.revision" :title="m.title" icon="el-icon-eleme">
            <div slot="description">
              <p v-for="l in m.description.split('\n')" :key="l + (Math.random() * 1000).toFixed(0)" style="line-height: 10px;">{{ l }}</p>
            </div>
          </el-step>
        </el-steps>
      </div>
    </el-dialog>

    <el-dialog title="Upload Pictures" :visible.sync="uploadDialogVisible">
      <el-cascader
        ref="picturePathCas"
        v-model="picturePath"
        :props="picPaths"
        style="margin-bottom: 10px;"
        placeholder="Please specify a path"
        clearable
      />
      <div class="image-container">
        <el-upload
          class="avatar-uploader"
          action="#"
          list-type="picture-card"
          :auto-upload="false"
          :file-list="imageList"
          :on-change="onUploadFileChange"
          :on-remove="onFileRemove"
          :before-remove="beforeRemove"
        >
          <img v-if="imageUrl" :src="imageUrl" class="avatar">
          <i v-else class="el-icon-plus avatar-uploader-icon" />
        </el-upload>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="onDeleteCurrentPicPath">Delete Current Folder</el-button>
        <el-button @click="uploadDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="uploadDialogVisible = false">Confirm</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import 'codemirror/lib/codemirror.css'
import '@toast-ui/editor/dist/toastui-editor.css'

import { Editor, Viewer } from '@toast-ui/vue-editor'

import { mapGetters } from 'vuex'
import { getDocument, updateDocument, deleteDocument, lockDocument, getDocRoots, editPrivilegeCheck, getHistory, getPictures, uploadPictures, deletePicture, getPicturePaths, createPicturePath, deletePicturePath } from '@/api/testSuite'
import { baseName, b64toBlob } from '@/utils/index'

export default {
  name: 'Documentation',
  components: {
    Viewer,
    Editor
  },
  data() {
    const _this = this
    return {
      viewMode: true,
      proprietary: false,
      newDocDialogVisible: false,
      historyDialogVisible: false,
      uploadDialogVisible: false,
      pathNew: undefined,
      pathRoot: undefined,
      paths: undefined,
      fileName: undefined,
      markdownContent: '',
      docLocked: false,
      history: [],
      imageList: [],
      serverFiles: undefined,
      tempIndex: 1,
      staticUrl: process.env.NODE_ENV === 'development' ? 'http://localhost:5000/static/pics' : '/static/pics',
      imageUrl: undefined,
      picturePath: undefined,
      picPaths: {
        lazy: true,
        checkStrictly: true,
        async lazyLoad(node, resolve) {
          const data = await _this.checkEditPrivilege()
          if (!data) return

          if (node.root) {
            resolve([{
              value: '.',
              label: '/'
            }])
            _this.picturePath = '.'
            return
          }
          const curPath = []
          let curNode = node
          while (curNode) {
            if (curNode.root) {
              curPath.push('.')
              break
            }
            curPath.push(curNode.value)
            curNode = curNode.parent
          }

          if (node.isDisabled) {
            let ret
            try {
              ret = await _this.$prompt('Please input the new folder name', 'Tip', {
                confirmButtonText: 'Confirm',
                cancelButtonText: 'Cancel'
              })
            } catch {
              resolve()
              node.loaded = false
              return
            }
            node.label = ret.value
            node.disabled = false
            curPath[0] = node.label
            data.path = curPath.reverse().join('/')
            ret = await createPicturePath(data)
            if (ret.code && ret.code !== 20000) {
              _this.$message.warning(ret.message)
            }
            if (node.parent) {
              node.parent.loaded = false
              node.parent.children = []
              // _this.$nextTick(() => lazyLoad(node.parent, resolve))
            }
            resolve()
            return
          }

          data.path = curPath.reverse().join('/')
          let ret = await getPicturePaths(data)
          if (ret.code && ret.code !== 20000) {
            _this.$message.warning(ret.message)
            return
          }
          const paths = await getPicturePaths(data)
          if (!_this.picturePath) _this.picturePath = ['.']
          ret = paths.map(item => ({
            value: item.value,
            label: item.label
          }))
          if (!node.root) {
            ret.push({ value: this.tempIndex++, label: 'Click to New A Folder', disabled: true })
          }
          resolve(ret)
        }
      }
    }
  },
  computed: {
    ...mapGetters([
      'organization_team',
      'language'
    ])
  },
  watch: {
    async proprietary(val) {
      if (val && !this.organization_team) {
        this.$message.warning('Your organization or team has not been specified')
        this.$nextTick(() => { this.proprietary = false })
        return
      }
      await this.getMarkdownPage()
    },
    async organization_team() {
      await this.getMarkdownPage()
    },
    async $route(to, from) {
      await this.getMarkdownPage()
    },
    async language() {
      await this.getMarkdownPage()
    },
    uploadDialogVisible(value) {
      if (!value) this.imageList = []
    },
    async picturePath(path) {
      const data = await this.checkEditPrivilege()
      if (!data) return

      data.path = path.join('/')
      await this.getCurrentPathPictures(data)
    }
  },
  async mounted() {
    await this.getMarkdownPage()
  },
  methods: {
    async getMarkdownPage() {
      let organization
      let team
      if (this.organization_team) {
        [organization, team] = this.organization_team
      }
      let path = this.$route.params.path
      const query = this.$route.query
      this.viewMode = query.view === undefined ? true : query.view
      if (path === ':path') {
        path = 'home.md'
      }
      if (path.endsWith('/')) {
        path = path.slice(0, path.length - 1)
      }
      if (path.endsWith('.md')) {
        this.fileName = path.slice(0, path.length - 3)
      } else {
        this.fileName = path
      }
      this.fileName = baseName(this.fileName)
      this.markdownContent = ''
      const ret = await getDocument(path, { language: this.language, organization, team, proprietary: this.proprietary })
      if (ret.code !== 20000) {
        if (ret.code === 2) {
          this.markdownContent = '### <p style="text-align: center;">The page has not been created</p>\n*<p style="text-align: center;">Click the button "Edit" above to create it.</p>*'
        } else {
          this.$message.error(ret.message)
          return
        }
      } else {
        this.markdownContent = ret.data.content
        this.docLocked = ret.data.locked
      }
      this.markdownContent = this.markdownContent.replace(/(?<!!)\[([^\]]*)\]\(([^\)]+)\)/g, (all, text, link) => {
        return '[' + text + '](/#/documentation' + link.replace(/\s/, '-') + ')'
      })
      const imageExtensions = ['.jpg', '.png', '.bmp', '.tiff', '.svg', '.gif']
      imageExtensions.forEach(imageExtension => {
        this.markdownContent = this.markdownContent.replace(new RegExp('!\\[([^\\]]*)\\]\\(([^\\)]+)' + imageExtension + '\\)', 'g'), (all, text, link) => {
          return '![' + text + '](' + this.staticUrl + link.replace(/\s/, '-') + imageExtension + ')'
        })
      })
      if (this.viewMode) {
        this.$refs.viewer.invoke('setMarkdown', this.markdownContent)
      } else {
        this.$refs.editor.invoke('setMarkdown', this.markdownContent)
      }
    },
    async onDocNew() {
      const data = await this.checkEditPrivilege()
      if (!data) return
      const { organization, team, language, proprietary } = data

      this.paths = await getDocRoots({ language, organization, team, proprietary })
      this.pathRoot = 0
      this.newDocDialogVisible = true
    },
    async docNewPage() {
      const data = await this.checkEditPrivilege()
      if (!data) return
      const { organization, team, language, proprietary } = data

      if (!this.pathNew.endsWith('.md')) {
        this.pathNew += '.md'
      }
      await updateDocument(this.pathNew, { language, organization, team, proprietary })
      this.newDocDialogVisible = false
      this.viewMode = false
      this.$router.push({ name: 'documentation', params: { path: this.pathNew }, query: { view: false }})
    },
    async onDocSave() {
      const data = await this.checkEditPrivilege()
      if (!data) return
      const { path, organization, team, language, proprietary } = data

      let content = this.$refs.editor.invoke('getMarkdown')
      content = content.replace(/\]\(\/#\/documentation\//g, '](/')
      content = content.replace('](' + this.staticUrl, '](')
      // content = content.replace(new RegExp('!\\[([^\\]]*)\\]\\(' + this.staticUrl + '([^\)]+)' imageExtension + '\\)', 'g'), (all, text, link) => {
      //       return '![' + text + '](' + link.replace(/\s/, '-') + imageExtension + ')'
      //   })

      await updateDocument(path, { language, organization, team, proprietary, doc_content: content })
      this.$message.info('Content has been saved')
    },
    async onCancelEdit() {
      this.viewMode = true
      if (!this.$route.query.view) {
        this.$router.push({ name: 'documentation', params: { path: this.$route.params.path }, query: { key: (Math.random() * 1000).toFixed(0) }})
      } else {
        this.$router.push({ name: 'documentation', params: { path: this.$route.params.path }})
        await this.getMarkdownPage()
      }
    },
    beforeRemove(file, fileList) {
      return this.$confirm(`Are you sure to delete ${file.name}?`)
    },
    async checkEditPrivilege() {
      if (!this.organization_team) {
        this.$message.warning('Your organization or team has not been specified')
        return
      }
      const [organization, team] = this.organization_team
      let path = this.$route.params.path
      if (path === ':path') {
        path = 'home.md'
      }
      const ret = await editPrivilegeCheck({ path, organization, team, language: this.language, proprietary: this.proprietary })
      if (ret.code !== 20000) {
        this.$message.warning('You don\'t have the privilege to edit the page, please contact the organization owner for details.')
        return
      }
      return { path, organization, team, language: this.language, proprietary: this.proprietary }
    },
    async onDelete() {
      const confirmed = await this.$confirm(`Are you sure to delete the page?`)
      if (!confirmed) return

      const data = await this.checkEditPrivilege()
      if (!data) return
      const { path, organization, team, language, proprietary } = data

      await deleteDocument(path, { language, organization, team, proprietary })
      this.viewMode = true
      this.$router.push({ name: 'documentation', params: { path: 'home.md' }})
    },
    async onLock() {
      const data = await this.checkEditPrivilege()
      if (!data) return
      const { path, organization, team, language, proprietary } = data

      await lockDocument(path, { lock: !this.docLocked, language, organization, team, proprietary })
      await this.onCancelEdit()
    },
    async onEdit() {
      const data = await this.checkEditPrivilege()
      if (!data) return

      this.$refs.editor.invoke('setMarkdown', this.markdownContent)
      this.viewMode = false
    },
    async onHistory() {
      const data = await this.checkEditPrivilege()
      if (!data) return

      const ret = await getHistory(data)
      if (ret.code === 20000) {
        this.history = ret.data.history
        this.historyDialogVisible = true
      } else {
        this.$message.warning('Failed to get the history')
      }
    },
    async getCurrentPathPictures(data) {
      data.path = data.path.replace(/^[\/\\]+/g, '')
      const ret = await getPictures(data)
      if (ret.code !== 20000) return
      this.imageList = ret.data.fileList.map(file => {
        file.uid = Date.now() + this.tempIndex++
        const blob = b64toBlob(file.data, file.type)
        return {
          status: 'ready',
          name: file.name,
          size: file.size,
          percentage: 100,
          uid: file.uid,
          raw: blob,
          url: URL.createObjectURL(blob)
        }
      })
      this.serverFiles = this.imageList.map(file => {
        return { uid: file.uid }
      })
    },
    async onUpload() {
      const data = await this.checkEditPrivilege()
      if (!data) return

      this.uploadDialogVisible = true

      data.path = this.picturePath ? this.picturePath.join('/') : '.'
      await this.getCurrentPathPictures(data)
    },
    async onUploadFileChange(file) {
      const data = await this.checkEditPrivilege()
      if (!data) return
      const { organization, team, language, proprietary } = data

      const formData = new FormData()
      formData.append('path', this.picturePath.join('/'))
      formData.append('organization', organization)
      formData.append('team', team)
      formData.append('language', language)
      formData.append('proprietary', proprietary)

      let found = false
      for (const i in this.serverFiles) {
        if (this.serverFiles[i].uid === file.uid) {
          found = true
          break
        }
      }
      if (found) return
      formData.append(file.name, file.raw)

      await uploadPictures(formData)
    },
    async onFileRemove(file) {
      const data = await this.checkEditPrivilege()
      if (!data) return
      data.filename = file.name
      data.path = this.picturePath.join('/')

      const ret = await deletePicture(data)
      if (ret.code !== 20000) {
        this.$message.warning(ret.message)
      }
    },
    async onDeleteCurrentPicPath() {
      const confirmed = await this.$confirm(`Are you sure to delete the folder?`)
      if (!confirmed) return

      const data = await this.checkEditPrivilege()
      if (!data) return
      data.path = this.picturePath.join('/')
      const ret = await deletePicturePath(data)
      if (ret.code !== 20000) {
        this.$message.warning(ret.message)
      }
      this.currentNode = this.$refs.picturePathCas.getCheckedNodes()[0]
      if (this.currentNode.parent) {
        this.currentNode.parent.children = []
        this.currentNode.parent.loaded = false
      }
      this.picturePath = ['.']
    }
  }
}
</script>

<style lang="scss" scoped>
.button-container {
  margin: 10px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.viewer-container {
  margin: 10px;
  border: 1px;
}
.image-container {
  display: flex;
  flex-wrap: wrap;
}
.image-thumb {
  margin: 2px;
  width: 100px;
  height: 100px;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
}
.avatar {
  width: 100px;
  height: 100px;
  display: block;
}
</style>

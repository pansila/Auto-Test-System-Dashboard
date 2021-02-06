<template>
  <div style="margin: 30px">
    <!-- <div class="filter-container">
      <el-row type="flex" justify="space-between" :gutter="8">
        <el-col :span="6">
          <el-select v-model="testSuiteIdx" placeholder="please select a test suite to edit" style="width: 100%">
            <el-option v-for="(t, i) in testSuiteList" :key="t" :label="t" :value="i" />
          </el-select>
        </el-col>
      </el-row>
    </div> -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <div slot="header">
            <span>Test Scripts</span>
            <el-button-group style="float: right;">
              <el-button size="small" @click="onNewFile">New File</el-button>
              <el-button size="small" @click="onNewFolder">New Folder</el-button>
              <el-upload
                style="float: right"
                class="upload-demo"
                action="http://abc.com"
                multiple
                :auto-upload="false"
                :file-list="fileList"
                :on-change="onUploadFileChange"
                :on-remove="handleRemove"
                :before-remove="beforeRemove"
              >
                <el-button size="small">Upload Scripts</el-button>
              </el-upload>
            </el-button-group>
          </div>
          <el-container style="max-height: 200px; border: 1px solid #eee">
            <el-aside width="100%" style="padding: 0">
              <keep-alive>
                <el-tree :data="testScripts || []" :render-content="renderContentForScript" :highlight-current="true" @node-click="onClickScript" />
              </keep-alive>
            </el-aside>
          </el-container>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div slot="header">
            <span>Test Libraries</span>
            <el-button-group style="float: right;">
              <el-button size="small">New File</el-button>
              <el-button size="small">New Folder</el-button>
              <el-upload
                style="float: right"
                class="upload-demo"
                action="#"
                multiple
                :auto-upload="false"
                :file-list="fileList"
                :on-change="onUploadFileChange"
                :on-remove="handleRemove"
                :before-remove="beforeRemove"
              >
                <el-button size="small">Upload Scripts</el-button>
              </el-upload>
            </el-button-group>
          </div>
          <el-container style="max-height: 200px; border: 1px solid #eee">
            <el-aside width="100%" style="padding: 0">
              <keep-alive>
                <el-tree :data="testLibraries || []" :render-content="renderContentForLibrary" @node-click="onClickScript" />
              </keep-alive>
            </el-aside>
          </el-container>
        </el-card>
      </el-col>
    </el-row>
    <Editor
      v-show="currentEditType === 'test_scripts'"
      :id="userScriptID"
      ref="userScriptEditor"
      :options="editorOptions"
      style="margin-top: 30px"
      @change="onEditorChange"
    />
    <div v-show="currentEditType === 'test_libraries'" :id="backingScriptID" style="margin-top: 30px; width: 100%; height: 500px;" />
    <el-dialog title="Rename" :visible.sync="dialogRenameVisible">
      <el-form :model="form">
        <el-form-item label="New File Name" label-width="120px">
          <el-input v-model="form.name" autocomplete="off" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogRenameVisible = false">Cancel</el-button>
        <el-button type="primary" @click="onDialogRenameOK">OK</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
// deps for editor
import 'codemirror/lib/codemirror.css'
import '@toast-ui/editor/dist/toastui-editor.css'

import { Editor } from '@toast-ui/vue-editor'

import { mapGetters } from 'vuex'
import defaultOptions from './defaultOptions'
import { fetchScripts, getScript, updateScript, removeScript, uploadScripts } from '@/api/testSuite'
import { debounce } from '@/utils'

import ace from 'ace-builds/src-noconflict/ace'
import setupAce from './ace-webpack-resolver'

setupAce(ace)

const DOC_STATE_NULL = 'none'
const DOC_STATE_CREATED = 'created'
const DOC_STATE_MODIFIED = 'modified'
const DOC_STATE_MODIFING = 'modifing'

export default {
  name: 'ScriptEditor',
  components: {
    Editor
  },
  props: {
    value: {
      type: String,
      default: ''
    },
    userScriptID: {
      type: String,
      required: false,
      default() {
        return 'markdown-editor-' + +new Date() + ((Math.random() * 1000).toFixed(0) + '')
      }
    },
    backingScriptID: {
      type: String,
      required: false,
      default() {
        return 'python-editor-' + +new Date() + ((Math.random() * 1000).toFixed(0) + '')
      }
    },
    options: {
      type: Object,
      default() {
        return defaultOptions
      }
    },
    mode: {
      type: String,
      default: 'wysiwyg'
    },
    height: {
      type: String,
      required: false,
      default: '100%'
    },
    language: {
      type: String,
      required: false,
      default: 'en_US' // https://github.com/nhnent/tui.editor/tree/master/src/js/langs
    }
  },
  data() {
    return {
      tests: [],
      testSuiteIdx: null,
      backingScriptEditor: null,
      testScripts: null,
      testLibraries: null,
      currentEditType: 'test_scripts',
      mouseover: 0,
      currentNode: null,
      lastNode: null,
      dialogRenameVisible: false,
      lastFile: null,
      fileList: [],
      uploadURL: process.env.BASE_API + '/script/upload/',
      form: {
        name: null
      },
      topScriptNode: null,
      topLibraryNode: null,
      switchingFile: false
    }
  },
  computed: {
    ...mapGetters([
      'organization_team'
    ]),
    editorOptions() {
      const options = Object.assign({}, defaultOptions, this.options)
      options.initialEditType = this.mode
      options.height = this.height
      options.language = this.language
      return options
    },
    editor() {
      const _this = this
      return this.currentEditType === 'test_scripts' ? {
        setValue(data) {
          _this.$refs.userScriptEditor.invoke('setMarkdown', data)
        },
        getValue() {
          return _this.$refs.userScriptEditor.invoke('getMarkdown')
        },
        moveCursorTo() {
          _this.$refs.userScriptEditor.invoke('moveCursorToStart')
        }
      } : this.backingScriptEditor
    },
    scripts() {
      return this.currentEditType === 'test_scripts' ? this.testScripts : this.testLibraries
    },
    testSuiteList() {
      const tss = []
      for (let i = 0; i < this.tests.length; i++) {
        if (i === 0) {
          tss.push(this.tests[i].test_suite)
          continue
        }
        let j
        for (j = 0; j < i; j++) {
          if (this.tests[i].test_suite === this.tests[j].test_suite) {
            tss.push(this.tests[i].test_suite + ` (${this.tests[i].path})`)
            break
          }
        }
        if (j === i) {
          tss.push(this.tests[i].test_suite)
        }
      }
      return tss
    }
  },
  watch: {
    value(newValue, preValue) {
      if (newValue !== preValue && newValue !== this.$refs.userScriptEditor.invoke('getMarkdown')) {
        this.$refs.userScriptEditor.invode('setMarkdown', newValue)
      }
    },
    language(val) {
      this.destroyEditor()
      this.initEditor()
    },
    height(newValue) {
      this.$refs.userScriptEditor.invoke('height', newValue)
    },
    mode(newValue) {
      this.$refs.userScriptEditor.invoke('changeMode', newValue)
    },
    async organization_team(newVal) {
      await this.fetchData()
      this.currentNode = null
      this.editor.setValue('')
    }
  },
  async created() {
    await this.fetchData()
  },
  mounted() {
    this.initEditor()
  },
  destroyed() {
    this.destroyEditor()
  },
  methods: {
    async fetchData() {
      // if (!this.organization_team) return
      // const [organization, team] = this.organization_team
      // const ret = await fetchTests({ organization, team })
      // if (ret.code !== 20000) return
      // this.tests = ret.data.test_suites
      await this.updateScriptContent()
      await this.fetchScriptList()
    },
    async fetchScriptList() {
      if (!this.organization_team && !this.organizations) return
      const [organization, team] = this.organization_team
      const ret = await fetchScripts({ organization, team })
      if (ret.code !== 20000) return
      this.testScripts = ret.data.test_scripts.children
      this.testLibraries = ret.data.test_libraries.children
    },
    async updateScriptContent() {
      if (!this.organization_team) return
      const [organization, team] = this.organization_team

      if (!this.currentNode || this.currentNode.data._flag !== DOC_STATE_MODIFING) {
        return
      }

      const path = []
      this.getScriptPath(path, this.scripts, this.currentNode.data)
      const file_path = path.join('/')
      if (!file_path) {
        console.error('Can not find file path, current node is ' + this.currentNode.data.label)
        return
      }

      await updateScript({
        file: file_path,
        script_type: this.currentEditType,
        content: this.editor.getValue(),
        organization,
        team
      })
      if (this.currentNode) { // current node could have been deleted after returning from udpating script
        this.currentNode.data._flag = DOC_STATE_MODIFIED
      }
    },
    onEditorChange() {
      if (!this.currentNode) {
        return
      }
      if (this.switchingFile) {
        this.switchingFile = false
        this.lastFile = this.editor.getValue()
        return
      }
      if (this.lastFile === this.editor.getValue()) {
        return
      }
      if (this.currentEditType === 'test_libraries' && this.lastNode !== this.currentNode) {
        this.lastNode = this.currentNode
        return
      }
      this.currentNode.data._flag = DOC_STATE_MODIFING

      debounce(async() => { await this.updateScriptContent() }, 2000)()
      this.lastFile = this.editor.getValue()
    },
    initEditor() {
      if (this.value) {
        this.$refs.userScriptEditor.invoke('setMarkdown', this.value)
      }
      // this.userScriptEditor.on('change', () => {
      //   this.$emit('input', this.userScriptEditor.getValue())
      // })

      this.backingScriptEditor = ace.edit(this.backingScriptID)
      this.backingScriptEditor.setTheme('ace/theme/chrome')
      this.backingScriptEditor.session.setMode('ace/mode/python')
      this.backingScriptEditor.on('change', this.onEditorChange)
    },
    destroyEditor() {
      // this.$refs.userScriptEditor.invoke('off', 'change')
      // this.$refs.userScriptEditor.invoke('remove')
      this.$refs.userScriptEditor.invoke('setMarkdown', '')

      if (!this.backingScriptEditor) return
      this.backingScriptEditor.destroy()
      this.backingScriptEditor.container.remove()
    },
    onMouseOver(node) {
      this.mouseover = node.$treeNodeId
    },
    onMouseOut() {
      this.mouseover = 0
    },
    renderContent(h, type, { node, data, store }) {
      if (node.parent && !node.parent.parent) {
        if (type === 0 && !this.topScriptNode) {
          this.topScriptNode = node
        } else if (type === 1 && !this.topLibraryNode) {
          this.topLibraryNode = node
        }
      }
      return (
        <span class='custom-tree-node' onMouseover={() => this.onMouseOver(data)} onMouseout={() => this.onMouseOut()}>
          <span>{node.label}</span>
          <span v-show={this.mouseover === data.$treeNodeId}>
            <el-button size='mini' type='text' on-click={ () => this.rename(data) }>Rename</el-button>
            <el-button v-show={data.type !== 'file'} size='mini' type='text' on-click={ (e) => { this.append(data, node); e.stopPropagation() }}>Append</el-button>
            <el-button size='mini' type='text' on-click={ (e) => { this.remove(node, data); e.stopPropagation() }}>Delete</el-button>
          </span>
        </span>
      )
    },
    renderContentForScript(h, { node, data, store }) {
      return this.renderContent(h, 0, { node, data, store })
    },
    renderContentForLibrary(h, { node, data, store }) {
      return this.renderContent(h, 1, { node, data, store })
    },
    setCurrentEditType(data) {
      if (data.label.endsWith('.md') || data.label.endsWith('.robot')) {
        this.currentEditType = 'test_scripts'
      } else {
        this.currentEditType = 'test_libraries'
      }
    },
    getScriptPath(path, tree, node) {
      return tree.every(e => {
        if (e.$treeNodeId === node.$treeNodeId) {
          if (e.type === 'directory') {
            path.push(e.label + '/')
          } else {
            path.push(e.label)
          }
          return false
        }
        if (e.children) {
          const ret = this.getScriptPath(path, e.children, node)
          if (!ret) {
            path.unshift(e.label)
          }
          return ret
        }
        return true
      })
    },
    async onClickScript(data, node) {
      if (!this.organization_team) return
      const [organization, team] = this.organization_team

      this.lastNode = this.currentNode
      if (this.lastNode !== node) {
        this.switchingFile = true
      } else if (this.lastNode && node) {
        this.currentNode = node
        return
      }

      if (this.currentNode && this.currentNode.data._flag === DOC_STATE_MODIFING) {
        await this.updateScriptContent()
      }

      this.currentNode = node
      if (data._flag === DOC_STATE_CREATED) {
        this.editor.setValue('')
        this.lastFile = null
        return
      }
      if (data.type !== 'file') return
      this.setCurrentEditType(data)

      const path = []
      this.getScriptPath(path, this.scripts, data)

      const no_cache = !data._flag || data._flag === DOC_STATE_MODIFIED
      const res_data = await getScript(
        {
          file: path.join('/'),
          script_type: this.currentEditType,
          organization,
          team
        },
        no_cache)
      if (no_cache) {
        data._flag = DOC_STATE_NULL
      }
      this.editor.setValue(res_data)
      this.editor.moveCursorTo(0, 0)

      this.lastFile = this.editor.getValue()
    },
    rename(data) {
      this.form.name = data.label
      this.dialogRenameVisible = true
    },
    onDialogRenameOK() {
      const path = []
      const [organization, team] = this.organization_team

      this.getScriptPath(path, this.scripts, this.currentNode.data)

      this.currentNode.data.label = this.form.name
      updateScript({ file: path.join('/'), new_name: this.form.name, script_type: this.currentEditType, organization, team })
      this.dialogRenameVisible = false
    },
    newFileNumber(files, match) {
      let max_number = -1
      files.forEach(file => {
        const ret = match.exec(file.label)
        if (ret) {
          let [, number] = ret
          if (!number) number = 0
          if (+number > max_number) {
            max_number = +number
          }
        }
      })
      return max_number
    },
    newFileName(files) {
      const match = /New File\(?(\d*)\)?\.(md|py)/
      const max_number = this.newFileNumber(files, match)
      if (max_number !== -1) {
        return `New File(${max_number + 1}).${this.currentEditType === 'test_scripts' ? 'md' : 'py'}`
      }
      return `New File.${this.currentEditType === 'test_scripts' ? 'md' : 'py'}`
    },
    newFolderName(files) {
      const match = /New Folder\(?(\d*)\)?/
      const max_number = this.newFileNumber(files, match)
      if (max_number !== -1) {
        return `New Folder(${max_number + 1})`
      }
      return 'New Folder'
    },
    append(data, node) {
      if (data.type === 'file') return
      const newChild = { _flag: DOC_STATE_CREATED, type: 'file', label: '', children: [] }
      if (!data.children) {
        this.$set(data, 'children', [])
      }
      newChild.label = this.newFileName(data.children)
      data.children.push(newChild)

      this.$nextTick(async() => {
        const newNode = node.childNodes[node.childNodes.length - 1]
        await this.onClickScript(newNode.data, newNode)
        newNode.data._flag = DOC_STATE_MODIFING
        await this.updateScriptContent()
      })
    },
    data2node(nodeTree, data) {
      let node
      nodeTree.every(item => {
        if (item.data.$treeNodeId === data.$treeNodeId) {
          node = item
          return false
        }
        if (item.childNodes) {
          node = this.data2node(item.childNodes, data)
        }
        return true
      })
      return node
    },
    async remove(node, data) {
      if (!this.organization_team) return
      this.$confirm('Confirm to remove the file?', 'Warning', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(async() => {
        const [organization, team] = this.organization_team
        const path = []
        this.getScriptPath(path, this.scripts, data)

        const parent = node.parent
        const children = parent.data.children || parent.data
        const index = children.findIndex(d => d.$treeNodeId === data.$treeNodeId)
        children.splice(index, 1)
        this.currentNode = null

        await removeScript({
          file: path.join('/'),
          script_type: this.currentEditType,
          organization,
          team
        })

        const new_data = children[index] || children[index - 1] || parent.data
        const new_node = this.data2node(parent.childNodes, new_data)

        await this.onClickScript(new_data, new_node)
      })
    },
    onNewFile() {
      if (!this.currentNode) {
        this.currentNode = this.topScriptNode
      }
      const data = this.currentNode.data
      const parent = this.currentNode.parent
      const children = parent.data.children || parent.data
      const index = children.findIndex(d => d.$treeNodeId === data.$treeNodeId)
      const newChild = { _flag: DOC_STATE_CREATED, type: 'file', label: this.newFileName(children), children: [] }
      children.splice(index + 1, 0, newChild)
      this.$nextTick(async() => {
        const newNode = parent.childNodes[index + 1]
        await this.onClickScript(newNode.data, newNode)
        newNode.data._flag = DOC_STATE_MODIFING
        await this.updateScriptContent()
      })
    },
    onNewFolder() {
      if (!this.currentNode) {
        this.currentNode = this.topScriptNode
      }
      const data = this.currentNode.data
      const parent = this.currentNode.parent
      const children = parent.data.children || parent.data
      const index = children.findIndex(d => d.$treeNodeId === data.$treeNodeId)
      const newChild = { _flag: DOC_STATE_CREATED, type: 'directory', label: this.newFolderName(children), children: [] }
      children.splice(index + 1, 0, newChild)
      this.$nextTick(async() => {
        const newNode = parent.childNodes[index + 1]
        await this.onClickScript(newNode.data, newNode)
        newNode.data._flag = DOC_STATE_MODIFING
        await this.updateScriptContent()
      })
    },
    async onTabClick() {
      if (this.currentNode && this.currentNode.data._flag === DOC_STATE_MODIFING) {
        await this.updateScriptContent()
      }
      this.currentNode = null
    },
    handleRemove(file, fileList) {
      this.fileList = fileList
    },
    beforeRemove(file, fileList) {
      return this.$confirm(`Are you sure to delte ${file.name}?`)
    },
    async __onUploadFileChange() {
      if (!this.organization_team) return
      const [organization, team] = this.organization_team

      const formData = new FormData()
      formData.append('script_type', this.currentEditType)
      formData.append('organization', organization)
      formData.append('team', team)
      this.fileList.forEach(file => {
        formData.append(file.name, file.raw)
      })
      await uploadScripts(formData)

      setTimeout(() => { this.fileList = [] }, 5000)
      setTimeout(this.fetchScriptList, 1000)
    },
    _onUploadFileChange: debounce(function() { this.__onUploadFileChange() }, 500),
    onUploadFileChange(file, fileList) {
      this.fileList = fileList
      this._onUploadFileChange()
    }
  }
}
</script>

<style>
  .custom-tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    padding-right: 8px;
  }
  .el-tree-node.is-current>.el-tree-node__content {
    background-color: #86d9fa9c !important;
  }
</style>

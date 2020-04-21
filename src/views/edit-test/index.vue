<template>
  <div style="margin: 30px">
    <div class="filter-container">
      <el-row type="flex" justify="start" :gutter="8">
        <el-col style="width: auto;">
          <el-button class="filter-item" icon="el-icon-plus" @click="onNewFile">New File</el-button>
        </el-col>
        <el-col style="width: auto;">
          <el-button class="filter-item" icon="el-icon-plus" @click="onNewFolder">New Folder</el-button>
        </el-col>
        <el-col style="width: auto;">
          <el-upload
            class="upload-demo"
            action="http://abc.com"
            multiple
            :auto-upload="false"
            :file-list="fileList"
            :on-change="onUploadFileChange"
            :on-remove="handleRemove"
            :before-remove="beforeRemove"
          >
            <el-button type="primary">Upload Scripts</el-button>
          </el-upload>
        </el-col>
      </el-row>
    </div>
    <el-tabs v-model="tabName" type="border-card" tab-click="onTabClick">
      <el-tab-pane key="1" label="Test Scripts" name="test_scripts">
        <el-container style="max-height: 200px; border: 1px solid #eee">
          <el-aside width="100%" style="padding: 0">
            <keep-alive>
              <el-tree :data="test_scripts || []" :render-content="renderContent" :highlight-current="true" @node-click="onClickScript" />
            </keep-alive>
          </el-aside>
        </el-container>
      </el-tab-pane>
      <el-tab-pane key="2" label="Test Libraries" name="test_libraries">
        <el-container style="max-height: 200px; border: 1px solid #eee">
          <el-aside width="100%" style="padding: 0">
            <keep-alive>
              <el-tree :data="test_libraries || []" :render-content="renderContent" @node-click="onClickScript" />
            </keep-alive>
          </el-aside>
        </el-container>
      </el-tab-pane>
    </el-tabs>
    <div v-show="tabName === 'test_scripts'" :id="userScriptID" style="margin-top: 30px" />
    <div v-show="tabName === 'test_libraries'" :id="backingScriptID" style="margin-top: 30px; width: 100%; height: 500px;" />
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
import 'codemirror/lib/codemirror.css' // codemirror
import 'tui-editor/dist/tui-editor.css' // editor ui
import 'tui-editor/dist/tui-editor-contents.css' // editor content

import { mapGetters } from 'vuex'
import Editor from 'tui-editor'
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
  name: 'MarddownEditor',
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
      default: 'auto'
    },
    language: {
      type: String,
      required: false,
      default: 'en_US' // https://github.com/nhnent/tui.editor/tree/master/src/js/langs
    }
  },
  data() {
    return {
      userScriptEditor: null,
      backingScriptEditor: null,
      test_scripts: null,
      test_libraries: null,
      tabName: 'test_scripts',
      mouseover: 0,
      currentNode: null,
      lastNode: null,
      dialogRenameVisible: false,
      lastFile: null,
      fileList: [],
      uploadURL: process.env.BASE_API + '/script/upload/',
      form: {
        name: null
      }
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
      return this.tabName === 'test_scripts' ? this.userScriptEditor : this.backingScriptEditor
    },
    scripts() {
      return this.tabName === 'test_scripts' ? this.test_scripts : this.test_libraries
    }
  },
  watch: {
    value(newValue, preValue) {
      if (newValue !== preValue && newValue !== this.userScriptEditor.getValue()) {
        this.userScriptEditor.setValue(newValue)
      }
    },
    language(val) {
      this.destroyEditor()
      this.initEditor()
    },
    height(newValue) {
      this.userScriptEditor.height(newValue)
    },
    mode(newValue) {
      this.userScriptEditor.changeMode(newValue)
    },
    async tabName(newVal, preVal) {
      await this.updateScriptContent(preVal)
    },
    async organization_team(newVal) {
      await this.updateScriptContent()
      await this.fetchScriptList()
      this.currentNode = null
      this.editor.setValue('')
    }
  },
  async created() {
    await this.updateScriptContent()
    await this.fetchScriptList()
  },
  mounted() {
    this.initEditor()
  },
  destroyed() {
    this.destroyEditor()
  },
  methods: {
    async fetchScriptList() {
      if (!this.organization_team && !this.organizations) return
      const [organization, team] = this.organization_team
      const data = await fetchScripts({ organization, team })
      this.test_scripts = data.test_scripts.children
      this.test_libraries = data.test_libraries.children
    },
    async updateScriptContent(script_type) {
      if (!this.organization_team) return
      const [organization, team] = this.organization_team

      if (!this.currentNode) {
        return
      }
      if (this.currentNode.data._flag !== DOC_STATE_MODIFING) {
        return
      }

      const scripts = (script_type && (script_type === 'test_scripts' ? this.test_scripts : this.test_libraries)) || this.scripts
      const editor = (script_type && (script_type === 'test_scripts' ? this.userScriptEditor : this.backingScriptEditor)) || this.editor

      const path = []
      this.getScriptPath(path, scripts, this.currentNode.data)

      await updateScript({
        file: path.join('/'),
        script_type: script_type || this.tabName,
        content: editor.getValue(),
        organization,
        team
      })
      if (this.currentNode) { // current node could have been deleted after returning from udpating script
        this.currentNode.data._flag = DOC_STATE_MODIFIED
      }
    },
    updateScriptContent_limited: debounce(function() { this.updateScriptContent() }, 2000),
    onEditorChange() {
      if (!this.currentNode) {
        return
      }
      if (this.lastFile === this.editor.getValue()) {
        return
      }
      if (this.tabName === 'test_libraries' && this.lastNode !== this.currentNode) {
        this.lastNode = this.currentNode
        return
      }
      this.currentNode.data._flag = DOC_STATE_MODIFING

      this.updateScriptContent_limited()
      this.lastFile = this.editor.getValue()
    },
    initEditor() {
      this.userScriptEditor = new Editor({
        el: document.getElementById(this.userScriptID),
        ...this.editorOptions,
        events: {
          change: this.onEditorChange
        },
        height: '600px',
        usageStatistics: false
      })
      if (this.value) {
        this.userScriptEditor.setValue(this.value)
      }
      this.userScriptEditor.on('change', () => {
        this.$emit('input', this.userScriptEditor.getValue())
      })

      this.backingScriptEditor = ace.edit(this.backingScriptID)
      this.backingScriptEditor.setTheme('ace/theme/chrome')
      this.backingScriptEditor.session.setMode('ace/mode/python')
      this.backingScriptEditor.on('change', this.onEditorChange)
    },
    destroyEditor() {
      if (!this.userScriptEditor) return
      this.userScriptEditor.off('change')
      this.userScriptEditor.remove()

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
    renderContent(h, { node, data, store }) {
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

      if (this.currentNode && this.currentNode.data._flag === DOC_STATE_MODIFING) {
        await this.updateScriptContent()
      }

      this.currentNode = node
      if (data._flag === DOC_STATE_CREATED) {
        this.editor.setValue('')
        return
      }
      if (data.type !== 'file') return

      const path = []
      this.getScriptPath(path, this.scripts, data)

      const no_cache = data._flag === DOC_STATE_MODIFIED || !data._flag
      const res_data = await getScript(
        {
          file: path.join('/'),
          script_type: this.tabName,
          organization,
          team
        },
        no_cache)
      if (no_cache) {
        data._flag = DOC_STATE_NULL
      }
      this.editor.setValue(res_data)
      if (this.editor.moveCursorTo) this.editor.moveCursorTo(0, 0)
      if (this.editor.moveCursorToStart) this.editor.moveCursorToStart()

      if (!this.lastFile) {
        this.lastFile = this.editor.getValue()
        return
      }
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
      updateScript({ file: path.join('/'), new_name: this.form.name, script_type: this.tabName, organization, team })
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
        return `New File(${max_number + 1}).${this.tabName === 'test_scripts' ? 'md' : 'py'}`
      }
      return `New File.${this.tabName === 'test_scripts' ? 'md' : 'py'}`
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
        this.updateScriptContent()
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
        script_type: this.tabName,
        organization,
        team
      })

      const new_data = children[index] || children[index - 1] || parent.data
      const new_node = this.data2node(parent.childNodes, new_data)

      await this.onClickScript(new_data, new_node)
    },
    onNewFile() {
      if (!this.currentNode) {
        this.$message({ type: 'warning', message: 'Please specify a position to add' })
        return
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
        this.updateScriptContent()
      })
    },
    onNewFolder() {
      if (!this.currentNode) {
        this.$message({ type: 'warning', message: 'Please specify a position to add' })
        return
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
        this.updateScriptContent()
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
      formData.append('script_type', this.tabName)
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

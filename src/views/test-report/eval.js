import Vue from 'vue'

function robotVersionCheck(data) {
  let tree
  /* strip the root description node
   * <?xml version="1.0" encoding="UTF-8"?>
   */
  if (data.declaration && data.elements && data.elements.length === 1) {
    tree = data.elements[0]
  } else {
    console.error('data looks not like a single root node XMLDocument')
    return []
  }
  if (!tree.attributes || !tree.attributes.generator) {
    console.error('Can\'t find the robot version')
    return []
  }
  // Robot 3.1.1 (Python 3.6.5 on win32)
  return [tree, tree.attributes.generator.split('(')[0].split(' ')[1]]
}

// Flatten the array
function treeToArray(data) {
  let tmp = []
  data.forEach((item, index) => {
    Vue.set(item, '_index', index)
    tmp.push(item)
    if (item.elements) {
      const res = treeToArray(item.elements)
      tmp = tmp.concat(res)
    }
  })
  return tmp
}

export function processRobotResultStat_3_1_1(data) {
  const statData = []
  data.forEach(item => {
    if (item.name === 'suite') {
      item.elements.forEach(suite => {
        const data = {}
        Vue.set(data, 'suite', suite.elements[0].text)
        Vue.set(data, 'total', parseInt(suite.attributes.pass) + parseInt(suite.attributes.fail))
        Vue.set(data, 'pass', suite.attributes.pass)
        Vue.set(data, 'fail', suite.attributes.fail)
        statData.push(data)
      })
    }
  })
  return statData
}

export function processRobotResultStat(data) {
  const [tree, robotVersion] = robotVersionCheck(data)
  let ret = []

  if (!tree) return []

  if (robotVersion === '3.1.1') {
    tree.elements.forEach(item => {
      if (item.name === 'statistics') {
        ret = processRobotResultStat_3_1_1(item.elements)
      }
    })
  } else {
    console.error(`Unsupported robot version: ${robotVersion}`)
    return []
  }

  return ret
}

// Flatten the array
export function detailTreeToArray(data) {
  let tmp = []
  data.forEach((item, index) => {
    if (item.name === 'statistics') return
    if (item.name === 'errors') return
    Vue.set(item, '_index', index)
    tmp.push(item)
    if (item.elements) {
      const res = treeToArray(item.elements)
      tmp = tmp.concat(res)
    }
  })
  return tmp
}

function addAttrs(data, { preIndex = false, level = 0, expand = false, show = true } = {}) {
  data.forEach((item, index) => {
    const _id = (preIndex ? `${preIndex}-${index}` : index) + ''
    Vue.set(item, '_id', _id)
    Vue.set(item, '_level', level)
    Vue.set(item, '_expand', expand)
    Vue.set(item, '_show', show)

    Vue.set(item, 'content_head', '')
    Vue.set(item, 'boldInfo', '')
    Vue.set(item, 'content', '')
    Vue.set(item, 'level', '')
    Vue.set(item, 'status', '')
    Vue.set(item, 'start_time', '')
    Vue.set(item, 'end_time', '')
    Vue.set(item, 'duration', '')

    if (item.elements) {
      addAttrs(item.elements, {
        level: level + 1,
        expand,
        preIndex: _id,
        status
      })
    }
  })
}

function convertTime(time) {
  // "20190410 15:10:46.276" => "2019-04-10 15:10:46.276"
  const t = time.split('')
  t.splice(4, 0, '-')
  t.splice(7, 0, '-')
  time = t.join('')
  return Date.parse(time)
}

function processRobotResult_3_1_1(data, expand) {
  data.forEach((item, index) => {
    // item._expand = expand
    // item._show = expand

    if ((item.name === 'suite' || item.name === 'test') && item.attributes && item.attributes.name) {
      item.boldInfo = item.attributes.name
    }

    if (item.name === 'status' && item.attributes) {
      if (item.attributes.status) {
        item.parent.status = item.attributes.status
        item.parent.elements[index] = undefined
        if (item.attributes.status === 'FAIL') {
          expand = true
        }
      }
      if (item.attributes.starttime) {
        item.parent.start_time = item.attributes.starttime
      }
      if (item.attributes.endtime) {
        item.parent.end_time = item.attributes.endtime
      }
      const start_time = convertTime(item.parent.start_time)
      const end_time = convertTime(item.parent.end_time)
      item.parent.duration = (end_time - start_time) / 1000 + 's'
    }

    if (item.name === 'kw' && item.attributes) {
      if (item.attributes.type) {
        item.name = item.attributes.type
      } else {
        item.name = 'keyword'
      }
      if (item.attributes.library) {
        item.boldInfo = item.attributes.library + '.'
      }
      item.boldInfo += item.attributes.name
    }

    // elevate args to arguments
    if (item.name === 'arg') {
      item.elements.forEach(i => {
        if (i.type === 'text') {
          item.parent.content += i.text + ' '
        }
      })
      item.parent.elements[index] = undefined
    }

    // elevate doc text to doc
    if (item.name === 'doc' || item.name === 'msg') {
      item.elements.forEach(i => {
        if (i.type === 'text') {
          item.content += i.text
        }
      })
      delete item.elements
    }

    if (item.name === 'msg') {
      if (item.attributes.level) {
        item.level = item.attributes.level
      }
    }

    // elevate assignment to keyword
    if (item.name === 'assign') {
      if (item.elements && item.elements[0]) {
        const v = item.elements[0]
        if (v.name === 'var' && v.elements && v.elements[0]) {
          const t = v.elements[0]
          if (t.type === 'text') {
            item.parent.content_head = t.text + ' = '
          }
        }
      }
      item.parent.elements[index] = undefined
    }

    if (item.elements) {
      const ret = processRobotResult_3_1_1(item.elements, expand)
      if (item.name.toLowerCase() === 'arguments') {
        item.parent.content += ' ' + item.content
        item.parent.elements[index] = undefined
      }
      item._expand = ret
      item._show = ret
    }
  })

  // clean up empty elements
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i] === undefined) {
      data.splice(i, 1)
    }
  }
  if (data.length === 0 && data.parent) {
    delete data.parent.elements
  }

  return expand
}

export function processRobotResult(data) {
  const [tree, robotVersion] = robotVersionCheck(data)

  if (!tree) return []

  if (robotVersion === '3.1.1') {
    addAttrs(tree.elements)
    processRobotResult_3_1_1(tree.elements, false)
  } else {
    console.error(`Unsupported robot version: ${robotVersion}`)
    return []
  }

  // remove top level elements' parent due to row visibility controlled by parent's existence
  tree.elements.forEach(item => {
    item.parent = undefined
  })

  return detailTreeToArray(tree.elements)
}

let element_id = 0

export function processRobotResultXML(xmlDoc) {
  const root = xmlDoc.documentElement
  const resp = {}

  root.childNodes.forEach(child => {
    if (child.nodeName === 'suite') {
      element_id = 0
      const node = { '_level': 0, '_expand': true, 'name': child.nodeName, 'content': child.attributes.getNamedItem('name').value }
      resp['test_log'] = process_test_suite(child, { parent: node })
    } else if (child.nodeName === 'statistics') {
      resp['test_stat'] = process_test_stat(child)
    }
  })

  return resp
}

export function loadRobotResultXMLNode(xmlDoc, el_id, table_data) {
  const root = xmlDoc.getElementById(el_id)
  let parent
  let i

  for (i = 0; i < table_data.length; i++) {
    if (table_data[i].id === el_id) {
      parent = table_data[i]
      break
    }
  }
  if (!parent) return null

  const ret = process_test_suite(root, { depth: parent._level + 1, expand_level: parent._level + 1, level: parent._level, parent: parent })
  for (let j = 1; j < ret.length; j++) {
    table_data.splice(++i, 0, ret[j])
  }
}

const traverse_depth = 2
function process_tag_status(child, node, parent, flow_control) {
  let attr
  attr = child.attributes.getNamedItem('status')
  if (attr) {
    parent['status'] = attr.value
  }
  attr = child.attributes.getNamedItem('starttime')
  if (attr) {
    parent['start_time'] = attr.value
  }
  attr = child.attributes.getNamedItem('endtime')
  if (attr) {
    parent['end_time'] = attr.value
  }
  const start_time = convertTime(parent['start_time'])
  const end_time = convertTime(parent['end_time'])
  parent['duration'] = (end_time - start_time) / 1000 + 's'
  flow_control.stop = true
  flow_control.stop_cnt++
}

function process_tag_kw(child, node, parent, flow_control) {
  let attr
  attr = child.attributes.getNamedItem('name')
  if (attr.value === 'Run Keyword') {
    flow_control.depth++
  }

  attr = child.attributes.getNamedItem('type')
  if (attr) {
    node['name'] = attr.value
  } else {
    node['name'] = 'keyword'
  }

  attr = child.attributes.getNamedItem('library')
  if (attr) {
    node['content'] = attr.value + '.'
  } else {
    node['content'] = ''
  }
  node['content'] = node['content'] + child.attributes.getNamedItem('name').value

  // if (parent['content'] === 'BuiltIn.Run Keyword') {
  //   flow_control.elevate = true
  // }
}

function process_tag_arguments(child, node, parent, flow_control) {
  const contents = []
  child.childNodes.forEach(c => {
    if (c.nodeType !== 1) return
    if (c.textContent) {
      contents.push(c.textContent)
    }
  })
  parent['after_content'] = contents.join(' ')
  // if parent['_parent']['name'] == 'keyword': # found a nested keyword, seen only for keyword "Run Keyword"
  //     break
  flow_control.stop = true
  flow_control.stop_cnt++
}

function process_tag_msg(child, node, parent, flow_control) {
  const attr = child.attributes.getNamedItem('level')
  if (attr) {
    node['msg_level'] = attr.value
  }
  // if 'timestamp' in child.attrib:
  //     node['before_content'] = child.attrib['timestamp'] + ': '
}

function process_tag_doc(child, node, parent, flow_control) {
  if (parent['content'] === 'BuiltIn.Run Keyword' || parent['content'] === 'BuiltIn.Import Library') {
    flow_control.stop = true
    flow_control.stop_cnt++
  }
}

function process_tag_assign(child, node, parent, flow_control) {
  const v = child.childNodes[0]
  if (v.nodeName === 'var') {
    parent['before_content'] = v.textContent + ' = '
  }
  flow_control.stop = true
  flow_control.stop_cnt++
}

function process_test_suite(tree, { depth = traverse_depth, expand_level = 2, level = 0, parent = null } = {}) {
  /*
  node fields:
    '_parent'
    '_level'
    '_expand'
    'name'
    'before_content'
    'content'
    'after_content'
    'status'
    'duration'
    'start_time'
    'end_time'
    'msg_level"
  */
  let ret = [parent]
  let counting = false
  level = level + 1
  if (level > depth) {
    counting = true
  }
  const flow_control = { stop_cnt: 0, stop: false, elevate: false, depth: traverse_depth }
  let child_num = 0
  tree.childNodes.forEach(child => {
    if (child.nodeType !== 1) return
    child_num += 1

    flow_control.stop = false
    flow_control.elevate = false
    flow_control.depth = traverse_depth

    // let parent have a certain status even it has reached the depth limit
    if (child.nodeName === 'status') {
      process_tag_status(child, null, parent, flow_control)
    }

    if (counting) return

    const node = {}
    node['_parent'] = parent
    node['_level'] = level
    node['_expand'] = level < expand_level
    node['name'] = child.nodeName

    const attr = child.attributes.getNamedItem('id')
    if (!attr) {
      child.setAttribute('id', element_id)
      node['id'] = element_id
      element_id++
    } else {
      node['id'] = attr.value
    }

    if (child.nodeName === 'test' || child.nodeName === 'suite') {
      node['content'] = child.attributes.getNamedItem('name').value
    }

    if (child.nodeName === 'kw') {
      process_tag_kw(child, node, parent, flow_control)
    }

    if (child.nodeName === 'arguments') {
      process_tag_arguments(child, node, parent, flow_control)
    }

    if (child.nodeName === 'msg') {
      process_tag_msg(child, node, parent, flow_control)
    }

    if (child.nodeName === 'doc') {
      process_tag_doc(child, node, parent, flow_control)
    }

    if (child.nodeName === 'msg' || child.nodeName === 'doc') {
      node['after_content'] = child.textContent
    }

    if (child.nodeName === 'assign') {
      process_tag_assign(child, node, parent, flow_control)
    }

    if (!flow_control.stop) {
      const r = process_test_suite(child, { depth: flow_control.depth, level: level, parent: node })
      if (flow_control.elevate) {
        r[0]['_parent'] = parent['_parent']
        r.forEach(e => e._level--)
        ret = []
      }
      ret.push.apply(ret, r)
    }
  })
  parent['_has_children'] = flow_control.stop_cnt !== child_num
  return ret
}

function process_test_stat(tree) {
  /*
  node fields:
      'suite'
      'total'
      'pass'
      'fail'
  */
  const ret = []
  tree.childNodes.forEach(child => {
    const node = {}
    if (child.nodeName === 'suite') {
      child.childNodes.forEach(c => {
        if (c.nodeType === 1) {
          node['suite'] = c.attributes.getNamedItem('name').value
          node['total'] = parseInt(c.attributes.getNamedItem('pass').value) + parseInt(c.attributes.getNamedItem('fail').value) + ''
          node['pass'] = c.attributes.getNamedItem('pass').value
          node['fail'] = c.attributes.getNamedItem('fail').value
          ret.push(node)
        }
      })
    }
  })

  return ret
}

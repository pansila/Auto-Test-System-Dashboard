let element_id = 0

function convertTime(time) {
  // "20190410 15:10:46.276" => "2019-04-10 15:10:46.276"
  const t = time.split('')
  t.splice(4, 0, '-')
  t.splice(7, 0, '-')
  time = t.join('')
  return Date.parse(time)
}

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

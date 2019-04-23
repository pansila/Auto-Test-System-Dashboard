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

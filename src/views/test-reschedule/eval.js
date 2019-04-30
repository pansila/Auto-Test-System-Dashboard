import Vue from 'vue'

// Flatten the array
export function treeToArray(data, children = 'tasks') {
  let tmp = []
  data.forEach((item, index) => {
    Vue.set(item, '_index', index)
    tmp.push(item)
    if (item[children] && item[children].length > 0) {
      const res = treeToArray(item.tasks)
      tmp = tmp.concat(res)
    }
  })
  return tmp
}

export function traverseTreeEvery(tree, children = 'tasks', callback) {
  let ret = true
  return tree.every((item, index) => {
    if (item[children]) {
      ret = traverseTreeEvery(item[children], children, callback)
    }
    return ret && callback(item, index)
  })
}

export function addAttrs(data, { parent = null, preIndex = false, level = 0, expand = false, children = 'tasks', show = true } = {}) {
  data.forEach((item, index) => {
    const _id = (preIndex ? `${preIndex}-${index}` : index) + ''
    Vue.set(item, '_id', _id)
    Vue.set(item, '_level', level)
    Vue.set(item, '_parent', parent)
    Vue.set(item, '_expand', expand)
    Vue.set(item, '_show', show)

    if (item[children] && item[children].length > 0) {
      addAttrs(item.tasks, {
        parent: item,
        level: level + 1,
        expand,
        preIndex: _id,
        status
      })
    }
  })
}

export function cleanParentAttr(data, children = 'tasks') {
  data.forEach(item => {
    item._parent = null
    if (item[children] && item[children].length > 0) {
      addAttrs(item[children], children)
    }
  })
  return data
}

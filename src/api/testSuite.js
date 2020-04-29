import request from '@/utils/request'

export function fetchTests(query) {
  return request({
    url: '/test/',
    method: 'get',
    params: query
  })
}

export function fetchTest(test, query) {
  return request({
    url: '/test/' + test,
    method: 'get',
    params: query
  })
}

export function fetchTestResult(params) {
  return request({
    url: '/task/result',
    method: 'get',
    responseType: 'document',
    params
  })
}

export function fetchTestResultFiles(params) {
  return request({
    url: '/task/result_files',
    method: 'get',
    params
  })
}

export function fetchTestResultFile(params) {
  return request({
    url: '/task/result_file',
    method: 'get',
    responseType: 'blob',
    params
  })
}

export function startTest(data) {
  return request({
    url: '/task/',
    method: 'post',
    data
  })
}

export function fetchTaskList(query) {
  return request({
    url: '/task/',
    method: 'get',
    params: query
  })
}

export function updateTask(data) {
  return request({
    url: '/task/',
    method: 'patch',
    data
  })
}

export function fetchEndpoints(query) {
  return request({
    url: '/endpoint/',
    method: 'get',
    params: query
  })
}

export function testEndpoint(data) {
  return request({
    url: '/endpoint/check/',
    method: 'post',
    data
  })
}

export function updateEndpoint(data) {
  return request({
    url: '/endpoint/',
    method: 'post',
    data
  })
}

export function deleteEndpoint(data) {
  return request({
    url: '/endpoint/',
    method: 'delete',
    data
  })
}

export function authorizeEndpoint(data) {
  return request({
    url: '/endpoint/authorize',
    method: 'post',
    data
  })
}

export function forbidEndpoint(data) {
  return request({
    url: '/endpoint/forbid',
    method: 'post',
    data
  })
}

export function fetchQueuingTests(query) {
  return request({
    url: '/endpoint/queue/',
    method: 'get',
    params: query
  })
}

export function updateTaskQueue(data) {
  return request({
    url: '/endpoint/queue/',
    method: 'post',
    data
  })
}

export function uploadFiles(data) {
  return request({
    url: '/taskresource/',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function getTaskResourceList(params) {
  return request({
    url: '/taskresource/list',
    method: 'get',
    params
  })
}

export function fetchTasks(query) {
  return request({
    url: '/testresult/',
    method: 'get',
    params: query
  })
}

export function cancelTask(task) {
  return request({
    url: '/task/',
    method: 'delete',
    data: task
  })
}

export function fetchScripts(params) {
  return request({
    url: '/script/',
    method: 'get',
    params
  })
}

export function getScript(query, modified) {
  return request({
    url: '/script/',
    method: 'get',
    params: query,
    headers: {
      'Cache-Control': modified ? 'no-cache' : 'max-age=1'
    }
  })
}

export function updateScript(data) {
  return request({
    url: '/script/',
    method: 'post',
    data
  })
}

export function removeScript(data) {
  return request({
    url: '/script/',
    method: 'delete',
    data
  })
}

export function uploadScripts(data) {
  return request({
    url: '/script/upload/',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function uploadPackage(data) {
  return request({
    url: '/store/',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function removePackage(data) {
  return request({
    url: '/store/',
    method: 'delete',
    data: data
  })
}

export function fetchPackages(query) {
  return request({
    url: '/store/',
    method: 'get',
    params: query
  })
}

export function installPackage(data) {
  return request({
    url: '/store/package',
    method: 'put',
    data: data
  })
}

export function uninstallPackage(data) {
  return request({
    url: '/store/package',
    method: 'delete',
    data: data
  })
}

export function updatePackage(data) {
  return request({
    url: '/store/package',
    method: 'patch',
    data: data
  })
}

export function getPackageInfo(query) {
  return request({
    url: '/store/package',
    method: 'get',
    params: query
  })
}

export function downloadFile(params) {
  return request({
    url: '/setting/download',
    method: 'get',
    responseType: 'blob',
    params
  })
}

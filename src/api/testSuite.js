import request from '@/utils/request'
import { isJson } from '@/utils/validate'

const api_version = '/api_v1'

export function fetchTests(query) {
  return request({
    url: api_version + '/test/',
    method: 'get',
    params: query
  })
}

export function fetchTest(query) {
  return request({
    url: api_version + '/test/detail',
    method: 'get',
    params: query
  })
}

export function fetchTestResult(params) {
  return request({
    url: api_version + '/task/result',
    method: 'get',
    responseType: 'document',
    params
  })
}

export function fetchTestResultFiles(params) {
  return request({
    url: api_version + '/task/result_files',
    method: 'get',
    params
  })
}

export function fetchTestResultFile(params) {
  return request({
    url: api_version + '/task/result_file',
    method: 'get',
    responseType: 'blob',
    params
  })
}

export function startTest(data) {
  return request({
    url: api_version + '/task/',
    method: 'post',
    data
  })
}

export function fetchTaskList(query) {
  return request({
    url: api_version + '/task/',
    method: 'get',
    params: query
  })
}

export function updateTask(data) {
  return request({
    url: api_version + '/task/',
    method: 'patch',
    data
  })
}

export function fetchEndpoints(query) {
  return request({
    url: api_version + '/endpoint/',
    method: 'get',
    params: query
  })
}

export function testEndpoint(data) {
  return request({
    url: api_version + '/endpoint/check/',
    method: 'post',
    data
  })
}

export function updateEndpoint(data) {
  return request({
    url: api_version + '/endpoint/',
    method: 'post',
    data
  })
}

export function deleteEndpoint(data) {
  return request({
    url: api_version + '/endpoint/',
    method: 'delete',
    data
  })
}

export function authorizeEndpoint(data) {
  return request({
    url: api_version + '/endpoint/authorize',
    method: 'post',
    data
  })
}

export function forbidEndpoint(data) {
  return request({
    url: api_version + '/endpoint/forbid',
    method: 'post',
    data
  })
}

export function fetchQueuingTests(query) {
  return request({
    url: api_version + '/endpoint/queue/',
    method: 'get',
    params: query
  })
}

export function fetchEndpointConfig(query) {
  return request({
    url: api_version + '/endpoint/config',
    method: 'get',
    params: query
  })
}

export function updateTaskQueue(data) {
  return request({
    url: api_version + '/endpoint/queue/',
    method: 'post',
    data
  })
}

export function uploadFiles(data) {
  return request({
    url: api_version + '/taskresource/',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function getTaskResourceList(params) {
  return request({
    url: api_version + '/taskresource/list',
    method: 'get',
    params
  })
}

export function fetchTasks(query) {
  return request({
    url: api_version + '/testresult/',
    method: 'get',
    params: query
  })
}

export function cancelTask(task) {
  return request({
    url: api_version + '/task/',
    method: 'delete',
    data: task
  })
}

export function fetchScripts(params) {
  return request({
    url: api_version + '/script/',
    method: 'get',
    params
  })
}

export function getScript(query, modified) {
  return request({
    url: api_version + '/script/',
    method: 'get',
    params: query,
    headers: {
      'Cache-Control': modified ? 'no-cache' : 'max-age=1'
    }
  })
}

export function updateScript(data) {
  return request({
    url: api_version + '/script/',
    method: 'post',
    data
  })
}

export function removeScript(data) {
  return request({
    url: api_version + '/script/',
    method: 'delete',
    data
  })
}

export function uploadScripts(data) {
  return request({
    url: api_version + '/script/upload/',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function uploadPackage(data) {
  return request({
    url: api_version + '/store/',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function removePackage(data) {
  return request({
    url: api_version + '/store/',
    method: 'delete',
    data: data
  })
}

export function fetchPackages(query) {
  return request({
    url: api_version + '/store/',
    method: 'get',
    params: query
  })
}

export function installPackage(data) {
  return request({
    url: api_version + '/store/package',
    method: 'put',
    data: data
  })
}

export function uninstallPackage(data) {
  return request({
    url: api_version + '/store/package',
    method: 'delete',
    data: data
  })
}

export function updatePackage(data) {
  return request({
    url: api_version + '/store/package',
    method: 'patch',
    data: data
  })
}

export function getPackageInfo(query) {
  return request({
    url: api_version + '/store/package',
    method: 'get',
    params: query
  })
}

export function downloadFile(params) {
  return request({
    url: api_version + '/setting/download',
    method: 'get',
    responseType: 'blob',
    params
  })
}

export function getDocument(path, params) {
  return request({
    url: '/doc/' + path,
    method: 'get',
    params,
    headers: {
      'Cache-Control': 'no-cache'
    },
    transformResponse: function(response) {
      if (isJson(response)) {
        return JSON.parse(response)
      } else {
        return response
      }
    }
  })
}

export function updateDocument(path, data) {
  return request({
    url: '/doc/' + path,
    method: 'post',
    data
  })
}

export function deleteDocument(path, data) {
  return request({
    url: '/doc/' + path,
    method: 'delete',
    data
  })
}

export function lockDocument(path, data) {
  return request({
    url: '/doc/' + path,
    method: 'patch',
    data
  })
}

export function getDocRoots(params) {
  return request({
    url: '/doc/roots',
    method: 'get',
    params
  })
}

export function editPrivilegeCheck(params) {
  return request({
    url: '/doc/check',
    method: 'get',
    params
  })
}

export function getHistory(params) {
  return request({
    url: '/doc/history',
    method: 'get',
    params
  })
}

export function getPictures(params) {
  return request({
    url: '/doc/pictures',
    method: 'get',
    params
  })
}

export function uploadPictures(data) {
  return request({
    url: '/doc/pictures',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function deletePicture(data) {
  return request({
    url: '/doc/pictures',
    method: 'delete',
    data
  })
}

export function getPicturePaths(params) {
  return request({
    url: '/doc/picture/path',
    method: 'get',
    params
  })
}

export function createPicturePath(data) {
  return request({
    url: '/doc/picture/path',
    method: 'post',
    data
  })
}

export function deletePicturePath(data) {
  return request({
    url: '/doc/picture/path',
    method: 'delete',
    data
  })
}

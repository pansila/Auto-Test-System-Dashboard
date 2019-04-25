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

export function fetchTestDetail(test, query) {
  return request({
    url: '/task/result/' + test,
    method: 'get',
    responseType: 'text',
    params: query
  })
}

export function startTest(data) {
  return request({
    url: '/task/',
    method: 'post',
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

export function updateEndpoint(data) {
  return request({
    url: '/endpoint/',
    method: 'post',
    data
  })
}

export function deleteEndpoint(address) {
  return request({
    url: '/endpoint/',
    method: 'delete',
    params: { address: address }
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

export function updateTask(data) {
  return request({
    url: '/task/update',
    method: 'post',
    data
  })
}

export function getTaskResourceList(data) {
  return request({
    url: '/taskresource/list/' + data,
    method: 'get'
  })
}

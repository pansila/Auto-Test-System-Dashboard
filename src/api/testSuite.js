import request from '@/utils/request'

export function fetchList(query) {
  return request({
    url: '/test/',
    method: 'get',
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

export function fetchEndpoints(data) {
  return request({
    url: '/endpoint/',
    method: 'get',
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

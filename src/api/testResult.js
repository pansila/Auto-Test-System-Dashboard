import request from '@/utils/request'

export function fetchList(query) {
  return request({
    url: '/testresult/',
    method: 'get',
    params: query
  })
}

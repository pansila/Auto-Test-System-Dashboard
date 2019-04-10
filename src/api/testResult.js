import request from '@/utils/request'

export function fetchTasks(query) {
  return request({
    url: '/testresult/',
    method: 'get',
    params: query
  })
}

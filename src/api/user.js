import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

export function getInfo(token) {
  return request({
    url: '/user/info',
    method: 'get',
    params: { token }
  })
}

export function checkEmail(email) {
  return request({
    url: '/user/check',
    method: 'get',
    params: { email }
  })
}

export function register(data) {
  return request({
    url: '/user/',
    method: 'post',
    data
  })
}

export function newOrganization(data) {
  return request({
    url: '/organization/',
    method: 'post',
    data
  })
}

export function fetchOrganizations() {
  return request({
    url: '/organization/',
    method: 'get'
  })
}

export function quitOrganization(data) {
  return request({
    url: '/organization/member',
    method: 'delete',
    data
  })
}

export function newTeam(data) {
  return request({
    url: '/team/',
    method: 'post',
    data
  })
}

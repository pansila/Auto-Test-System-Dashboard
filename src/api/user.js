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

export function updateAccount(user) {
  return request({
    url: '/user/account',
    method: 'post',
    data: user
  })
}

export function deleteAccount(data) {
  return request({
    url: '/user/account',
    method: 'delete',
    data
  })
}

export function updatePassword(data) {
  return request({
    url: '/user/password',
    method: 'post',
    data
  })
}

export function useAvatar(data) {
  return request({
    url: '/user/avatar',
    method: 'patch',
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

export function joinOrganization(data) {
  return request({
    url: '/organization/join',
    method: 'post',
    data
  })
}

export function fetchJoinedOrganizations() {
  return request({
    url: '/organization/',
    method: 'get'
  })
}

export function fetchJoinedOrganizationTeams() {
  return request({
    url: '/organization/include_team',
    method: 'get'
  })
}

export function fetchAllOrganizations() {
  return request({
    url: '/organization/all',
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

export function deleteOrganization(data) {
  return request({
    url: '/organization/',
    method: 'delete',
    data
  })
}

export function fetchOrganizationUsers(params) {
  return request({
    url: '/organization/users',
    method: 'get',
    params
  })
}

export function transferOwnership(data) {
  return request({
    url: '/organization/transfer',
    method: 'post',
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

export function joinTeam(data) {
  return request({
    url: '/team/join',
    method: 'post',
    data
  })
}

export function fetchJoinedTeams() {
  return request({
    url: '/team/',
    method: 'get'
  })
}

export function fetchAllTeams(params) {
  return request({
    url: '/team/all',
    method: 'get',
    params
  })
}

export function quitTeam(data) {
  return request({
    url: '/team/member',
    method: 'delete',
    data
  })
}

export function deleteTeam(data) {
  return request({
    url: '/team/',
    method: 'delete',
    data
  })
}

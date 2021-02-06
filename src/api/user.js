import request from '@/utils/request'

const api_version = '/api_v1'

export function login(data) {
  return request({
    url: api_version + '/auth/login',
    method: 'post',
    data
  })
}

export function logout() {
  return request({
    url: api_version + '/auth/logout',
    method: 'post'
  })
}

export function getInfo(token) {
  return request({
    url: api_version + '/user/info',
    method: 'get',
    params: { token }
  })
}

export function checkEmail(email) {
  return request({
    url: api_version + '/user/check',
    method: 'get',
    params: { email }
  })
}

export function register(data) {
  return request({
    url: api_version + '/user/',
    method: 'post',
    data
  })
}

export function updateAccount(user) {
  return request({
    url: api_version + '/user/account',
    method: 'post',
    data: user
  })
}

export function deleteAccount(data) {
  return request({
    url: api_version + '/user/account',
    method: 'delete',
    data
  })
}

export function updatePassword(data) {
  return request({
    url: api_version + '/user/password',
    method: 'post',
    data
  })
}

export function getAvatar(params) {
  return request({
    url: api_version + '/user/avatar',
    method: 'get',
    params
  })
}

export function useAvatar(data) {
  return request({
    url: api_version + '/user/avatar',
    method: 'patch',
    data
  })
}

export function uploadAvatar(data) {
  return request({
    url: api_version + '/user/avatar',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function getOrganizationAvatar(organization_id) {
  return request({
    url: api_version + '/organization/avatar/' + organization_id,
    method: 'get'
  })
}

export function newOrganization(data) {
  return request({
    url: api_version + '/organization/',
    method: 'post',
    data
  })
}

export function joinOrganization(data) {
  return request({
    url: api_version + '/organization/join',
    method: 'post',
    data
  })
}

export function fetchJoinedOrganizations() {
  return request({
    url: api_version + '/organization/',
    method: 'get'
  })
}

export function fetchJoinedOrganizationTeams() {
  return request({
    url: api_version + '/organization/include_team',
    method: 'get'
  })
}

export function fetchAllOrganizations() {
  return request({
    url: api_version + '/organization/all',
    method: 'get'
  })
}

export function quitOrganization(data) {
  return request({
    url: api_version + '/organization/member',
    method: 'delete',
    data
  })
}

export function deleteOrganization(data) {
  return request({
    url: api_version + '/organization/',
    method: 'delete',
    data
  })
}

export function fetchOrganizationUsers(params) {
  return request({
    url: api_version + '/organization/users',
    method: 'get',
    params
  })
}

export function transferOwnership(data) {
  return request({
    url: api_version + '/organization/transfer',
    method: 'post',
    data
  })
}

export function getTeamAvatar(team_id) {
  return request({
    url: api_version + '/team/avatar/' + team_id,
    method: 'get'
  })
}

export function newTeam(data) {
  return request({
    url: api_version + '/team/',
    method: 'post',
    data
  })
}

export function joinTeam(data) {
  return request({
    url: api_version + '/team/join',
    method: 'post',
    data
  })
}

export function fetchJoinedTeams() {
  return request({
    url: api_version + '/team/',
    method: 'get'
  })
}

export function fetchAllTeams(params) {
  return request({
    url: api_version + '/team/all',
    method: 'get',
    params
  })
}

export function quitTeam(data) {
  return request({
    url: api_version + '/team/member',
    method: 'delete',
    data
  })
}

export function deleteTeam(data) {
  return request({
    url: api_version + '/team/',
    method: 'delete',
    data
  })
}

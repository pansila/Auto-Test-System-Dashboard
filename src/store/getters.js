const getters = {
  sidebar: state => state.app.sidebar,
  size: state => state.app.size,
  device: state => state.app.device,
  visitedViews: state => state.tagsView.visitedViews,
  cachedViews: state => state.tagsView.cachedViews,
  token: state => state.user.token,
  email: state => state.user.email,
  avatar: state => state.user.avatar,
  name: state => state.user.name,
  introduction: state => state.user.introduction,
  registered_on: state => state.user.registered_on,
  region: state => state.user.region,
  roles: state => state.user.roles,
  permission_routes: state => state.permission.routes,
  errorLogs: state => state.errorLog.logs,
  organization_team: state => state.settings.organization_team,
  organizations: state => state.settings.organizations,
  taskqueue_update: state => state.settings.taskqueue_update
}
export default getters

import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/* Router Modules */

/** note: sub-menu only appear when children.length>=1
 *  detail see  https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 **/

/**
 * Note: sub-menu only appear when route children.length >= 1
 * Detail see: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * hidden: true                   if set true, item will not show in the sidebar(default is false)
 * alwaysShow: true               if set true, will always show the root menu
 *                                if not set alwaysShow, when item has more than one children route,
 *                                it will becomes nested mode, otherwise not show the root menu
 * redirect: noRedirect           if set noRedirect will no redirect in the breadcrumb
 * name:'router-name'             the name is used by <keep-alive> (must set!!!)
 * meta : {
    roles: ['admin','editor']    control the page roles (you can set multiple roles)
    title: 'title'               the name show in sidebar and breadcrumb (recommend set)
    icon: 'svg-name'             the icon show in the sidebar
    noCache: true                if set true, the page will no be cached(default is false)
    affix: true                  if set true, the tag will affix in the tags-view
    breadcrumb: false            if set false, the item will hidden in breadcrumb(default is true)
    activeMenu: '/example/list'  if set path, the sidebar will highlight the path you set
  }
 */

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path*',
        component: () => import('@/views/redirect/index')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    path: '/auth-redirect',
    component: () => import('@/views/login/auth-redirect'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/error-page/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error-page/401'),
    hidden: true
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/dashboard/index'),
        name: 'Dashboard',
        meta: { title: 'Dashboard', icon: 'dashboard', affix: true }
      }
    ]
  },
  {
    path: '/start-test',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/start-test/index'),
        name: 'start-test',
        meta: { title: 'Start Test', icon: 'guide', noCache: true, affix: true }
      }
    ]
  },
  {
    path: '/test-reschedule',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/test-reschedule/index'),
        name: 'test-reschedule',
        meta: { title: 'Test Reschedule', icon: 'nested', noCache: true, affix: true }
      }
    ]
  },
  {
    path: '/edit-test',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/test-report/index'),
        name: 'edit-test',
        meta: { title: 'Edit Test', icon: 'edit', noCache: true, affix: true }
      }
    ]
  },
  {
    path: '/test-report',
    component: Layout,
    name: 'test-report',
    noShowingChildren: true,
    children: [
      {
        path: 'index',
        component: () => import('@/views/test-report/index'),
        name: 'test-report-index',
        meta: { title: 'Test Report', icon: 'chart', noCache: true, affix: true }
      },
      {
        path: 'test-detail',
        component: () => import('@/views/test-report/testDetail'),
        name: 'test-detail',
        hidden: true,
        meta: { title: 'Test Detail', icon: 'chart', noCache: true, affix: true }
      }
    ]
  },
  {
    path: '/test-endpoint',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/test-endpoint/index'),
        name: 'test-endpoint',
        meta: { title: 'Test Endpoint', icon: 'tree', noCache: true, affix: true }
      }
    ]
  },
  {
    path: '/test-store',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/test-report/index'),
        name: 'test-store',
        meta: { title: 'Test Store', icon: 'example', noCache: true, affix: true }
      }
    ]
  },
  {
    path: '/users',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/test-report/index'),
        name: 'users',
        meta: { title: 'Users', icon: 'peoples', noCache: true, affix: true }
      }
    ]
  },
  {
    path: '/setting',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/test-report/index'),
        name: 'setting',
        meta: { title: 'Setting', icon: 'tab', noCache: true, affix: true }
      }
    ]
  },
  {
    path: '/help',
    component: Layout,
    children: [
      {
        path: 'index',
        component: () => import('@/views/test-report/index'),
        name: 'help',
        meta: { title: 'Help', icon: 'documentation', noCache: true, affix: true }
      }
    ]
  }
]

export const asyncRoutes = [
  /** When your routing table is too long, you can split it into small modules**/

  { path: '*', redirect: '/404', hidden: true }
]

const createRouter = () => new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router

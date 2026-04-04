import { createRouter, createWebHistory } from 'vue-router'
import AppListPage from '../pages/AppListPage.vue'
import RouteListPage from '../pages/RouteListPage.vue'
import RouteDetailPage from '../pages/RouteDetailPage.vue'

const routes = [
  {
    path: '/',
    name: 'AppList',
    component: AppListPage
  },
  {
    path: '/apps/:appId',
    name: 'RouteList',
    component: RouteListPage,
    props: true
  },
  {
    path: '/apps/:appId/routes/:page',
    name: 'RouteDetail',
    component: RouteDetailPage,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

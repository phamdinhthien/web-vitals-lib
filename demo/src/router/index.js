import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import AboutPage from '../pages/AboutPage.vue'
import GalleryPage from '../pages/GalleryPage.vue'

const routes = [
  { path: '/', name: 'Home', component: HomePage },
  { path: '/about', name: 'About', component: AboutPage },
  { path: '/gallery', name: 'Gallery', component: GalleryPage }
]

export default createRouter({
  history: createWebHistory(),
  routes
})

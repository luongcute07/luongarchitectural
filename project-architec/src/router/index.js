
import { createRouter, createWebHistory } from 'vue-router'
import NewsModal from '../components/NewsModal.vue'
const router = createRouter({
  
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: NewsModal,
    },
    
  ]
})

export default router

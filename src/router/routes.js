
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Index.vue') },
      { path: '/indoor', component: () => import('pages/Indoor.vue') },
      { path: '/outdoor', component: () => import('pages/Outdoor.vue') },
      { path: '/workers', component: () => import('pages/Workers.vue') },
      { path: '/devices', component: () => import('pages/Devices.vue') },
      { path: '/monitor', component: () => import('pages/Monitor.vue') },
      { path: '/cmd', component: () => import('pages/Cmd.vue') }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes

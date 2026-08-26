export default {
  routes: [
    {
      method: 'GET',
      path: '/admin-panel/users',
      handler: 'admin-panel.listUsers',
      config: {
        policies: ['api::admin-panel.is-admin'],
      },
    },
    {
      method: 'PUT',
      path: '/admin-panel/users/:id/role',
      handler: 'admin-panel.changeUserRole',
      config: {
        policies: ['api::admin-panel.is-admin'],
      },
    },
    {
      method: 'GET',
      path: '/admin-panel/stats',
      handler: 'admin-panel.stats',
      config: {
        policies: ['api::admin-panel.is-admin'],
      },
    },
  ],
};

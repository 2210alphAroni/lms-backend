const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::course.course', {
  config: {
    create: {
      policies: ['api::course.can-manage-course'],
    },
    update: {
      policies: ['api::course.can-manage-course'],
    },
    delete: {
      policies: ['api::course.can-manage-course'],
    },
  },
});
/**
 * course router
 */
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::course.course', {
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

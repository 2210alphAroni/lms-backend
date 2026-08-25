/**
 * enrollment router
 */
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::enrollment.enrollment', {
  config: {
    create: {
      policies: ['api::enrollment.can-manage-enrollment'],
    },
    update: {
      policies: ['api::enrollment.can-manage-enrollment'],
    },
    delete: {
      policies: ['api::enrollment.can-manage-enrollment'],
    },
  },
});

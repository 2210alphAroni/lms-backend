/**
 * lesson-progress router
 */
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::lesson-progress.lesson-progress', {
  config: {
    create: {
      policies: ['api::lesson-progress.can-manage-progress'],
    },
    update: {
      policies: ['api::lesson-progress.can-manage-progress'],
    },
    delete: {
      policies: ['api::lesson-progress.can-manage-progress'],
    },
  },
});

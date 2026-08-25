/**
 * quiz router
 */
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::quiz.quiz', {
  config: {
    create: {
      policies: ['api::quiz.can-manage-quiz'],
    },
    update: {
      policies: ['api::quiz.can-manage-quiz'],
    },
    delete: {
      policies: ['api::quiz.can-manage-quiz'],
    },
  },
});

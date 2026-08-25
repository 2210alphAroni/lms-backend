/**
 * quiz-attempt router
 */
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::quiz-attempt.quiz-attempt', {
  config: {
    update: {
      policies: ['api::quiz-attempt.can-manage-attempt'],
    },
    delete: {
      policies: ['api::quiz-attempt.can-manage-attempt'],
    },
  },
});

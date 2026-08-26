/**
 * lesson-progress controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::lesson-progress.lesson-progress', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    const data = { ...(ctx.request.body?.data || {}) };
    delete data.user;

    if (user?.platformRole === 'student') {
      ctx.request.body = {
        ...ctx.request.body,
        data: {
          ...data,
          completed: true,
          completedAt: ctx.request.body?.data?.completedAt || new Date(),
        },
      };
    }

    const response: any = await super.create(ctx);
    const userId = user?.documentId || user?.id;

    if (userId && response?.data?.documentId) {
      const updated = await strapi.documents('api::lesson-progress.lesson-progress').update({
        documentId: response.data.documentId,
        data: { user: { connect: [userId] } } as any,
        populate: ['user', 'course', 'lesson'],
      });
      response.data = updated;
    }

    return response;
  },

  async find(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to view lesson progress.');
    }

    if (user.platformRole === 'student') {
      const requestedFilters = (ctx.query.filters as object) || {};
      ctx.query = {
        ...ctx.query,
        filters: {
          ...requestedFilters,
          user: {
            id: { $eq: user.id },
          },
        },
      };
    }

    if (user.platformRole === 'instructor') {
      const requestedFilters = (ctx.query.filters as object) || {};
      ctx.query = {
        ...ctx.query,
        filters: {
          ...requestedFilters,
          course: {
            owner: {
              id: { $eq: user.id },
            },
          },
        },
      };
    }

    return super.find(ctx);
  },
}));

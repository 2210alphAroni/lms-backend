/**
 * enrollment controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::enrollment.enrollment', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    const data = { ...(ctx.request.body?.data || {}) };
    delete data.user;

    if (user?.platformRole === 'student') {
      ctx.request.body = {
        ...ctx.request.body,
        data: {
          ...data,
          enrolledAt: ctx.request.body?.data?.enrolledAt || new Date(),
        },
      };
    }

    const response: any = await super.create(ctx);
    const userId = user?.documentId || user?.id;

    if (userId && response?.data?.documentId) {
      const updated = await strapi.documents('api::enrollment.enrollment').update({
        documentId: response.data.documentId,
        data: { user: { connect: [userId] } } as any,
        populate: ['user', 'course'],
      });
      response.data = updated;
    }

    return response;
  },

  async find(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to view enrollments.');
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

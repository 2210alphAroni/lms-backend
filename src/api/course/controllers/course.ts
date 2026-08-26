/**
 * course controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::course.course', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    const data = { ...(ctx.request.body?.data || {}) };
    delete data.owner;

    ctx.request.body = {
      ...ctx.request.body,
      data,
    };

    const response: any = await super.create(ctx);
    const ownerId = user?.documentId || user?.id;

    if (ownerId && response?.data?.documentId) {
      const updated = await strapi.documents('api::course.course').update({
        documentId: response.data.documentId,
        data: { owner: { connect: [ownerId] } } as any,
        populate: ['owner'],
      });
      response.data = updated;
    }

    return response;
  },
}));

/**
 * blog-post controller
 */
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::blog-post.blog-post', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    const data = { ...(ctx.request.body?.data || {}) };
    delete data.author;

    ctx.request.body = {
      ...ctx.request.body,
      data,
    };

    const response: any = await super.create(ctx);
    const authorId = user?.documentId || user?.id;

    if (authorId && response?.data?.documentId) {
      const updated = await strapi.documents('api::blog-post.blog-post').update({
        documentId: response.data.documentId,
        data: { author: { connect: [authorId] } } as any,
        populate: ['author'],
      });
      response.data = updated;
    }

    return response;
  },

  async find(ctx) {
    const user = ctx.state.user;

    // Admin and Content Manager can see everything (draft + published)
    if (user && (user.platformRole === 'admin' || user.platformRole === 'content_manager')) {
      return super.find(ctx);
    }

    // Everyone else (students, instructors, logged-out visitors)
    // only sees published posts — force the filter regardless of what was requested
    ctx.query = {
      ...ctx.query,
      filters: {
        ...(ctx.query.filters as object || {}),
        toggle: 'published',
      },
    };

    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    const post: any = await strapi.documents('api::blog-post.blog-post').findOne({
      documentId: id,
    });

    if (!post) {
      return ctx.notFound();
    }

    const isPrivileged = user && (user.platformRole === 'admin' || user.platformRole === 'content_manager');

    if (post.toggle !== 'published' && !isPrivileged) {
      return ctx.notFound(); // hide drafts from unauthorized viewers entirely
    }

    return super.findOne(ctx);
  },
}));

/**
 * enrollment controller
 */

import { factories } from '@strapi/strapi';

function getRelationId(value: unknown) {
  if (!value || typeof value !== 'object') return value;
  const relation = value as { connect?: unknown };
  const connected = Array.isArray(relation.connect) ? relation.connect[0] : relation.connect;
  if (!connected || typeof connected !== 'object') return connected;
  const entry = connected as { documentId?: unknown; id?: unknown };
  return entry.documentId || entry.id;
}

function getCourseDocumentId(ctx: any) {
  const filters = ctx.query?.filters as any;
  return filters?.course?.documentId?.$eq || filters?.course?.documentId || undefined;
}

export default factories.createCoreController(
  'api::enrollment.enrollment',
  ({ strapi }) => ({

    async create(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in.');
      }

      if (user.platformRole !== 'student') {
        return ctx.forbidden('Only students can enroll in courses.');
      }

      const data = { ...(ctx.request.body?.data || {}) };
      const courseId = getRelationId(data.course);

      if (!courseId) {
        return ctx.badRequest('course is required.');
      }

      const course = await strapi.documents('api::course.course').findOne({
        documentId: String(courseId),
      });

      if (!course) {
        return ctx.notFound('Course not found.');
      }

      const existing = await strapi.documents('api::enrollment.enrollment').findMany({
        filters: {
          user: { id: { $eq: user.id } },
          course: { documentId: { $eq: String(courseId) } },
        },
        populate: {
          course: {
            populate: ['owner'],
          },
        },
        limit: 1,
      } as any);

      if (existing[0]) {
        return { data: existing[0] };
      }

      const enrollment = await strapi
        .documents('api::enrollment.enrollment')
        .create({
          data: {
            user: user.documentId || user.id,
            course: String(courseId),
            enrolledAt: data.enrolledAt || new Date(),
          } as any,
          populate: {
            course: {
              populate: ['owner'],
            },
          },
        });

      return {
        data: enrollment,
      };
    },

    async find(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized(
          'You must be logged in to view enrollments.'
        );
      }

      const enrollments = await strapi
        .documents('api::enrollment.enrollment')
        .findMany({
          filters: {
            ...(user.platformRole === 'student'
              ? { user: { id: { $eq: user.id } } }
              : {}),
            ...(user.platformRole === 'instructor'
              ? { course: { owner: { id: { $eq: user.id } } } }
              : {}),
            ...(getCourseDocumentId(ctx)
              ? {
                  course: {
                    ...(user.platformRole === 'instructor'
                      ? { owner: { id: { $eq: user.id } } }
                      : {}),
                    documentId: { $eq: String(getCourseDocumentId(ctx)) },
                  },
                }
              : {}),
          },
          populate: {
            course: {
              populate: ['owner'],
            },
            ...(user.platformRole === 'admin' ||
            user.platformRole === 'content_manager' ||
            user.platformRole === 'instructor'
              ? {
                  user: {
                    fields: ['username', 'email'],
                  },
                }
              : {}),
          },
          sort: { enrolledAt: 'desc' },
        } as any);

      return {
        data: enrollments,
        meta: {},
      };
    },

    async update(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in to update enrollments.');
      }

      if (user.platformRole !== 'admin' && user.platformRole !== 'content_manager') {
        return ctx.forbidden('You are not allowed to update enrollments.');
      }

      const data = { ...(ctx.request.body?.data || {}) };
      delete data.user;

      ctx.request.body = {
        ...ctx.request.body,
        data,
      };

      return super.update(ctx);
    },

    async delete(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in to delete enrollments.');
      }

      if (user.platformRole !== 'admin' && user.platformRole !== 'content_manager') {
        return ctx.forbidden('You are not allowed to delete enrollments.');
      }

      return super.delete(ctx);
    },

  })
);

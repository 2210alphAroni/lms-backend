/**
 * lesson-progress controller
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

export default factories.createCoreController('api::lesson-progress.lesson-progress', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to update lesson progress.');
    }

    if (user.platformRole !== 'student') {
      return ctx.forbidden('Only students can update lesson progress.');
    }

    const data = { ...(ctx.request.body?.data || {}) };
    const courseId = getRelationId(data.course);
    const lessonId = getRelationId(data.lesson);

    if (!courseId || !lessonId) {
      return ctx.badRequest('course and lesson are required.');
    }

    const lesson: any = await strapi.documents('api::lesson.lesson').findOne({
      documentId: String(lessonId),
      populate: ['course'],
    });

    if (!lesson) {
      return ctx.notFound('Lesson not found.');
    }

    if (lesson.course?.documentId !== String(courseId)) {
      return ctx.badRequest('Lesson does not belong to this course.');
    }

    const enrollment = await strapi.documents('api::enrollment.enrollment').findMany({
      filters: {
        user: { id: { $eq: user.id } },
        course: { documentId: { $eq: String(courseId) } },
      },
      limit: 1,
    } as any);

    if (!enrollment[0]) {
      return ctx.forbidden('Enroll in this course before updating lesson progress.');
    }

    const existing = await strapi.documents('api::lesson-progress.lesson-progress').findMany({
      filters: {
        user: { id: { $eq: user.id } },
        course: { documentId: { $eq: String(courseId) } },
        lesson: { documentId: { $eq: String(lessonId) } },
      },
      limit: 1,
    } as any);

    const progressData = {
      completed: data.completed ?? true,
      completedAt: data.completedAt || new Date(),
    };

    if (existing[0]) {
      const updated = await strapi.documents('api::lesson-progress.lesson-progress').update({
        documentId: existing[0].documentId,
        data: progressData,
        populate: ['course', 'lesson'],
      });

      return { data: updated };
    }

    const progress = await strapi.documents('api::lesson-progress.lesson-progress').create({
      data: {
        user: user.documentId || user.id,
        course: String(courseId),
        lesson: String(lessonId),
        ...progressData,
      } as any,
      populate: ['course', 'lesson'],
    });

    return { data: progress };
  },

  async find(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to view lesson progress.');
    }

    const courseDocumentId = getCourseDocumentId(ctx);
    const filters = {
      ...(user.platformRole === 'student'
        ? { user: { id: { $eq: user.id } } }
        : {}),
      ...(user.platformRole === 'instructor'
        ? {
            course: {
              owner: { id: { $eq: user.id } },
              ...(courseDocumentId ? { documentId: { $eq: String(courseDocumentId) } } : {}),
            },
          }
        : {}),
      ...(user.platformRole !== 'instructor' && courseDocumentId
        ? { course: { documentId: { $eq: String(courseDocumentId) } } }
        : {}),
    };

    const progress = await strapi.documents('api::lesson-progress.lesson-progress').findMany({
      filters,
      populate: {
        lesson: true,
        course: true,
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
    } as any);

    return {
      data: progress,
      meta: {},
    };
  },

  async update(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to update lesson progress.');
    }

    const progress: any = await strapi.documents('api::lesson-progress.lesson-progress').findOne({
      documentId: ctx.params.id,
      populate: ['user'],
    });

    if (!progress) {
      return ctx.notFound('Lesson progress not found.');
    }

    const canUpdate =
      user.platformRole === 'admin' ||
      user.platformRole === 'content_manager' ||
      (user.platformRole === 'student' && progress.user?.id === user.id);

    if (!canUpdate) {
      return ctx.forbidden('You are not allowed to update this lesson progress.');
    }

    const data = { ...(ctx.request.body?.data || {}) };
    delete data.user;
    delete data.course;
    delete data.lesson;

    const updated = await strapi.documents('api::lesson-progress.lesson-progress').update({
      documentId: ctx.params.id,
      data,
      populate: ['course', 'lesson'],
    });

    return { data: updated };
  },

  async delete(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to delete lesson progress.');
    }

    if (user.platformRole !== 'admin' && user.platformRole !== 'content_manager') {
      return ctx.forbidden('You are not allowed to delete lesson progress.');
    }

    const deleted = await strapi.documents('api::lesson-progress.lesson-progress').delete({
      documentId: ctx.params.id,
    });

    return { data: deleted };
  },
}));

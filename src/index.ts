import type { Core } from '@strapi/strapi';

const PUBLIC_ACTIONS = [
  'api::course.course.find',
  'api::course.course.findOne',
  'api::blog-post.blog-post.find',
  'api::blog-post.blog-post.findOne',
];

const AUTHENTICATED_ACTIONS = [
  ...PUBLIC_ACTIONS,
  'api::course.course.create',
  'api::course.course.update',
  'api::course.course.delete',
  'api::lesson.lesson.find',
  'api::lesson.lesson.findOne',
  'api::lesson.lesson.create',
  'api::lesson.lesson.update',
  'api::lesson.lesson.delete',
  'api::quiz.quiz.find',
  'api::quiz.quiz.findOne',
  'api::quiz.quiz.create',
  'api::quiz.quiz.update',
  'api::quiz.quiz.delete',
  'api::enrollment.enrollment.find',
  'api::enrollment.enrollment.findOne',
  'api::enrollment.enrollment.create',
  'api::enrollment.enrollment.update',
  'api::enrollment.enrollment.delete',
  'api::lesson-progress.lesson-progress.find',
  'api::lesson-progress.lesson-progress.findOne',
  'api::lesson-progress.lesson-progress.create',
  'api::lesson-progress.lesson-progress.update',
  'api::lesson-progress.lesson-progress.delete',
  'api::quiz-attempt.quiz-attempt.find',
  'api::quiz-attempt.quiz-attempt.findOne',
  'api::quiz-attempt.quiz-attempt.create',
  'api::quiz-attempt.quiz-attempt.update',
  'api::quiz-attempt.quiz-attempt.delete',
  'api::blog-post.blog-post.create',
  'api::blog-post.blog-post.update',
  'api::blog-post.blog-post.delete',
  'api::admin-panel.admin-panel.listUsers',
  'api::admin-panel.admin-panel.changeUserRole',
  'api::admin-panel.admin-panel.stats',
];

async function ensureUsersPermissions(strapi: Core.Strapi, roleType: string, actions: string[]) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: roleType },
  });

  if (!role) {
    return;
  }

  for (const action of actions) {
    const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
      where: {
        action,
        role: role.id,
      },
    });

    if (!existing) {
      await strapi.db.query('plugin::users-permissions.permission').create({
        data: {
          action,
          role: role.id,
        },
      });
    }
  }
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensureUsersPermissions(strapi, 'public', PUBLIC_ACTIONS);
    await ensureUsersPermissions(strapi, 'authenticated', AUTHENTICATED_ACTIONS);
  },
};

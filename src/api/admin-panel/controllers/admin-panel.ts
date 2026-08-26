export default {
  async listUsers(ctx: any) {
    const users = await strapi.documents('plugin::users-permissions.user').findMany({
      fields: ['username', 'email', 'platformRole'],
      sort: { username: 'asc' },
    });

    return { data: users };
  },

  async changeUserRole(ctx: any) {
    const { id } = ctx.params;
    const { platformRole } = ctx.request.body || {};

    const validRoles = ['admin', 'content_manager', 'instructor', 'student'];

    if (!platformRole || !validRoles.includes(platformRole)) {
      return ctx.badRequest('A valid platformRole is required.');
    }

    const targetUser = await strapi.documents('plugin::users-permissions.user').findOne({
      documentId: id,
    });

    if (!targetUser) {
      return ctx.notFound('User not found.');
    }

    const updatedUser = await strapi.documents('plugin::users-permissions.user').update({
      documentId: id,
      data: { platformRole },
    });

    return { data: updatedUser };
  },

  async stats(ctx: any) {
    const allUsers = await strapi.documents('plugin::users-permissions.user').findMany({
      fields: ['platformRole'],
    });

    const usersByRole: Record<string, number> = {
      admin: 0,
      content_manager: 0,
      instructor: 0,
      student: 0,
    };

    allUsers.forEach((u: any) => {
      if (usersByRole[u.platformRole] !== undefined) {
        usersByRole[u.platformRole] += 1;
      }
    });

    const totalCourses = await strapi.documents('api::course.course').count({});
    const totalEnrollments = await strapi.documents('api::enrollment.enrollment').count({});

    return {
      data: {
        totalUsers: allUsers.length,
        usersByRole,
        totalCourses,
        totalEnrollments,
      },
    };
  },
};

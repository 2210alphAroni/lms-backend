export default async (policyContext: any, config: any, { strapi }: any) => {
  const user = policyContext.state.user;

  if (!user) {
    return false;
  }

  const role = user.platformRole;

  // Admin and Content Manager can manage ANY enrollment
  if (role === 'admin' || role === 'content_manager') {
    return true;
  }

  const enrollmentId = policyContext.params.id;

  // CREATE: students enroll as themselves; the controller attaches ctx.state.user.
  if (!enrollmentId) {
    if (role !== 'student') {
      return false;
    }
    return true;
  }

  // UPDATE/DELETE: Student can only touch their own enrollment
  if (role === 'student') {
    const enrollment = await strapi.documents('api::enrollment.enrollment').findOne({
      documentId: enrollmentId,
      populate: ['user'],
    });
    if (!enrollment || !enrollment.user) {
      return false;
    }
    return enrollment.user.id === user.id;
  }

  return false;
};

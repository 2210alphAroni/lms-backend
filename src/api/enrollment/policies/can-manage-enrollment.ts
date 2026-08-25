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

  // CREATE: Student can only enroll themselves (their `user` field must match their own id)
  if (!enrollmentId) {
    if (role !== 'student') {
      return false;
    }
    const bodyUserId = policyContext.request.body?.data?.user;
    // bodyUserId could be a numeric id or documentId depending on how frontend sends it
    return String(bodyUserId) === String(user.id);
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

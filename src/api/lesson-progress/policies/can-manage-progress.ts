export default async (policyContext: any, config: any, { strapi }: any) => {
  const user = policyContext.state.user;

  if (!user) {
    return false;
  }

  const role = user.platformRole;

  // Admin and Content Manager can manage any progress record
  if (role === 'admin' || role === 'content_manager') {
    return true;
  }

  const progressId = policyContext.params.id;

  // CREATE: only a student can create their OWN progress record
  if (!progressId) {
    if (role !== 'student') {
      return false;
    }
    const bodyUserId = policyContext.request.body?.data?.user;
    return String(bodyUserId) === String(user.id);
  }

  // UPDATE/DELETE: student can only touch their own progress record
  if (role === 'student') {
    const progress = await strapi.documents('api::lesson-progress.lesson-progress').findOne({
      documentId: progressId,
      populate: ['user'],
    });
    if (!progress || !progress.user) {
      return false;
    }
    return progress.user.id === user.id;
  }

  return false;
};

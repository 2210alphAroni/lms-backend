export default async (policyContext: any, config: any, { strapi }: any) => {
  const user = policyContext.state.user;

  if (!user) {
    return false;
  }

  const role = user.platformRole;

  const progressId = policyContext.params.id;

  if (!progressId) {
    return role === 'student';
  }

  // Admin and Content Manager can update/delete any progress record.
  if (role === 'admin' || role === 'content_manager') {
    return true;
  }

  // UPDATE: student can only touch their own progress record.
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

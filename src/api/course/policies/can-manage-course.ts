export default async (policyContext: any, config: any, { strapi }: any) => {
  const user = policyContext.state.user;

  if (!user) {
    return false;
  }

  const role = user.platformRole;

  if (role === 'admin' || role === 'content_manager') {
    return true;
  }

  if (role === 'instructor') {
    const courseId = policyContext.params.id;
    if (!courseId) {
      return true;
    }
    const course = await strapi.documents('api::course.course').findOne({
      documentId: courseId,
      populate: ['owner'],
    });
    if (!course || !course.owner) {
      return false;
    }
    return course.owner.id === user.id;
  }

  return false;
};

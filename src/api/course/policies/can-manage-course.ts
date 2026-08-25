export default async (policyContext: any, config: any, { strapi }: any) => {
  const user = policyContext.state.user;

  console.log('=== POLICY CHECK ===');
  console.log('User:', user ? user.username : 'NO USER');
  console.log('platformRole:', user ? user.platformRole : 'N/A');

  if (!user) {
    return false;
  }

  const role = user.platformRole;

  if (role === 'admin' || role === 'content_manager') {
    console.log('Allowed: admin/content_manager');
    return true;
  }

  if (role === 'instructor') {
    const courseId = policyContext.params.id;
    if (!courseId) {
      console.log('Allowed: instructor create');
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

  console.log('Blocked: role is', role);
  return false;
};

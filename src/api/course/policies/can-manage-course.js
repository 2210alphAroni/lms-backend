module.exports = async (policyContext, config, { strapi }) => {
  const user = policyContext.state.user;

  // Must be logged in
  if (!user) {
    return false;
  }

  const role = user.platformRole;

  // Admin and Content Manager can manage ANY course
  if (role === 'admin' || role === 'content_manager') {
    return true;
  }

  // Instructor can only manage THEIR OWN course
  if (role === 'instructor') {
    const courseId = policyContext.params.id;

    // If there's no course id (e.g. this is a "create" request), allow it —
    // ownership will be enforced separately when we set `owner` on create
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

  // Students and any other role: not allowed
  return false;
};
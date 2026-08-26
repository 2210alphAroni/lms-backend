function getRelationId(value: any) {
  if (!value || typeof value !== 'object') return value;
  const connected = Array.isArray(value.connect) ? value.connect[0] : value.connect;
  if (!connected || typeof connected !== 'object') return connected;
  return connected.documentId || connected.id;
}

export default async (policyContext: any, config: any, { strapi }: any) => {
  const user = policyContext.state.user;

  if (!user) {
    return false;
  }

  const role = user.platformRole;

  // Admin and Content Manager can manage ANY lesson
  if (role === 'admin' || role === 'content_manager') {
    return true;
  }

  if (role === 'instructor') {
    const lessonId = policyContext.params.id;

    // Creating a new lesson: check the `course` field in the request body
    // to make sure the instructor owns that course
    if (!lessonId) {
      const courseId = getRelationId(policyContext.request.body?.data?.course);
      if (!courseId) {
        return false;
      }
      const course = await strapi.documents('api::course.course').findOne({
        documentId: courseId,
        populate: ['owner'],
      });
      return course?.owner?.id === user.id;
    }

    // Updating/deleting an existing lesson: check via lesson -> course -> owner
    const lesson = await strapi.documents('api::lesson.lesson').findOne({
      documentId: lessonId,
      populate: { course: { populate: ['owner'] } },
    });

    if (!lesson || !lesson.course || !lesson.course.owner) {
      return false;
    }

    return lesson.course.owner.id === user.id;
  }

  return false;
};

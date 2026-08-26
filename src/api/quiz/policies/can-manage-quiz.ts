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

  if (role === 'admin' || role === 'content_manager') {
    return true;
  }

  if (role === 'instructor') {
    const quizId = policyContext.params.id;

    // Creating a new quiz: check the `course` field in the request body
    if (!quizId) {
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

    // Updating/deleting an existing quiz: check via quiz -> course -> owner
    const quiz = await strapi.documents('api::quiz.quiz').findOne({
      documentId: quizId,
      populate: { course: { populate: ['owner'] } },
    });

    if (!quiz || !quiz.course || !quiz.course.owner) {
      return false;
    }

    return quiz.course.owner.id === user.id;
  }

  return false;
};

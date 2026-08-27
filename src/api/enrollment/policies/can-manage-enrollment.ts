export default async (policyContext: any, config: any, { strapi }: any) => {
  const user = policyContext.state.user;

  if (!user) {
    return false;
  }

  const role = user.platformRole;

  const enrollmentId = policyContext.params.id;

  if (!enrollmentId) {
    return role === 'student';
  }

  // Admin and Content Manager can update/delete ANY enrollment.
  if (role === 'admin' || role === 'content_manager') {
    return true;
  }

  // Students enroll through POST only; no student update/delete endpoint access.
  return false;
};

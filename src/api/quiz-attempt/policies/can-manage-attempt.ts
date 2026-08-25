export default async (policyContext: any, config: any, { strapi }: any) => {
  const user = policyContext.state.user;

  if (!user) {
    return false;
  }

  const role = user.platformRole;

  // Only admin can edit or delete a quiz attempt after submission —
  // attempts are meant to be immutable records once graded
  return role === 'admin';
};

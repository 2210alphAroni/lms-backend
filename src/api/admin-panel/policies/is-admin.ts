export default async (policyContext: any, config: any, { strapi }: any) => {
  const user = policyContext.state.user;

  console.log('=== ADMIN PANEL POLICY CHECK ===');
  console.log('User:', user ? user.username : 'NO USER');
  console.log('platformRole:', user ? JSON.stringify(user.platformRole) : 'N/A');

  if (!user) {
    console.log('Blocked: no user');
    return false;
  }

  const allowed = user.platformRole === 'admin';
  console.log('Allowed:', allowed);
  return allowed;
};

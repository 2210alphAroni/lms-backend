export default async (policyContext: any, config: any, { strapi }: any) => {
  const user = policyContext.state.user;

  if (!user) {
    return false;
  }

  const role = user.platformRole;

  // Admin can manage ANY blog post
  if (role === 'admin') {
    return true;
  }

  if (role === 'content_manager') {
    const postId = policyContext.params.id;

    // Creating a new post: always allowed for content_manager
    if (!postId) {
      return true;
    }

    // Updating/deleting: only their OWN posts
    const post = await strapi.documents('api::blog-post.blog-post').findOne({
      documentId: postId,
      populate: ['author'],
    });

    if (!post || !post.author) {
      return false;
    }

    return post.author.id === user.id;
  }

  // Instructor and Student: not allowed
  return false;
};

/**
 * quiz-attempt controller
 */
import { factories } from '@strapi/strapi';

function getRelationId(value: any) {
  if (!value || typeof value !== 'object') return value;
  const connected = Array.isArray(value.connect) ? value.connect[0] : value.connect;
  if (!connected || typeof connected !== 'object') return connected;
  return connected.documentId || connected.id;
}

export default factories.createCoreController('api::quiz-attempt.quiz-attempt', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to view quiz attempts.');
    }

    if (user.platformRole === 'student') {
      const requestedFilters = (ctx.query.filters as object) || {};
      ctx.query = {
        ...ctx.query,
        filters: {
          ...requestedFilters,
          users_permissions_user: {
            id: { $eq: user.id },
          },
        },
      };
    }

    if (user.platformRole === 'instructor') {
      const requestedFilters = (ctx.query.filters as object) || {};
      ctx.query = {
        ...ctx.query,
        filters: {
          ...requestedFilters,
          quiz: {
            course: {
              owner: {
                id: { $eq: user.id },
              },
            },
          },
        },
      };
    }

    return super.find(ctx);
  },

  async create(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to submit a quiz.');
    }

    if (user.platformRole !== 'student') {
      return ctx.forbidden('Only students can submit quiz attempts.');
    }

    const { quiz: quizRelation, answers } = ctx.request.body?.data || {};
    const quizId = getRelationId(quizRelation);

    if (!quizId || !Array.isArray(answers)) {
      return ctx.badRequest('quiz and answers are required.');
    }

    // Fetch the quiz WITH its questions (including correct answers) —
    // this data never leaves the server, so the client cannot cheat
    const quiz: any = await strapi.documents('api::quiz.quiz').findOne({
      documentId: quizId,
      populate: ['Question'],
    });

    if (!quiz) {
      return ctx.notFound('Quiz not found.');
    }

    const questions = quiz.Question || [];
    let correctCount = 0;

    // Compare each submitted answer against the correct index, server-side
    questions.forEach((question: any, index: number) => {
      if (answers[index] === question.correctOptionIndex) {
        correctCount += 1;
      }
    });

    const score = questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;

    // Save the attempt with a SERVER-COMPUTED score and timestamp —
    // never trust a score sent from the client
    const attempt = await strapi.documents('api::quiz-attempt.quiz-attempt').create({
      data: {
        users_permissions_user: user.documentId || user.id,
        quiz: quizId,
        answers,
        score,
        submittedAt: new Date(),
      },
    });

    return { data: attempt };
  },
}));

/**
 * quiz-attempt controller
 */
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::quiz-attempt.quiz-attempt', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to submit a quiz.');
    }

    if (user.platformRole !== 'student') {
      return ctx.forbidden('Only students can submit quiz attempts.');
    }

    const { quiz: quizId, answers } = ctx.request.body?.data || {};

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
        user: user.id,
        quiz: quizId,
        answers,
        score,
        submittedAt: new Date(),
      },
    });

    return { data: attempt };
  },
}));

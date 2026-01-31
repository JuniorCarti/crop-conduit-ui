const { ZodError } = require('zod');
const { badRequest, unauthorized, notFound, serverError } = require('./response');

function handleError(event, error) {
  if (error instanceof ZodError) {
    return badRequest(event, 'Validation failed', error.flatten());
  }

  if (error && error.message === 'Invalid JSON body') {
    return badRequest(event, 'Invalid JSON body');
  }

  if (error && error.statusCode === 401) {
    return unauthorized(event, error.message || 'Unauthorized');
  }

  if (error && error.statusCode === 404) {
    return notFound(event, error.message || 'Not Found');
  }

  console.error(error);
  return serverError(event);
}

module.exports = { handleError };

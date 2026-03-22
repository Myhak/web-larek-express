import HttpError from './HttpError';

export default class UnauthorizedError extends HttpError {
  constructor(message: string = 'Необходима авторизация') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

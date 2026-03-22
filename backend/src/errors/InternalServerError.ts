import HttpError from './HttpError';

export default class InternalServerError extends HttpError {
  constructor(message: string = 'На сервере произошла ошибка') {
    super(500, message);
    this.name = 'InternalServerError';
  }
}

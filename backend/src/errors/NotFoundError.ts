import HttpError from './HttpError';

export default class NotFoundError extends HttpError {
  constructor(message: string = 'Запрашиваемый ресурс не найден') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

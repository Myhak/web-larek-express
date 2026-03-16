import HttpError from './HttpError';

export default class ConflictError extends HttpError {
  constructor(message: string = 'Конфликт при создании ресурса') {
    super(409, message);
    this.name = 'ConflictError';
  }
}

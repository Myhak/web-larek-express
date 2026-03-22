import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Интерфейс для токена
interface IToken {
  token: string;
}

// Определяем интерфейс для документа пользователя
export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  tokens: IToken[];
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Определяем схему токена
const tokenSchema = new mongoose.Schema<IToken>({
  token: {
    type: String,
    required: true,
  },
}, { _id: false });

// Определяем схему пользователя
const userSchema = new mongoose.Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Поле "email" должно быть заполнено'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Введите корректный email'],
  },
  password: {
    type: String,
    required: [true, 'Поле "password" должно быть заполнено'],
    minlength: [6, 'Минимальная длина поля "password" - 6'],
    select: false,
  },
  name: {
    type: String,
    default: 'Ё-мое',
    minlength: [2, 'Минимальная длина поля "name" - 2'],
    maxlength: [30, 'Максимальная длина поля "name" - 30'],
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'Поле "role" должно быть "user" или "admin"',
    },
    default: 'user',
  },
  tokens: {
    type: [tokenSchema],
    select: false,
    default: [],
  },
}, {
  timestamps: true,
});

// Хэширование пароля перед сохранением
userSchema.pre('save', async function save(next) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Метод для сравнения пароля
userSchema.methods.comparePassword = async function comparePassword(
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Создаем модель пользователя
export default mongoose.model<IUser>('user', userSchema);

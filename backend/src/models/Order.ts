import mongoose from 'mongoose';

// Определяем интерфейс для документа заказа
export interface IOrder {
  _id: string;
  email: string;
  phone: string;
  address: string;
  payment: 'card' | 'online';
  items: string[]; // Массив ID товаров
  total: number;
  status: 'created' | 'paid' | 'cancelled' | 'shipped';
  createdAt: Date;
}

// Определяем схему заказа
const orderSchema = new mongoose.Schema<IOrder>({
  email: {
    type: String,
    required: [true, 'Поле "email" должно быть заполнено'],
    match: [/^\S+@\S+\.\S+$/, 'Введите корректный email'],
  },
  phone: {
    type: String,
    required: [true, 'Поле "phone" должно быть заполнено'],
  },
  address: {
    type: String,
    required: [true, 'Поле "address" должно быть заполнено'],
  },
  payment: {
    type: String,
    enum: {
      values: ['card', 'online'],
      message: 'Поле "payment" должно быть "card" или "online"',
    },
    required: [true, 'Поле "payment" должно быть заполнено'],
  },
  items: {
    type: [String],
    required: [true, 'Поле "items" должно быть заполнено'],
    validate: {
      validator: (v: string[]) => v.length > 0,
      message: 'Поле "items" не может быть пустым',
    },
  },
  total: {
    type: Number,
    required: [true, 'Поле "total" должно быть заполнено'],
    min: [0, 'Поле "total" должно быть неотрицательным числом'],
  },
  status: {
    type: String,
    enum: {
      values: ['created', 'paid', 'cancelled', 'shipped'],
      message: 'Поле "status" должно быть одним из: created, paid, cancelled, shipped',
    },
    default: 'created',
  },
}, {
  timestamps: true,
});

// Создаем модель заказа
export default mongoose.model<IOrder>('order', orderSchema);

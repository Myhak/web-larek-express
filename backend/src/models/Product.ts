import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

// Определяем интерфейс для документа продукта
export interface IProduct {
  _id: string;
  title: string;
  image: {
    fileName: string;
    originalName: string;
  };
  category: string;
  description?: string;
  price: number | null;
}

// Определяем схему продукта
const productSchema = new mongoose.Schema<IProduct>({
  title: {
    type: String,
    required: [true, 'Поле "title" должно быть заполнено'],
    minlength: [2, 'Минимальная длина поля "title" - 2'],
    maxlength: [30, 'Максимальная длина поля "title" - 30'],
    unique: true,
  },
  image: {
    fileName: {
      type: String,
      required: [true, 'Поле "image.fileName" должно быть заполнено'],
    },
    originalName: {
      type: String,
      required: [true, 'Поле "image.originalName" должно быть заполнено'],
    },
  },
  category: {
    type: String,
    required: [true, 'Поле "category" должно быть заполнено'],
  },
  description: {
    type: String,
    required: false,
  },
  price: {
    type: Number,
    default: null,
  },
});

// Post-remove хук для очистки файла при удалении документа
productSchema.post('findOneAndDelete', (doc: IProduct | null) => {
  if (doc?.image?.fileName) {
    const filePath = path.join(__dirname, '../../public', doc.image.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

// Создаем модель продукта
export default mongoose.model<IProduct>('product', productSchema);

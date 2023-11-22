import { Schema, Document, model, Types } from 'mongoose';

export interface AnswerInterface extends Document {
  text: string,
  question: Types.ObjectId,
  user: Types.ObjectId,
  delete: boolean,
  time: string,
  date: string,
}

const answerSchema: Schema = new Schema({
  text: {
    type: String,
    required: true
  },
  question: {
    type: Types.ObjectId,
    ref: 'Question',
    required: true
  },
  user: {
    type: Types.ObjectId,
    ref: 'User'
  },
  delete: {
    type: Boolean,
    default: false,
  },
  time: {
    type: String,
    default: Date.now()
  },
  date: {
    type: String,
    default: new Date().toJSON().substr(0,10)
  }
});

export const Answer = model<AnswerInterface>('Answer', answerSchema, 'Answers');

import { model, Document, Schema, Types } from 'mongoose';

export interface QuestionInterface extends Document {
  text: string,
  users: Types.Array<Types.ObjectId>,
  delete: boolean,
  active: boolean
}

const questionSchema: Schema = new Schema({
  text: {
    type: String,
    required: true
  },
  users: [{
    type: Types.ObjectId,
    ref: 'User'
  }],
  active: {
    type: Boolean,
    default: true
  },
  delete: {
    type: Boolean,
    default: false
  }
},{ usePushEach: true, strict: "throw" });

export const Question = model<QuestionInterface>('Question', questionSchema, 'Questions');

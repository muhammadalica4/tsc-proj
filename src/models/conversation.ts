import { Schema, Document, model, Types } from 'mongoose';

export interface ConversationInterface extends Document {
  title: string,
  creator: Types.ObjectId,
  members: Types.Array<Types.ObjectId>,
  updateTime: string,
  isOneToOne: boolean,
  delete: boolean,
}

var conversationSchema = new Schema({
    title: {
        type: String,
        default: ''
    },
    creator: {
        type: Types.ObjectId,
        ref: 'User'
    },
    members: [{
        type: Types.ObjectId,
        ref: 'User'
    }],
    updateTime: {
        type: String,
        default: Date.now()
    },
    isOneToOne: {
      type: Boolean,
      default: false
    },
    delete: {
        type: Boolean,
        default: false
    }
});

export const Conversation = model<ConversationInterface>('Conversation', conversationSchema, 'Conversations');

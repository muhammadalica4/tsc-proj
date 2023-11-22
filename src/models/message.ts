import { Schema, Document, model, Types } from 'mongoose';

export interface MessageInterface extends Document {
  message: string,
  attachment: {
    path: string,
    origin: string,
  },
  sender: Types.ObjectId,
  receiver: Types.Array<Types.ObjectId>,
  isSeen: boolean,
  time: string,
  conversation: Types.ObjectId,
  delete: boolean
}

const messageSchema = new Schema({
  message: {
    type: String,
    default: ""
  },
  attachment: {
    path: {
      type: String,
      default: ""
    },
    origin: {
      type: String,
      default: ""
    }
  },
  sender: {
    type: Types.ObjectId,
    ref: 'User'
  },
  receiver: [{
    type: Types.ObjectId,
    ref: 'User'
  }],
  isSeen: {
    type: Boolean,
    default: false
  },
  time: {
    type: String,
    default: Date.now(),
  },
  conversation: {
    type: Types.ObjectId,
    ref: 'Conversation'
  },
  delete: {
    type: Boolean,
    default: false
  }
}, { usePushEach: true, strict: "throw" });

export const Message = model<MessageInterface>('Message', messageSchema, 'Messages');

import { Schema, model, Document, Types } from 'mongoose';

export interface NotificationInterface extends Document {
  title: string,
  text: string,
  to: Types.ObjectId,
  seen: boolean,
  ntype: string,
  data: object,
  time: string,
  delete: boolean
};

const notificationSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
  },
  to: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ntype: {
    type: String,
    default: ""
  },
  seen: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Object,
    default: {}
  },
  time: {
      type: String,
      default: Date.now()
  },
  delete: {
    type: Boolean,
    default: false
  }
});

export const Notification = model<NotificationInterface>("Notification", notificationSchema, "Notifications");

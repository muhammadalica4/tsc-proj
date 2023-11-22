import { Schema, Document, model, Types } from 'mongoose';
// import * as mongoose from 'mongoose';

export interface SessionInterface extends Document {
    token: string,
    user: Types.ObjectId,
    expireTime: string,
    isIndefinite: boolean,
    isActive: boolean
}

const sessionSchema: Schema = new Schema({
    token: {
        type: String,
        required: true,
    },
    user: {
        type: Types.ObjectId,
        ref: 'User',
        required: true,
    },
    expireTime: {
        type: String,
        default: Date.now(),
    },
    isIndefinite: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
});

export const Session = model<SessionInterface>('Session', sessionSchema, 'Sessions');

import { Schema, Document, model, Types } from 'mongoose';
import { base_url, prefix, secure } from '../config';
import bcrypt from 'bcrypt-nodejs';

import { generateActivationToken } from '../helpers/helpers';
const { ObjectId } = Types;
interface looseObject {
    [key: string]: any;
}

export interface AgendaInterface extends Document {
	title: string,
	date: string,
	time: string,
	companianId: Schema.Types.ObjectId,
  userId: Schema.Types.ObjectId,
	repeatDay: string,
  createDate: string	
}

const agendaSchema: Schema = new Schema({
	title: {
      type: String,
      required: true
  },
  date: {
      type: String,
      required: true,
  },
  time: {
      type: String,
      required: true,
  },
  repeatDay: {
      type: String,
      required: false,
  },
  companianId: {
      type: Schema.Types.ObjectId,
      ref: 'companianId',
      required: true,
  },
  userId: {
      type: Schema.Types.ObjectId,
      ref: 'userId',
      required: true,
  },
  createDate: {
      type: String,
      required: true,
  }
});

export const Agenda = model<AgendaInterface>('Agenda', agendaSchema, 'Agenda');
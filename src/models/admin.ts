import { Schema, Document, model, Types } from 'mongoose';
import { base_url, prefix, secure } from '../config';
import bcrypt from 'bcrypt-nodejs';
// import { Device, DeviceInterface } from './device';
// import { Bookmark, BookmarkInterface } from './bookmark';
// import { Permission, PermissionInterface } from './permission';
import { Playlist, PlaylistInterface } from './playlist';
import { generateActivationToken } from '../helpers/helpers';

interface looseObject {
    [key: string]: any;
}

export interface AdminInterface extends Document {
	firstname: string,
	lastname: string,
	username: string,
	email: string,
	password: string,
	picture: {
      path: string,
      origin: string,
  },
	status: string,
	joinDate: string,
	delete: boolean,
  createPassword(pwd: string): void,
  isAuthenticated(pwd: string): boolean,
  getName(): string,
  json(): object
}

const adminSchema: Schema = new Schema({
	firstname: {
      type: String,
      required: true
  },
  lastname: {
      type: String,
      required: true,
  },
  username: {
      required: true,
      index: {
          unique: true,
      },
      type: String,
  },
  email: {
      required: true,
      index: {
          unique: true
      },
      type: String,
  },
  password: {
      type: String,
  },
  picture: {
      path: {
          type: String,
          default: ""
      },
      origin: {
          type: String,
          default: ""
      }
  },
  status: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline'
  },
  joinDate: {
      type: String,
      default: Date.now()
  },
  delete: {
  	type: Boolean,
  	default: false
  }
}, { usePushEach: true, strict: "throw" });

adminSchema.methods.createPassword = function(pwd: string): void {
    this.password = bcrypt.hashSync(pwd, bcrypt.genSaltSync(300));
}

adminSchema.methods.isAuthenticated = function(pwd: string): boolean {
    return bcrypt.compareSync(pwd, this.password);
}

adminSchema.methods.getName = function(): string {
    return `${this.firstname} ${this.lastname}`;
}

adminSchema.methods.json = function(): object {
    let profile: looseObject = {
        id: this._id,
        firstname: this.firstname,
        lastname: this.lastname,
        email: this.email,
        username: this.username,
        picture: this.picture,
        joinDate: this.joinDate
    }
    return profile;
}

export const Admin = model<AdminInterface>('Admin', adminSchema, 'Admins');

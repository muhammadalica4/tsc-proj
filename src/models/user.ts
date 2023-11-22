import { Schema, Document, model, Types } from 'mongoose';
import { base_url, prefix, secure } from '../config';
import bcrypt from 'bcrypt-nodejs';
// import { Companian, CompanianInterface } from './companian';
// import { Device, DeviceInterface } from './device';
// import { Bookmark, BookmarkInterface } from './bookmark';
// import { Permission, PermissionInterface } from './permission';
// import { Playlist, PlaylistInterface } from './playlist';
import { generateActivationToken } from '../helpers/helpers';
const { ObjectId } = Types;
interface looseObject {
    [key: string]: any;
}

export interface UserInterface extends Document {
	name: string,
	imei: string,
	email: string,
	password: string,
  	__: string,
  	fcm: string,
  	company: string,
	picture: {
      path: string,
      origin: string
	},
	features: {
		askme: boolean,
		phone: boolean,
		message: boolean,
		camera: boolean,
		gallery: boolean,
		music: boolean,
		games: boolean,
		weather: boolean,
		help: boolean
	},
  	role: string,
  	phone: string,
  	token: string,
  	access: Types.Array<Types.ObjectId>,
  	companians: Types.Array<Types.ObjectId>,
  	users: Types.Array<Types.ObjectId>,
  	questions: Types.Array<Types.ObjectId>,
  	permissions: Types.Array<Types.ObjectId>,
  	playlists: Types.Array<Types.ObjectId>,
	joinDate: string,
	delete: boolean,
  	createPassword(pwd: string): void,
  	isAuthenticated(pwd: string): boolean,
  	// getEndPoints(my?: boolean): object,
  	json(): object,
  	// getCompanians(): Promise<any>,
  	// getUsers(): Promise<any>,
  	// getPermissions(): Promise<any>,
  	// checkPermission(permission: string): Promise<any>,
  	// getPlaylists(): Promise<any>,
}

const userSchema: Schema = new Schema({
	name: {
      type: String,
      default: ""
  },
  imei: {
      type: String,
      default: "",
  },
  email: {
      required: true,
      index: {
          unique: true
      },
      type: String,
  },
  token: {
    type: String,
    default: ""
  },
  password: {
      type: String,
  },
  __: {
      type: String,
      default: ""
  },
  fcm: {
    type: String,
    default: ""
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
  features: {
	askme: {
		type: Boolean,
		default: true
	},
	phone: {
		type: Boolean,
		default: true
	},
	message: {
		type: Boolean,
		default: true
	},
	camera: {
		type: Boolean,
		default: true
	},
	gallery: {
		type: Boolean,
		default: true
	},
	music: {
		type: Boolean,
		default: true
	},
	games: {
		type: Boolean,
		default: true
	},
	weather: {
		type: Boolean,
		default: true
	},
	help: {
		type: Boolean,
		default: true
	}
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'manager', 'companian'],
    default: 'user'
  },
  phone: {
    type: String,
    default: ""
  },
  company: {
    type: String,
    default: "",
  },
  access: [{
    type: Types.ObjectId,
    ref: 'User'
  }],
  companians: [{
    type: Types.ObjectId,
    ref: 'User'
  }],
  users: [{
    type: Types.ObjectId,
    ref: 'User'
  }],
  questions: [{
    type: Types.ObjectId,
    ref: 'Question'
  }],
  permissions: [{
      type: Types.ObjectId,
      ref: 'Permission',
  }],
  playlists: [{
    type: ObjectId,
    ref: 'Playlist'
  }],
  joinDate: {
      type: String,
      default: Date.now()
  },
  delete: {
  	type: Boolean,
  	default: false
  }
}, { usePushEach: true, strict: "throw" });

userSchema.methods.createPassword = function(pwd: string): void {
    this.__ = pwd;
    this.password = bcrypt.hashSync(pwd, bcrypt.genSaltSync(300));
}

userSchema.methods.isAuthenticated = function(pwd: string): boolean {
    return bcrypt.compareSync(pwd, this.password);
}

// userSchema.methods.getEndPoints = function(my: boolean = false): object {
//     my = typeof my === 'boolean' && my === true || false;
//     let mine = my ? 'me' : `users/${this._id}`;
//     return {
//         profile: my ? `${base_url}${secure.apiMyProfile.url}` : `${base_url}${secure.apiProfile.url}`,
//         permissions: my ? `${base_url}${secure.apiMyPermissions.url}` : `${base_url}${secure.apiPermissions.url}`,
//         endPoints: my ? `${base_url}${secure.apiMyEndpoints.url}` : `${base_url}${secure.apiEndpoints.url}`,
//         contacts: my ? `${base_url}${secure.apiMyContacts.url}` : `${base_url}${secure.apiContacts.url}`,
//         devices: my ? `${base_url}${secure.apiMyDevices.url}` : `${base_url}${secure.apiDevices.url}`,
//         playlists: my ? `${base_url}${secure.apiMyPlaylists.url}` : `${base_url}${secure.apiPlaylists.url}`
//     };
// }

userSchema.methods.json = function(): object {
    let profile: looseObject = {
        id: this._id,
        name: this.name,
        email: this.email,
        imei: this.imei,
        company: this.company,
        phone: this.phone,
        picture: this.picture,
        joinDate: this.joinDate,
		role: this.role
    };

    return profile;
}

// userSchema.methods.getCompanians = async function(): Promise<any> {
//     return Companian.find({"_id": {
//         "$in": this.companians
//     }, delete: false});
// }
//
// userSchema.methods.getUsers = async function(): Promise<any> {
//     return User.find({"_id": {
//         "$in": this.users
//     }, delete: false});
// }

// userSchema.methods.getPermissions = async function(): Promise<any> {
//     return Permission.find({"_id": {
//         "$in": this.permissions
//     }, delete: false});
// }
//
// userSchema.methods.checkPermission = async function(permission: string ): Promise<any> {
//     return Permission.findOne({"_id": {
//         "$in": this.permissions
//     }, "url": permission, delete: false});
// }

// userSchema.methods.getPlaylists = async function(): Promise<any> {
//   return Playlist.find({"_id": {
//     "$in": this.playlists
//   }, delete: false});
// }

export const User = model<UserInterface>('User', userSchema, 'Users');

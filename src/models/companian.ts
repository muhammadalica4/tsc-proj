import { Schema, Document, model, Types } from 'mongoose';
import { User, UserInterface } from './user';
import bcrypt from 'bcrypt-nodejs';
// import * as mongoose from 'mongoose';

interface looseObject {
    [key: string]: any;
}

export interface CompanianInterface extends Document {
	firstname: string,
	lastname: string,
	phone: {
    type: string,
    index: {
      unique: true
    },
    required: true,
  },
	email: string,
	company: string,
	password: string,
  fcm: string,
	picture: {
      path: string,
      origin: string,
  },
	users: Types.Array<Types.ObjectId>,
	joinDate: string,
	delete: boolean,
	createPassword(pwd: string): void,
	isAuthenticated(pwd: string): boolean,
	getName(): string,
  getUsers(): Promise<any>,
	json(): object
}

const companianSchema: Schema = new Schema({
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        default: "",
    },
    phone: {
        type: String,
        required: true,
				index: {
					unique: true
				}
    },
    email: {
        type: String,
        required: true,
        index: {
          unique: true
        }
    },
    company: {
        type: String,
        default: ""
    },
    password: {
      type: String,
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
		users: [{
			type: Types.ObjectId,
			ref: 'User'
		}],
		joinDate: {
			type: String,
			default: new Date.now()
		},
		delete: {
			type: Boolean,
			default: false
		}
});

companianSchema.methods.createPassword = function(pwd: string): void {
    this.password = bcrypt.hashSync(pwd, bcrypt.genSaltSync(300));
}

companianSchema.methods.isAuthenticated = function(pwd: string): boolean {
    return bcrypt.compareSync(pwd, this.password);
}

companianSchema.methods.getName = function(): string {
    return `${this.firstname} ${this.lastname}`;
}

companianSchema.methods.getUsers = async function(): Promise<any> {
    return User.find({"_id": {
        "$in": this.users
    }, delete: false});
}

companianSchema.methods.json = function(){
	let profile: looseObject = {
			id: this._id,
			firstname: this.firstname,
			lastname: this.lastname,
			email: this.email,
			phone: this.phone,
			company: this.company,
			picture: this.picture,
			joinDate: this.joinDate
	}
	return profile;
}

export const Companian = model<CompanianInterface>('Companian', companianSchema, 'Companians');

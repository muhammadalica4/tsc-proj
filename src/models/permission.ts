import { Schema, Document, model} from 'mongoose';

export interface PermissionInterface extends Document {
	name: string,
	url: string,
  method: string,
	delete: boolean
};

const permissionSchema: Schema = new Schema({
    name: {
        type: String,
        default: "",
    },
    url: {
        type: String,
        required: true,
        default: ""
    },
    method: {
      type: String,
      required: true,
      default: ""
    },
		delete: {
				type: Boolean,
				default: false
		}
});

export const Permission = model<PermissionInterface>('Permission', permissionSchema, 'Permissions');

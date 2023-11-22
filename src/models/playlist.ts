import { Schema, Document, Types, model } from 'mongoose';
import { Media } from './media';

export interface PlaylistInterface extends Document {
  name: string,
  items: Types.Array<Types.ObjectId>,
  delete: boolean,
  getItems(): Promise<any>
}

const playlistSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  items: [{
    type: Types.ObjectId,
    ref: "Media"
  }],
  delete: {
    type: Boolean,
    default: false
  }
}, {usePushEach: true});

playlistSchema.methods.getItems = async function(): Promise<any> {
  return Media.find({"_id": {
    "$in": this.items
  }, delete: false});
}

export const Playlist = model<PlaylistInterface>('Playlist', playlistSchema, 'Playlist');

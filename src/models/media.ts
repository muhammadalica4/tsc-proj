import { Schema, Document, model } from 'mongoose';

export interface MediaInterface extends Document {
  title: string,
  artist: Array<string>,
  albumartist: Array<string>,
  album: string,
  year: string,
  genre: Array<string>,
  picture: {
    origin: string,
    path: string
  }
  url: {
    origin: string,
    path: string
  },
  time: string,
  delete: boolean
}

const mediaSchema = new Schema({
  title: {
    type: String,
    default: ""
  },
  artist: [{
    type: String,
  }],
  albumartist: [{
    type: String,
  }],
  album: {
    type: String,
    default: ""
  },
  year: {
    type: String,
    default: ""
  },
  genre: [{
    type: String,
  }],
  picture: {
    origin: {
      type: String,
      default: ""
    },
    path: {
      type: String,
      default: ""
    }
  },
  url: {
    origin: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    }
  },
  time: {
    type: String,
    default: Date.now(),
  },
  delete: {
    type: Boolean,
    default: false
  }
});

export const Media = model<MediaInterface>('Media', mediaSchema, 'Media');

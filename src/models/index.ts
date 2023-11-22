import { connect, Types } from 'mongoose';
import { db } from '../config/config';
import { User, UserInterface } from './user';
// import { Companian, CompanianInterface } from './companian';
import { Question, QuestionInterface } from './question';
import { Session, SessionInterface } from './session';
import { Media, MediaInterface } from './media';
import { Playlist, PlaylistInterface } from './playlist';
import { Message, MessageInterface } from './message';
import { Conversation, ConversationInterface } from './conversation';
// import { Admin, AdminInterface } from './admin';
import { Permission, PermissionInterface } from './permission';
import { Answer, AnswerInterface } from './answer';
import { Notification, NotificationInterface } from './notification';
import { Agenda, AgendaInterface } from './agenda';
const { ObjectId } = Types;

export const initDatabase = (): void => {
	connect(db, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false}).then(async () => {
		console.log('successfull connected to database');
		let boilorPlate: boolean = process.env.NODE_ENV === 'boilorplate' || false;
		if(boilorPlate){
			let user = new User({name: "Willem Dickmans", email: "info@tabuelo.com", role: "admin"});
			user.createPassword("Dickmans#798");
			let saved = await user.save();
			if(saved){
				process.exit();
			}
		}
	}).catch((error) => {
		console.log("an error occured while connecting to database: ", error);
		process.exit();
	});
}

export {
	User,
	UserInterface,
	Permission,
	PermissionInterface,
	Question,
	QuestionInterface,
	Answer,
	AnswerInterface,
	Session,
	SessionInterface,
	Media,
	MediaInterface,
	Playlist,
	PlaylistInterface,
	Notification,
	NotificationInterface,
	Message,
	MessageInterface,
	Conversation,
	ConversationInterface,	
	Agenda,
	AgendaInterface,
	// Admin,
	// AdminInterface
};

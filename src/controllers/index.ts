import fs from 'fs';
import path from 'path';
import { User, Session, Media, Playlist, Question, Answer, Permission, Notification, Conversation, Message, Agenda } from '../models';
import { Request, Response } from 'express';
import { app, socketsList, io, Events } from '../socket';
import { Patterns, allowedImages, allowedMediaTypes, uploads_base_url, uploadsDir } from '../config';
import { localization, encryption, getMilliSecondsOfMonth, getFileExtension, readMusicMetaData, sendMailToCompanian } from '../helpers';
import { Types } from 'mongoose';
const { ObjectId } = Types;
const admin = require("firebase-admin");
const serviceAccount = require("../../agenda-tabuelo-firebase-adminsdk-53p1b-e5bf94e7e6.json");

interface looseObject { [key: string]: any; };
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export async function getDashboardDataForAdmin(req: Request, res: Response): Promise<any> {
  try {
    let obj: {[key: string]: any; } = {};
    let all = req.query.hasOwnProperty('all') || false;
    if(!all){
      obj.delete = false;
    }
    let medias = await Media.find(obj);
    let playlists = await Playlist.find(obj);
    let sessions = await Session.find();
    let users = await User.find(obj);
    let questions = await Question.find(obj);
    let answers = await Answer.find(obj);
    let permissions = await Permission.find(obj);
    let agendas = await Agenda.find();
    return res.status(200).json({success: true, data: { medias, playlists, sessions, users, questions, answers, permissions, agendas}});
  } catch(e){
    console.log(e);
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getDashboardDataForCurrentUser(req: Request, res: Response): Promise<any> {
  try {
    let myCompanians = await User.find({ _id: { $in: req.auth.companians }, delete: false});
    let myPlaylists = await Playlist.find({ _id: { $in: req.auth.playlists }, delete: false});
    let myQuestions = await Question.find({ _id: { $in: req.auth.questions }, delete: false});
    let myPermissions = await Permission.find({ _id: { $in: req.auth.permissions }, delete: false});
    let myAccess = await User.find({ _id: { $in: req.auth.access }, delete: false});
    let myUsers = await User.find({ _id: { $in: req.auth.users }, delete: false});
    return res.status(200).json({success: true, companians: myCompanians, playlists: myPlaylists, questions: myQuestions, permissions: myPermissions, access: myAccess, users: myUsers});
  } catch (e){
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getDashboardDataForUser(req: Request, res: Response): Promise<any> {
  if(!req.params.userId){
    return res.status(400).json({success: false, message: localization.translate('userId is missing')});
  } else {
    let user = await User.findOne({ _id: req.params.userId, delete: false });
    if(!user){
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    } else {
      try {
        let myCompanians = await User.find({ _id: { $in: user.companians }, delete: false});
        let myPlaylists = await Playlist.find({ _id: { $in: user.playlists }, delete: false});
        let myQuestions = await Question.find({ _id: { $in: user.questions }, delete: false});
        let myPermissions = await Permission.find({ _id: { $in: user.permissions }, delete: false});
        let myAccess = await User.find({ _id: { $in: user.access }, delete: false});
        let myUsers = await User.find({ _id: { $in: user.users }, delete: false});
        let agenda = await Agenda.find({userId:{ $in: user._id }});
        return res.status(200).json({success: true, companians: myCompanians, playlists: myPlaylists, questions: myQuestions, permissions: myPermissions, access: myAccess, users: myUsers,agenda: agenda});
      } catch (e){
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

export async function webLogin(req: Request, res: Response): Promise<any> {
  if(!req.body.email || !req.body.pwd){
      return res.status(401).json({success: false, message: localization.translate('email and password is required to login')});
  } else {
      let isAdmin = typeof req.body.admin === "boolean" && req.body.admin === true || false;
      let indefinite = typeof req.body.remember === "boolean" && req.body.remember === true || false;
      let role: string = isAdmin ? 'admin' : 'manager';
      let account = await User.findOne({email: req.body.email.toLowerCase(), role: role, delete: false});
      if(account && account.isAuthenticated(req.body.pwd)){
          let sExpire = Date.now() + getMilliSecondsOfMonth();
          let s = new Session({token: encryption(JSON.stringify(account.json())), user: new ObjectId(account._id), isIndefinite: indefinite, expireTime: sExpire});
          let session = await s.save();
          if(session){
              return res.status(200).json({
                  success: true,
                  token: session.token,
                  user: account.json()
              });
          } else {
              return res.status(500).json({
                  success: false,
                  message: localization.translate('internel server error')
              });
          }
      } else {
          return res.status(400).json({success: false, message: localization.translate('invalid credentials')});
      }
  }
}

export async function tabletLogin(req: Request, res: Response): Promise<any> {
  if(!req.body.imei || !req.body.pwd){
    return res.status(400).json({success: false, message: localization.translate('password is required to login')});
  } else {
    let user = await User.findOne({imei: req.body.imei, role: 'user', delete: false});
    if(user && user.isAuthenticated(req.body.pwd)){
      let sExpire = Date.now() + getMilliSecondsOfMonth();
      let s = new Session({token: encryption(JSON.stringify(user.json())), user: new ObjectId(user._id), isIndefinite: true, expireTime: sExpire});
      let session = await s.save();
      if(session){
        return res.status(200).json({
          success: true,
          token: session.token,
          user: user.json()
        });
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    } else {
      return res.status(400).json({success: false, message: localization.translate('invalid credentials')});
    }
  }
}

export async function companianLogin(req: Request, res: Response): Promise<any> {
  if(!req.body.phone || !req.body.pwd){
    return res.status(400).json({success: false, message: localization.translate('username and password are required to login')});
  } else {
	let isManager: boolean = (typeof req.body.manager === 'boolean' && req.body.manager === true ) || false;
	let search: looseObject = isManager ? {email: req.body.phone.toLowerCase(), role: 'manager', delete: false} : {$or: [{phone: req.body.phone.toLowerCase()}, {email: req.body.phone.toLowerCase()}], role: 'companian', delete: false};
    let user = await User.findOne(search);
    if(user && user.isAuthenticated(req.body.pwd)){
      let sExpire = Date.now() + getMilliSecondsOfMonth();
      let s = new Session({token: encryption(JSON.stringify(user.json())), user: new ObjectId(user._id), isIndefinite: true, expireTime: sExpire});
      let session = await s.save();
      if(session){
        return res.status(200).json({
          success: true,
          token: session.token,
          user: user.json()
        });
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    } else {
      return res.status(400).json({success: false, message: localization.translate('invalid credentials')});
    }
  }
}

export async function logout(req: Request, res: Response): Promise<any> {
  let token = req.token;
  let session = await Session.findOne({token: token});
  if(session){
      session.isActive = false;
      let saved = await session.save();
      if(saved){
          return res.status(200).json({success: true, message: localization.translate('logged out successfully')});
      } else {
          return res.status(500).json({success: true, message: localization.translate('internel server error')});
      }
  } else {
      return res.status(500).json({success: true, message: localization.translate('internel server error')});
  }
}

export async function getMyProfile(req: Request, res: Response): Promise<any> {
  try {
    return res.status(200).json({success: true, data: req.auth.json()});
  } catch(e){
    return res.status(500).json({success: false, message: localization.translate("internel server error")});
  }
}

export async function getMyFeatures(req: Request, res: Response): Promise<any> {
    try {
      return res.status(200).json({success: true, data: req.auth.features});
    } catch(e){
      return res.status(500).json({success: false, message: localization.translate("internel server error")});
    }
}

export async function saveFirebaseToken(req: Request, res: Response): Promise<any> {
  if(!req.body.fcmtoken){
    return res.status(400).json({success: false, message: localization.translate('fcm token is required')});
  } else {
    req.auth.fcm = req.body.fcmtoken;
    let saved = await req.auth.save();
    if(saved){
      return res.status(200).json({success: true, message: localization.translate('fcm token updated successfully')});
    } else {
      return res.status(500).json({success: false, message: localization.translate('internel server error')});
    }
  }
}

/*
 * Users section started
 */

export async function getUserFeatures(req: Request, res: Response): Promise<any> {
  if(!req.params.userId){
    return res.status(400).json({success: false, message: localization.translate('userId is missing')});
  } else {
    let user = await User.findOne({_id: req.params.userId, delete: false});
    if(!user){
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    } else {
		return res.status(200).json({success: true, data: user.features});
    }
  }
}

export async function updateMyFeatures(req: Request, res: Response): Promise<any> {
	let shouldUpdate: boolean = false;
	if(req.body.hasOwnProperty('askme')){
		req.auth.features.askme = !!req.body.askme;
		shouldUpdate = true;
	}
	if(req.body.hasOwnProperty('phone')){
		req.auth.features.phone = !!req.body.phone;
		shouldUpdate = true;
	}
	if(req.body.hasOwnProperty('message')){
		req.auth.features.message = !!req.body.message;
		shouldUpdate = true;
	}
	if(req.body.hasOwnProperty('camera')){
		req.auth.features.camera = !!req.body.camera;
		shouldUpdate = true;
	}
	if(req.body.hasOwnProperty('gallery')){
		req.auth.features.gallery = !!req.body.gallery;
		shouldUpdate = true;
	}
	if(req.body.hasOwnProperty('music')){
		req.auth.features.music = !!req.body.music;
		shouldUpdate = true;
	}
	if(req.body.hasOwnProperty('games')){
		req.auth.features.games = !!req.body.games;
		shouldUpdate = true;
	}
	if(req.body.hasOwnProperty('weather')){
		req.auth.features.weather = !!req.body.weather;
		shouldUpdate = true;
	}
	if(req.body.hasOwnProperty('help')){
		req.auth.features.help = !!req.body.help;
		shouldUpdate = true;
	}
	if(!shouldUpdate){
		return res.status(200).json({success: false, message: localization.translate('nothing to update')});
	} else {
		let saved = await req.auth.save();
		if(saved){
			return res.status(200).json({success: true, message: localization.translate('features updated successfully'), data: req.auth.features});
		} else {
			return res.status(500).json({success: false, message: localization.translate('internel server error')});
		}
	}
}

export async function updateUserFeatures(req: Request, res: Response): Promise<any> {
	if(!req.body.userId){
		return res.status(400).json({success: false, message: localization.translate('userId is missing')});
	} else {
		let user = await User.findOne({_id: req.body.userId, delete: false});
		if(!user){
			return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
		} else {
			let shouldUpdate: boolean = false;
			if(req.body.hasOwnProperty('askme')){
				user.features.askme = !!req.body.askme;
				shouldUpdate = true;
			}
			if(req.body.hasOwnProperty('phone')){
				user.features.phone = !!req.body.phone;
				shouldUpdate = true;
			}
			if(req.body.hasOwnProperty('message')){
				user.features.message = !!req.body.message;
				shouldUpdate = true;
			}
			if(req.body.hasOwnProperty('camera')){
				user.features.camera = !!req.body.camera;
				shouldUpdate = true;
			}
			if(req.body.hasOwnProperty('gallery')){
				user.features.gallery = !!req.body.gallery;
				shouldUpdate = true;
			}
			if(req.body.hasOwnProperty('music')){
				user.features.music = !!req.body.music;
				shouldUpdate = true;
			}
			if(req.body.hasOwnProperty('games')){
				user.features.games = !!req.body.games;
				shouldUpdate = true;
			}
			if(req.body.hasOwnProperty('weather')){
				user.features.weather = !!req.body.weather;
				shouldUpdate = true;
			}
			if(req.body.hasOwnProperty('help')){
				user.features.help = !!req.body.help;
				shouldUpdate = true;
			}
			if(!shouldUpdate){
				return res.status(200).json({success: false, message: localization.translate('nothing to update')});
			} else {
				let saved = await user.save();
				if(saved){
					try {
						let notification = new Notification({
							ntype: 'features',
							title: 'Home Screen Configured',
							text: 'Your home screen is configured',
							to: user._id,
							data: {
								features: user.features
							}
						});
						let userSocket: any = socketsList.getSocketByUser(user!._id!.toString());
						if(userSocket !== null){
							notification.seen = true;
							io.to(userSocket).emit(Events.NOTIFICATION, notification);
						}
						await notification.save();
					} catch(e){
						console.log(e);
					}
					return res.status(200).json({success: true, message: localization.translate('features updated successfully'), data: user.features});
				} else {
					return res.status(500).json({success: false, message: localization.translate('internel server error')});
				}
			}		
		}
	}
}

export async function getUsers(req: Request, res: Response): Promise<any> {
  let obj: { [key: string]: any; } = {};
  if(!req.query.all){
    obj.delete = false;
  }
  let users = await User.find(obj);
  if(users){
    return res.status(200).json({success: true, users: users});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getUserById(req: Request, res: Response): Promise<any> {
  if(!req.params.userId){
    return res.status(400).json({success: false, message: localization.translate('userId is missing')});
  } else {
    let obj: { [key: string]: any; } = {
      _id: req.params.userId,
      delete: false
    };
    if(req.query.delete){
      obj.delete = true;
    }
    let user = await User.findOne(obj);
    if(user){
      return res.status(200).json({success: true, user: user});
    } else {
      return res.status(500).json({success: false, message: localization.translate('internel server error')});
    }
  }
}

export async function getMyCompanians(req: Request, res: Response): Promise<any> {
  let companians = await User.find({_id: { $in: req.auth.companians }, delete: false});
  if(companians){
    return res.status(200).json({success: true, companians: companians});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getMyPlaylists(req: Request, res: Response): Promise<any> {
  let playlists = await Playlist.find({_id: { $in: req.auth.playlists }, delete: false});
  if(playlists){
    return res.status(200).json({success: true, playlists: playlists});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getMyQuestions(req: Request, res: Response): Promise<any> {
  let questions = await Question.find({_id: { $in: req.auth.questions }, delete: false});
  if(questions){
    return res.status(200).json({success: true, questions: questions});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getMyPermissions(req: Request, res: Response): Promise<any> {
  let permissions = await Permission.find({_id: { $in: req.auth.permissions }, delete: false});
  if(permissions){
    return res.status(200).json({success: true, permissions: permissions});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getMyAccess(req: Request, res: Response): Promise<any> {
  let access = await User.find({_id: { $in: req.auth.access }, delete: false});
  if(access){
    return res.status(200).json({success: true, access: access});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getMyUsers(req: Request, res: Response): Promise<any> {
  let users = await User.find({_id: { $in: req.auth.users }, delete: false});
  if(users){
    return res.status(200).json({success: true, users: users});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getMyConversations(req: Request, res: Response): Promise<any> {
  let conversations = await Conversation.find({$or: [{creator: req.auth._id, delete: false}, {members: req.auth._id, delete: false}]}, null, {sort: {updateTime: '-1'}});
  if(conversations){
    return res.status(200).json({success: true, conversations: conversations});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getMyAnswers(req: Request, res: Response): Promise<any> {
	let answers = await Answer.find({user: req.auth._id, delete: false}).populate([{path: 'question'}, {path: 'user'}]);
	if(answers){
		return res.status(200).json({success: true, answers: answers});
	} else {
		return res.status(500).json({success: false, message: localization.translate('internel server error')});
	}
}

export async function getMyAllLinkedAccounts(req: Request, res: Response): Promise<any> {
	let users = await User.find({_id: {$in: req.auth.users}});
	let companians = await User.find({_id: {$in: req.auth.companians}});
	let access = await User.find({_id: {$in: req.auth.access}});
	if(users && companians && access){
		return res.status(200).json({success: true, users: users, companians: companians, access: access});
	} else {
		return res.status(500).json({success: false, message: localization.translate('internel server error')});
	}
}

export async function getUserCompanians(req: Request, res: Response): Promise<any> {
  if(!req.params.userId){
    return res.status(400).json({success: false, message: localization.translate('userId is missing')});
  } else {
    let user = await User.findOne({_id: req.params.userId, delete: false});
    if(!user){
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    } else {
      let companians = await User.find({_id: { $in: user.companians }, delete: false});
      if(!companians){
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      } else {
        return res.status(200).json({success: true, companians: companians});
      }
    }
  }
}

export async function getUserPlaylists(req: Request, res: Response): Promise<any> {
  if(!req.params.userId){
    return res.status(400).json({success: false, message: localization.translate('userId is missing')});
  } else {
    let user = await User.findOne({_id: req.params.userId, delete: false});
    if(!user){
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    } else {
      let playlists = await Playlist.find({_id: { $in: user.playlists }, delete: false});
      if(!playlists){
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      } else {
        return res.status(200).json({success: true, playlists: playlists});
      }
    }
  }
}

export async function getUserQuestions(req: Request, res: Response): Promise<any> {
  if(!req.params.userId){
    return res.status(400).json({success: false, message: localization.translate('userId is missing')});
  } else {
    let user = await User.findOne({_id: req.params.userId, delete: false});
    if(!user){
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    } else {
      let questions = await Question.find({_id: { $in: user.questions }, delete: false});
      if(questions){
        return res.status(200).json({success: true, questions: questions});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

export async function getUserPermissions(req: Request, res: Response): Promise<any> {
  if(!req.params.userId){
    return res.status(400).json({success: false, message: localization.translate('userId is missing')});
  } else {
    let user = await User.findOne({_id: req.params.userId, delete: false});
    if(!user){
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    } else {
      let permissions = await Permission.find({_id: { $in: user.permissions }, delete: false});
      if(permissions){
        return res.status(200).json({success: true, permissions: permissions});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

export async function getUserAccess(req: Request, res: Response): Promise<any> {
  if(!req.params.userId){
    return res.status(400).json({success: false, message: localization.translate('userId is missing')});
  } else {
    let user = await User.findOne({_id: req.params.userId, delete: false});
    if(!user){
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    } else {
      let access = await User.find({_id: { $in: user.access }, delete: false});
      if(access){
        return res.status(200).json({success: true, access: access});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

export async function getCompanianUsers(req: Request, res: Response): Promise<any> {
  if(!req.params.companianId){
    return res.status(400).json({success: false, message: localization.translate('companianId is missing')});
  } else {
    let companian = await User.findOne({_id: req.params.companianId, delete: false});
    if(!companian){
      return res.status(400).json({success: false, message: localization.translate('requested companian does not exists')});
    } else {
      let users = await User.find({_id: { $in: companian.users }, delete: false});
      if(users){
        return res.status(200).json({success: true, users: users});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

export async function getUserConversations(req: Request, res: Response): Promise<any> {
  if(!req.params.userId){
    return res.status(400).json({success: false, message: localization.translate('userId is missing')});
  } else {
    let user = await User.findOne({_id: req.params.userId, delete: false});
    if(!user){
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    } else {
      let conversations = await Conversation.find({$or: [{creator: user._id, delete: false}, {members: user._id, delete: false}]}, null, {sort: {updateTime: '-1'}});
      if(conversations){
        return res.status(200).json({success: true, conversations: conversations});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

export async function getUserAnswers(req: Request, res: Response): Promise<any> {
    if(!req.params.userId){
      return res.status(400).json({success: false, message: localization.translate('userId is missing')});
    } else {
      let user = await User.findOne({_id: req.params.userId, delete: false});
      if(!user){
        return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
      } else {
	  	let answers = await Answer.find({user: user._id, delete: false}).populate([{path: 'question'}, {path: 'user'}]);
	  	if(answers){
	  		return res.status(200).json({success: true, answers: answers});
	  	} else {
	  		return res.status(500).json({success: false, message: localization.translate('internel server error')});
	  	}
      }
    }
}

export async function getUserAllLinkedAccounts(req: Request, res: Response): Promise<any> {
    if(!req.params.userId){
      return res.status(400).json({success: false, message: localization.translate('userId is missing')});
    } else {
      let user = await User.findOne({_id: req.params.userId, delete: false});
      if(!user){
        return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
      } else {
	  	let users = await User.find({_id: {$in: user.users}});
	  	let companians = await User.find({_id: {$in: user.companians}});
	  	let access = await User.find({_id: {$in: user.access}});
	  	if(users && companians && access){
	  		return res.status(200).json({success: true, users: users, companians: companians, access: access});
	  	} else {
	  		return res.status(500).json({success: false, message: localization.translate('internel server error')});
	  	}
      }
    }
}

export async function addUser(req: Request, res: Response): Promise<any> {
  if(!req.body.name || !req.body.email || !req.body.role || !req.body.pwd){
    try {
      fs.unlinkSync(req.file.path);
    } catch(e){
      console.log(e);
    }
    return res.status(400).json({success: false, message: localization.translate('please fill all fields')});
  } else {
    let errors: {[key: string]: string; } = {};
    if(!['user', 'admin', 'companian', 'manager'].includes(req.body.role)){
      errors.role = localization.translate('invalid value for role');
    }
    if(req.body.role === 'user'){
      if(!req.body.imei || !req.body.phone){
        try {
          fs.unlinkSync(req.file.path);
        } catch(e){
          console.log(e);
        }
        return res.status(400).json({success: false, message: localization.translate('please fill all fields')});
      } else {
        if(!Patterns.IMEI.test(req.body.imei)){
          errors.imei = localization.translate('imei number invalid');
        } else {
          let isAlreadyPresent = await User.findOne({imei: req.body.imei});
          if(isAlreadyPresent){
            errors.imei = localization.translate('device already registered');
          }
        }
        if(!Patterns.PHONE_REGEX.test(req.body.phone)){
          errors.phone = localization.translate('invalid phone number');
        } else {
          let isPhoneUsed = await User.findOne({phone: req.body.phone});
          if(isPhoneUsed){
            errors.phone = localization.translate('phone already in use');
          }
        }
      }
    }
    if(req.body.role === 'companian'){
      if(!req.body.phone){
        try {
          fs.unlinkSync(req.file.path);
        } catch(e){
          console.log(e);
        }
        return res.status(400).json({success: false, message: localization.translate('please fill all fields')});
      } else {
        if(!Patterns.PHONE_REGEX.test(req.body.phone)){
          errors.phone = localization.translate('invalid phone number');
        } else {
          let isPhoneUsed = await User.findOne({phone: req.body.phone});
          if(isPhoneUsed){
            errors.phone = localization.translate('phone already in use');
          }
        }
      }
    }
    if(!Patterns.EMAIL_REGEX.test(req.body.email)){
      errors.email = localization.translate('invalid email address');
    } else {
      let isEmailUsed = await User.findOne({email: req.body.email.toLowerCase()});
      if(isEmailUsed){
        errors.email = localization.translate('email already in use');
      }
    }
    if(!Patterns.PASSWORD_REGEX.test(req.body.pwd)){
      errors.pwd = localization.translate('password must contain mixed case alphanumeric 8 or more characters');
    }
    if(req.file !== undefined){
      let ext = getFileExtension(req.file.filename);
      if(!allowedImages.includes(ext)){
        errors.picture = localization.translate('only jpeg or png images are allowed');
      }
    }
    if(Object.keys(errors).length > 0){
      try {
        fs.unlinkSync(req.file.path);
      } catch(e){
        console.log(e);
      }
      return res.status(400).json({success: false, message: localization.translate('bad request'), errors: errors});
    } else {
      let picture: {origin: string, path: string} = { origin: '', path: ''};
      if(req.file){
        let url = new URL(`${uploads_base_url}${req.file.filename}`);
        picture.origin = url.origin;
        picture.path = url.pathname;
      }
      let user = new User({name: req.body.name, email: req.body.email.toLowerCase(), role: req.body.role, picture: picture});
      if(req.body.role === 'user'){
        user.imei = req.body.imei;
        user.phone = req.body.phone;
      } else if(req.body.role === 'companian') {
        user.phone = req.body.phone;
        if(req.body.company){
          user.company = req.body.company;
        }
      }
      user.createPassword(req.body.pwd);
      let saved = await user.save();
      if(saved){
        if(req.body.role === 'companian'){
          try {
            let options: {[key: string]: any;} = {
              username: req.body.email.toLowerCase(),
              password: req.body.pwd,
              link: "#"
            };
            sendMailToCompanian(user.email, options);
          } catch(e){
            console.log(e);
          }
        }
        return res.status(200).json({success: true, message: localization.translate('user added successfully'), user: user});
      } else {
        try {
          fs.unlinkSync(req.file.path);
        } catch(e){
          console.log(e);
        }
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

export async function editUser(req: Request, res: Response): Promise<any> {
  if(!req.params.userId){
    return res.status(400).json({success: false, message: localization.translate('userId is missing')});
  } else {
    let user = await User.findOne({_id: req.params.userId, delete: false});
    if(!user){
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    } else {
      let shouldUpdate: boolean = false;
      let errors: {[key: string]: string; } = {};
      if(req.body.name){
        user.name = req.body.name;
        shouldUpdate = true;
      }
      if(req.body.role){
        if(!['user', 'admin', 'companian', 'manager'].includes(req.body.role)){
          errors.role = localization.translate('invalid value for role');
        } else {
          user.role = req.body.role;
          shouldUpdate = true;
        }
      }
      if(req.body.imei && req.body.role){
        if(req.body.role === 'user'){
          if(!Patterns.IMEI.test(req.body.imei)){
            errors.imei = localization.translate('imei number invalid');
          } else {
            let isImeiTaken = await User.findOne({imei: req.body.imei, _id: {$ne: new ObjectId(req.params.userId)}});
            if(isImeiTaken){
              errors.imei = localization.translate('device already registered');
            } else {
              user.imei = req.body.imei;
              shouldUpdate = true;
            }
          }
        }
      }
      if(req.body.email){
        if(!Patterns.EMAIL_REGEX.test(req.body.email)){
          errors.email = localization.translate('invalid email address');
        } else {
          let isEmailTaken = await User.findOne({email: req.body.email.toLowerCase(), _id: {$ne: new ObjectId(req.params.userId)}});
          if(isEmailTaken){
            errors.email = localization.translate('email already in use');
          } else {
            user.email = req.body.email.toLowerCase();
            shouldUpdate = true;
          }
        }
      }
      if(req.body.phone && req.body.role){
        if(['user', 'companian'].includes(req.body.role)){
          if(!Patterns.PHONE_REGEX.test(req.body.phone)){
            errors.phone = localization.translate('invalid phone number');
          } else {
            let isPhoneTaken = await User.findOne({phone: req.body.phone, _id: {$ne: new ObjectId(req.params.userId)}});
            if(isPhoneTaken){
              errors.phone = localization.translate('phone already in use');
            } else {
              user.phone = req.body.phone;
              shouldUpdate = true;
            }
          }
        }
      }
      if(req.body.company && req.body.role){
        if(req.body.role === 'companian'){
          user.company = req.body.company;
          shouldUpdate = true;
        }
      }
      if(req.body.pwd){
        if(!Patterns.PASSWORD_REGEX.test(req.body.pwd)){
          errors.pwd = localization.translate('password must contain both uppercase and lowercase characters and and numbers and should be 8 or more characters long');
        } else {
          user.createPassword(req.body.pwd);
          shouldUpdate = true;
        }
      }
      if(req.file !== undefined){
        let ext = getFileExtension(req.file.filename);
        if(!allowedImages.includes(ext)){
          errors.picture = localization.translate('only jpeg or png images are allowed');
        } else {
          let url = new URL(`${uploads_base_url}${req.file.filename}`);
          user.picture = {origin: url.origin, path: url.pathname };
          shouldUpdate = true;
        }
      }
      if(Object.keys(errors).length > 0){
        try {
          fs.unlinkSync(req.file.path);
        } catch(e){
          console.log(e);
        }
        return res.status(400).json({success: false, message: localization.translate('bad request'), errors: errors});
      } else {
        if(!shouldUpdate){
          try {
            fs.unlinkSync(req.file.path);
          } catch(e){
            console.log(e);
          }
          return res.status(200).json({success: false, message: localization.translate('nothing to update')});
        } else {
          if(user.role !== 'user'){
            user.imei = "";
          }
          if(!['user', 'companian'].includes(user.role)){
            user.phone = "";
          }
          if(user.role !== 'companian'){
            user.company = "";
          }
          let saved = await user.save();
          if(saved){
            try {
              if(saved.role === 'user'){
                saved.companians.map((usr: any) => {
                  let usock: string | null = socketsList.getSocketByUser(usr.toString());
                  if(usock !== null){
                    io.to(usock).emit(Events.USER_UPDATE, saved.json());
                  }
                });
              }
              if(saved.role === 'companian'){
                saved.companians.map((comp: any) => {
                  let csock: string | null = socketsList.getSocketByUser(comp.toString());
                  if(csock !== null){
                    io.to(csock).emit(Events.USER_UPDATE, saved.json());
                  }
                });
              }
              if(saved.role === 'manager'){
                saved.companians.map((acc: any) => {
                  let asock: string | null = socketsList.getSocketByUser(acc.toString());
                  if(asock !== null){
                    io.to(asock).emit(Events.USER_UPDATE, saved.json());
                  }
                });
              }
            } catch (e) {
              console.log(e);
            }
            return res.status(200).json({success: true, message: localization.translate('user updated successfully'), user: user});
          } else {
            try {
              fs.unlinkSync(req.file.path);
            } catch(e){
              console.log(e);
            }
            return res.status(500).json({success: false, message: localization.translate('internel server error')});
          }
        }
      }
    }
  }
}

export async function deleteUser(req: Request, res: Response): Promise<any> {
  if(!req.params.userId){
    return res.status(400).json({success: false, message: localization.translate('userId is missing')});
  } else {
    let user = await User.findOne({_id: req.params.userId, delete: false});
    if(user){
      user.delete = true;
      let saved = await user.save();
      if(saved){
        return res.status(200).json({success: true, message: localization.translate('user deleted successfully')});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    } else {
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    }
  }
}

export async function undeleteUser(req: Request, res: Response): Promise<any> {
  if(!req.params.userId){
    return res.status(400).json({success: false, message: localization.translate('userId is missing')});
  } else {
    let user = await User.findOne({_id: req.params.userId});
    if(user){
      user.delete = false;
      let saved = await user.save();
      if(saved){
        return res.status(200).json({success: true, message: localization.translate('user undeleted successfully')});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    } else {
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    }
  }
}

/*
 * Users section ended
 */

/*
 * Companians section started
 */

// export async function getCompanians(req: Request, res: Response): Promise<any> {
//   let obj: { [key: string]: any; } = {};
//   if(!req.query.all){
//     obj.delete = false;
//   }
//   let companians = await Companian.find(obj);
//   if(companians){
//     return res.status(200).json({success: true, companians: companians});
//   } else {
//     return res.status(500).json({success: false, message: localization.translate('internel server error')});
//   }
// }

// export async function getCompanianById(req: Request, res: Response): Promise<any> {
//   if(!req.params.companianId){
//     return res.status(400).json({success: false, message: localization.translate('companianId is missing')});
//   } else {
//     let obj: { [key: string]: any; } = {
//       _id: req.params.companianId,
//       delete: false
//     };
//     if(req.query.delete){
//       obj.delete = true;
//     }
//     let companian = await Companian.findOne(obj);
//     if(companian){
//       return res.status(200).json({success: true, companian: companian});
//     } else {
//       return res.status(500).json({success: false, message: localization.translate('internel server error')});
//     }
//   }
// }

// export async function getMyUsers(req: Request, res: Response): Promise<any> {
//   let users = await req.auth.getUsers();
//   if(users){
//     return res.status(200).json({success: true, users: users});
//   } else {
//     return res.status(500).json({success: false, message: localization.translate('internel server error')});
//   }
// }

// export async function addCompanian(req: Request, res: Response): Promise<any> {
//   if(!req.body.firstname || !req.body.lastname || !req.body.phone || !req.body.email || !req.body.pwd){
//     try {
//       fs.unlinkSync(req.file.path);
//     } catch(e){
//       console.log(e);
//     }
//     return res.status(400).json({success: false, message: localization.translate('all fields are required')});
//   } else {
//     let picture: { origin: string, path: string} = { origin: '', path: '' };
//     let company: string = '';
//     let errors: {[key: string]: string; } = {};
//     if(!Patterns.ALPHA.test(req.body.firstname)){
//       errors.firstname = localization.translate('only alphabetic characters allowed');
//     }
//     if(!Patterns.ALPHA.test(req.body.lastname)){
//       errors.lastname = localization.translate('only alphabetic characters allowed');
//     }
//     if(req.body.company){
//       if(!Patterns.ALPHA.test(req.body.company)){
//         errors.company = localization.translate('only alphabetic characters allowed');
//       } else {
//         company = req.body.company;
//       }
//     }
//     if(!Patterns.EMAIL_REGEX.test(req.body.email)){
//       errors.email = localization.translate('invalid email address');
//     } else {
//       let c = await Companian.findOne({email: req.body.email});
//       if(c){
//         errors.email = localization.translate('email already in use');
//       }
//     }
//     if(!Patterns.PHONE_REGEX.test(req.body.phone)){
//       errors.phone = localization.translate('invalid phone number');
//     } else {
//       let c2 = await Companian.findOne({phone: req.body.phone});
//       if(c2){
//         errors.phone = localization.translate('phone number already in use');
//       }
//     }
//     if(req.file !== undefined){
//       let ext = getFileExtension(req.file.filename);
//       if(!allowedImages.includes(ext)){
//         errors.picture = localization.translate('only jpeg or png images are allowed');
//       } else {
//         let url = new URL(`${uploads_base_url}${req.file.filename}`);
//         picture.origin = url.origin;
//         picture.path = url.pathname;
//       }
//     }
//     if(!Patterns.PASSWORD_REGEX.test(req.body.pwd)){
//       errors.pwd = localization.translate('password must contain both uppercase and lowercase characters and and numbers and should be 8 or more characters long');
//     }
//     if(Object.keys(errors).length > 0){
//       try {
//         fs.unlinkSync(req.file.path);
//       } catch(e){
//         console.log(e);
//       }
//       return res.status(400).json({success: false, message: localization.translate('bad request'), errors: errors});
//     } else {
//       let companian = new Companian({firstname: req.body.firstname, lastname: req.body.lastname, phone: req.body.phone, company: company, email: req.body.email, picture: picture});
//       companian.createPassword(req.body.pwd);
//       let saved = await companian.save();
//       if(saved){
//         try {
//           let options: {[key: string]: any;} = {
//             username: req.body.email,
//             password: req.body.pwd,
//             link: "#"
//           };
//           sendMailToCompanian(companian.email, options);
//         } catch(e){
//           console.log(e);
//         }
//         return res.status(200).json({success: true, message: localization.translate('companian added successfully'), companian: companian});
//       } else {
//         try {
//           fs.unlinkSync(req.file.path);
//         } catch(e){
//           console.log(e);
//         }
//         return res.status(500).json({success: false, message: localization.translate('internel server error')});
//       }
//     }
//   }
// }

export async function addMyCompanian(req: Request, res: Response): Promise<any> {
  if(!req.body.name || !req.body.email || !req.body.phone || !req.body.pwd){
    try {
      fs.unlinkSync(req.file.path);
    } catch(e){
      console.log(e);
    }
    return res.status(400).json({success: false, message: localization.translate('all fields are required')});
  } else {
    let user = await User.findOne({_id: req.auth._id, role: 'user', delete: false});
    if(!user){
      try {
        fs.unlinkSync(req.file.path);
      } catch (e){
        console.log(e);
      }
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    } else {
      let picture: { origin: string, path: string} = { origin: '', path: '' };
      let company: string = '';
      let errors: {[key: string]: string; } = {};
      let c = await User.findOne({$or: [{phone: req.body.phone}, {email: req.body.email}]});
      if(c){
        try {
          fs.unlinkSync(req.file.path);
        } catch (e){
          console.log(e);
        }
        let userHasCompanian = true;
        let companianHasUser = true;
        let companianId = new ObjectId(c._id);
        let userId = new ObjectId(user._id);
        if(!user.companians.includes(companianId)){
          user.companians.push(companianId);
          userHasCompanian = false;
        }
        if(!c.users.includes(userId)){
          c.users.push(userId);
          companianHasUser = false;
        }
        if(userHasCompanian && companianHasUser){
          return res.status(400).json({success: false, message: localization.translate('companian already linked')});
        } else {
          let saveCompanian = await c.save();
          let saveUser = await user.save();
          if(saveCompanian && saveUser){
            try {
              sendMailToCompanian(c.email);
            } catch(e){
              console.log(e);
            }
            let obj: {[key: string]: any} = {
              user: user,
              companian: c
            };
            app.emit(Events.COMPANIAN_LINKED, obj);
            return res.status(200).json({success: true, message: localization.translate('companian linked successfully')});
          } else {
            return res.status(500).json({success: false, message: localization.translate('internel server error')});
          }
        }
      } else {
        if(req.body.company){
          company = req.body.company;
        }
        if(!Patterns.PHONE_REGEX.test(req.body.phone)){
          errors.phone = localization.translate('invalid phone number');
        } else {
          let isPhoneUsed = await User.findOne({phone: req.body.phone});
          if(isPhoneUsed){
            errors.phone = localization.translate('phone already in use');
          }
        }
        if(!Patterns.EMAIL_REGEX.test(req.body.email)){
          errors.email = localization.translate('invalid phone number');
        } else {
          let isEmailUsed = await User.findOne({email: req.body.email});
          if(isEmailUsed){
            errors.email = localization.translate('email already in use');
          }
        }
        if(req.file !== undefined){
          let ext = getFileExtension(req.file.filename);
          if(!allowedImages.includes(ext)){
            errors.picture = localization.translate('only jpeg or png images are allowed');
          } else {
            let url = new URL(`${uploads_base_url}${req.file.filename}`);
            picture.origin = url.origin;
            picture.path = url.pathname;
          }
        }
        if(!Patterns.PASSWORD_REGEX.test(req.body.pwd)){
          errors.pwd = localization.translate('password must contain both uppercase and lowercase characters and and numbers and should be 8 or more characters long');
        }
        if(Object.keys(errors).length > 0){
          try {
            fs.unlinkSync(req.file.path);
          } catch(e){
            console.log(e);
          }
          console.log(errors);
          return res.status(400).json({success: false, message: localization.translate('bad request'), errors: errors});
        } else {
          let companian = new User({name: req.body.name, role: 'companian', phone: req.body.phone, company: company, email: req.body.email, picture: picture});
          companian.users.push(new ObjectId(user._id));
          companian.createPassword(req.body.pwd);
          let saved = await companian.save();
          user.companians.push(new ObjectId(saved._id));
          let saved2 = await user.save();
          if(saved && saved2){
            try {
              let options: {[key: string]: any;} = {
                username: req.body.email,
                password: req.body.pwd,
                link: "#"
              };
              sendMailToCompanian(companian.email, options);
            } catch(e){
              console.log(e);
            }
            let obj: {[key: string]: any} = {
              user: user,
              companian: companian
            };
            app.emit(Events.COMPANIAN_LINKED, obj);
            return res.status(200).json({success: true, message: localization.translate('my companian added successfully'), companian: companian});
          } else {
            try {
              fs.unlinkSync(req.file.path);
            } catch(e){
              console.log(e);
            }
            return res.status(500).json({success: false, message: localization.translate('internel server error')});
          }
        }
      }
    }
  }
}

export async function addUserCompanian(req: Request, res: Response): Promise<any> {
  if(!req.body.name || !req.body.email || !req.body.phone || !req.body.pwd || !req.body.userId){
    try {
      fs.unlinkSync(req.file.path);
    } catch(e){
      console.log(e);
    }
    return res.status(400).json({success: false, message: localization.translate('all fields are required')});
  } else {
    let user = await User.findOne({_id: req.body.userId, role: 'user', delete: false});
    if(!user){
      try {
        fs.unlinkSync(req.file.path);
      } catch (e){
        console.log(e);
      }
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    } else {
      let picture: { origin: string, path: string} = { origin: '', path: '' };
      let company: string = '';
      let errors: {[key: string]: string; } = {};
      let c = await User.findOne({$or: [{phone: req.body.phone}, {email: req.body.email}]});
      if(c){
        try {
          fs.unlinkSync(req.file.path);
        } catch (e){
          console.log(e);
        }
        let userHasCompanian = true;
        let companianHasUser = true;
        let companianId = new ObjectId(c._id);
        let userId = new ObjectId(user._id);
        if(!user.companians.includes(companianId)){
          user.companians.push(companianId);
          userHasCompanian = false;
        }
        if(!c.users.includes(userId)){
          c.users.push(userId);
          companianHasUser = false;
        }
        if(userHasCompanian && companianHasUser){
          return res.status(400).json({success: false, message: localization.translate('companian already linked')});
        } else {
          let saveCompanian = await c.save();
          let saveUser = await user.save();
          if(saveCompanian && saveUser){
            try {
              sendMailToCompanian(c.email);
            } catch(e){
              console.log(e);
            }
            let obj: {[key: string]: any} = {
              user: user,
              companian: c
            };
            app.emit(Events.COMPANIAN_LINKED, obj);
            return res.status(200).json({success: true, message: localization.translate('companian linked successfully')});
          } else {
            return res.status(500).json({success: false, message: localization.translate('internel server error')});
          }
        }
      } else {
        if(req.body.company){
          company = req.body.company;
        }
        if(!Patterns.PHONE_REGEX.test(req.body.phone)){
          errors.phone = localization.translate('invalid phone number');
        } else {
          let isPhoneUsed = await User.findOne({phone: req.body.phone});
          if(isPhoneUsed){
            errors.phone = localization.translate('phone already in use');
          }
        }
        if(!Patterns.EMAIL_REGEX.test(req.body.email)){
          errors.email = localization.translate('invalid phone number');
        } else {
          let isEmailUsed = await User.findOne({email: req.body.email});
          if(isEmailUsed){
            errors.email = localization.translate('email already in use');
          }
        }
        if(req.file !== undefined){
          let ext = getFileExtension(req.file.filename);
          if(!allowedImages.includes(ext)){
            errors.picture = localization.translate('only jpeg or png images are allowed');
          } else {
            let url = new URL(`${uploads_base_url}${req.file.filename}`);
            picture.origin = url.origin;
            picture.path = url.pathname;
          }
        }
        if(!Patterns.PASSWORD_REGEX.test(req.body.pwd)){
          errors.pwd = localization.translate('password must contain both uppercase and lowercase characters and and numbers and should be 8 or more characters long');
        }
        if(Object.keys(errors).length > 0){
          try {
            fs.unlinkSync(req.file.path);
          } catch(e){
            console.log(e);
          }
          console.log(errors);
          return res.status(400).json({success: false, message: localization.translate('bad request'), errors: errors});
        } else {
          let companian = new User({name: req.body.name, role: 'companian', phone: req.body.phone, company: company, email: req.body.email, picture: picture});
          companian.users.push(new ObjectId(user._id));
          companian.createPassword(req.body.pwd);
          let saved = await companian.save();
          user.companians.push(new ObjectId(saved._id));
          let saved2 = await user.save();
          if(saved && saved2){
            try {
              let options: {[key: string]: any;} = {
                username: req.body.email,
                password: req.body.pwd,
                link: "#"
              };
              sendMailToCompanian(companian.email, options);
            } catch(e){
              console.log(e);
            }
            let obj: {[key: string]: any} = {
              user: user,
              companian: companian
            };
            app.emit(Events.COMPANIAN_LINKED, obj);
            return res.status(200).json({success: true, message: localization.translate('my companian added successfully'), companian: companian});
          } else {
            try {
              fs.unlinkSync(req.file.path);
            } catch(e){
              console.log(e);
            }
            return res.status(500).json({success: false, message: localization.translate('internel server error')});
          }
        }
      }
    }
  }
}

// export async function editCompanian(req: Request, res: Response): Promise<any> {
//   if(!req.params.companianId){
//     try {
//       fs.unlinkSync(req.file.path);
//     } catch(e){
//       console.log(e);
//     }
//     return res.status(400).json({success: false, message: localization.translate('companianId is missing')});
//   } else {
//     let companian = await Companian.findOne({_id: req.params.companianId, delete: false});
//     if(!companian){
//       try {
//         fs.unlinkSync(req.file.path);
//       } catch(e){
//         console.log(e);
//       }
//       return res.status(400).json({success: false, message: localization.translate('requested companian does not exists')});
//     } else {
//       let shouldUpdate: boolean = false;
//       let errors: {[key: string]: string; } = {};
//       if(req.body.firstname){
//         if(!Patterns.ALPHA.test(req.body.firstname)){
//           errors.firstname = localization.translate('only alphabetic characters allowed');
//         } else {
//           companian.firstname = req.body.firstname;
//           shouldUpdate = true;
//         }
//       }
//       if(req.body.lastname){
//         if(!Patterns.ALPHA.test(req.body.lastname)){
//           errors.lastname = localization.translate('only alphabetic characters allowed');
//         } else {
//           companian.lastname = req.body.lastname;
//           shouldUpdate = true;
//         }
//       }
//       if(req.body.company){
//         if(!Patterns.ALPHA.test(req.body.company)){
//           errors.company = localization.translate('only alphabetic characters allowed');
//         } else {
//           companian.company = req.body.company;
//           shouldUpdate = true;
//         }
//       }
//       if(req.file !== undefined){
//         let ext = getFileExtension(req.file.filename);
//         if(!allowedImages.includes(ext)){
//           errors.picture = localization.translate('only jpeg or png images are allowed');
//         } else {
//           let url = new URL(`${uploads_base_url}${req.file.filename}`);
//           companian.picture = {origin: url.origin, path: url.pathname };
//           shouldUpdate = true;
//         }
//       }
//       if(req.body.email){
//         if(!Patterns.EMAIL_REGEX.test(req.body.email)){
//           errors.email = localization.translate('invalid email address');
//         } else {
//           let c = await Companian.findOne({email: req.body.email, _id: {$ne: new ObjectId(req.params.companianId)}});
//           if(c){
//             errors.email = localization.translate('email already in use');
//           } else {
//             companian.email = req.body.email;
//             shouldUpdate = true;
//           }
//         }
//       }
//       if(req.body.phone){
//         if(!Patterns.PHONE_REGEX.test(req.body.phone)){
//           errors.phone = localization.translate('invalid phone number');
//         } else {
//           let c2 = await Companian.findOne({phone: req.body.phone, _id: {$ne: new ObjectId(req.params.companianId)}});
//           if(c2){
//             errors.phone = localization.translate('phone number already in use');
//           } else {
//             companian.phone = req.body.phone;
//             shouldUpdate = true;
//           }
//         }
//       }
//       if(req.body.pwd){
//         if(!Patterns.PASSWORD_REGEX.test(req.body.pwd)){
//           errors.pwd = localization.translate('password must contain both uppercase and lowercase characters and and numbers and should be 8 or more characters long');
//         } else {
//           companian.createPassword(req.body.pwd);
//           shouldUpdate = true;
//         }
//       }
//       if(Object.keys(errors).length > 0){
//         try {
//           fs.unlinkSync(req.file.path);
//         } catch(e){
//           console.log(e);
//         }
//         return res.status(400).json({success: false, message: localization.translate('bad request'), errors: errors});
//       } else {
//         if(!shouldUpdate){
//           try {
//             fs.unlinkSync(req.file.path);
//           } catch(e){
//             console.log(e);
//           }
//           return res.status(200).json({success: false, message: localization.translate('nothing to update')});
//         } else {
//           let saved = await companian.save();
//           if(saved){
//             return res.status(200).json({success: true, message: localization.translate('companian updated successfully'), companian: companian});
//           } else {
//             try {
//               fs.unlinkSync(req.file.path);
//             } catch(e){
//               console.log(e);
//             }
//             return res.status(500).json({success: false, message: localization.translate('internel server error')});
//           }
//         }
//       }
//     }
//   }
// }

export async function assignCompanian(req: Request, res: Response): Promise<any> {
  if(!req.body.companianId || !req.body.userId){
    return res.status(400).json({success: false, message: localization.translate('userId and companianId are missing')});
  } else {
    let errors: {[key: string]: string; } = {};
    if(!ObjectId.isValid(req.body.companianId)){
      errors.playlistId = localization.translate('companianId is invalid');
    }
    if(!ObjectId.isValid(req.body.userId)){
      errors.userId = localization.translate('userId is invalid');
    }
    if(Object.keys(errors).length > 0){
      return res.status(400).json({success: false, message: localization.translate('bad request'), errors: errors});
    } else {
      let user = await User.findOne({_id: req.body.userId, role: 'user', delete: false});
      if(!user){
        return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
      } else {
        let companian = await User.findOne({_id: req.body.companianId, role: 'companian', delete: false});
        if(!companian){
          return res.status(400).json({success: false, message: localization.translate('requested companian does not exists')});
        } else {
          let companianId = new ObjectId(companian._id);
          let userId = new ObjectId(user._id);
          if(user.companians.includes(companianId) && companian.users.includes(userId)){
            return res.status(400).json({success: false, message: localization.translate('already linked')});
          } else {
            user.companians.push(companianId);
            companian.users.push(userId);
            let savedUser = await user.save();
            let savedCompanian = await companian.save();
            if(savedUser && savedCompanian){
              let obj: {[key: string]: any} = {
                user: user,
                companian: companian
              };
              app.emit(Events.COMPANIAN_LINKED, obj);
              return res.status(200).json({success: true, message: localization.translate('companian added successfully')});
            } else {
              return res.status(500).json({success: false, message: localization.translate('internel server error')});
            }
          }
        }
      }
    }
  }
}

export async function grantAccess(req: Request, res: Response): Promise<any> {
  if(!req.body.accessId || !req.body.managerId){
    return res.status(400).json({success: false, message: localization.translate('managerId and accessId are missing')});
  } else {
    let errors: {[key: string]: string; } = {};
    if(!ObjectId.isValid(req.body.accessId)){
      errors.accessId = localization.translate('accessId is invalid');
    }
    if(!ObjectId.isValid(req.body.managerId)){
      errors.managerId = localization.translate('managerId is invalid');
    }
    if(Object.keys(errors).length > 0){
      return res.status(400).json({success: false, message: localization.translate('bad request'), errors: errors});
    } else {
      let manager = await User.findOne({_id: req.body.managerId, role: 'manager', delete: false});
      if(!manager){
        return res.status(400).json({success: false, message: localization.translate('requested manager does not exists')});
      } else {
        let access = await User.findOne({_id: req.body.accessId, role: 'user', delete: false});
        if(!access){
          return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
        } else {
          let managerId = new ObjectId(manager._id);
          let accessId = new ObjectId(access._id);
          if(manager.access.includes(accessId) && access.access.includes(managerId)){
            return res.status(400).json({success: false, message: localization.translate('already linked')});
          } else {
            manager.access.push(accessId);
            access.access.push(managerId);
            let savedUser = await manager.save();
            let savedCompanian = await access.save();
            if(savedUser && savedCompanian){
                let obj: {[key: string]: any} = {
                  user: access,
				  manager: manager
                };
                app.emit(Events.MANAGER_LINKED, obj);
              return res.status(200).json({success: true, message: localization.translate('access granted successfully')});
            } else {
              return res.status(500).json({success: false, message: localization.translate('internel server error')});
            }
          }
        }
      }
    }
  }
}

export async function unlinkCompanian(req: Request, res: Response): Promise<any> {
  if(!req.body.companianId || !req.body.userId){
    return res.status(400).json({success: false, message: localization.translate('userId and companianId are missing')});
  } else {
    let errors: {[key: string]: string; } = {};
    if(!ObjectId.isValid(req.body.companianId)){
      errors.playlistId = localization.translate('companianId is invalid');
    }
    if(!ObjectId.isValid(req.body.userId)){
      errors.userId = localization.translate('userId is invalid');
    }
    if(Object.keys(errors).length > 0){
      return res.status(400).json({success: false, message: localization.translate('bad request'), errors: errors});
    } else {
      let user = await User.findOne({_id: req.body.userId, role: 'user', delete: false});
      if(!user){
        return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
      } else {
        let companian = await User.findOne({_id: req.body.companianId, role: 'companian', delete: false});
        if(!companian){
          return res.status(400).json({success: false, message: localization.translate('requested companian does not exists')});
        } else {
          let companianId = new ObjectId(companian._id);
          let userId = new ObjectId(user._id);
          if(!user.companians.includes(companianId) || !companian.users.includes(userId)){
            return res.status(400).json({success: false, message: localization.translate('already unlinked')});
          } else {
            user.companians.splice(user.companians.indexOf(companianId), 1);
            companian.users.splice(companian.users.indexOf(userId), 1);
            let savedUser = await user.save();
            let savedCompanian = await companian.save();
            if(savedUser && savedCompanian){
              return res.status(200).json({success: true, message: localization.translate('companian removed successfully')});
            } else {
              return res.status(500).json({success: false, message: localization.translate('internel server error')});
            }
          }
        }
      }
    }
  }
}

export async function denyAccess(req: Request, res: Response): Promise<any> {
  if(!req.body.accessId || !req.body.managerId){
    return res.status(400).json({success: false, message: localization.translate('accessId and managerId are missing')});
  } else {
    let errors: {[key: string]: string; } = {};
    if(!ObjectId.isValid(req.body.accessId)){
      errors.accessId = localization.translate('accessId is invalid');
    }
    if(!ObjectId.isValid(req.body.managerId)){
      errors.managerId = localization.translate('managerId is invalid');
    }
    if(Object.keys(errors).length > 0){
      return res.status(400).json({success: false, message: localization.translate('bad request'), errors: errors});
    } else {
      let manager = await User.findOne({_id: req.body.managerId, role: 'manager', delete: false});
      if(!manager){
        return res.status(400).json({success: false, message: localization.translate('requested manager does not exists')});
      } else {
        let access = await User.findOne({_id: req.body.accessId, role: 'user', delete: false});
        if(!access){
          return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
        } else {
          let managerId = new ObjectId(manager._id);
          let accessId = new ObjectId(access._id);
          if(!manager.access.includes(accessId) || !access.access.includes(managerId)){
            return res.status(400).json({success: false, message: localization.translate('already unlinked')});
          } else {
            manager.access.splice(manager.access.indexOf(accessId), 1);
            access.access.splice(access.access.indexOf(managerId), 1);
            let savedUser = await manager.save();
            let savedCompanian = await access.save();
            if(savedUser && savedCompanian){
              return res.status(200).json({success: true, message: localization.translate('access denied successfully')});
            } else {
              return res.status(500).json({success: false, message: localization.translate('internel server error')});
            }
          }
        }
      }
    }
  }
}

// export async function deleteCompanian(req: Request, res: Response): Promise<any> {
//   if(!req.params.companianId){
//     return res.status(400).json({success: false, message: localization.translate('companianId is missing')});
//   } else {
//     let companian = await Companian.findOne({_id: req.params.companianId, delete: false});
//     if(companian){
//       companian.delete = true;
//       let saved = await companian.save();
//       if(saved){
//         return res.status(200).json({success: true, message: localization.translate('companian deleted successfully')});
//       } else {
//         return res.status(500).json({success: false, message: localization.translate('internel server error')});
//       }
//     } else {
//       return res.status(400).json({success: false, message: localization.translate('requested companian does not exists')});
//     }
//   }
// }

/*
 * Companians section ended
 */

/*
 * Permissions section started
 */

export async function getPermissions(req: Request, res: Response): Promise<any> {
  let obj: { [key: string]: any; } = {};
  if(!req.query.all){
    obj.delete = false;
  }
  let permissions = await Permission.find(obj);
  if(permissions){
    return res.status(200).json({success: true, permissions: permissions});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getPermissionById(req: Request, res: Response): Promise<any> {
  if(!req.params.permissionId){
    return res.status(400).json({success: false, message: localization.translate('permissionId is missing')});
  } else {
    let obj: { [key: string]: any; } = {
      _id: req.params.permissionId,
      delete: false
    };
    if(req.query.delete){
      obj.delete = true;
    }
    let permission = await Permission.findOne(obj);
    if(permission){
      return res.status(200).json({success: true, permission: permission});
    } else {
      return res.status(500).json({success: false, message: localization.translate('internel server error')});
    }
  }
}

export async function addPermission(req: Request, res: Response): Promise<any> {
  if(!req.body.name || !req.body.url || !req.body.method){
    return res.status(400).json({success: false, message: localization.translate('please fill all fields')});
  } else {
    let errors: {[key: string]: string; } = {};
    if(!Patterns.SITE_URL_REGEX.test(req.body.url)){
      errors.url = localization.translate('url is not valid');
    }
    if(!['GET', 'POST', 'HEAD', 'PUT', 'DELETE', 'PATCH'].includes(req.body.method.toUpperCase())){
      errors.method = localization.translate('method is not valid');
    }
    if(Object.keys(errors).length > 0){
      return res.status(400).json({success: false, message: localization.translate('bad request'), errors: errors});
    } else {
      let permission = new Permission({name: req.body.name, url: req.body.url, method: req.body.method.toUpperCase()});
      let saved = await permission.save();
      if(saved){
        return res.status(200).json({success: true, message: localization.translate('permission added successfully'), permission: permission});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

export async function editPermission(req: Request, res: Response): Promise<any> {
  if(!req.params.permissionId){
    return res.status(400).json({success: false, message: localization.translate('permissionId is required')});
  } else {
    let permission = await Permission.findOne({_id: req.params.permissionId, delete: false});
    if(!permission){
      return res.status(400).json({success: false, message: localization.translate('requested permission does not exists')});
    } else {
      let shouldUpdate: boolean = false;
      let errors : {[key: string]: string; } = {};
      if(req.body.name){
        permission.name = req.body.name;
        shouldUpdate = true;
      }
      if(req.body.url){
        if(!Patterns.SITE_URL_REGEX.test(req.body.url)){
          errors.url = localization.translate('url is not valid');
        } else {
          permission.url = req.body.url;
          shouldUpdate = true;
        }
      }
      if(req.body.method){
        if(!['GET', 'POST', 'HEAD', 'PUT', 'DELETE', 'PATCH'].includes(req.body.method.toUpperCase())){
          errors.method = localization.translate('method is not valid');
        } else {
          permission.method = req.body.method.toUpperCase();
          shouldUpdate = true;
        }
      }
      if(Object.keys(errors).length > 0){
        return res.status(400).json({success: false, message: localization.translate('bad request'), errors: errors});
      } else {
        if(!shouldUpdate){
          return res.status(200).json({success: false, message: localization.translate('nothing to update')});
        } else {
          let saved = await permission.save();
          if(saved){
            return res.status(200).json({success: true, message: localization.translate('permission updated successfully'), permission: permission});
          } else {
            return res.status(500).json({success: false, message: localization.translate('internel server error')});
          }
        }
      }
    }
  }
}

export async function grantPermissions(req: Request, res: Response): Promise<any> {
  if(!req.body.userId || !req.body.permissionIds){
    return res.status(400).json({success: false, message: localization.translate('please fill all fields')});
  } else {
    let errors: {[key: string]: string; } = {};
    if(!ObjectId.isValid(req.body.userId)){
      errors.userId = localization.translate('userId is invalid');
    }
    if(!Array.isArray(req.body.permissionIds)){
      errors.permissionIds = localization.translate('permissionIds should be array');
    } else {
      let filtered: any = req.body.permissionIds.filter((pId: string) => !ObjectId.isValid(pId));
      if(filtered.length > 0){
        errors.permissionIds = localization.translate('permissionIds contains invalid data');
      }
    }
    if(Object.keys(errors).length > 0){
      return res.status(400).json({success: false, message: localization.translate('bad request'), errors: errors});
    } else {
      let user = await User.findOne({_id: req.body.userId, delete: false});
      if(!user){
        return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
      } else {
        let permissionIds = req.body.permissionIds.map((pId: string) => new ObjectId(pId));
        user.permissions.splice(0, user.permissions.length);
        user.permissions.push(...permissionIds);
        let saved = await user.save();
        if(saved){
          return res.status(200).json({success: true, message: localization.translate('permissions granted successfully')});
        } else {
          return res.status(500).json({success: false, message: localization.translate('internel server error')});
        }
      }
    }
  }
}

export async function deletePermission(req: Request, res: Response): Promise<any> {
  if(!req.params.permissionId){
    return res.status(400).json({success: false, message: localization.translate('permissionId is missing')});
  } else {
    let permission = await Permission.findOne({_id: req.params.permissionId, delete: false});
    if(!permission){
      return res.status(400).json({success: false, message: localization.translate('requested permission does not exists')});
    } else {
      permission.delete = true;
      let saved = await permission.save();
      if(saved){
        return res.status(200).json({success: true, message: localization.translate('permission removed successfully')});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

/*
 * Permissions section ended
 */

/*
 * Medias section started
 */

export async function getMedias(req: Request, res: Response): Promise<any> {
  let obj: { [key: string]: any; } = {};
  if(!req.query.all){
    obj.delete = false;
  }
  let medias = await Media.find(obj);
  if(medias){
    return res.status(200).json({success: true, medias: medias});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getMediaById(req: Request, res: Response): Promise<any> {
  if(!req.params.mediaId){
    return res.status(400).json({success: false, message: localization.translate('mediaId is missing')});
  } else {
    let obj: { [key: string]: any; } = {
      _id: req.params.mediaId,
      delete: false
    };
    if(req.query.delete){
      obj.delete = true;
    }
    let media = await Media.findOne(obj);
    if(media){
      return res.status(200).json({success: true, media: media});
    } else {
      return res.status(500).json({success: false, message: localization.translate('internel server error')});
    }
  }
}

export async function addMedia(req: Request, res: Response): Promise<any> {
  let files: {[key: string]: any } = req.files;
  if(!files.media || !files.media.length){
    return res.status(400).json({success: false, message: localization.translate('media not found')});
  } else {
    let mediaFile = files.media[0];
    let ext: string = getFileExtension(mediaFile.filename);
    if(!allowedMediaTypes.includes(ext)){
      try {
        fs.unlinkSync(mediaFile.path);
        if(files.albumart && files.albumart.length){
          fs.unlinkSync(files.albumart[0].path);
        }
      } catch(e){
        console.log(e);
      }
      return res.status(400).json({success: false, message: localization.translate('only mp3 files are allowed yet')});
    } else {
      let url = new URL(`${uploads_base_url}${mediaFile.filename}`);
      let media = new Media({url: {origin: url.origin, path: url.pathname}});
      if(req.body.override){
        if(req.body.title){
          media.title = req.body.title;
        }
        if(req.body.artist){
          media.artist = req.body.artist.split(",");
        }
        if(req.body.albumartist){
          media.albumartist = req.body.albumartist.split(",");
        }
        if(req.body.album){
          media.album = req.body.album;
        }
        if(req.body.year){
          media.year = req.body.year;
        }
        if(req.body.genre){
          media.genre = req.body.genre.split(",");
        }
        if(files.albumart && files.albumart.length){
          let nPicture = files.albumart[0];
          let url3 = new URL(`${uploads_base_url}${nPicture.filename}`);
          media.picture = {origin: url3.origin, path: url3.pathname};
        }
      } else {
        try {
          let data = await readMusicMetaData(fs.createReadStream(mediaFile.path));
          if(data.title){
            media.title = data.title;
          }
          if(data.artist.length){
            media.artist = data.artist;
          }
          if(data.albumartist.length){
            media.albumartist = data.albumartist;
          }
          if(data.album){
            media.album = data.album;
          }
          if(data.year){
            media.year = data.year;
          }
          if(data.genre.length){
            media.genre = data.genre;
          }
          if(data.picture.length){
            let picture = data.picture[0];
            let filename = "_" + Date.now().toString() + ".jpg";
            if(!fs.existsSync(path.join(uploadsDir + `/${filename}`))){
              let url2 = new URL(`${uploads_base_url}${filename}`);
              media.picture = {origin: url2.origin, path: url2.pathname};
              let stream = fs.createWriteStream(path.join(uploadsDir + `/${filename}`));
              stream.once('open', function(fd){
                stream.write(picture.data);
              });
            }
          }
        } catch (e){
          media.title = path.parse(mediaFile.path).name;
        }
      }
      let savedMedia = await media.save();
      if(savedMedia){
        return res.status(200).json({success: true, message: localization.translate('media created successfully'), media: media});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

export async function addMediaToPlaylist(req: Request, res: Response): Promise<any> {
  let files: {[key: string]: any } = req.files;
  if(!files.media || !files.media.length || !req.body.playlist){
    try {
      fs.unlinkSync(files.media.path);
    } catch(e){
      console.log(e);
    }
    return res.status(400).json({success: false, message: localization.translate('media not found')});
  } else {
    let playlist = await Playlist.findOne({_id: req.body.playlist, delete: false});
    if(!playlist){
      try {
        fs.unlinkSync(files.media.path);
      } catch(e){
        console.log(e);
      }
      return res.status(400).json({success: false, message: localization.translate('requested playlist does not exists')});
    } else {
      let mediaFile = files.media[0];
      let ext: string = getFileExtension(mediaFile.filename);
      if(!allowedMediaTypes.includes(ext)){
        try {
          fs.unlinkSync(mediaFile.path);
          if(files.albumart && files.albumart.length){
            fs.unlinkSync(files.albumart[0].path);
          }
        } catch(e){
          console.log(e);
        }
        return res.status(400).json({success: false, message: localization.translate('only mp3 files are allowed yet')});
      } else {
        let url = new URL(`${uploads_base_url}${mediaFile.filename}`);
        let media = new Media({url: {origin: url.origin, path: url.pathname}});
        if(req.body.override){
          if(req.body.title){
            media.title = req.body.title;
          }
          if(req.body.artist){
            media.artist = req.body.artist.split(",");
          }
          if(req.body.albumartist){
            media.albumartist = req.body.albumartist.split(",");
          }
          if(req.body.album){
            media.album = req.body.album;
          }
          if(req.body.year){
            media.year = req.body.year;
          }
          if(req.body.genre){
            media.genre = req.body.genre.split(",");
          }
          if(files.albumart && files.albumart.length){
            let nPicture = files.albumart[0];
            let url3 = new URL(`${uploads_base_url}${nPicture.filename}`);
            media.picture = {origin: url3.origin, path: url3.pathname};
          }
        } else {
          try {
            let data = await readMusicMetaData(fs.createReadStream(mediaFile.path));
            if(data.title){
              media.title = data.title;
            }
            if(data.artist.length){
              media.artist = data.artist;
            }
            if(data.albumartist.length){
              media.albumartist = data.albumartist;
            }
            if(data.album){
              media.album = data.album;
            }
            if(data.year){
              media.year = data.year;
            }
            if(data.genre.length){
              media.genre = data.genre;
            }
            if(data.picture.length){
              let picture = data.picture[0];
              let filename = "_" + Date.now().toString() + ".jpg";
              if(!fs.existsSync(path.join(uploadsDir + `/${filename}`))){
                let url2 = new URL(`${uploads_base_url}${filename}`);
                media.picture = {origin: url2.origin, path: url2.pathname};
                let stream = fs.createWriteStream(path.join(uploadsDir + `/${filename}`));
                stream.once('open', function(fd){
                  stream.write(picture.data);
                });
              }
            }
          } catch (e){
            media.title = path.parse(mediaFile.path).name;
          }
        }
        let savedMedia = await media.save();
        playlist.items.push(new ObjectId(savedMedia._id));
        let saved2 = await playlist.save();
        if(savedMedia && saved2){
          return res.status(200).json({success: true, message: localization.translate('media created successfully'), media: media});
        } else {
          return res.status(500).json({success: false, message: localization.translate('internel server error')});
        }
      }
    }
  }
}

export async function assignMedia(req: Request, res: Response): Promise<any> {
  if(!req.body.playlistId || !req.body.mediaId){
    return res.status(400).json({success: false, message: localization.translate('mediaId and playlistId are missing')});
  } else {
    let playlist = await Playlist.findOne({_id: req.body.playlistId, delete: false});
    if(!playlist){
      return res.status(400).json({success: false, message: localization.translate('requested playlist does not exists')});
    } else {
      let media = await Media.findOne({_id: req.body.mediaId, delete: false});
      if(!media){
        return res.status(400).json({success: false, message: localization.translate('requested media does not exists')});
      } else {
        let mediaId = new ObjectId(media._id);
        if(playlist.items.includes(mediaId)){
          return res.status(400).json({success: false, message: localization.translate('already linked')});
        } else {
          playlist.items.push(new ObjectId(media._id));
          let saved = await playlist.save();
          if(saved){
            return res.status(200).json({success: true, message: localization.translate('media added to playlist successfully')});
          } else {
            return res.status(500).json({success: false, message: localization.translate('internel server error')});
          }
        }
      }
    }
  }
}

export async function deleteMedia(req: Request, res: Response): Promise<any> {
  if(!req.params.mediaId){
    return res.status(400).json({success: false, message: localization.translate('mediaId is missing')});
  } else {
    let media = await Media.findOne({_id: req.params.mediaId, delete: false});
    if(!media){
      return res.status(400).json({success: false, message: localization.translate('request media does not exists')});
    } else {
      media.delete = true;
      let saved = await media.save();
      if(saved){
        return res.status(200).json({success: true, message: localization.translate('media deleted successfully')});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

/*
 * Medias section ended
 */

/*
 * Playlists section started
 */

export async function getPlaylists(req: Request, res: Response): Promise<any> {
  let obj: { [key: string]: any; } = {};
  if(!req.query.all){
    obj.delete = false;
  }
  let playlists = await Playlist.find(obj);
  if(playlists){
    return res.status(200).json({success: true, playlists: playlists});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getPlaylistById(req: Request, res: Response): Promise<any> {
  if(!req.params.playlistId){
    return res.status(400).json({success: false, message: localization.translate('playlistId is missing')});
  } else {
    let obj: { [key: string]: any; } = {
      _id: req.params.playlistId,
      delete: false
    };
    if(req.query.delete){
      obj.delete = true;
    }
    let playlist = await Playlist.findOne(obj);
    if(playlist){
      return res.status(200).json({success: true, playlist: playlist});
    } else {
      return res.status(500).json({success: false, message: localization.translate('internel server error')});
    }
  }
}

export async function getPlaylistItems(req: Request, res: Response): Promise<any> {
  if(!req.params.playlistId){
    return res.status(400).json({success: false, message: localization.translate('playlistId is missing')});
  } else {
    let playlist = await Playlist.findOne({_id: req.params.playlistId, delete: false});
    if(!playlist){
      return res.status(400).json({success: false, message: localization.translate('requested playlist does not exists')});
    } else {
      let items = await playlist.getItems();
      if(items){
        return res.status(200).json({success: true, items: items});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

export async function addPlaylist(req: Request, res: Response): Promise<any> {
  if(!req.body.playlist){
    return res.status(400).json({success: false, message: localization.translate('playlist name is required')});
  } else {
    let playlist = new Playlist({name: req.body.playlist});
    let saved = await playlist.save();
    if(saved){
      return res.status(200).json({success: true, message: localization.translate('playlist added successfully'), playlist: playlist});
    } else {
      return res.status(500).json({success: localization.translate('internel server error')});
    }
  }
}

export async function addMyPlaylist(req: Request, res: Response): Promise<any> {
  if(!req.body.playlist){
    return res.status(400).json({success: false, message: localization.translate('playlist name is required')});
  } else {
    let user = await User.findOne({_id: req.auth._id, delete: false});
    if(!user){
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    } else {
      let playlist = new Playlist({name: req.body.playlist});
      let saved = await playlist.save();
      user.playlists.push(new ObjectId(saved._id));
      let saved2 = await user.save();
      if(saved && saved2){
        return res.status(200).json({success: true, message: localization.translate('playlist added successfully'), playlist: playlist});
      } else {
        return res.status(500).json({success: localization.translate('internel server error')});
      }
    }
  }
}

export async function addUserPlaylist(req: Request, res: Response): Promise<any> {
  if(!req.body.playlist || !req.body.userId){
    return res.status(400).json({success: false, message: localization.translate('playlist name is required')});
  } else {
    let user = await User.findOne({_id: req.body.userId, delete: false});
    if(!user){
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    } else {
      let playlist = new Playlist({name: req.body.playlist});
      let saved = await playlist.save();
      user.playlists.push(new ObjectId(saved._id));
      let saved2 = await user.save();
      if(saved && saved2){
        return res.status(200).json({success: true, message: localization.translate('playlist added successfully'), playlist: playlist});
      } else {
        return res.status(500).json({success: localization.translate('internel server error')});
      }
    }
  }
}

export async function editPlaylist(req: Request, res: Response): Promise<any> {
  if(!req.params.playlistId){
    return res.status(400).json({success: false, message: localization.translate('playlistId is missing')});
  } else {
    let playlist = await Playlist.findOne({_id: req.params.playlistId, delete: false});
    if(!playlist){
      return res.status(400).json({success: false, message: localization.translate('requested playlist does not exists')});
    } else {
      let shouldUpdate: boolean = false;
      if(req.body.playlist){
        playlist.name = req.body.playlist;
        shouldUpdate = true;
      }
      if(!shouldUpdate){
        return res.status(200).json({success: false, message: localization.translate('nothing to update')});
      } else {
        let saved = await playlist.save();
        if(saved){
          return res.status(200).json({success: true, message: localization.translate('playlist updated successfully'), playlist: playlist});
        } else {
          return res.status(500).json({success: false, message: localization.translate('internel server error')});
        }
      }
    }
  }
}

export async function assignPlaylist(req: Request, res: Response): Promise<any> {
  if(!req.body.playlistId || !req.body.userId){
    return res.status(400).json({success: false, message: localization.translate('userId and playlistId are missing')});
  } else {
    let user = await User.findOne({_id: req.body.userId, delete: false});
    if(!user){
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    } else {
      let playlist = await Playlist.findOne({_id: req.body.playlistId, delete: false});
      if(!playlist){
        return res.status(400).json({success: false, message: localization.translate('requested playlist does not exists')});
      } else {
        let playlistId = new ObjectId(playlist._id);
        if(user.playlists.includes(playlistId)){
          return res.status(400).json({success: false, message: localization.translate('already linked')});
        } else {
          user.playlists.push(new ObjectId(playlist._id));
          let saved = await user.save();
          if(saved){
            return res.status(200).json({success: true, message: localization.translate('playlist added successfully')});
          } else {
            return res.status(500).json({success: false, message: localization.translate('internel server error')});
          }
        }
      }
    }
  }
}

export async function deletePlaylist(req: Request, res: Response): Promise<any> {
  if(!req.params.playlistId){
    return res.status(400).json({success: false, message: localization.translate('playlistId is missing')});
  } else {
    let playlist = await Playlist.findOne({_id: req.params.playlistId, delete: false});
    if(!playlist){
      return res.status(400).json({success: false, message: localization.translate('request playlist does not exists')});
    } else {
      playlist.delete = true;
      let saved = await playlist.save();
      if(saved){
        return res.status(200).json({success: true, message: localization.translate('playlist deleted successfully')});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

/*
 * Playlists section ended
 */

/*
 * Sessions section started
 */

export async function getSessions(req: Request, res: Response): Promise<any> {
  let sessions = await Session.find({});
  if(sessions){
    return res.status(200).json({success: true, sessions: sessions});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getSessionById(req: Request, res: Response): Promise<any> {
  if(!req.params.sessionId){
    return res.status(400).json({success: false, message: localization.translate('sessionId is missing')});
  } else {
    let obj: { [key: string]: any; } = {
      _id: req.params.sessionId
    };
    let session = await Session.findOne(obj);
    if(session){
      return res.status(200).json({success: true, session: session});
    } else {
      return res.status(500).json({success: false, message: localization.translate('internel server error')});
    }
  }
}

/*
 * Sessions section ended
 */

/*
 * Questions section started
 */

export async function getQuestions(req: Request, res: Response): Promise<any> {
  let obj: {[key:string]: any; } = {};
  if(!req.query.all){
    obj.delete = false;
  }
  let questions = await Question.find(obj);
  if(questions){
    return res.status(200).json({success: true, questions: questions});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getMyRandomQuestion(req: Request, res: Response): Promise<any> {
  let d = new Date();
  let answers = await Answer.find({user: req.auth._id, date: d.toJSON().substr(0,10), delete: false});
  if(answers && answers.length > 2){
    return res.status(200).json({success: false, message: localization.translate('no more questions for today')});
  } else {
    let answers = await Answer.find({user: req.auth._id, delete: false});
    if(answers){
      let ids = answers.map(answer => new ObjectId(answer.question));
      let question = await Question.aggregate([{$match: {$and: [{$or: [{users: { $size: 0 }, active: true, delete: false}, { users: new ObjectId(req.auth._id), active: true, delete: false}]}, {_id: { $not: { $in: ids}}}]}},{$sample: {size: 1}}]);
      if(question){
        if(question.length){
          return res.status(200).json({success: true, question: question});
        } else {
          return res.status(200).json({success: false, message: localization.translate('no more questions for today')});
        }
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    } else {
      return res.status(500).json({success: false, message: localization.translate('internel server error')});
    }
  }
}

export async function getQuestionById(req: Request, res: Response): Promise<any> {
  if(!req.params.questionId){
    return res.status(400).json({success: false, message: localization.translate('questionId is missing')});
  } else {
    let obj: { [key: string]: any; } = {
      _id: req.params.questionId
    };
    if(!req.query.all){
      obj.delete = false;
    }
    let question = await Question.findOne(obj);
    if(question){
      return res.status(200).json({success: true, question: question});
    } else {
      return res.status(500).json({success: false, message: localization.translate('internel server error')});
    }
  }
}

export async function addQuestion(req: Request, res: Response): Promise<any> {
  if(!req.body.question){
    return res.status(200).json({success: false, message: localization.translate('question is required')});
  } else {
    let question = new Question({text: req.body.question});
    let saved = await question.save();
    if(saved){
      return res.status(200).json({success: true, message: localization.translate('question added successfully'), question: question})
    } else {
      return res.status(500).json({success: false, message: localization.translate('internel server error')});
    }
  }
}

export async function addMyQuestion(req: Request, res: Response): Promise<any> {
  if(!req.body.question){
    return res.status(200).json({success: false, message: localization.translate('question is required')});
  } else {
    let question = new Question({text: req.body.question});
    question.users.push(new ObjectId(req.auth._id));
    let saved = await question.save();
    req.auth.questions.push(new ObjectId(saved._id));
    let saved2 = await req.auth.save();
    if(saved && saved2){
      return res.status(200).json({success: true, message: localization.translate('question added successfully'), question: question})
    } else {
      return res.status(500).json({success: false, message: localization.translate('internel server error')});
    }
  }
}

export async function addUserQuestion(req: Request, res: Response): Promise<any> {
  if(!req.body.question || !req.body.userId){
    return res.status(200).json({success: false, message: localization.translate('question is required')});
  } else {
    let user = await User.findOne({_id: req.body.userId, delete: false});
    if(!user){
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    } else {
      let question = new Question({text: req.body.question});
      question.users.push(new ObjectId(user._id));
      let saved = await question.save();
      user.questions.push(new ObjectId(saved._id));
      let saved2 = await user.save();
      if(saved && saved2){
        return res.status(200).json({success: true, message: localization.translate('question added successfully'), question: question})
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

export async function editQuestion(req: Request, res: Response): Promise<any> {
  if(!req.params.questionId){
    return res.status(400).json({success: false, message: localization.translate('questionId is missing')});
  } else {
    let question = await Question.findOne({_id: req.params.questionId, delete: false});
    if(!question){
      return res.status(400).json({success: false, message: localization.translate('requested question does not exists')});
    } else {
      let shouldUpdate: boolean = false;
      if(req.body.question){
        question.text = req.body.question;
        shouldUpdate = true;
      }
      if(req.body.hasOwnProperty('active')){
        if(typeof req.body.active === 'boolean'){
          question.active = req.body.active;
          shouldUpdate = true;
        }
      }
      if(!shouldUpdate){
        return res.status(200).json({success: false, message: localization.translate('nothing to update')});
      } else {
        let saved = await question.save();
        if(saved){
          return res.status(200).json({success: true, message: localization.translate('question updated successfully'), question: question});
        } else {
          return res.status(500).json({success: false, message: localization.translate('internel server error')});
        }
      }
    }
  }
}

export async function assignQuestion(req: Request, res: Response): Promise<any> {
  if(!req.body.userId || !req.body.questionId){
    return res.status(400).json({success: false, message: localization.translate('userId and questionId are missing')});
  } else {
    let user = await User.findOne({_id: req.body.userId, delete: false});
    if(!user){
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    } else {
      let question = await Question.findOne({_id: req.body.questionId, delete: false});
      if(!question){
        return res.status(400).json({success: false, message: localization.translate('requested question does not exists')});
      } else {
        let questionId = new ObjectId(question._id);
        let userId = new ObjectId(user._id);
        if(user.questions.includes(questionId) && question.users.includes(userId)){
          return res.status(400).json({success: false, message: localization.translate('already linked')});
        } else {
          if(!user.questions.includes(questionId)){
            user.questions.push(questionId);
          }
          if(!question.users.includes(userId)){
            question.users.push(userId);
          }
          let saved = await user.save();
          let saved2 = await question.save();
          if(saved && saved2){
            return res.status(200).json({success: true, message: localization.translate('question linked successfully')});
          } else {
            return res.status(500).json({success: false, message: localization.translate('internel server error')});
          }
        }
      }
    }
  }
}

export async function deleteQuestion(req: Request, res: Response): Promise<any> {
  if(!req.params.questionId){
    return res.status(400).json({success: false, message: localization.translate('questionId is missing')});
  } else {
    let question = await Question.findOne({_id: req.params.questionId, delete: false});
    if(!question){
      return res.status(400).json({success: false, message: localization.translate('requested question does not exists')});
    } else {
      question.delete = true;
      let saved = await question.save();
      if(saved){
        return res.status(200).json({success: true, message: localization.translate('question deleted successfully')});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

/*
 * Questions section ended
 */

/*
 * Answers section started
 */

export async function getAnswers(req: Request, res: Response): Promise<any> {
  let obj: { [key: string]: any; } = {};
  if(!req.query.all){
    obj.delete = false;
  }
  let answers = await Answer.find(obj);
  if(answers){
    return res.status(200).json({success: true, answers: answers});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getAnswerById(req: Request, res: Response): Promise<any> {
  if(!req.params.answerId){
    return res.status(400).json({success: false, message: localization.translate('answerId is missing')});
  } else {
    let obj: { [key: string]: any; } = {
      _id: req.params.answerId
    };
    if(!req.query.all){
      obj.delete = false;
    }
    let answer = await Answer.findOne(obj);
    if(answer){
      return res.status(200).json({success: true, answer: answer});
    } else {
      return res.status(500).json({success: false, message: localization.translate('internel server error')});
    }
  }
}

export async function answerRandomQuestion(req: Request, res: Response): Promise<any> {
  if(!req.body.answer && !req.body.questionId){
    return res.status(400).json({success: false, message: localization.translate('all fields are required')});
  } else {
    let d = new Date();
    let answers = await Answer.find({user: req.auth._id, date: d.toJSON().substr(0,10), delete: false});
    if(answers && answers.length > 2){
      return res.status(200).json({success: false, message: localization.translate('you\'ve answered all the questions for today')});
    } else {
      let question = await Question.findOne({_id: new ObjectId(req.body.questionId), delete: false});
      if(!question){
        return res.status(400).json({success: false, message: localization.translate('requested question does not exists')});
      } else {
        let d = new Date();
        let answer = new Answer({text: req.body.answer, question: new ObjectId(question._id), user: req.auth._id, time: d.getTime(), date: d.toJSON().substr(0,10)});
        let saved = await answer.save();
        if(saved){
          try {
            req.auth.access.map((acc: any) => {
              let notification = new Notification({
                title: `New Answer`,
                text: `${req.auth.name} answered "${answer!.text}" for the question "${question!.text}"`,
                ntype: 'answer',
                to: acc._id.toString(),
                data: {
                  question: question,
                  answer: answer
                },
                time: new Date().getTime()
              });
              notification.save((err, n) => {
                if(!err){
                  let userSocket = socketsList.getSocketByUser(acc._id.toString());
                  if(userSocket !== null){
                    io.to(userSocket).emit(Events.NOTIFICATION, n);
                  }
                }
              });
            });
          } catch(e){
            console.log(e);
          }
          return res.status(200).json({success: true, message: localization.translate('answer submitted successfully')});
        } else {
          return res.status(500).json({success: false, message: localization.translate('internel server error')});
        }
      }
    }
  }
}

export async function addAnswer(req: Request, res: Response): Promise<any> {
  if(!req.body.questionId || !req.body.answer || !req.body.userId){
    return res.status(400).json({success: false, message: localization.translate('please fill all fields')});
  } else {
    let errors :{[key: string]: string; } = {};
    if(req.body.userId){
      let user = await User.findOne({_id: new ObjectId(req.body.userId), delete: false});
      if(!user){
        errors.userId = localization.translate('requested user does not exists');
      }
    }
    if(req.body.questionId){
      let question = await Question.findOne({_id: new ObjectId(req.body.questionId), delete: false});
      if(!question){
        errors.questionId = localization.translate('requested question does not exists');
      }
    }
    if(Object.keys(errors).length > 0){
      return res.status(400).json({success: false, message: localization.translate('bad request'), errors: errors});
    } else {
      let d = new Date();
      let answer = new Answer({text: req.body.answer, question: new ObjectId(req.body.questionId), user: new ObjectId(req.body.userId), time: d.getTime(), date: d.toJSON().substr(0,10)});
      let saved = await answer.save();
      if(saved){
        return res.status(200).json({success: true, message: localization.translate('answer saved successfully'), answer: answer});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

export async function editAnswer(req: Request, res: Response): Promise<any> {
  if(!req.params.answerId){
    return res.status(400).json({success: false, message: localization.translate('answerId is missing')});
  } else {
    let answer = await Answer.findOne({_id: req.params.answerId, delete: false});
    if(!answer){
      return res.status(400).json({success: false, message: localization.translate('requested answer does not exists')});
    } else {
      let errors: {[key: string]: string; } = {};
      let shouldUpdate: boolean = false;
      if(req.body.answer){
        answer.text = req.body.answer;
        shouldUpdate = true;
      }
      if(req.body.question){
        let question = await Question.findOne({_id: new ObjectId(req.body.question), delete: false});
        if(!question){
          errors.question = localization.translate('requested question does not exists');
        } else {
          answer.question = question._id;
          shouldUpdate = true;
        }
      }
      if(req.body.user){
        let user = await User.findOne({_id: new ObjectId(req.body.user), delete: false});
        if(!user){
          errors.user = localization.translate('requested user does not exists');
        } else {
          answer.user = user._id;
          shouldUpdate = true;
        }
      }
      if(Object.keys(errors).length > 0){
        return res.status(400).json({success: false, message: localization.translate('bad request'), errors: errors});
      } else {
        if(!shouldUpdate){
          return res.status(200).json({success: false, message: localization.translate('nothing to update')});
        } else {
          let saved = await answer.save();
          if(saved){
            return res.status(200).json({success: true, message: localization.translate('answer updated successfully'), answer: answer});
          } else {
            return res.status(500).json({success: false, message: localization.translate('internel server error')});
          }
        }
      }
    }
  }
}

export async function deleteAnswer(req: Request, res: Response): Promise<any> {
  if(!req.params.answerId){
    return res.status(400).json({success: false, message: localization.translate('answerId is missing')});
  } else {
    let answer = await Answer.findOne({_id: req.params.answerId, delete: false});
    if(!answer){
      return res.status(400).json({success: false, message: localization.translate('requested answer does not exists')});
    } else {
      answer.delete = true;
      let saved = await answer.save();
      if(saved){
        return res.status(200).json({success: true, message: localization.translate('answer deleted successfully')});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

/*
 * Answers section ended
 */

/*
 * Notifications section ended
 */

export async function getNotifications(req: Request, res: Response): Promise<any> {
  let obj: { [key: string]: any; } = {};
  if(!req.query.all){
    obj.delete = false;
  }
  let notifications = await Notification.find(obj);
  if(notifications){
    return res.status(200).json({success: true, notifications: notifications});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getNotificationById(req: Request, res: Response): Promise<any> {
  if(!req.params.notificationId){
    return res.status(400).json({success: false, message: localization.translate('notificationId is missing')});
  } else {
    let obj: { [key: string]: any; } = {
      _id: req.params.notificationId
    };
    if(!req.query.all){
      obj.delete = false;
    }
    let notification = await Notification.findOne(obj);
    if(notification){
      return res.status(200).json({success: true, notification: notification});
    } else {
      return res.status(500).json({success: false, message: localization.translate('internel server error')});
    }
  }
}

export async function getMyNotifications(req: Request, res: Response): Promise<any> {
  let obj: {[key: string]: any} = {
    to: new ObjectId(req.auth._id), delete: false
  };
  if(!req.query.all){
    obj.seen = false;
  }
  let notifications = await Notification.find(obj);
  if(notifications){
    return res.status(200).json({success: true, notifications: notifications});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getUserNotifications(req: Request, res: Response): Promise<any> {
  if(!req.params.userId){
    return res.status(400).json({success: false, message: localization.translate('userId is missing')});
  } else {
    let user = await User.findOne({_id: req.params.userId, delete: false});
    if(!user){
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    } else {
      let obj: {[key: string]: any} = {
        to: new ObjectId(user._id), delete: false
      };
      if(!req.query.all){
        obj.seen = false;
      }
      let notifications = await Notification.find(obj);
      if(notifications){
        return res.status(200).json({success: true, notifications: notifications});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

export async function seeNotification(req: Request, res: Response): Promise<any> {
  if(!req.params.notificationId){
    return res.status(400).json({success: false, message: localization.translate('notificationId is missing')});
  } else {
    let notification = await Notification.findOne({_id: req.params.notificationId, delete: false});
    if(!notification){
      return res.status(400).json({success: localization.translate('requested notification does not exists')});
    } else {
      notification.seen = true;
      let saved = await notification.save();
      if(saved){
        return res.status(200).json({success: true, message: localization.translate('notification seen successfully'), notification: notification});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

export async function deleteNotification(req: Request, res: Response): Promise<any> {
  if(!req.params.notificationId){
    return res.status(400).json({success: false, message: localization.translate('notificationId is missing')});
  } else {
    let notification = await Notification.findOne({_id: req.params.notificationId, delete: false});
    if(!notification){
      return res.status(400).json({success: localization.translate('requested notification does not exists')});
    } else {
      notification.delete = true;
      let saved = await notification.save();
      if(saved){
        return res.status(200).json({success: true, message: localization.translate('notification deleted successfully')});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

/*
 * Notifications section ended
 */

/*
 * Conversation section started
 */

export async function getConversations(req: Request, res: Response): Promise<any> {
  let obj : { [key: string]: any; } = {};
  if(!req.query.all){
    obj.delete = false;
  }
  let conversations = await Conversation.find(obj);
  if(conversations){
    return res.status(200).json({success: true, conversations: conversations});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getConversationById(req: Request, res: Response): Promise<any> {
  if(!req.params.conversationId){
    return res.status(400).json({success: false, message: localization.translate('conversationId is missing')});
  } else {
    let obj : { [key: string]: any; } = {
      _id: req.params.conversationId
    };
    if(!req.query.all){
      obj.delete = false;
    }
    let conversation = await Conversation.findOne(obj);
    if(conversation){
      return res.status(200).json({success: true, conversation: conversation});
    } else {
      return res.status(500).json({success: false, message: localization.translate('internel server error')});
    }
  }
}

export async function addConversation(req: Request, res: Response): Promise<any> {
  if(!req.body.members){
    return res.status(400).json({success: false, message: localization.translate('please select chat participents')});
  } else {
    if(!Array.isArray(req.body.members)){
      return res.status(400).json({success: false, message: localization.translate('members should be array')});
    } else {
      let filtered = req.body.members.filter((m: any) => ObjectId.isValid(m));
      if(filtered.length !== req.body.members.length){
        return res.status(400).json({success: false, message: localization.translate('members contains invalid data')});
      } else {
        if(req.body.directChat){
          if(req.body.members.length !== 1){
            return res.status(400).json({success: false, message: localization.translate('only two members are allowed')});
          } else if(req.body.members.includes(req.auth._id.toString())){
            return res.status(400).json({success: false, message: localization.translate('you cannot chat with your own')});
          } else {
            let ms: any[] = req.body.members.map((m: string) => new ObjectId(m));
            if(!ms.includes(req.auth._id.toString())){
              ms.push(req.auth._id);
            }
            let members = await User.find({_id: { $in: ms}, delete: false});
            if(members.length === ms.length){
              let conversation = await Conversation.aggregate([{$match: {$and: [{members: {$in: ms}},{members: {$size: 2}}]}}, {$limit: 1}]);
              if(conversation.length){
                return res.status(400).json({success: false, message: localization.translate('conversation already exists')});
              } else {
                let conversation = new Conversation({creator: req.auth._id, members: ms, isOneToOne: true});
                let saved = await conversation.save();
                if(saved){
                  return res.status(200).json({success: true, conversation: conversation});
                } else {
                  return res.status(500).json({success: false, message: localization.translate('internel server error')});
                }
              }
            } else {
              return res.status(200).json({success: false, message: localization.translate('members contains invalid data')});
            }
          }
        } else {
          if(!req.body.title){
            return res.status(400).json({success: false, message: localization.translate('group title is required')});
          } else {
            let ms2: any[] = req.body.members.map((m: string) => new ObjectId(m));
            if(!ms2.includes(req.auth._id)){
              ms2.push(req.auth._id);
            }
            let members = await User.find({_id: { $in: ms2}, delete: false});
            if(members.length === ms2.length){
              let conversation = new Conversation({title: req.body.title, creator: req.auth._id, members: ms2});
              let saved = await conversation.save();
              if(saved){
                return res.status(200).json({success: true, message: localization.translate('conversation created successfully'), conversation: conversation});
              } else {
                return res.status(500).json({success: false, message: localization.translate('internel server error')});
              }
            } else {
              return res.status(400).json({success: false, message: localization.translate('members contains invalid data')});
            }
          }
        }
      }
    }
  }
}

export async function addUserConversation(req: Request, res: Response): Promise<any> {
  if(!req.body.members || !req.body.userId){
    return res.status(400).json({success: false, message: localization.translate('please select chat participents')});
  } else {
    if(!Array.isArray(req.body.members)){
      return res.status(400).json({success: false, message: localization.translate('members should be array')});
    } else {
      let membs: string[] = req.body.members;
      if(!membs.includes(req.body.userId)){
        membs.push(req.body.userId);
      }
      let filtered = membs.filter((m: any) => ObjectId.isValid(m));
      if(filtered.length !== membs.length){
        return res.status(400).json({success: false, message: localization.translate('members contains invalid data')});
      } else {
        if(req.body.directChat){
          if(req.body.members.length !== 1){
            return res.status(400).json({success: false, message: localization.translate('only two members are allowed')});
          } else if(req.body.members.includes(req.body.userId)){
            return res.status(400).json({success: false, message: localization.translate('user cannot chat with its own')});
          } else {
            let ms: any[] = membs.map((m: string) => new ObjectId(m));
            let members = await User.find({_id: { $in: ms}, delete: false});
            if(members.length === ms.length){
              let conversation = await Conversation.aggregate([{$match: {$and: [{members: {$in: ms}},{members: {$size: 2}}]}}, {$limit: 1}]);
              if(conversation.length){
                return res.status(400).json({success: false, message: localization.translate('conversation already exists')});
              } else {
                let conversation = new Conversation({creator: new ObjectId(req.body.userId), members: ms, isOneToOne: true});
                let saved = await conversation.save();
                if(saved){
                  return res.status(200).json({success: true, message: localization.translate('conversation created successfully'), conversation: conversation});
                } else {
                  return res.status(500).json({success: false, message: localization.translate('internel server error')});
                }
              }
            } else {
              return res.status(400).json({success: false, message: localization.translate('members contains invalid data')});
            }
          }
        } else {
          if(!req.body.title){
            return res.status(400).json({success: false, message: localization.translate('group title is required')});
          } else {
            let ms2: any[] = membs.map((m: string) => new ObjectId(m));
            let members = await User.find({_id: { $in: ms2}, delete: false});
            if(members.length === ms2.length){
              let conversation = new Conversation({title: req.body.title, creator: new ObjectId(req.body.userId), members: ms2});
              let saved = await conversation.save();
              if(saved){
                return res.status(200).json({success: true, message: localization.translate('conversation created successfully'), conversation: conversation});
              } else {
                return res.status(500).json({success: false, message: localization.translate('internel server error')});
              }
            } else {
              return res.status(200).json({success: false, message: localization.translate('members contains invalid data')});
            }
          }
        }
      }
    }
  }
}

export async function addUsersToMyConversation(req: Request, res: Response): Promise<any> {
  if(!req.body.userIds || !req.body.conversationId){
    return res.status(400).json({success: false, message: localization.translate('userIds and conversationId are missing')});
  } else {
    let conversation = await Conversation.findOne({_id: req.body.conversationId, creator: req.auth._id, delete: false});
    if(!conversation){
      return res.status(400).json({success: false, message: localization.translate('requested conversation does not exists')});
    } else if(conversation.isOneToOne) {
      return res.status(400).json({success: false, message: localization.translate('cannot add members to this conversation')});
    } else {
      let uss: any[] = req.body.userIds.filter((uid: string) => !ObjectId.isValid(uid));
      if(uss.length){
        return res.status(400).json({success: false, message: localization.translate('userIds contains invalid data')});
      } else {
        let usrs: any[] = req.body.userIds.map((u: string) => new ObjectId(u));
        let users = await User.find({_id: {$in: usrs}, delete: false});
        if(users.length !== usrs.length){
          return res.status(400).json({success: false, message: localization.translate('userIds contains invalid data')});
        } else {
          let existingMembers: number = conversation!.members.length;
          usrs.map((usr: any) => {
            if(!conversation!.members.includes(usr)){
              conversation!.members.push(usr);
            }
          });
          if(existingMembers === conversation!.members.length){
            return res.status(400).json({success: false, message: localization.translate('no new members added')});
          } else {
            let saved = await conversation.save();
            if(saved){
              return res.status(200).json({success: true, message: localization.translate('members added successfully'), conversation: conversation});
            } else {
              return res.status(500).json({success: false, message: localization.translate('internel server error')});
            }
          }
        }
      }
    }
  }
}

export async function addUsersToUserConversation(req: Request, res: Response): Promise<any> {
  if(!req.params.userId){
    return res.status(400).json({success: false, message: localization.translate('userId is missing')});
  } else {
    let user = await User.findOne({_id: req.params.userId, delete: false});
    if(!user){
      return res.status(400).json({success: false, message: localization.translate('requested user does not exists')});
    } else {
      if(!req.body.userIds || !req.body.conversationId){
        return res.status(400).json({success: false, message: localization.translate('userIds and conversationId are missing')});
      } else {
        let conversation = await Conversation.findOne({_id: req.body.conversationId, creator: user._id, delete: false});
        if(!conversation){
          return res.status(400).json({success: false, message: localization.translate('requested conversation does not exists')});
        } else if(conversation.isOneToOne) {
          return res.status(400).json({success: false, message: localization.translate('cannot add members to this conversation')});
        } else {
          let uss: any[] = req.body.userIds.filter((uid: string) => !ObjectId.isValid(uid));
          if(uss.length){
            return res.status(400).json({success: false, message: localization.translate('userIds contains invalid data')});
          } else {
            let usrs: any[] = req.body.userIds.map((u: string) => new ObjectId(u));
            let users = await User.find({_id: {$in: usrs}, delete: false});
            if(users.length !== usrs.length){
              return res.status(400).json({success: false, message: localization.translate('userIds contains invalid data')});
            } else {
              let existingMembers: number = conversation!.members.length;
              usrs.map((usr: any) => {
                if(!conversation!.members.includes(usr)){
                  conversation!.members.push(usr);
                }
              });
              if(existingMembers === conversation!.members.length){
                return res.status(400).json({success: false, message: localization.translate('no new members added')});
              } else {
                let saved = await conversation.save();
                if(saved){
                  return res.status(200).json({success: true, message: localization.translate('members added successfully'), conversation: conversation});
                } else {
                  return res.status(500).json({success: false, message: localization.translate('internel server error')});
                }
              }
            }
          }
        }
      }
    }
  }
}

export async function deleteConversation(req: Request, res: Response): Promise<any> {
  if(!req.params.conversationId){
    return res.status(400).json({success: false, message: localization.translate('conversationId is missing')});
  } else {
    let conversation = await Conversation.findOne({_id: req.params.conversationId, delete: false});
    if(!conversation){
      return res.status(400).json({success: false, message: localization.translate('requested conversation does not exists')});
    } else {
      conversation.delete = true;
      let saved = await conversation.save();
      if(saved){
        return res.status(200).json({success: true, message: localization.translate('conversation deleted successfully')});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}

/*
 * Conversation section started
 */

/*
 * Message section started
 */

export async function getMessages(req: Request, res: Response): Promise<any> {
  let obj : { [key: string]: any; } = {};
  if(!req.query.all){
    obj.delete = false;
  }
  let messages = await Message.find(obj);
  if(messages){
    return res.status(200).json({success: true, messages: messages});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

export async function getMessageById(req: Request, res: Response): Promise<any> {
  if(!req.params.messageId){
    return res.status(400).json({success: false, message: localization.translate('messageId is missing')});
  } else {
    let obj : { [key: string]: any; } = {
      _id: req.params.messageId
    };
    if(!req.query.all){
      obj.delete = false;
    }
    let message = await Message.findOne(obj);
    if(message){
      return res.status(200).json({success: true, msg: message});
    } else {
      return res.status(500).json({success: false, message: localization.translate('internel server error')});
    }
  }
}

export async function sendMessage(req: Request, res: Response): Promise<any> {
  if(!req.body.conversationId || (!req.body.message && !req.file)){
    try {
      fs.unlinkSync(req.file.path);
    } catch(e){
      console.log(e);
    }
    return res.status(400).json({success: false, message: localization.translate('all fields are required')});
  } else {
    let conversation = await Conversation.findOneAndUpdate({$or: [{creator: req.auth._id}, {members: req.auth._id}], _id: req.body.conversationId, delete: false}, { $set: {updateTime: Date.now().toString()}}, {new: true});
    if(!conversation){
      try {
        fs.unlinkSync(req.file.path);
      } catch(e){
        console.log(e);
      }
      return res.status(400).json({success: false, message: localization.translate('requested conversation does not exists')});
    } else {
      if(!req.file && req.body.message.trim().length < 1){
        return res.status(400).json({success: false, message: localization.translate('message body is empty')});
      } else {
        let usrs: any[] = conversation.members.filter((m: any) => m !== req.auth._id);
        let msg = new Message({conversation: conversation._id, sender: req.auth._id, receiver: usrs});
        if(req.file){
          let url = new URL(`${uploads_base_url}${req.file.filename}`);
          msg.attachment.path = url.pathname;
          msg.attachment.origin = url.origin;
        }
        if(req.body.message){
          if(!req.file){
            let foundUrl : any = Patterns.BEGINING_MSG_URL_REGEX.exec(req.body.message.trim());
            if(foundUrl !== null){
              let makeUrl = new URL(foundUrl[0]);
              msg.attachment.path = makeUrl.pathname;
              msg.attachment.origin = makeUrl.origin;
            }
          }
          msg.message = req.body.message.trim();
        }
        let saved = await msg.save();
        if(saved){
          try {
            let populatedMsg = await msg.populate([{path: 'sender', select: ['name', '_id', 'picture']}]).execPopulate();
            msg.receiver.map(async (rec: any) => {
              let uId = rec!._id.toString();
              if(uId !== req!.auth!._id!.toString()){
                let ruser: any = socketsList.getSocketByUser(uId);
                let isUserOnline: boolean = ruser !== null;
                let notification = new Notification({
                  title: 'New Message',
                  text: `${req.auth.name} send a message`,
                  ntype: 'message',
                  to: rec,
                  data: {
                    message: populatedMsg,
                    conversation: conversation,
                  },
                  seen: isUserOnline
                });
                if(isUserOnline){
                  io.to(ruser).emit(Events.NOTIFICATION, notification);
                }
                await notification.save();
              }
            });
          } catch(e){
            console.log(e);
          }
          return res.status(200).json({success: true, message: localization.translate('message sent successfully'), msg: msg, conversation: conversation});
        } else {
          return res.status(500).json({success: false, message: localization.translate('internel server error')});
        }
      }
    }
  }
}

/*
 * Message section started
 */

/*
 * Agenda section started
*/

export async function createAgenda(req: Request, res: Response): Promise<any> {
    if(!req.body.title || !req.body.date || !req.body.time || !req.body.companianId || !req.body.userId){

      return res.status(400).json({success: false, message: localization.translate('all fields are required')});

    } else {
      let repeatDay = "";
      if(req.body.repeatDay){
        repeatDay = req.body.repeatDay;
      }
      let datetime = new Date();
      let createDate = datetime.toISOString().slice(0,10);

      let agenda = new Agenda({
        title: req.body.title, 
        date: req.body.date, 
        time: req.body.time, 
        companianId: req.body.companianId, 
        userId:req.body.userId, 
        repeatDay: repeatDay, 
        createDate: createDate
      });

        let saved = await agenda.save();
        if(saved){

          let notificationData = {
            "type":"insert",
            "id":saved._id.toString(),
            "title": saved.title, 
              "date": saved.date, 
              "time": saved.time, 
              "companianId": saved.companianId.toString(), 
              "userId":saved.userId.toString(), 
              "repeatDay": saved.repeatDay,
          };
          
          let user = await User.findById(req.body.userId);
          let fcmtoken = "";
          if(user){ 
            fcmtoken = user.fcm;
            let payload = { data: notificationData };
            let options = { priority: "high", timeToLive: 60 * 60 *24 };
            console.log("Token : "+fcmtoken);
     
            admin.messaging().sendToDevice(fcmtoken, payload, options)
              .then(function(response:any) {
              console.log("Successfully sent message:", response);
              //console.log("Successfully sent message:", response.results[0].error);

            })
            .catch(function(error:any) {
              console.log("Error sending message:", error);
            });
          }

          return res.status(200).json({success: true, message: localization.translate('agenda created successfully')});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
}

export async function updateAgenda(req: Request, res: Response): Promise<any> {
  if(!req.params.agendaId){
    return res.status(400).json({success: false, message: localization.translate('agendaId is missing')});
  } else {
    let agenda = await Agenda.findOne({"_id": req.params.agendaId});
    if(!agenda){
      return res.status(400).json({success: false, message: localization.translate('requested agenda does not exists')});
    }else{
    
      let shouldUpdate: boolean = false;
      if(req.body.title){
          agenda.title = req.body.title;
          shouldUpdate = true;
        }
        if(req.body.date){
          agenda.date = req.body.date;
          shouldUpdate = true;
        }
        if(req.body.time){
          agenda.time = req.body.time;
          shouldUpdate = true;
        }
        if(req.body.companianId){
          agenda.companianId = req.body.companianId;
          shouldUpdate = true;
        }
        if(req.body.userId){
          agenda.userId = req.body.userId;
          shouldUpdate = true;
        }
        if(req.body.repeatDay || req.body.repeatDay  == '' || req.body.repeatDay == null){
          agenda.repeatDay = req.body.repeatDay;
          shouldUpdate = true;
        }

      if(shouldUpdate){
        let saved = await agenda.save();
        if(saved){
          
          let userId = agenda.userId;
          let user = await User.findById(userId);
          let notificationData = {
            "type":"update",
            "id":agenda._id.toString(),
            "title": agenda.title, 
              "date": agenda.date, 
              "time": agenda.time, 
              "companianId": agenda.companianId.toString(), 
              "userId":agenda.userId.toString(), 
              "repeatDay": agenda.repeatDay,
            };

              let fcmtoken = "";
              if(user){ 
                fcmtoken = user.fcm;
                let payload = { data: notificationData };
                let options = { priority: "high", timeToLive: 60 * 60 *24 };
         
                admin.messaging().sendToDevice(fcmtoken, payload, options)
                  .then(function(response:any) {
                  console.log("Successfully sent message:", response);
                })
                .catch(function(error:any) {
                  console.log("Error sending message:", error);
                });
              }

              return res.status(200).json({success: true, message: localization.translate('agenda updated successfully'), agenda: agenda});
          } else {
              return res.status(500).json({success: false, message: localization.translate('internel server error')});
          }
      }else{
        return res.status(200).json({success: false, message: localization.translate('nothing to update'), agenda: agenda});
      }
    }
  }
}


export async function deleteAgenda(req: Request, res: Response): Promise<any> {
  if(!req.params.agendaId){
    return res.status(400).json({success: false, message: localization.translate('agendaId is missing')});
  } else {
    let agenda = await Agenda.findOne({"_id": req.params.agendaId});
    if(!agenda){
      return res.status(400).json({success: false, message: localization.translate('requested agenda does not exists')});
    }else{
      let deleted = await Agenda.deleteOne({ _id : req.params.agendaId});
      if(deleted){

        
        let userId = agenda.userId;
        let user = await User.findById(userId);
        let notificationData = {'type':'delete','id':agenda._id.toString()};
            let fcmtoken = "";
            if(user){ 
              fcmtoken = user.fcm;
              let payload = { data: notificationData };
              let options = { priority: "high", timeToLive: 60 * 60 *24 };
       
              admin.messaging().sendToDevice(fcmtoken, payload, options)
                .then(function(response:any) {
                console.log("Successfully sent message:", response);
              })
              .catch(function(error:any) {
                console.log("Error sending message:", error);
              });
            }

        return res.status(200).json({success: true, message: localization.translate('agenda deleted successfully')});
      } else {
        return res.status(500).json({success: false, message: localization.translate('internel server error')});
      }
    }
  }
}



export async function getUserAgendaList(req: Request, res: Response): Promise<any> {
  if(!req.params.agendaId){
    return res.status(400).json({success: false, message: localization.translate('agendaId is missing')});
  } else {
    /*let agenda = await Agenda.find({userId: req.params.agendaId}).sort( { "_id": -1 } );*/
    const agenda = await Agenda.aggregate([
        {
            $match: {
                'userId': ObjectId(req.params.agendaId)
            }

        },
        {
           $sort: {date: -1}
        },
        {
            $lookup: {
                from: "Users",
                localField: "companianId",
                foreignField: "_id",
                as: "companian"
            }
        }
    ]);
    if(!agenda){
      return res.status(400).json({success: false, message: localization.translate('requested agenda does not exists')});
    } else {
    	return res.status(200).json({success: true, agenda: agenda});
    }
   }
}

export async function getAgenda(req: Request, res: Response): Promise<any> {
  
 const agenda = await Agenda.aggregate([
    {
        $sort: {date: -1}
    },
    {
      $lookup: {
        from: "Users",
        localField: "companianId",
        foreignField: "_id",
        as: "companian"
      }
    },
    {
      $lookup: {
        from: "Users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    }
  ]);
  if(agenda){
    return res.status(200).json({success: true, agenda: agenda});
  } else {
    return res.status(500).json({success: false, message: localization.translate('internel server error')});
  }
}

const Controller: looseObject = {
  getDashboardDataForAdmin,
  getDashboardDataForCurrentUser,
  getDashboardDataForUser,
  webLogin,
  tabletLogin,
  companianLogin,
  logout,
  getMyProfile,
  getMyFeatures,
  saveFirebaseToken,
  getUserFeatures,
  updateMyFeatures,
  updateUserFeatures,
  getUsers,
  getUserById,
  addUser,
  editUser,
  deleteUser,
  undeleteUser,
  // getCompanians,
  getMyCompanians,
  getMyPlaylists,
  getMyQuestions,
  getMyPermissions,
  getMyAccess,
  getMyUsers,
  getMyConversations,
  getMyAnswers,
  getMyAllLinkedAccounts,
  getUserCompanians,
  getUserPlaylists,
  getUserQuestions,
  getUserPermissions,
  getUserAccess,
  getCompanianUsers,
  getUserConversations,
  getUserAnswers,
  getUserAllLinkedAccounts,
  // getCompanianById,
  // getMyUsers,
  // addCompanian,
  addMyCompanian,
  addUserCompanian,
  // editCompanian,
  assignCompanian,
  grantAccess,
  unlinkCompanian,
  denyAccess,
  // deleteCompanian,
  getPermissions,
  getPermissionById,
  addPermission,
  editPermission,
  grantPermissions,
  deletePermission,
  getMedias,
  getMediaById,
  addMedia,
  addMediaToPlaylist,
  assignMedia,
  deleteMedia,
  getPlaylists,
  getPlaylistById,
  getPlaylistItems,
  addPlaylist,
  editPlaylist,
  addMyPlaylist,
  addUserPlaylist,
  assignPlaylist,
  deletePlaylist,
  getSessions,
  getSessionById,
  getQuestions,
  getQuestionById,
  getMyRandomQuestion,
  addQuestion,
  editQuestion,
  addMyQuestion,
  addUserQuestion,
  assignQuestion,
  deleteQuestion,
  getAnswers,
  getAnswerById,
  answerRandomQuestion,
  addAnswer,
  editAnswer,
  deleteAnswer,
  getNotifications,
  getNotificationById,
  getMyNotifications,
  getUserNotifications,
  seeNotification,
  deleteNotification,
  getConversations,
  getConversationById,
  addConversation,
  addUserConversation,
  addUsersToMyConversation,
  addUsersToUserConversation,
  deleteConversation,
  getMessages,
  getMessageById,
  sendMessage,
  createAgenda,
  updateAgenda,
  deleteAgenda,
  getUserAgendaList,
  getAgenda
};

export default Controller;

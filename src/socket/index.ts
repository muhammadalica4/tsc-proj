import { createServer, Server } from 'http';
import SocketIO from 'socket.io';
import { Session, User, Notification } from '../models';
import { decryption } from '../helpers';
import express, { Application } from 'express';
import { Events } from './events';
import Socket from './sockets';
export { Events } from './events';
import { companianLinked, managerLinked } from './handler';
export { companianLinked, managerLinked } from './handler';

export const app: Application = express();
export const server: Server  = createServer(app);
export const io: SocketIO.Server = SocketIO(server);
export const socketsList: Socket = new Socket();

app.on(Events.COMPANIAN_LINKED, companianLinked);
app.on(Events.MANAGER_LINKED, managerLinked);

io.use(async (socket, next) => {
  if(socket.handshake.query.token){
    let token: string = socket.handshake.query.token;
    // console.log(token);
    let session = await Session.findOne({token: token});
    // console.log("session: ", session);
    if(session && session.isActive){
      let isValid: boolean = session.isIndefinite === true || parseInt(session.expireTime, 10) > Date.now();
      // console.log("isValid: ", isValid);
      if(isValid){
        let json = null;
        try {
            json = JSON.parse(decryption(session.token));
        } catch(e){
            console.log(e);
        }
        // console.log("json: ", json);
        if(json != null){
          let user = await User.findOne({_id: json.id, delete: false});
          // console.log("user: ", user);
          if(user){
              socket.handshake.query.user = user.toString();
              socketsList.addNew({id: user._id.toString(), socket: socket.id});
              return next();
          }
        }
      }
    }
  }
  return next(new Error('could not authenticate'));
}).on(Events.CONNECTION, async function(socket){
  console.log("Socket connected: ", socket.id);
  console.log("socketsList: ", socketsList.getSockets());
  let availableUser: any = socket.handshake.query.user;
  if(availableUser !== null){
    // socket.broadcast.emit(Events.USER_ONLINE, availableUser._id.toString());
    if(availableUser.role === 'manager'){
      let managers = availableUser.access.filter((acc: any) => {
        let obj: string | null = socketsList.getSocketByUser(acc.toString());
        if(obj !== null){
          console.log("acc obj: ", acc.toString(), obj);
          io.to(obj).emit(Events.USER_ONLINE, availableUser._id.toString());
        }
        return obj !== null;
      });
      socket.emit(Events.ALL_USERS, managers);
    }
    if(availableUser.role === 'user'){
      let companians = availableUser.companians.filter((comp: any) => {
        let obj: string | null = socketsList.getSocketByUser(comp.toString());
        if(obj !== null){
          console.log("comp obj: ", comp.toString(), obj);
          io.to(obj).emit(Events.USER_ONLINE, availableUser._id.toString());
        }
        return obj !== null;
      });
      socket.emit(Events.ALL_USERS, companians);
    }
    if(availableUser.role === 'companian'){
      let users = availableUser.users.filter((usr: any) => {
        let obj: string | null = socketsList.getSocketByUser(usr.toString());
        if(obj !== null){
          console.log("usr obj: ", usr.toString(), obj);
          io.to(obj).emit(Events.USER_ONLINE, availableUser._id.toString());
        }
        return obj !== null;
      });
      socket.emit(Events.ALL_USERS, users);
    }
	if(availableUser.role === 'companian' || availableUser.role === 'user'){
		let notifications = await Notification.find({to: availableUser._id, seen: false}).populate([{
				path: 'data.message.sender',
				model: 'User',
				select: ['name', '_id', 'picture']
			},
			{
				path: 'data.answer',
				model: 'Answer'
			},
			{
				path: 'data.question',
				model: 'Question'
			}
		]);
		if(notifications){
			socket.emit(Events.PENDING_NOTIFICATIONS, notifications);
			let notificationIds: any[] = notifications.map((n: any) => n._id);
			await Notification.updateMany({_id: { $in: notificationIds }}, {seen: true});
		}
	}
    socket.on(Events.DISCONNECT, () => {
      if(availableUser.role === 'manager'){
        let managers = availableUser.access.filter((acc: any) => {
          let obj: string | null = socketsList.getSocketByUser(acc.toString());
          if(obj !== null){
            console.log("disc acc obj: ", acc.toString(), obj);
            io.to(obj).emit(Events.USER_OFFLINE, availableUser._id.toString());
          }
          return obj !== null;
        });
      }
      if(availableUser.role === 'user'){
        let companians = availableUser.companians.filter((comp: any) => {
          let obj: string | null = socketsList.getSocketByUser(comp.toString());
          if(obj !== null){
            console.log("disc comp obj: ", comp.toString(), obj);
            io.to(obj).emit(Events.USER_OFFLINE, availableUser._id.toString());
          }
          return obj !== null;
        });
      }
      if(availableUser.role === 'companian'){
        let users = availableUser.users.filter((usr: any) => {
          let obj: string | null = socketsList.getSocketByUser(usr.toString());
          if(obj !== null){
            console.log("disc usr obj: ", usr.toString(), obj);
            io.to(obj).emit(Events.USER_OFFLINE, availableUser._id.toString());
          }
          return obj !== null;
        });
      }
      socketsList.removeUserBySocket(socket.id);
      console.log('disconnected socketsList: ', socketsList.getSockets());
    });
  }
});

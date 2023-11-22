import { User, Conversation, Notification } from '../models';
import { io, socketsList, Events } from './index';

export async function companianLinked(obj: any): Promise<any> {
  try {
    let user = obj!.user;
    let userId = obj!.user!._id;
    let companianId = obj!.companian!._id;

    let conversation = await Conversation.findOne({creator: userId, isOneToOne: true, $and: [{members: userId}, {members: companianId}]});
    if(!conversation){
      let cone = new Conversation({creator: userId, members: [userId, companianId], isOneToOne: true});
      let saved = await cone.save();
      if(saved){
        let noneuser = new Notification({ntype: 'conversation', title: 'New Chat', text: `${user.name} started new chat`, to: userId, data: {
          conversation: cone
        }});
        let nonecompanian = new Notification({ntype: 'conversation', title: 'New Chat', text: `${user.name} started new chat`, to: companianId, data: {
          conversation: cone
        }});
        let isUserConnected : any = socketsList.getSocketByUser(userId.toString());
        if(isUserConnected !== null){
          noneuser.seen = true;
          io.to(isUserConnected).emit(Events.NOTIFICATION, noneuser);
        }
        await noneuser.save();

        let isCompanianConnected : any = socketsList.getSocketByUser(companianId.toString());
        if(isCompanianConnected){
          nonecompanian.seen = true;
          io.to(isCompanianConnected).emit(Events.NOTIFICATION, nonecompanian);
        }
        await nonecompanian.save();
      }
    }
    let conversation2 = await Conversation.findOne({creator: userId, isOneToOne: false});
    if(conversation2){
      if(!conversation2!.members.includes(companianId)){
        conversation2.members.push(companianId);
        let saved2 = await conversation2.save();
        if(saved2){
          let ntwocompanian = new Notification({ntype: 'conversation', title: 'New Chat', text: `${user.name} started new chat`, to: companianId, data: {
            conversation: conversation2
          }});

          let isCompanianConnected : any = socketsList.getSocketByUser(companianId.toString());
          if(isCompanianConnected){
            ntwocompanian.seen = true;
            io.to(isCompanianConnected).emit(Events.NOTIFICATION, ntwocompanian);
          }
          await ntwocompanian.save();
        }
      }
    } else {
      let ctwo = new Conversation({creator: userId, title: `${user.name}'s group`, members: [userId, companianId], isOneToOne: false});
      let saved3 = await ctwo.save();
      if(saved3){
        let nthreeuser = new Notification({ntype: 'conversation', title: 'New Chat', text: `${user.name} started new chat`, to: userId, data: {
          conversation: ctwo
        }});
        let nthreecompanian = new Notification({ntype: 'conversation', title: 'New Chat', text: `${user.name} started new chat`, to: companianId, data: {
          conversation: ctwo
        }});
        let isUserConnected : any = socketsList.getSocketByUser(userId.toString());
        if(isUserConnected !== null){
          nthreeuser.seen = true;
          io.to(isUserConnected).emit(Events.NOTIFICATION, nthreeuser);
        }
        await nthreeuser.save();

        let isCompanianConnected : any = socketsList.getSocketByUser(companianId.toString());
        if(isCompanianConnected){
          nthreecompanian.seen = true;
          io.to(isCompanianConnected).emit(Events.NOTIFICATION, nthreecompanian);
        }
        await nthreecompanian.save();
      }
    }
  } catch (e){
    console.log(e);
  }
}

export async function managerLinked(obj: any): Promise<any> {
  try {
    let user = obj!.user;
    let userId = obj!.user!._id;
    let managerId = obj!.manager!._id;

    let conversation = await Conversation.findOne({creator: userId, isOneToOne: true, $and: [{members: userId}, {members: managerId}]});
    if(!conversation){
      let cone = new Conversation({creator: userId, members: [userId, managerId], isOneToOne: true});
      let saved = await cone.save();
      if(saved){
        let noneuser = new Notification({ntype: 'conversation', title: 'New Chat', text: `${user.name} started new chat`, to: userId, data: {
          conversation: cone
        }});
        let nonemanager = new Notification({ntype: 'conversation', title: 'New Chat', text: `${user.name} started new chat`, to: managerId, data: {
          conversation: cone
        }});
        let isUserConnected : any = socketsList.getSocketByUser(userId.toString());
        if(isUserConnected !== null){
          noneuser.seen = true;
          io.to(isUserConnected).emit(Events.NOTIFICATION, noneuser);
        }
        await noneuser.save();

        let isManagerConnected : any = socketsList.getSocketByUser(managerId.toString());
        if(isManagerConnected){
          nonemanager.seen = true;
          io.to(isManagerConnected).emit(Events.NOTIFICATION, nonemanager);
        }
        await nonemanager.save();
      }
    }
    let conversation2 = await Conversation.findOne({creator: userId, isOneToOne: false});
    if(conversation2){
      if(!conversation2!.members.includes(managerId)){
        conversation2.members.push(managerId);
        let saved2 = await conversation2.save();
        if(saved2){
          let ntwomanager = new Notification({ntype: 'conversation', title: 'New Chat', text: `${user.name} started new chat`, to: managerId, data: {
            conversation: conversation2
          }});

          let isManagerConnected : any = socketsList.getSocketByUser(managerId.toString());
          if(isManagerConnected){
            ntwomanager.seen = true;
            io.to(isManagerConnected).emit(Events.NOTIFICATION, ntwomanager);
          }
          await ntwomanager.save();
        }
      }
    } else {
      let ctwo = new Conversation({creator: userId, title: `${user.name}'s group`, members: [userId, managerId], isOneToOne: false});
      let saved3 = await ctwo.save();
      if(saved3){
        let nthreeuser = new Notification({ntype: 'conversation', title: 'New Chat', text: `${user.name} started new chat`, to: userId, data: {
          conversation: ctwo
        }});
        let nthreemanager = new Notification({ntype: 'conversation', title: 'New Chat', text: `${user.name} started new chat`, to: managerId, data: {
          conversation: ctwo
        }});
        let isUserConnected : any = socketsList.getSocketByUser(userId.toString());
        if(isUserConnected !== null){
          nthreeuser.seen = true;
          io.to(isUserConnected).emit(Events.NOTIFICATION, nthreeuser);
        }
        await nthreeuser.save();

        let isManagerConnected : any = socketsList.getSocketByUser(managerId.toString());
        if(isManagerConnected){
          nthreemanager.seen = true;
          io.to(isManagerConnected).emit(Events.NOTIFICATION, nthreemanager);
        }
        await nthreemanager.save();
      }
    }
  } catch (e){
    console.log(e);
  }
}

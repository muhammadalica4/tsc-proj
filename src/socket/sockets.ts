class Socket
{
  sockets: {[key: string]: string; };

  constructor(){
    this.sockets = {};
  }

  addNew(options: {[key: string]: string}){
    this.sockets[options.id] = options.socket;
  }

  getSocketByUser(user: string){
    if(!(user in this.sockets)){
      return null;
    }
    return this.sockets[user];
  }

  getUserBySocket(socketId: string){
    let user = null;
    for (var k in this.sockets){
      if(this.sockets[k] === socketId){
        user = k;
        break;
      }
    }
    return user;
  }

  removeSocket(socket: string){
    delete this.sockets[socket];
  }

  removeUserBySocket(socketId: string){
    for (var k in this.sockets){
  		if(this.sockets[k] == socketId){
  			delete this.sockets[k];
  			break;
  		}
  	}
  }

  getSockets(){
    return this.sockets;
  }
}

export default Socket;

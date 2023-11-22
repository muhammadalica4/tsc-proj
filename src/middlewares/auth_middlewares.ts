import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { Session } from '../models/session';
// import { excludedRoutes } from '../config/config';
import { decryption, localization } from '../helpers';

export async function tokenVerification(req: Request, res: Response, next: NextFunction): Promise<any> {
    if(req.secureRoute && req.secureRoute.requestAuthentication){
        let token = req.header('access-token');
        if(typeof token === 'undefined'){
            return res.status(401).json({success: false, message: localization.translate('authentication failed, please try to login again')});
        } else {
            let session = await Session.findOne({token: token});
            if(!session){
                return res.status(401).json({success: false, message: localization.translate('authentication failed, please try to login again')});
            } else {
                if(session.isActive){
                    let isValid: boolean = session.isIndefinite === true || parseInt(session.expireTime, 10) > Date.now();
                    if(isValid){
                        let json = null;
                        try {
                            json = JSON.parse(decryption(session.token));
                        } catch(e){
                            console.log(e);
                        }
                        if(json != null){
                          let user = await User.findOne({_id: json.id, delete: false}).populate([{path: 'permissions'}, {path: 'users'}, {path: 'access'}, {path: 'companians'}, {path: 'playlists', populate: {path: 'items', model: 'Media'}}]);
                          if(user){
                              req.auth = user;
                              req.token = session.token;
                              return next();
                          } else {
                              return res.status(401).json({success: false, message: localization.translate("authentication failed, please try to login again")});
                          }
                        } else {
                            return res.status(401).json({success: false, message: localization.translate("authentication failed, please try to login again")});
                        }
                    } else {
                        return res.status(401).json({success: false, message: localization.translate("authentication failed, please try to login again")});
                    }
                } else {
                    return res.status(401).json({success: false, message: localization.translate("authentication failed, please try to login again")});
                }
            }
        }
    } else {
        return next();
    }
}

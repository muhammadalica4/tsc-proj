import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { secure } from '../config';
import { Permission, User } from '../models';
import { localization, pathMatcher } from '../helpers';
const { ObjectId } = Types;
const pathMatch = pathMatcher({
  sensitive: false,
  strict: false,
  end: false
});

export async function initPermissionVerification(req: Request, res: Response, next: NextFunction): Promise<any> {
  if(req.secureRoute && req.secureRoute.requestAuthentication && req.secureRoute.requestPermissions){
    if(req.auth.role === 'admin'){
      if(req.secureRoute.url === secure.deleteUser.url && req.secureRoute.method === secure.deleteUser.method){
        if(req.originalUrl.split('/').slice(-1)[0].toString() === req.auth._id.toString()){
           return res.status(403).json({success: false, message: localization.translate('permission denied')});
        }
      }
      return next();
    } else {
      let permission = await Permission.findOne({url: req.secureRoute.url, method: req.secureRoute.method, delete: false});
      if(permission){
        let filtered = req.auth.permissions.filter((perm: any) => {
          return perm!._id!.toString() === permission!._id!.toString();
        });
        if(filtered.length > 0){
          try {
            let matcher = pathMatch(req.secureRoute.url);
            let matched = matcher(req.originalUrl);
            if(matched.hasOwnProperty("userId")){
              if(req.method === 'DELETE'){
                return res.status(403).json({success: false, message: localization.translate('permission denied')});
              } else if(req.auth.role === 'manager'){
                return next();
              } else {
                if(matched.userId === req.auth._id){
                  return next();
                } else {
                  let access = await User.findOne({_id: new ObjectId(matched.userId), delete: false});
                  if(access){
                    let filtered2 = req.auth.access.filter((acc: any) => acc!._id!.toString() === access!._id!.toString());
                    if(filtered2.length > 0){
                      return next();
                    } else {
                      return res.status(403).json({success: false, message: localization.translate('permission denied')});
                    }
                  } else {
                    return res.status(403).json({success: false, message: localization.translate('permission denied')});
                  }
                }
              }
            } else {
              return next();
            }
          } catch (e){
            console.log(e);
            return res.status(403).json({success: false, message: localization.translate('permission denied')});
          }
        } else {
          return res.status(403).json({success: false, message: localization.translate('permission denied')});
        }
      } else {
        return res.status(403).json({success: false, message: localization.translate('permission denied')});
      }
    }
  } else {
    return next();
  }
}

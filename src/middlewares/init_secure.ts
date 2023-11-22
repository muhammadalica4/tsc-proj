import { Request, Response, NextFunction } from 'express';
import { pathToRegexp } from 'path-to-regexp';
import { secure, SecureRoute } from '../config';

export async function initSecureRoutes(req: Request, res: Response, next: NextFunction): Promise<any> {
	try {
		let filtered = Object.values(secure).filter((route: SecureRoute) => {
				let regexp = pathToRegexp(route.regex);
				return regexp.exec(req.originalUrl) !== null && route.method === req.method;
			}
		);
		if(filtered.length){
			req.secureRoute = filtered[0];
		} else {
			let sRoute: SecureRoute = {
			    url: '*',
			    method: 'ALL',
			    requestPermissions: false,
			    requestAuthentication: false,
			    regex: '*'
			}
			req.secureRoute = sRoute;
		}
	} catch (e){
		let sRoute: SecureRoute = {
		    url: '*',
		    method: 'ALL',
		    requestPermissions: false,
		    requestAuthentication: false,
		    regex: '*'
		}
		req.secureRoute = sRoute;
	}
  return next();
}

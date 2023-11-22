import { Application, Request, Response, NextFunction } from 'express';
import { tokenVerification } from './auth_middlewares';
import { initSecureRoutes } from './init_secure';
import { initPermissionVerification } from './check_permissions';

function initMiddlewares(app: Application): void {
	app.use(initSecureRoutes);
	app.use(tokenVerification);
	// app.use(initPermissionVerification);
	// app.use(function(req: Request, res: Response, next: NextFunction): any {
	// 		console.log(`${req.method}: ${req.originalUrl}`);
	//     return next();
	// });
}

export default initMiddlewares;

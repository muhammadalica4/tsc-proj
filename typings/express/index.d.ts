declare namespace Express {
	export interface Request {
		auth: any,
		user: any,
		token: any,
		secureRoute: any,
		registeredRoutes: any
	}
}

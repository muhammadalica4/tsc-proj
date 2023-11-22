import express from 'express';
import path from 'path';
import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import { localization } from './helpers';
import cors from 'cors';
import { app, server } from './socket';
import { base_url, port, uploadsDir, prefix, secure } from './config';
import { initDatabase } from './models';
import router from './routes';
import initMiddlewares from './middlewares';

initDatabase();
app.use(morgan('dev'));
app.disable('etag');
app.use(cors());
app.use(bodyParser.urlencoded({extended: true, limit: '100mb'}));
app.use(bodyParser.json({limit: '100mb'}));
initMiddlewares(app);

app.use(router);

if(process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'underdevelopment' ){
    app.get(`${prefix}/`, (req: Request, res: Response) => {
        return res.json({message: localization.translate('something working great here')});
    });

    app.use("/uploads", express.static(uploadsDir));
}

app.head(secure.validateSession.url, function(req: Request, res: Response){
    res.status(200).end();
});

server.listen(port, ()=>{
	console.log(`server running on ${base_url}`);
    console.log(`server running on ${port}`);
});

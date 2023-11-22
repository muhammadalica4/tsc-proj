import multer from 'multer';
import { Express } from 'express';
import fs from 'fs';
import path from 'path';
import { uploadsDir } from '../config/config';
if(!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

const multipart = multer({
    storage: multer.diskStorage({
        destination: function(req: Express.Request, file: Express.Multer.File, next: any){
            next(null, uploadsDir);
        }, filename: function(req: Express.Request, file: Express.Multer.File, next: any){
            next(null, Date.now() + path.extname(file.originalname));
        }
    })
});

export default multipart;

import { Request, Response, NextFunction } from 'express';
import en from '../lang/en.json';

interface looseObject { [key: string]: Object };

class Localization {
	defaultLang: string;
	currentLang: string;
	languages: any;

	constructor(languages: any = null, lang: string = 'en'){
		if(languages !== null){
			this.languages = languages;
		}
		this.defaultLang = lang;
		this.currentLang = lang;
	}

	setLang = (req: Request, res: Response, next: NextFunction) => {
		if(req.query.lang !== undefined){
			this.currentLang = req.query.lang.toString();
		} else {
			this.currentLang = this.defaultLang.toString();
		}
		next();
	}

	addLang = (lang: string, data: Object) => {
		this.languages[lang] = data;
	}

	translate = (message: string) => {
		if(this.languages.hasOwnProperty(this.currentLang)){
			if(this.languages[this.currentLang].hasOwnProperty(message)){
				return this.languages[this.currentLang][message];
			}
		}
		// if(this.languages[this.currentLang] !== undefined){
		// 	if(this.languages[this.currentLang][message] !== undefined){
		// 		return this.languages[this.currentLang][message];
		// 	}
		// }
		return message;
	}
}

export default new Localization({ 'en': en });

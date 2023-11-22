import md5 from 'md5';
import sha1 from 'sha1';
import CryptoJS from 'crypto-js';
import mm from 'musicmetadata';
import SendMail from 'sendmail';
import { hash, encryptionKey, noreply } from '../config/config';
import { pathToRegexp } from 'path-to-regexp';
const sendMail = SendMail({});

export function hasher(algo: string, text: string): string {
	let h = "";
	switch(algo){
		case 'md5':
			h = md5(text);
		break;
		case 'sha1':
			h = sha1(text);
		break;
		default:
			h = md5(text);
		break;
	}
	return h;
}


export function generateActivationToken(): string {
    return hasher(hash, Date.now().toString());
}

export function toUcWords(str: string): string {
    return (str + '').replace(/^(.)|\s+(.)/g, function ($1) {
        return $1.toUpperCase()
    });
}

export function getMilliSecondsOfMonth(): number {
    return 30 * 24 * 60 * 60 * 1000;
}

export function getFileExtension(filename: string, show: boolean = false): string {
    let na = filename.split(".");
    return (show ? "." : "") + na[(na.length-1)];
}

export function encryption(text: string): string {
    let str = Buffer.from(text).toString('base64');
	return CryptoJS.AES.encrypt(str, encryptionKey).toString();
}

export function decryption(text: string): string {
    let bytes = CryptoJS.AES.decrypt(text, encryptionKey);
    let dec = bytes.toString(CryptoJS.enc.Utf8);
    return Buffer.from(dec, 'base64').toString('ascii');
}

export function readMusicMetaData(stream: any): Promise<any> {
	return new Promise((resolve, reject) => {
		mm(stream, function(err, data){
			if(err){
				stream.destroy();
				reject();
			} else {
				stream.destroy();
				resolve(data);
			}
		});
	});
}

export function pathMatcher(options?: object): Function {
  options = options || {}

  return function (path: string): Function {
    var keys: any = []
    var re: any = pathToRegexp(path, keys, options)

    return function (pathname: string, params: {[key: string]: any}): object {
      var m = re.exec(pathname)
      if (!m) return {}

      params = params || {}

      var key, param
      for (var i = 0; i < keys.length; i++) {
        key = keys[i]
        param = m[i + 1]
        if (!param) continue
        params[key.name] = decodeURIComponent(param)
        if (key.repeat) params[key.name] = params[key.name].split(key.delimiter)
      }

      return params
    }
  }
}

export function sendMailToCompanian(to: string, options: {[key: string]: any} = {}){
	let html = `<!Doctype html><html><body>You've been invited to Companian App.<br>your login details are as follows<br>username: ${options.username}<br>password: ${options.password}<br><br>click the following link to download and install the companian app to your mobile<br><a href="${options.link}">Download</a></body></html>`;
	let html2 = `<!Doctype html><html><body>You've been invited to Companian App.<br><br>click the following link to download and install the companian app to your mobile<br><a href="#">Download</a></body></html>`;
	let contents: string = Object.keys(options).length > 0 ? html : html2;
	sendMail({from: noreply, to: to, subject: 'Welcome to Companian', html: contents}, function(){
		console.log('mail sent');
	});
}

export const ALPHA_NO_WHITESPACE = /^((?!\s)[A-Za-z]+(?!\s))$/;
export const ALPHA = /^[A-Za-z]+$/;
export const IMEI = /^(\d){15}$/;
export const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
export const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])((?=.*[\~\!\@\#\$\%\^\&\*\(\)\_\+\|\?\<\>\{\}\]\[])?)(?=.*[A-Z])[0-9a-zA-Z\~\!\@\#\$\%\^\&\*\(\)\_\+\|\?\<\>\{\}\]\[]{8,}$/;
export const PHONE_REGEX = /^(((923)[0-4][0-9][0-9]{7})|(6[0-9]{8}))$/;
export const SITE_URL_REGEX = /^((\/(:?)([A-Za-z0-9]+)(\/?))+)$/;
export const BEGINING_MSG_URL_REGEX = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;

interface looseObject {
  [key: string]: any;
}

const Patterns: looseObject = {
  ALPHA_NO_WHITESPACE,
  IMEI,
  EMAIL_REGEX,
  PASSWORD_REGEX,
  ALPHA,
  PHONE_REGEX,
  SITE_URL_REGEX,
  BEGINING_MSG_URL_REGEX
};

export default Patterns;

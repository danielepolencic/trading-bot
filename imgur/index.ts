import * as Request from 'request';
import * as Fs from 'fs';
import * as Http from 'http';
import * as Path from 'path';
import * as Joi from 'joi';

const profileSchema = Joi.object({
  url: Joi.string().required(),
  clientId: Joi.string().required(),
  clientSecret: Joi.string().required(),
  pin: Joi.string().required(),
  refreshToken: Joi.string().required()
});

let imgurProfile: Joi.ValidationResult<IProfile> | void = undefined;

if (!!process.env.IMGUR_PROFILE) {
  imgurProfile = Joi.validate<IProfile>(JSON.parse(`${process.env.IMGUR_PROFILE}`), profileSchema);

  if (!!imgurProfile.error) {
    console.log('Invalid Imgur profile', imgurProfile.error);
    process.exit(1);
  }
}

export function uploadNow({fileName, description}: {fileName: string, description: string}): Promise<IImage> {
  if (imgurProfile && imgurProfile.value) {
    const file = Fs.readFileSync(Path.resolve(fileName)).toString('base64');
    return upload(refreshToken)(imgurProfile.value, {file, albumId: 'D1klw', description});
  }

  return Promise.reject('Invalid imgur profile');
}

export function getToken({clientId, clientSecret, pin, url}: IProfile) : Promise<IToken> {
  return new Promise<IToken>((resolve, reject) => {
    Request.post({
      url: `${url}/oauth2/token`,
      json: {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'pin',
        pin
      }
    }, (err: Error, incomingMessage: Http.IncomingMessage, response: ITokenResponse | BasicResponse) => {
      if (!!err) {
        return reject(new Error(`
** Could not retrieve the token for CLIENT_ID=${clientId} **
${err.name}: ${err.message}
        `.trim()));
      }

      if (incomingMessage.statusCode !== 200) {
        const error: IErrorResponse = (response as BasicResponse).data as IErrorResponse;
        return reject(new Error(`
** Could not retrieve the token for CLIENT_ID=${clientId} **

POST ${url}/oauth2/token
{
  "client_id": "${clientId}",
  "client_secret": "${clientSecret}",
  "grant_type": "pin",
  "pin": "${pin}"
}

${incomingMessage.statusCode}
${error.error}
        `.trim()));
      }

      const token = response as ITokenResponse;
      resolve({
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        accountUsername: token.account_username
      });
    });
  });
}

export function refreshToken({clientId, clientSecret, refreshToken, url}: IProfile): Promise<IToken> {
  return new Promise<IToken>((resolve, reject) => {
    Request.post({
      url: `${url}/oauth2/token`,
      json: {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }
    }, (err: Error, incomingMessage: Http.IncomingMessage, response: ITokenResponse | BasicResponse) => {
      if (!!err) {
        return reject(new Error(`
** Could not refresh the token for CLIENT_ID=${clientId} **
${err.name}: ${err.message}
        `.trim()));
      }

      if (incomingMessage.statusCode !== 200) {
        const error = (response as BasicResponse).data as IErrorResponse;
        return reject(new Error(`
** Could not refresh the token for CLIENT_ID=${clientId} **

POST ${url}/oauth2/token
{
  "client_id": "${clientId}",
  "client_secret": "${clientSecret}",
  "refresh_token": "${refreshToken}",
  "grant_type": "refresh_token"
}

${incomingMessage.statusCode}
${error.error}
        `.trim()));
      }

      const token = response as ITokenResponse;
      resolve({
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        accountUsername: token.account_username
      });
    });
  });
}

export function upload(tokenFactory: (profile: IProfile) => Promise<IToken>) {
  return (profile: IProfile, {file, albumId, description}: {file: string, albumId: string, description: string}): Promise<IImage> => {
    return tokenFactory(profile).then(token => {
      return new Promise<IImage>((resolve, reject) => {
        const name = (new Date()).toISOString();
        Request({
          url: `${profile.url}/3/upload`,
          method: 'POST',
          json: {
            image: file,
            name,
            album: albumId,
            description
          },
          headers: {
            Authorization: `Bearer ${token.accessToken}`
          }
        }, (err: Error, incomingMessage: Http.IncomingMessage, response: BasicResponse) => {
          if (!!err) {
            return reject(new Error(`
** Could not upload the image ${file} to album ${albumId} **
${err.name}: ${err.message}
            `.trim()));
          }

          if (incomingMessage.statusCode !== 200) {
            const error = response.data as IErrorResponse;
            return reject(new Error(`
** Could not upload the image ${file} to album ${albumId} **

POST ${profile.url}/3/upload
{
  "image": "${file}" (content),
  "name": "${name}",
  "album": "${albumId}"
}

${incomingMessage.statusCode}
${error.error}
            `.trim()));
          }

          const image = response.data as IImageDate;
          resolve({link: image.link});
        });
      });
    });
  };
}

export interface IImage {
  link: string
}

export interface IToken {
  accessToken: string
  refreshToken: string
  accountUsername: string
}

export interface IProfile {
  url: string
  clientId: string
  clientSecret: string
  pin?: string
  refreshToken?: string
}

interface ITokenResponse {
  access_token: string,
  expires_in: number,
  token_type: string,
  scope: null,
  refresh_token: string,
  account_id: number,
  account_username: string
}

interface IImageDate {
  id: string
  title: null
  description: null
  datetime: number
  type: string
  animated: boolean
  width: number
  height: number
  size: number
  views: number
  bandwidth: number
  vote: null
  favorite: boolean
  nsfw: null
  section: null
  account_url: null
  account_id: number
  is_ad: boolean
  in_gallery: boolean
  deletehash: string
  name: string
  link: string
}

interface BasicResponse {
  data: IImageDate | IErrorResponse | boolean | null | number
  success: boolean
  status: number
}

interface IErrorResponse {
  error: string
  request: string
  method: string
}
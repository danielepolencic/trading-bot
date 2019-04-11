export const invalidPin = `{
  "data": {
    "error": "Invalid Pin",
    "request": "/oauth2/token",
    "method": "POST"
  },
  "success": false,
  "status": 400
}`;

export const accessToken = `{
  "access_token": "86a88c7c32b2b18e52d6d1fe2615a1df50f3b088",
  "expires_in": 2419200,
  "token_type": "bearer",
  "scope": null,
  "refresh_token": "bcec3c6f8e8746da892c01abd1066d18878df7bd",
  "account_id": 6561500,
  "account_username": "danielepolencic"
}`;

export const refreshToken = `{
  "access_token": "78caed075ab65bd6204aae1b9efdf1ad7289e5d5",
  "expires_in": 2419200,
  "token_type": "bearer",
  "scope": null,
  "refresh_token": "fb9841a1d8bab439a2e02bf871c6d60b5b4a61f9",
  "account_id": 6561500,
  "account_username": "danielepolencic"
}`;

export const uploadSuccessful = `{
  "data": {
    "id": "WA3nwhv",
    "title": null,
    "description": null,
    "datetime": 1477231186,
    "type": "image/jpeg",
    "animated": false,
    "width": 720,
    "height": 708,
    "size": 47115,
    "views": 0,
    "bandwidth": 0,
    "vote": null,
    "favorite": false,
    "nsfw": null,
    "section": null,
    "account_url": null,
    "account_id": 6561500,
    "is_ad": false,
    "in_gallery": false,
    "deletehash": "hAjlqGOXnBGNTmq",
    "name": "2016-10-23T13:59:45.739Z",
    "link": "http://i.imgur.com/WA3nwhv.jpg"
  },
  "success": true,
  "status": 200
}`;
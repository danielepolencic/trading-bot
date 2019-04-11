FROM node:6.9.1

ENV PORT=4000
ENV NODE_ENV=production

WORKDIR /app
COPY package.json /app
RUN npm install --production=false --silent
COPY . /app

RUN npm run build
RUN npm test

EXPOSE 4000
CMD ["npm", "start"]

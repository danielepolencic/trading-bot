FROM node:6.9.1

ENV PORT=8080
ENV REDIS_HOST=localhost
ENV REDIS_PORT=6379

RUN npm install -g redis-commander --silent

CMD redis-commander -p $PORT --redis-port $REDIS_PORT --redis-host $REDIS_HOST --http-u mago --http-p merlino

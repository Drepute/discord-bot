FROM node:18.1.0-alpine3.14

RUN apk add --no-cache curl

WORKDIR /app
COPY package*.json yarn.lock .
RUN yarn install

COPY . .

ENTRYPOINT ["node", "index.js" ]

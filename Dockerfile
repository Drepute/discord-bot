FROM node:18.1.0-alpine3.14

RUN apk add --no-cache curl

WORKDIR /app
COPY . .
RUN yarn install

ENTRYPOINT ["node", "index.js" ]


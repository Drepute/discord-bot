# Install libs
FROM node:18-alpine3.15 AS deps

WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn install --frozen-lock

# Copy libs and run app
FROM node:18-alpine3.15

WORKDIR /app

RUN apk add --no-cache curl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENTRYPOINT ["node", "index.js" ]

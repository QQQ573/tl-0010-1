FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install json-server

COPY mock ./mock

EXPOSE 3001

CMD ["npx", "json-server", "--watch", "mock/db.json", "--port", "3001", "--host", "0.0.0.0", "--middlewares", "mock/middleware.js"]

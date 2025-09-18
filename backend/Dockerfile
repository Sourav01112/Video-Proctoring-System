FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY ../shared/package*.json ../shared/

RUN npm ci --only=production

COPY . .
COPY ../shared ../shared

RUN npm run build

EXPOSE 8000
CMD ["npm", "start"]
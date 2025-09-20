FROM node:22-alpine as build

ARG VITE_API_URL
ARG VITE_SOCKET_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN echo "VITE_API_URL is: $VITE_API_URL"
RUN echo "VITE_SOCKET_URL is: $VITE_SOCKET_URL"

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM node:22-alpine

RUN npm install -g serve

WORKDIR /app
COPY --from=build /app/dist ./dist

CMD ["serve", "-s", "dist", "-l", "3000"]
FROM node:22-alpine AS build
WORKDIR /app

COPY src/AutoWrap.Platform.Web/package.json ./
RUN npm install

COPY src/AutoWrap.Platform.Web/ ./
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY src/AutoWrap.Platform.Web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

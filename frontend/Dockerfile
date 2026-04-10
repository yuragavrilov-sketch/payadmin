FROM node:20-alpine AS build

ARG VITE_KEYCLOAK_URL=/keycloak
ARG VITE_KEYCLOAK_REALM=svcmgr
ARG VITE_KEYCLOAK_CLIENT_ID=payadmin-frontend

ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm config set strict-ssl false && npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

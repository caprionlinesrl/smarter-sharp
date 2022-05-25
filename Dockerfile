FROM node:16.15.0-stretch-slim
LABEL maintainer="Alessandro Astarita <aleast@caprionline.it>"

WORKDIR /srv/smarter-sharp
COPY . /srv/smarter-sharp
RUN NODE_ENV=prod npm install

STOPSIGNAL SIGTERM
EXPOSE 3003
CMD node /srv/smarter-sharp/src/app.js

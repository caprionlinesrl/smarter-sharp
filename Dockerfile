FROM node:16.15.0-stretch-slim AS builder

WORKDIR /srv/smarter-sharp
COPY . /srv/smarter-sharp
RUN NODE_ENV=prod npm install

WORKDIR /srv/smarter-sharp/node_modules/sharp

RUN mkdir /tmp/sharp

RUN if [ "$(uname -m)" = "aarch64" ]; then \
    npm install --arch=arm64 --platform=linux --target=14 ; \
    mkdir -p /tmp/sharp/build/Release ; \
    cp build/Release/sharp-linux-arm64v8.node /tmp/sharp/build/Release ; \
    mkdir -p /tmp/sharp/vendor/8.12.2/linux-arm64v8/lib ; \
    cp vendor/8.12.2/linux-arm64v8/lib/libvips-cpp.so.42 /tmp/sharp/vendor/8.12.2/linux-arm64v8/lib ; \
fi

FROM node:16.15.0-stretch-slim
LABEL maintainer="Alessandro Astarita <aleast@caprionline.it>"

WORKDIR /srv/smarter-sharp
COPY . /srv/smarter-sharp
RUN NODE_ENV=prod npm install

COPY --from=builder /tmp/sharp /srv/smarter-sharp/node_modules/sharp

STOPSIGNAL SIGTERM
EXPOSE 3003
CMD node /srv/smarter-sharp/src/app.js

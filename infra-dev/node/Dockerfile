ARG DEBIAN_FRONTEND=noninteractive
ARG APTGET_ARGS="--no-install-recommends -y"

FROM node:16.15.0-stretch-slim
LABEL maintainer="Alessandro Astarita <aleast@caprionline.it>"
ARG DEBIAN_FRONTEND
ARG APTGET_ARGS

RUN apt-get update \
    && apt-get $APTGET_ARGS install \
        ca-certificates \
        procps \
        net-tools \
        dialog \
        sudo \
        telnet \
        ssh \
        wget \
        curl \
        bzip2 \
        unzip \
        vim \
        less \
        pv \
        diffutils \
        diffstat \
        patch \
        git \
    && apt-get $APTGET_ARGS clean

RUN npm install -g nodemon

RUN echo root:dev | chpasswd && echo node:dev | chpasswd

STOPSIGNAL SIGTERM
EXPOSE 3003
CMD nodemon /srv/smarter-sharp/src/app.js

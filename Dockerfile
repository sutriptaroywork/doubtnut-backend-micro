FROM node:12-alpine

RUN mkdir /app
WORKDIR /app

ENV CHROME_BIN="/usr/bin/chromium-browser" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

RUN set -x \
    && apk update \
    && apk upgrade \
    && apk add --no-cache \
    udev \
    ttf-freefont \
    chromium

RUN apk add --no-cache ffmpeg

COPY package*.json ./

RUN npm ci

ARG DD_VERSION
ENV DD_VERSION=$DD_VERSION

COPY . .

RUN npm run build && npm prune --production

ENV NODE_ENV=production
CMD ["npm", "start"]

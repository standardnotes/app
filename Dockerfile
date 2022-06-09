FROM ruby:2.7.4-alpine3.14

ARG USERNAME=snjs
ARG UID=1001
ARG GID=$UID

RUN apk add --update --no-cache \
    alpine-sdk \
    nodejs-current \
    python3 \
    git \
    yarn \
    tzdata

RUN addgroup -S $USERNAME -g $GID && adduser -D -S $USERNAME -G $USERNAME -u $UID

WORKDIR /app/

RUN chown -R $UID:$GID .

USER $USERNAME

COPY --chown=$UID:$GID package.json yarn.lock /app/

COPY --chown=$UID:$GID packages/web/package.json /app/packages/web/package.json
COPY --chown=$UID:$GID packages/web-server/package.json /app/packages/web-server/package.json

RUN yarn install

COPY --chown=$UID:$GID . /app

RUN gem install bundler

RUN yarn build

EXPOSE 3000

ENTRYPOINT [ "./docker/entrypoint.sh" ]

CMD [ "start" ]

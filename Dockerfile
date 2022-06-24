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

WORKDIR /app

RUN chown -R $UID:$GID .

USER $USERNAME

COPY --chown=$UID:$GID . .

RUN yarn install

RUN gem install bundler

RUN yarn build:web-server

EXPOSE 3000

ENTRYPOINT [ "./docker/entrypoint.sh" ]

CMD [ "start" ]

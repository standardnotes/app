FROM ruby:2.7.1-alpine

ARG UID=1000
ARG GID=1000

RUN addgroup -S webapp -g $GID && adduser -D -S webapp -G webapp -u $UID

RUN apk add --update --no-cache \
    alpine-sdk \
    nodejs \
    python2 \
    git \
    nodejs-npm \
    tzdata

WORKDIR /app/

RUN chown -R $UID:$GID .

USER webapp

COPY --chown=$UID:$GID package.json package-lock.json Gemfile Gemfile.lock /app/

COPY --chown=$UID:$GID vendor /app/vendor

RUN npm ci

RUN gem install bundler && bundle install

COPY --chown=$UID:$GID . /app/

RUN npm run bundle

RUN bundle exec rails assets:precompile

EXPOSE 3000

ENTRYPOINT [ "./docker/entrypoint.sh" ]

CMD [ "start" ]

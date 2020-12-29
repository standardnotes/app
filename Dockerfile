FROM ruby:2.7.1-alpine3.12

ARG UID=1000
ARG GID=1000

RUN addgroup -S webapp -g $GID && adduser -D -S webapp -G webapp -u $UID

RUN apk add --update --no-cache \
    alpine-sdk \
    nodejs-current \
    python2 \
    git \
    nodejs-npm \
    yarn \
    tzdata

WORKDIR /app/

RUN chown -R $UID:$GID .

USER webapp

COPY --chown=$UID:$GID package.json yarn.lock Gemfile Gemfile.lock /app/

COPY --chown=$UID:$GID vendor /app/vendor

RUN yarn install --pure-lockfile

RUN gem install bundler && bundle install

COPY --chown=$UID:$GID . /app/

RUN yarn bundle

RUN bundle exec rails assets:precompile

EXPOSE 3000

ENTRYPOINT [ "./docker/entrypoint.sh" ]

CMD [ "start" ]

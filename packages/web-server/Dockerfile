FROM ruby:2.7.4-alpine3.14

RUN apk add --update --no-cache \
    alpine-sdk \
    nodejs-current \
    python3 \
    git \
    yarn \
    tzdata

WORKDIR /app/

COPY package.json yarn.lock /app/

COPY packages/web/package.json /app/packages/web/package.json

RUN yarn install --pure-lockfile

COPY packages/web-server/ packages/web/ /app/

RUN yarn --cwd packages/web bundle

RUN gem install bundler && bundle install

RUN bundle exec rails assets:precompile

EXPOSE 3000

ENTRYPOINT [ "./docker/entrypoint.sh" ]

CMD [ "start" ]

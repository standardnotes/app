FROM ruby:2.7.1-alpine3.12

RUN apk add --update --no-cache \
    alpine-sdk \
    nodejs-current \
    python2 \
    git \
    nodejs-npm \
    yarn \
    tzdata

WORKDIR /app/

COPY package.json yarn.lock Gemfile Gemfile.lock /app/

COPY vendor /app/vendor

RUN yarn install --pure-lockfile

RUN gem install bundler && bundle install

COPY . /app/

RUN yarn bundle

RUN bundle exec rails assets:precompile

EXPOSE 3000

ENTRYPOINT [ "./docker/entrypoint.sh" ]

CMD [ "start" ]

FROM ruby:2.3.1-alpine

RUN apk add -U alpine-sdk nodejs

WORKDIR /app/

COPY . /app/

RUN bundle install

RUN npm install

RUN npm install -g bower grunt

RUN bundle exec rake bower:install

RUN grunt

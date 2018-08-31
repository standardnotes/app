###
# Build with 'docker build -t standard_notes_web.img .'
# Run with 'docker run -d -p 127.0.0.1:3000:3000 --name standard_notes_web --restart always standard_notes.img'
# If you need shell access, run 'docker exec -it standard_notes_web /bin/sh'
# Access from http://localhost:3000/
# Set up Nginx to terminate SSL with LetsEncrypt and proxy_pass to http://localhost:3000/
###

FROM ruby:alpine

RUN apk add --update --no-cache \
    alpine-sdk \
    nodejs \
    nodejs-npm \
    tzdata

WORKDIR /app/

COPY . /app/

RUN bundle install

RUN npm install

RUN npm install -g bower grunt

RUN bundle exec rake bower:install

RUN npm run build

EXPOSE 3000

ENTRYPOINT [ "./docker/entrypoint" ]

CMD [ "start" ]

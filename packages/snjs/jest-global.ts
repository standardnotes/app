//@ts-ignore
global['__VERSION__'] = global['SnjsVersion'] = require('./package.json').version
global['__IS_DEV__'] = global['isDev'] = process.env.NODE_ENV !== 'production'

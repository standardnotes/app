//= require_tree ./app

// css
import 'sn-stylekit/dist/stylekit.css';
import '../stylesheets/index.css.scss';

// Vendor
import 'angular';
import '../../../vendor/assets/javascripts/angular-sanitize';
import '../../../vendor/assets/javascripts/zip/deflate';
import '../../../vendor/assets/javascripts/zip/inflate';
import '../../../vendor/assets/javascripts/zip/zip';
import '../../../vendor/assets/javascripts/zip/z-worker';

// entry point
// eslint-disable-next-line import/first
import './app';

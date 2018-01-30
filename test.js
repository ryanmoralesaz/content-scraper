const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

request('https://news.ycombinator.com', function (error, response, html) {
  if (!error && response.statusCode == 200) {
    console.log(html);
  }
});
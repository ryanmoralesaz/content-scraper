    const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

let shirtPrices = []; // array to hold prices
let shirtTitles = []; // array to hold titles
let shirtImageUrls = []; // array to hold shirtimages
let shirtUrls = [];
let shirtDataHeaders = { // the headers for the csv
    title: "Title",
    price: "Price",
    imageUrl: "ImageUrl",
    url: "Url",
    time: "Time"
};
let shirtData = []; // the complete array of shirt data
let d = new Date(); // get the date
let month = d.getMonth() + 1; // set the month
let day = d.getDate(); // set the day
let year = d.getFullYear(); // set the year
let currentDate = "" + year + "-" + month + "-" + day; // concatenate date to correct order
let mikeshirturl = 'http://www.shirts4mike.com/shirts.php'; //shirt site entry point

// Thanks to chovy @ stack overflow 
//https://stackoverflow.com/questions/21194934/node-how-to-create-a-directory-if-doesnt-exist
if (!fs.existsSync("./data")) {
    fs.mkdirSync("./data"); // create the data folder it doesn't exist
}

let shirturlscrape = new Promise((resolve) => { // make a promise to find all of the shirturls
    request(mikeshirturl, (error, response, html) => { // request the shirt site
        if (!error) {
            const $ = cheerio.load(html); // use cheerio to scrape the page
            let shirtlinks = []; //make an array to hold the links to each shirt
            $('.products').filter(function() {
                let data = $(this);
                data.find('li a').each(function(i) { // scrape the hrefs from the shirt links
                    shirtlinks.push($(this).attr('href'));
                });
                let shirturls = shirtlinks.map((i) => {
                    return mikeshirturl.slice(0, 27) + i; // make a new array of the completed shirturls
                }); // end shirtlink map
                resolve(shirturls); // send the urls back to the promise
            }); // end products filter
        } else {
            console.log('There’s been a 404 error. Cannot connect to http://shirts4mike.com.');
        } 
        // end error check
    }); // end request url
}); // end the promise

let commaseparate = (callback) => { // functino to put data in csv format
    let keys = Object.keys(shirtDataHeaders);
    let values = Object.values(shirtDataHeaders);
    let result = values.join(",") + "\n";
    // Add the rows
    callback.forEach((obj) => {
        keys.forEach((k, ix) => {
            if (ix) result += ",";
            result += obj[k];
        });
        result += "\n";
    });
    shirtData = result;
    return shirtData;
};


shirturlscrape // following the promise chain to scrape shirt data
    .then(result => {
        result.map((i) => {
            request(i, (error, response, html) => { // request the shirt site
                if (!error) {
                    const $ = cheerio.load(html);
                    $('.shirt-details').filter(function() {
                        let data = $(this);
                        shirtPrices.push(data.find('.price').text()); //get shirt prices from price class element
                        let shirtTitle = String(data.children().first().clone().children().remove().end().text()); //get shirt titles from h1 element
                        shirtTitle = shirtTitle.replace(/,/g, " -"); // replace commas in titles with dashes to not confuse csv file
                        shirtTitles.push(shirtTitle); //push shirt titles to array
                        shirtUrls.push(i);
                    });
                    $('.shirt-picture').filter(function() {
                        let data = $(this);
                        shirtImageUrls.push('' + mikeshirturl.slice(0, 27) + data.find('img').attr('src')); // push shirt image urls to array
                    });

                    if (shirtPrices.length == result.length) {

                        for (let i = 0; i < result.length; i++) { //push each shirt data object to the final shirtdata array
                            shirtData.push({ title: shirtTitles[i], price: shirtPrices[i], imageUrl: shirtImageUrls[i], url: shirtUrls[i], time: currentDate });

                            if (shirtData.length == result.length) {
                                commaseparate(shirtData); // turn the data into csv formatting
                                fs.writeFile("./data/" + currentDate + '.csv', shirtData); // write the new csv file to the data folder
                            }
                        }
                    }
                }
            });
        });
    })




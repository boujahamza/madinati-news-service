const express = require('express');
const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');

var newsService = express();

newsService.get('/',function(req,res){
    var links = [];
    var page = req.query? req.query.page : 0;
    axios.get('https://www.bladi.net/rabat,333.html?debut_suite_rubrique=' + page*12) 
	.then(async function({ data }){ 
        console.log("Received request for news");
        var elements = await extractAllArticlesJSON(cheerio.load(data));
        links.push(elements);
        res.send('{"articles":'+links.toString()+'}');
        fs.writeFile("scraped.txt", links.toString(),()=>{})
    });
});

newsService.listen(process.env.PORT || 3001, function () {
    return console.log("Started news service server listening on port 3001");
});

const extractAllArticlesJSON = async function($){
    var article = {};
    var fullList = [];
    var titles = $("div.mbs > h2").map((_, h2) => $(h2).text()).toArray();
    var imageLinks = $("img.imglogo").map((_, img) => $(img).attr('src')).toArray();
    var links = $("div.grid3>a").map((_, a) => $(a).attr('href')).toArray();
    var shortDescs = $("div.mbs").map((_, div) => $(div).text()).toArray();

    for(i=0;i<12;i++){
        article = {};
        article["title"] = titles[i];
        article["imageLink"] = "https://www.bladi.net/"+imageLinks[i];
        article["link"] = "https://www.bladi.net/"+links[i];
        article["shortDesc"] = shortDescs[i].split(/\r?\n/)[6];
        article["fullDesc"] = await axios.get(article["link"]).then(function({data}){
            return extractArticleText(cheerio.load(data));
        });
        article["date"] = shortDescs[i].split(/\r?\n/)[3];
        fullList.push(article);
    }
    return JSON.stringify(fullList);
}

const extractArticleText = function($){
    return $("div.mtl.mbm > p").not(":has(strong)").map((_, p) => $(p).text()).toArray().toString();
}

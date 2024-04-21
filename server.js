import express from "express";
import bodyParser from "body-parser";
import axios, { all } from "axios";
import pg from "pg";


const API_URL = "https://openlibrary.org/search.json";
const ISBN_URL = "http://openlibrary.org/api/volumes/brief/"; // <id-type>/<id-value>.json"
const app = express();
const port = 3000;

var values = [];

function parseCodeBookInfo(resData){
    const keys = Object.keys(resData.records);
    const items = keys.map(key => {
        return resData.records[key];
    });
    var entries = items.map(item => {
        return {
            title: item.data.title,
            author: item.data.authors['0'].name,
            publishYear: item.publishDates[0],
            isbn: item.isbns[0],
            imgUrl: item.data.cover.medium,
        };
    });
    values = entries;

    return entries;
}

function parseBookInfo(resData){
    const numFound = resData['numFound'];
    const maxItems = numFound > 0 ? 10 : numFound;

    const allItems = resData['docs'].slice(0, maxItems);

    var parsedItems = allItems.filter(element => 'isbn' in element).map((element) => {
        if(element['isbn'])
        {
            return {
                title: element['title'],
                author: element['author_name'][0],
                publishYear: element['first_publish_year'],
                isbn: element['isbn'].length > 1 ? element['isbn'][0] : element['isbn'],
                imgUrl: "https://covers.openlibrary.org/b/isbn/" + (element['isbn'].length > 1 ? element['isbn'][0] : element['isbn']) + '-M.jpg',
    
            };
        }
        

    });

    console.log(parsedItems);
    return parsedItems;

}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.get('/', (req, res)=>{
    res.render('index.ejs');
});

app.get('/new', (req, res) => {
    res.render('new.ejs');
});

app.post('/advanced-search', async(req, res) => {
    console.log(req.body);

    const params = {
        title: req.body.title,
        author: req.body.author,
        language: req.body.language,
        publish_year: "[* TO " + req.body.publish_year + "]",
    }

    try {
        const response = await axios.get(API_URL, {
            params: params,
        });
        // TODO: Fix publish year parser
        var parsedResults = parseBookInfo(response.data);
        res.render('search-results.ejs', {searchResults: parsedResults});
    } catch (error) {
        console.error(error);
    }
});

app.post('/code-search', async (req, res) => {
    
    console.log(req.body);
    try {
        const response = await axios.get(ISBN_URL + req.body.codeType  + '/' + req.body.bookISBN + '.json');
        console.log(response.data);
        var parsedResults = parseCodeBookInfo(response.data);
        res.render('search-results.ejs', {searchResults: parsedResults});
    } catch (error) {
        console.error(error);
    }
    
});

app.post('/write-review', async (req, res) => {
    console.log(req.body);
    res.redirect('/');
});

app.listen(port, ()=>{
    console.log("Listening in port " + port)
});


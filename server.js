import express from "express";
import bodyParser from "body-parser";
import axios, { all } from "axios";
import pg from "pg";


const API_URL = "https://openlibrary.org/search.json";
const ISBN_URL = "http://openlibrary.org/api/volumes/brief/"; // <id-type>/<id-value>.json"
const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "books",
    password: "fulanitos25",
    port: 5432
});
db.connect();
var values = [];

async function getReviewedBooks(){
    const query = await db.query(
        "SELECT * FROM reviewed_books"
    );
    var books = query.rows;
    return books;
}

async function getQueryBookByItemNo(index){
    const query = await db.query("SELECT * FROM books_query WHERE no_item = $1;", 
    [index]);
    return query.rows[0];
}

async function cleanQueryBooks(){
    await db.query("DELETE FROM books_query");
}

async function saveBookQuery(books){
    await cleanQueryBooks();

    books.forEach((book, index) => {
        db.query("INSERT INTO books_query (title, author, publish_date, code_type, code, img_url, no_item) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
                    [book.title, book.author, book.publishYear, 'isbn', book.isbn, book.imgUrl, index])
    });
    
}

async function getQueryBooks(){
    const query = await db.query("SELECT * FROM books_query");
    console.log(query.rows);
    return query.rows;
}

async function saveBookReview(book){
    await db.query("INSERT INTO reviewed_books (title, author, publish_date, code_type, code, img_url, rating, review) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
                    [book.title, book.author, book.publish_date, book.code_type, book.code, book.img_url, book.rating, book.review]);
}

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
    console.log(entries);
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
    values = parsedItems;

    console.log(parsedItems);
    return parsedItems;

}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.get('/', async (req, res)=>{
    const books = await getReviewedBooks();
    console.log(books);
    res.render('index.ejs', {books: books});
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

        var parsedResults = parseBookInfo(response.data);

        // Database operations
        await saveBookQuery(parsedResults);

        res.redirect('/query-result');
    } catch (error) {
        //console.error(error);
        var flag = true;
        res.render('new.ejs', {activateAlert: flag});
    }
});

app.post('/code-search', async (req, res) => {
    
    console.log(req.body);
    try {
        const response = await axios.get(ISBN_URL + req.body.codeType  + '/' + req.body.bookISBN + '.json');
        console.log(response.data);
        var parsedResults = parseCodeBookInfo(response.data);
        saveBookQuery(parsedResults);
        res.redirect('/query-result');
        //res.render('search-results.ejs', {searchResults: parsedResults});
    } catch (error) {
        console.error(error);
    }
    
});

app.get('/query-result', async (req, res) => {
    const query_books = await getQueryBooks();
    console.log(query_books);
    res.render('search-results.ejs', {searchResults: query_books});
})

app.post('/write-review', async (req, res) => {
    //console.log(req.body);
    const selectedItem = await getQueryBookByItemNo(parseInt(req.body.selectedOption) - 1)
    console.log(selectedItem);
    res.render('write-review.ejs', {book: selectedItem});
});

app.post('/add-entry', async (req, res) => {
    const selectedItem = await getQueryBookByItemNo(parseInt(req.body.book_index));
    const entry = {
        title: selectedItem.title,
        author: selectedItem.author,
        publish_date: selectedItem.publish_date,
        code: selectedItem.code,
        code_type: selectedItem.codeType,
        img_url: selectedItem.img_url,
        rating: parseInt(req.body.rating),
        review: req.body.review
    };
    await saveBookReview(entry);
    res.redirect('/');
});

app.listen(port, ()=>{
    console.log("Listening in port " + port)
});


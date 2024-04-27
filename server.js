import express from "express";
import bodyParser from "body-parser";
import axios, { all } from "axios";
import pg from "pg";
import parse from 'postgres-date';

// return string as is
pg.types.setTypeParser(1114, str => str);

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


// Constants
const stars = [
    "⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"
];
const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Database operations
async function getReviewedBooks(orderBy){
    const query = await db.query(
        `SELECT * FROM reviewed_books ORDER BY ${orderBy} DESC;`
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
                    [book.title, book.author, book.publish_date, book.code_type, book.code, book.img_url, index])
    });
    
}

async function getQueryBooks(){
    const query = await db.query("SELECT * FROM books_query");
    //console.log(query.rows);
    return query.rows;
}

async function saveBookReview(book){
    await db.query("INSERT INTO reviewed_books (title, author, publish_date, code_type, code, img_url, rating, review) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
                    [book.title, book.author, book.publish_date, book.code_type, book.code, book.img_url, book.rating, book.review]);
}

async function deleteBookReview(id){
    await db.query("DELETE FROM reviewed_books WHERE id=$1", [id]);
}

async function getBookById(id){
    const book = await db.query("SELECT * FROM reviewed_books WHERE id=$1", [id]);
    //console.log(book.rows[0]);
    return book.rows[0];
}

async function updateBookReview(id, review, rating){
    await db.query("UPDATE reviewed_books SET review = $1, rating = $2 WHERE id=$3;", 
                    [review, rating, id]);
}
// Parsers
function parseCodeBookInfo(resData){
    const keys = Object.keys(resData.records);
    const items = keys.map(key => {
        return resData.records[key];
    });
    var entries = items.map(item => {
        return {
            title: item.data.title,
            author: item.data.authors['0'].name,
            publish_date: item.publishDates[0],
            code: item.isbns[0],
            code_type: 'isbn',
            img_url: item.data.cover.medium,
        };
    });
    
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
                publish_date: element['first_publish_year'],
                isbn: element['isbn'].length > 1 ? element['isbn'][0] : element['isbn'],
                img_url: "https://covers.openlibrary.org/b/isbn/" + 
                        (element['isbn'].length > 1 ? element['isbn'][0] : element['isbn']) + 
                        '-M.jpg',
                code_type: 'isbn',
            };
        }
    });

    //console.log(parsedItems); 
    return parsedItems;
}

function parseDate(timestamp){
    //console.log(typeof(timestamp) + " " + timestamp);
    const date = parse(timestamp);
    const output = months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
    return output;
}

function parseTimestamps(books){
    const newBooks = books.map(element => {
        var newElement = element;
        //console.log(element.modified_at);
        newElement.modified_at = parseDate(element.modified_at);
        return newElement
    });

    return newBooks;
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));



app.get('/', async (req, res)=>{
    var orderBy = "modified_at"
    if(req.query.orderBy){
        orderBy = req.query.orderBy;
    }


    var type = "";
    var alertMsg = "";
    if(req.query.message){
        alertMsg = req.query.message;
    }
    if(req.query.type){
        type = req.query.type;
    }
    
    const books = await getReviewedBooks(orderBy);
    const parsedBooks = parseTimestamps(books);
    res.render('index.ejs', 
        {books: parsedBooks, 
        stars: stars, 
        message: alertMsg,
        type:type,
        orderBy: orderBy});
});

app.get('/new', (req, res) => {
    res.render('new.ejs');
});

app.post('/advanced-search', async(req, res) => {
    //console.log(req.body);

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
    
    //console.log(req.body);
    try {
        const response = await axios.get(ISBN_URL + req.body.code_type  + '/' + req.body.bookISBN + '.json');
        //console.log(response.data);
        var parsedResults = parseCodeBookInfo(response.data);
        await saveBookQuery(parsedResults);
        res.redirect('/query-result');
        //res.render('search-results.ejs', {searchResults: parsedResults});
    } catch (error) {
        console.error(error);
    }
    
});

app.get('/query-result', async (req, res) => {
    const query_books = await getQueryBooks();
    //console.log(query_books);
    res.render('search-results.ejs', {searchResults: query_books});
})

app.post('/write-review', async (req, res) => {
    //console.log(req.body);
    const selectedItem = await getQueryBookByItemNo(parseInt(req.body.selectedOption) - 1)
    //console.log(selectedItem);
    res.render('write-review.ejs', {book: selectedItem});
});

app.post('/add-entry', async (req, res) => {
    try {
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

        var msg = encodeURIComponent("added-succesfully")
        res.redirect('/?message=' + msg);

    } catch (error) {
        var msg = encodeURIComponent("added-failed")
        res.redirect('/?message=' + msg);
    }
    
});

app.get('/remove', async (req, res) => {

    try {
        const id = req.query.id;
        await deleteBookReview(id);
        var msg = encodeURIComponent("Deleted-successfully");
        var type = encodeURIComponent("success");
        res.redirect(`/?message=${msg}&type=${type}`);
    } catch (error) {
        console.error(error);
        var msg = encodeURIComponent("Error deleting the entry");
        var type = encodeURIComponent("danger");
        res.redirect(`/?message=${msg}&type=${type}`);
    }
});

app.get('/edit', async (req, res) => {
    const id = req.query.id;
    const book = await getBookById(id);

    res.render('edit-review.ejs', {book: book});
});

app.post('/edit-entry', async (req, res) => {
    const review = req.body.review;
    const rating = parseInt(req.body.rating);
    const id = parseInt(req.body.id);
    //console.log(req.body);
    await updateBookReview(id, review, rating);

    res.redirect('/');
});

app.get('/post', async (req, res) => {
    const id = req.query.id;
    const book = await getBookById(id);

    res.render('post.ejs', {book: book});

})

app.listen(port, ()=>{
    console.log("Listening in port " + port)
});


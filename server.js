import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";


const API_URL = "https://openlibrary.org/search.json";
const ISBN_URL = "http://openlibrary.org/api/volumes/brief/"; // <id-type>/<id-value>.json"
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.get('/', (req, res)=>{
    res.render('index.ejs');
});

app.get('/new', (req, res) => {
    res.render('new.ejs');
});

app.post('/search-book', async (req, res) => {
    if(req.body.searchType === "title"){
        try {
            const response = await axios.get(API_URL, {
                params: {
                    title: req.body.bookTitle,
                }
            });
            console.log(response.data);
            res.send(response.data);
        } catch (error) {
            console.error(error);
        }
    } else if(req.body.searchType === "isbn"){
        try {
            const response = await axios.get(ISBN_URL + 'isbn/' + req.body.bookISBN + '.json');
            res.send(response.data);
        } catch (error) {
            console.error(error);
        }
        
    }
    //console.log(JSON.stringify(req.body));
    //const searchType = req.body.searchType;
    //console.log("Search Type: " + searchType);

    //res.send("Searching");
});

app.listen(port, ()=>{
    console.log("Listening in port " + port)
});


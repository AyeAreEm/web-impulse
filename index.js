// dependencies
const express = require('express');
const datastore = require('nedb');
const bcrypt = require('bcrypt');

// init dependencies
const app = express();
const accData = new datastore('accounts.nedb');
accData.loadDatabase();

const blogData = new datastore('blogs.nedb');
blogData.loadDatabase();

app.use(express.json());

app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static('views'));;

// routes
app.get('/', (req, res) => {
    blogData.find({}, (err, docs) => {
        res.render('index', {
            blogs: docs
        });
    });
});

// account tings
app.get('/sign-up', (req, res) => {
    res.render('signUp');
});

app.post('/sign-up', (req, res) => {
    try {
        accData.find({}, (err, docs) => {
            let found = docs.find(elem => elem.username == req.body.username);

            if (found == undefined) {
                hash(req.body.password).then(result => {
                    let username = req.body.username;
                    let data = { username, password: result };
                    accData.insert(data);
                    res.sendStatus(200);
                });
            } else if (found) {
                res.sendStatus(409);
            }
        });
    } catch {
        res.sendStatus(500);
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    try {
        accData.find({}, (err, docs) => {
            let found = docs.find(elem => {
                return elem.username == req.body.username && bcrypt.compareSync(req.body.password, elem.password)
            });

            if (found == undefined) {
                res.sendStatus(409);
            } else if (found) {
                res.sendStatus(200);
            }
        });
    } catch {
        res.sendStatus(500);
    }
});

// post tings
app.get('/create-post', (req, res) => {
    res.render('posting');
});

app.post('/create-post', (req, res) => {
    try {
        blogData.insert(req.body);
    } catch {
        res.sendStatus(409);
    }
});

app.get('/post/:id', (req, res) => {
    blogData.find({_id: req.params.id}, (err, docs) => {
        res.render('fullPost', {
            blog: docs
        });
    });
});

// hashing function
async function hash(password) {
    return await bcrypt.hash(password, 10);
}

const port = process.env.PORT || 5000;
app.listen(port);
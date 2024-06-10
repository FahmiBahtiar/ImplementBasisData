const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');

const app = express();
const port = 5000;
const methodOverride = require('method-override');


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'vina',
    password: 'vina',
    database: 'dbakademik'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});

// Routes
app.get('/', (req, res) => {
    const fetchMahasiswa = new Promise((resolve, reject) => {
        db.query('SELECT nim FROM mahasiswa', (err, results) => {
            if (err) reject(err);
            resolve(results);
        });
    });

    const fetchMataKuliah = new Promise((resolve, reject) => {
        db.query('SELECT kode_mk FROM matakuliah', (err, results) => {
            if (err) reject(err);
            resolve(results);
        });
    });

    Promise.all([fetchMahasiswa, fetchMataKuliah])
        .then(([mahasiswa, mataKuliah]) => {
            db.query('SELECT * FROM krs', (err, results) => {
                if (err) throw err;
                res.render('index', {
                    krsData: results,
                    mahasiswa: mahasiswa,
                    mataKuliah: mataKuliah
                });
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Error fetching data');
        });
});

app.post('/krs', (req, res) => {
    const { nim, kode_mk, kelp, ta, smt } = req.body;
    const sql = 'INSERT INTO krs (nim, kode_mk, kelp, ta, smt) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [nim, kode_mk, kelp, ta, smt], (err, result) => {
        if(err) {
            console.error(err);
            res.status(500).send('Error saving KRS entry');
        }else {
            console.log('KRS entry created');
            res.redirect('/');
        }
    });
});

// Render the update form
app.get('/krs/edit/:nim', (req, res) => {
    const nim = req.params.nim;

    const fetchKRS = new Promise((resolve, reject) => {
        db.query('SELECT * FROM krs WHERE nim = ?', [nim], (err, result) => {
            if (err){
                console.error(err);
                res.status(500).send('Error fetching KRS entry');
            }else if (nim === null || result.length === 0){
                res.status(404).send('KRS entry not found');
            }else{
                resolve(result[0]);
            }
        });
    });

    const fetchMahasiswa = new Promise((resolve, reject) => {
        db.query('SELECT nim FROM mahasiswa', (err, results) => {
            if (err){
                console.error(err);
                res.status(500).send('Error fetching Mahasiswa data');
            }else if (results.length === 0){
                res.status(404).send('No Mahasiswa data found');
            }else{
                resolve(results);
            }
        });
    });

    const fetchMataKuliah = new Promise((resolve, reject) => {
        db.query('SELECT kode_mk FROM matakuliah', (err, results) => {
            if (err){
                console.error(err);
                res.status(500).send('Error fetching Mata Kuliah data');
            }else if (results.length === 0){
                res.status(404).send('No Mata Kuliah data found');
            }else{
                resolve(results);
            }
        });
    });

    Promise.all([fetchKRS, fetchMahasiswa, fetchMataKuliah])
        .then(([krs, mahasiswa, mataKuliah]) => {
            res.render('edit', {
                krs: krs,
                mahasiswa: mahasiswa,
                mataKuliah: mataKuliah
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Error fetching data');
        });
});

// Handle the update submission
app.post('/krs/update/:nim', (req, res) => {
    const nim = req.params.nim;
    const {kode_mk, kelp, ta, smt } = req.body;
    const sql = 'UPDATE krs SET kode_mk = ?, kelp = ?, ta = ?, smt = ? WHERE nim = ?';
    db.query(sql, [kode_mk, kelp, ta, smt, nim], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error updating KRS entry');
        } else {
            console.log(`KRS entry for nim ${nim} updated`);
            res.redirect('/');
        }
    });
});

// delete the data
app.delete('/krs/delete/:nim/:kode_mk', (req, res) => {
    const nim = req.params.nim;
    const kode_mk = req.params.kode_mk;
    const sql = 'DELETE FROM krs WHERE nim = ? AND kode_mk = ?';
    db.query(sql, [nim, kode_mk], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error deleting KRS entry');
        } else {
            console.log(`KRS entry for nim ${nim} and kode_mk ${kode_mk} deleted`);
            res.redirect('/');
        }
    });
});


app.get('/krslog', (req, res) => {
    const {idlog, tgl, kode_status, keterangan, nim, kode_mk, kelp, ta, smt} = req.body;
    const sql = 'SELECT * FROM log_krs';
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.render('krslog', {
            krslogData: result
        });
    });
})

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

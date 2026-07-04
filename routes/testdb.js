const express = require('express');
const db = require('../service/db.js');
const router = express.Router();


router.get('/testdb', async (req, res) => {
    try {
        const [rows] = await db.query(
            'select * from Customer'
        );
        res.json([rows]);
    } catch (err) {
        console.error(err);
        res.status(500).json({error:"Database error"});
    }
});

router.get('/testing', async (req, res) => {
    try {
        const [rows] = await db.query('select * from sample_table');
        res.render('sampletb', {rows});
        console.log(rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({error:"Database Error"});
    }
})

module.exports = router;
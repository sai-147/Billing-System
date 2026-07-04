// routes/export.js
const express = require('express');
const { Parser } = require('json2csv');
const { pool, db } = require('../service/db.js');
const allowedTables = ["Firm_Table", "Invoices", "Cart", "Parts", "Tax", "Customer"];

const router = express.Router();

router.get('/exportcsv/:tableName', async (req, res) => {
    try {
        const { tableName } = req.params;

        // ✅ Validate table name
        if (!allowedTables.includes(tableName)) {
            return res.status(400).json({
                error: 'Invalid or unauthorized table'
            });
        }
        let sql;

        if (tableName === "Invoices") {
            sql = `
    SELECT i.*, c.*
    FROM Invoices i
    JOIN Cart c ON i.Invoice_No = c.Invoice_No
  `;
        } else {
            sql = `SELECT * FROM \`${tableName}\``;
        }
        // console.log(sql);


        // ✅ Query table safely
        const [rows] = await db.query(sql);
        // console.log(rows);

        if (!rows.length) {
            return res.status(404).json({
                message: 'No data found'
            });
        }

        // ✅ Convert to CSV
        const parser = new Parser();
        const csv = parser.parse(rows);

        // ✅ Send CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${tableName}.csv`
        );

        res.status(200).send(csv);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Failed to export CSV'
        });
    }
});

module.exports = router;

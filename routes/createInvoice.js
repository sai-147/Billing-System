const express = require('express');
const router = express.Router();
const { pool, db } = require('../service/db.js');

router.get('/select/InvoiceNo', async (req, res) => {
    const year = new Date().getFullYear();
    try {
        const [rows] = await db.query(
            `select count(*) as count from Invoices where Invoice_No Like ?`, [`INV-${year}-%`]
        );
        // console.log(rows);
        const next = rows[0].count + 1;
        const invoiceNo = `INV-${year}-${String(next).padStart(5, '0')}`;
        res.json({ invoiceNo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "err" });

    }


});

// GET /api/customers
router.get('/select/customers', async (req, res) => {
    try {
        const [rows] = await db.query(
            `select Id, Company_Name from Customer`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "err" });
    }
});

router.get('/select/:id/cin', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT CIN_No FROM Invoices WHERE Customer_Id = ?',
            [req.params.id]
        );
        res.json(rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "err" });
    }
});


router.get('/select/vehicleNo', async (req, res) => {
    try {
        const [rows] = await db.query(
            `select distinct(Vehicle_No) from Invoices`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "err" });
    }
});


router.get('/select/TransporterName', async (req, res) => {
    try {
        const [rows] = await db.query(
            `select distinct(Transporter_Name) from Invoices`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "err" });
    }
});

// GET /api/parts
router.get('/select/parts', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT Part_No, Part_Name, Price FROM Parts'
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "err" });
    }
});

router.post('/create/invoice', async (req, res) => {
    const conn = await db.getConnection();


    try {
        const {
            Invoice_No,
            Invoice_Date,
            BuyOrdDate,
            BuyOrdNo,
            E_Way_Bill_No,
            Customer_Id,
            CIN_No,
            Challan_No,
            ChallanDate,
            Vehicle_No,
            Transporter_Name,
            Bins,
            Bags,
            SGST_Included,
            CGST_Included,
            IGST_Included,
            Sub_Total,
            items
        } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }
        for (const item of items) {
            if (!item.Part_No || item.Qty <= 0) {
                return res.status(400).json({ error: 'Invalid cart item' });
            }
        }

        await conn.beginTransaction();

        await conn.query(
            `insert into Invoices (
                Invoice_No, Invoice_Date, Buyer_Order_Date, Buyer_Order_No, Challan_Date, E_Way_Bill_No, Customer_Id,
                CIN_No, Challan_No, SGST_Included, CGST_Included, IGST_Included,
                Bins, Bags, Vehicle_No, Sub_Total, Transporter_Name
            ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                Invoice_No,
                Invoice_Date,
                BuyOrdDate,
                BuyOrdNo,
                ChallanDate,
                E_Way_Bill_No || null,
                Customer_Id,
                CIN_No || null,
                Challan_No || null,
                SGST_Included || 0,
                CGST_Included || 0,
                IGST_Included || 0,
                Bins || null,
                Bags || null,
                Vehicle_No || null,
                Sub_Total,
                Transporter_Name

            ]

        );

        for (const item of items) {
            await conn.query(
                `insert into Cart (Invoice_No, Part_No, Qty)
                values ( ?, ?, ?)`,
                [
                    Invoice_No,
                    item.Part_No,
                    item.Qty
                ]
            );
        }
        await conn.commit();
        res.json({ success: true, Invoice_No });


    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: 'Invoice creation failed' });
    } finally {
        conn.release();
    }
});

module.exports = router;
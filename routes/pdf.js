const express = require('express');
const pdfService = require('../service/pdf-service.js');
const { initOutline } = require('pdfkit');
const router = express.Router();
const { pool, db } = require('../service/db.js');

// router.get('/invoice', (req, res, next) => {
//     const stream = res.writeHead(200, {
//         'Content-Type': 'application/pdf',
//         'Content-Disposition': 'inline;filename=invoice.pdf'
//     });
//     pdfService.buildPDF(
//         (chunk) => stream.write(chunk),
//         () => stream.end()
//     )
// })

router.get('/latest_invoice/:mode', async (req, res) => {
    try {
        // 🔹 Mode handling
        let content = 'inline';
        const mode = req.params.mode.trim().toLowerCase();

        if (mode === 'download') {
            content = 'attachment';
        } else if (mode !== 'preview') {
            return res.status(400).send('Invalid mode');
        }

        // 🔹 Invoice + Customer
        const [invoiceRows] = await db.query(`
            SELECT
                i.*,
                c.Company_Name as Customer_Company_Name,
                c.Billing_Address_Line_1,
                c.Billing_Address_Line_2,
                c.Billing_Address_Line_3,
                c.GSTIN AS Customer_GSTIN,
                c.State AS Customer_State,
                c.State_Code As Customer_State_Code,
                c.Shipping_Address_Line_1,
                c.Shipping_Address_Line_2,
                c.Shipping_Address_Line_3,
                c.Phone,
                c.Email,
                c.CIN_No As Customer_CIN_No,
                c.Pan_no As Customer_Pan_no
            FROM Invoices i
            JOIN Customer c ON i.Customer_Id = c.Id
            ORDER BY i.Invoice_Date DESC, i.Invoice_No DESC
            LIMIT 1
        `);

        if (invoiceRows.length === 0) {
            return res.status(404).send('No invoices found');
        }

        const invoice = invoiceRows[0];

        // 🔹 Cart + Parts + Tax
        const [itemsRows] = await db.query(`
            SELECT
                c.Part_No,
                c.Qty,
                p.Part_Name,
                p.Price,
                p.HSN,
                t.CGST,
                t.SGST,
                t.IGST
            FROM Cart c
            JOIN Parts p ON c.Part_No = p.Part_No
            JOIN Tax t ON p.HSN = t.HSN
            WHERE c.Invoice_No = ?
        `, [invoice.Invoice_No]);

        // 🔹 Firm details
        const [firmRows] = await db.query(`
            SELECT *
            FROM Firm_Table
            LIMIT 1
        `);

        const firm = firmRows[0] || {};

        // 🔹 Send PDF
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `${content}; filename=invoice_${invoice.Invoice_No}.pdf`
        });

        pdfService.buildPDF(
            chunk => res.write(chunk),
            () => res.end(),

            firm,
            invoice,
            {items: itemsRows}

        );

    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

router.get('/get_invoice/:invoice_no', async (req, res) => {
    try {
        // 🔹 Mode handling
        let content = 'inline';
        const invoice_no = req.params.invoice_no.trim();

        

        // 🔹 Invoice + Customer
        const [invoiceRows] = await db.query(`
            SELECT
                i.*,
                c.Company_Name as Customer_Company_Name,
                c.Billing_Address_Line_1,
                c.Billing_Address_Line_2,
                c.Billing_Address_Line_3,
                c.GSTIN AS Customer_GSTIN,
                c.State AS Customer_State,
                c.State_Code As Customer_State_Code,
                c.Shipping_Address_Line_1,
                c.Shipping_Address_Line_2,
                c.Shipping_Address_Line_3,
                c.Phone,
                c.Email,
                c.CIN_No As Customer_CIN_No,
                c.Pan_no As Customer_Pan_no
            FROM Invoices i
            JOIN Customer c ON i.Customer_Id = c.Id
            where i.Invoice_No = "${invoice_no}"
        `);

        if (invoiceRows.length === 0) {
            return res.status(404).send('No invoices found');
        }

        const invoice = invoiceRows[0];

        // 🔹 Cart + Parts + Tax
        const [itemsRows] = await db.query(`
            SELECT
                c.Part_No,
                c.Qty,
                p.Part_Name,
                p.Price,
                p.HSN,
                t.CGST,
                t.SGST,
                t.IGST
            FROM Cart c
            JOIN Parts p ON c.Part_No = p.Part_No
            JOIN Tax t ON p.HSN = t.HSN
            WHERE c.Invoice_No = ?
        `, [invoice.Invoice_No]);

        // 🔹 Firm details
        const [firmRows] = await db.query(`
            SELECT *
            FROM Firm_Table
            LIMIT 1
        `);

        const firm = firmRows[0] || {};

        // 🔹 Send PDF
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `${content}; filename=invoice_${invoice.Invoice_No}.pdf`
        });

        pdfService.buildPDF(
            chunk => res.write(chunk),
            () => res.end(),

            firm,
            invoice,
            {items: itemsRows}

        );

    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});


module.exports = router;
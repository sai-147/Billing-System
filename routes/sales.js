const express = require('express');
const router = express.Router();
const { pool, db } = require('../service/db.js');


router.get('/sales', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      Customer_Id,
      vehicleNo,
      ewayBillNo,
      sortBy = 'Invoice_No',
      order = 'DESC',
      Count = 10,
      page = 1
    } = req.query;
    // console.log(req.query)
    const limit = Number(Count);
    const offset = (page - 1) * limit;

    let whereSql = ` WHERE 1=1 `;
    const params = [];

    if (startDate) {
      whereSql += ` AND i.Invoice_Date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      whereSql += ` AND i.Invoice_Date <= ?`;
      params.push(endDate);
    }

    if (Customer_Id) {
      whereSql += ` AND i.Customer_Id = ?`;
      params.push(Customer_Id);
    }

    if (vehicleNo) {
      whereSql += ` AND i.Vehicle_No LIKE ?`;
      params.push(`%${vehicleNo}%`);
    }

    if (ewayBillNo) {
      whereSql += ` AND i.E_Way_Bill_No LIKE ?`;
      params.push(`%${ewayBillNo}%`);
    }

    // ---- COUNT ----
    const [[{ total }]] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM Invoices i
      JOIN Customer c ON i.Customer_Id = c.Id
      ${whereSql}
      `,
      params
    );


    // ---- DATA ----
    const allowedSort = ['Invoice_No', 'Sub_Total', 'Invoice_Date'];
    const allowedOrder = ['ASC', 'DESC'];

    let sql = `
  SELECT 
    i.Invoice_No,
    i.Invoice_Date,
    c.Company_Name,      -- 👈 DISPLAY NAME
    i.Sub_Total,
    i.E_Way_Bill_No,
    i.Vehicle_No
  FROM Invoices i
  JOIN Customer c ON i.Customer_Id = c.Id
  ${whereSql}
`;


    if (allowedSort.includes(sortBy)) {
      sql += ` ORDER BY i.${sortBy}`;
    }

    if (allowedOrder.includes(order)) {
      sql += ` ${order}`;
    }

    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);


    const [rows] = await db.query(sql, params);
    // console.log(rows);
    res.render('sales/sales.ejs', {
      invoices: rows,
      pagination: {
        total,
        page: Number(page),
        limit,
        totalPages: Math.ceil(total / limit)
      },
      filters: req.query,
      activePage: 'sales'
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.delete("/sales/:invoiceNo", async (req, res) => {
  const { invoiceNo } = req.params;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ Check invoice exists first
    const [[invoice]] = await conn.query(
      "SELECT Invoice_No FROM Invoices WHERE Invoice_No = ?",
      [invoiceNo]
    );

    if (!invoice) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }

    // 2️⃣ Delete child records
    await conn.query(
      "DELETE FROM Cart WHERE Invoice_No = ?",
      [invoiceNo]
    );

    // 3️⃣ Delete parent record
    await conn.query(
      "DELETE FROM Invoices WHERE Invoice_No = ?",
      [invoiceNo]
    );

    await conn.commit();

    // 4️⃣ Proper response
    res.status(200).json({
      success: true,
      message: "Deleted Successfully"
    });

  } catch (err) {
    await conn.rollback();
    console.error("Delete Invoice Error:", err);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  } finally {
    conn.release();
  }
});



module.exports = router;
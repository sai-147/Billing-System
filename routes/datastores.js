const express = require('express');
const router = express.Router();
const { pool, db } = require('../service/db.js');

const { listTables, readTable, readDesc } = require('../service/datastores_utils');


router.get('/datastores', async (req, res) => {
    try {
        const tables = await listTables(db);
        res.render('dataStores/datastores', { tables, activePage: 'master' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
})

router.get('/datastores/:name', async (req, res) => {
    const tableName = req.params.name;
    // console.log(tableName);
    try {
        const rows = await readTable(db, tableName);
        res.json(rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
})

router.get('/datastores/table-structure/:table', async (req, res) => {
    const table = req.params.table;

    try {
        const rows = await readDesc(db, table);
        res.json(rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
})

router.post('/datastores/add/:table', async (req, res) => {
    const table = req.params.table;
    // console.log(table);
    const data = req.body;
    // console.log(data);

    try {
        const columns = Object.keys(data);
        const values = Object.values(data);

        const placeholders = columns.map(() => "?").join(",");
        const sql = `insert into \`${table}\` (${columns.join(",")}) values (${placeholders})`;

        await db.query(sql, values);
        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "err" });
    }
})

const DROPDOWN_QUERIES = {
  Tax: {
    sql: "SELECT * FROM Tax"
  },
  Parts: {
    sql: "SELECT Part_No, Part_Name, HSN FROM Parts"
  },
  Customer: {
    sql: "SELECT Id, Company_Name FROM Customer"
  },
  Firm_Table: {
    sql: "SELECT Id, Firm_Name FROM Firm_Table"
  }
};


// Generic (id based)
router.get("/datastores/dropdown/:type", async (req, res) => {
  try {
    const { type } = req.params;

    const config = DROPDOWN_QUERIES[type];
    if (!config) {
      return res.status(400).json({
        success: false,
        message: "Invalid dropdown type"
      });
    }

    const [rows] = await db.query(config.sql);

    res.json(rows);

  } catch (err) {
    console.error("Dropdown Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ===== DELETE =====
router.delete("/datastores/delete/:table", async (req, res) => {
  const table = req.params.table;
  const { deleteKey } = req.body;
  console.log(table);
  console.log(deleteKey);

  try {
    let sql, params;

    if (table === "Tax") {
      sql = "DELETE FROM Tax WHERE HSN = ?";
      params = [deleteKey];
    }
    else if (table === "Parts") {
      sql = "DELETE FROM Parts WHERE Part_No = ?";
      params = [deleteKey];
    }
    else {
      sql = "DELETE FROM ?? WHERE Id = ?";
      params = [table, deleteKey];
    }
    console.log(sql, params);
    const [result] = await db.query(sql, params);
    console.log(result);

    if (result.affectedRows === 0) {
      return res.json({ message: "No record found" });
    }

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    console.log(err);
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        message: "Cannot delete: record is in use"
      });
    }
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});



module.exports = router;
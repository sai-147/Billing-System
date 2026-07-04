// Import Express
require('dotenv').config();
const express = require('express');
const pdfRouter = require('./routes/pdf.js');
const testDbRouter = require('./routes/testdb.js');
const datastores = require('./routes/datastores.js');
const createInvoice = require('./routes/createInvoice.js');
const sales = require('./routes/sales.js');
const exportcsv = require('./routes/csv.js');
const app = express();
const port = process.env.PORT;

//middlewares
app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());
app.use(pdfRouter);
app.use(testDbRouter);
app.use(datastores);
app.use(createInvoice);
app.use(sales);
app.use(exportcsv);

// Define a route
app.get('/', (req, res) => {
    res.render("home.ejs", { activePage: ""});
});



// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log('Server is running on http://0.0.0.0:3000');
});



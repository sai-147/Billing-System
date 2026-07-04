const { fontSize, font } = require('pdfkit');

PDFDocument = require('pdfkit');
const converter = require('number-to-words');
const date = new Date().toISOString().split('T')[0];
// console.log(date);
// 2025-12-23

// Mon Dec 23 2025

let prevcopyNo = 1;
let currcopyNo = 1;
let addheader = 1;
const path = require('path');
const imagePath = path.join(__dirname, '../public/image.png');
const fs = require('fs');
// console.log('Image exists:', fs.existsSync(imagePath));


function formatDate(date) {
     const d = new Date(date);
     const day = String(d.getDate()).padStart(2, '0');
     const month = String(d.getMonth() + 1).padStart(2, '0');
     const year = d.getFullYear();
     return `${day}-${month}-${year}`;
}
function calculateInvoiceTotals(items, invoice) {
     let result = {
          items: [],

          totalQty: 0,
          totalTaxableValue: 0,

          totalCGSTAmount: 0,
          totalSGSTAmount: 0,
          totalIGSTAmount: 0,

          grandTotal: 0
     };

     let cgstEnabled = invoice.CGST_Included === 1;
     let sgstEnabled = invoice.SGST_Included === 1;
     let igstEnabled = invoice.IGST_Included === 1;

     for (let i = 0; i < items.length; i++) {
          let item = items[i];

          let qty = Number(item.Qty) || 0;
          let rate = Number(item.Price) || 0;

          let taxableValue = qty * rate;

          // 🔹 Apply tax only if enabled
          let cgstPercent = cgstEnabled ? Number(item.CGST) || 0 : 0;
          let sgstPercent = sgstEnabled ? Number(item.SGST) || 0 : 0;
          let igstPercent = igstEnabled ? Number(item.IGST) || 0 : 0;

          let cgstAmount = Math.round((taxableValue * cgstPercent / 100) * 100) / 100;
          let sgstAmount = Math.round((taxableValue * sgstPercent / 100) * 100) / 100;
          let igstAmount = Math.round((taxableValue * igstPercent / 100) * 100) / 100;
          let totalItemAmount =
               taxableValue + cgstAmount + sgstAmount + igstAmount;

          result.items.push({
               ...item,
               taxableValue,
               cgstPercent,
               sgstPercent,
               igstPercent,
               cgstAmount,
               sgstAmount,
               igstAmount,
               totalItemAmount
          });

          // 🔹 Totals
          result.totalQty += qty;
          result.totalTaxableValue += taxableValue;
          result.totalCGSTAmount += cgstAmount;
          result.totalSGSTAmount += sgstAmount;
          result.totalIGSTAmount += igstAmount;
          result.grandTotal += totalItemAmount;
     }
     result.totalTaxableValue = Math.round(result.totalTaxableValue * 100) / 100;
     result.totalCGSTAmount = Math.round(result.totalCGSTAmount * 100) / 100;
     result.totalSGSTAmount = Math.round(result.totalSGSTAmount * 100) / 100;
     result.totalIGSTAmount = Math.round(result.totalIGSTAmount * 100) / 100;
     result.grandTotal = Math.round(result.grandTotal * 100) / 100;

     return result;
}

function capitalizeWords(str) {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}





function buildPDF(dataCallback, endCallback, firm, invoice, items) {
     // console.log(firm);
     // console.log(invoice);
     // console.log(items);
     const calculatedData = calculateInvoiceTotals(items.items, invoice);
     // console.log

     // console.log(calculatedData.totalTaxableValue);
     // console.log(calculatedData.grandTotal);

     const doc = new PDFDocument({ margin: 12, size: 'A4', fontSize: 10 });
     doc.on('data', dataCallback);
     doc.on('end', endCallback);
     doc.on('pageAdded', () => {
          if (currcopyNo == prevcopyNo) {
               addheader = 1;
          }
          else {
               prevcopyNo = currcopyNo;
               addheader = 0;
          }

     });
     // doc.fontSize(25);
     // doc.text('Some heading');
     doc.image(imagePath, 34, 20, { width: 80 });

     doc.table({

          columnStyles: [125, "*"],
          data: [
               [
                    { rowSpan: 3, border: [1, 1, 1, 1], text: "", align: { x: "center", y: "center" }, font: { size: 24 }, textStroke: 0.5, textStrokeColor: "black" },
                    { border: [1, 1, 0, 0], text: "TAX INVOICE", align: { x: "center", y: "center" }, font: { size: 24 }, textStroke: 0.5, textStrokeColor: "black" },

               ],
               [
                    // {rowSpan:3, border: [1, 0, 1, 1], backgroundColor: "#eee", text: "Tax Invoice", align: { x: "center", y: "center" }, font: { size: 24 }, textStroke: 0.5, textStrokeColor: "black" },
                    { border: [0, 1, 0, 0], text: "NIMARAN INDUSTRIES", align: { x: "center", y: "center" }, font: { size: 20 }, textStroke: 0.5, textStrokeColor: "black" },

               ],
               [
                    // {rowSpan:3, border: [1, 0, 1, 1], backgroundColor: "#eee", text: "Tax Invoice", align: { x: "center", y: "center" }, font: { size: 24 }, textStroke: 0.5, textStrokeColor: "black" },
                    { border: [0, 1, 1, 1], text: "ORIGINAL FOR BUYER", align: { x: "right", y: "center" }, font: { size: 10 }, textStroke: 0.5, textStrokeColor: "black" },

               ],


          ]
     })
     doc.table({
          columnStyles: ["*", "*", "*", "*"],

          data: [
               [
                    { colSpan: 2, text: "FACTORY / WAREHOUSE ADDRESS:", align: { x: "left", y: "center" }, textStroke: 0.5, border: [1, 1, 0, 1] },
                    { colSpan: 1, text: "Eway Bill No", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    {
                         colSpan: 1, text: `:${invoice.E_Way_Bill_No ?? ''}`
                         , align: { x: "left", y: "center" }, border: [0, 1, 0, 0]
                    }
               ],
               [
                    { colSpan: 2, text: `${firm.Address_Line_1 ?? ""}, ${firm.Address_Line_2 ?? ""}, ${firm.Address_Line_3 ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 1] },
                    { colSpan: 1, text: "Buyer's Order No", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Buyer_Order_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: `CIN NO: ${firm.CIN_No ?? ""} `, align: { x: "left", y: "center" }, border: [0, 0, 0, 1], textStroke: 0.5 },
                    { colSpan: 1, text: `PAN: ${invoice.Pan_no ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0], textStroke: 0.5 },
                    { colSpan: 1, text: "Buyer's Order Date", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${formatDate(invoice.Buyer_Order_Date) ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] }
               ],
               [
                    { colSpan: 1, text: "Invoice Number ", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Invoice_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "Vehicle Number", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Vehicle_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] }
               ],
               [
                    { colSpan: 1, text: "Invoice Date", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${formatDate(invoice.Invoice_Date) ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "Transporter Name", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Transporter_Name ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] }
               ],
               [
                    { colSpan: 1, text: "Place of Supply", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${firm.Supply_Place ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: "", align: { x: "left", y: "center" }, border: [0, 1, 0, 0] }
               ],
          ]
     })

     doc.table({
          columnStyles: ["*", "*", "*", "*", "*", "*", "*", "*"],

          data: [
               [
                    { colSpan: 4, text: "Details of the Receiver (Billed to)", backgroundColor: "#eee", align: { x: "center", y: "center" } },
                    { colSpan: 4, text: "Details of the Receiver (shipping to)", backgroundColor: "#eee", align: { x: "center", y: "center" }, border: [1, 1, 1, 1] },
               ],
               [
                    { colSpan: 1, text: "Name", align: { x: "left", y: "center" }, border: [1, 0, 0, 1], textStroke: 0.5 },
                    { colSpan: 3, text: `: ${invoice.Customer_Company_Name ?? ""}`, align: { x: "left", y: "center" }, border: [1, 1, 0, 0] },
                    { colSpan: 1, text: "Name", textStroke: 0.5, align: { x: "left", y: "center" }, border: [1, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Customer_Company_Name ?? ""}`, align: { x: "left", y: "center" }, border: [1, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: "Address", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Billing_Address_Line_1 ?? ""}, ${invoice.Billing_Address_Line_2 ?? ""}, ${invoice.Billing_Address_Line_3 ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "Address", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Shipping_Address_Line_1 ?? ""}, ${invoice.Shipping_Address_Line_2 ?? ""}, ${invoice.Shipping_Address_Line_3 ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: "State", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Customer_State ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "State", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Customer_State ?? ""}`, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: "Phone No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: `: ${invoice.Phone ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: "State Code", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Customer_State_Code ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "State Code", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Customer_State_Code ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: "GSTIN", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Customer_GSTIN ?? ""}`, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: "PAN No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: `: ${invoice.Customer_Pan_no ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "GSTIN", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Customer_GSTIN ?? ""}`, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: "PAN No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: `: ${invoice.Customer_Pan_no ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 2, text: "Challan No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 2, text: `: ${invoice.Challan_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 2, text: "CIN No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 2, text: `: ${invoice.CIN_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 2, text: "Challan Date", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 2, text: `: ${formatDate(invoice.Challan_Date) ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 2, text: "", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 2, text: "", align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],

          ]
     })

     let parts_data = {
          columnStyles: [15, "*", 65, 50, 50, 50, 15, 50, 15, 50, 15, 50],
          data: [
               [
                    { rowSpan: 2, colSpan: 1, text: "Sl No", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { rowSpan: 2, colSpan: 1, text: "Description", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 2, colSpan: 1, text: "HSN CODE", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 2, colSpan: 1, text: "QTY (NOS)", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 2, colSpan: 1, text: "Rate/Unit Rs.", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 2, colSpan: 1, text: "Taxable Value", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 2, text: "SGST", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 2, text: "CGST", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 2, text: "IGST", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
               ],
               [

                    { colSpan: 1, text: "%", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "Amount", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "%", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "Amount", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "%", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "Amount", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
               ],
          ]
     }

     for (let i = 0; i < calculatedData.items.length; i++) {
          let item = calculatedData.items[i];

          parts_data.data.push(
               [
                    { rowSpan: 1, colSpan: 1, text: `${i + 1}`, align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 7 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.Part_Name}`, align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.HSN}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.Qty}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.Price}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.taxableValue}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.sgstPercent}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 7 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.sgstAmount}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.cgstPercent}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 7 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.cgstAmount}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.igstPercent}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 7 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.igstAmount}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
               ]
          )
     }
     doc.table(parts_data);

     doc.table({
          columnStyles: [15, "*", 65, 50, 50, 50, 15, 50, 15, 50, 15, 50],
          data: [


               [
                    { colSpan: 3, text: `Total No of Bins: ${invoice.Bins ?? "0"} and Bags: ${invoice.Bags ?? "0"}`, align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 2, text: "Total:", align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 1, text: ` ${calculatedData.totalTaxableValue ?? ""}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 2, text: ` ${calculatedData.totalCGSTAmount ?? "0"}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 2, text: ` ${calculatedData.totalSGSTAmount ?? "0"}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 2, text: ` ${calculatedData.totalIGSTAmount ?? "0"}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 }

               ]

          ]
     })
     doc.table({
          columnStyles: ["*", "*"],
          data: [
               [
                    { rowSpan: 1, text: `Invoice Value ( In Words )` , textStroke: 0.5 },
                    { rowSpan: 2, text: `Invoice Total Rs.:  ${calculatedData.grandTotal}/-`, textStroke: 0.5, font: { size: 15 } }
               ],
               [
                    { rowSpan: 1, text: `${capitalizeWords(converter.toWords(Math.round(calculatedData.grandTotal)))} Only` , textStroke: 0 },
                     
               ]
          ]
     })
     doc.table({
          columnStyles: ["*", "*"],
          data: [
               [
                    { rowSpan: 2, text: "In Case of any dispute, that could be sought out only in the Jurisdiction of this Nimaran Industry " },
                    { rowSpan: 1, text: "For Nimaran Industry ", textStroke: 0.5 },
               ],
               [
                    { rowSpan: 1, text: "Authorised Signatory ", align: { x: "right", y: "center" }, textStroke: 0.5 },

               ]
          ]
     })
     currcopyNo = 2;
     doc.addPage();
     doc.image(imagePath, 34, 20, { width: 80 });

     doc.table({

          columnStyles: [125, "*"],
          data: [
               [
                    { rowSpan: 3, border: [1, 1, 1, 1], text: "", align: { x: "center", y: "center" }, font: { size: 24 }, textStroke: 0.5, textStrokeColor: "black" },
                    { border: [1, 1, 0, 0], text: "TAX INVOICE", align: { x: "center", y: "center" }, font: { size: 24 }, textStroke: 0.5, textStrokeColor: "black" },

               ],
               [
                    // {rowSpan:3, border: [1, 0, 1, 1], backgroundColor: "#eee", text: "Tax Invoice", align: { x: "center", y: "center" }, font: { size: 24 }, textStroke: 0.5, textStrokeColor: "black" },
                    { border: [0, 1, 0, 0], text: "NIMARAN INDUSTRIES", align: { x: "center", y: "center" }, font: { size: 20 }, textStroke: 0.5, textStrokeColor: "black" },

               ],
               [
                    // {rowSpan:3, border: [1, 0, 1, 1], backgroundColor: "#eee", text: "Tax Invoice", align: { x: "center", y: "center" }, font: { size: 24 }, textStroke: 0.5, textStrokeColor: "black" },
                    { border: [0, 1, 1, 1], text: "DUPLICATE FOR TRANSPORTER", align: { x: "right", y: "center" }, font: { size: 10 }, textStroke: 0.5, textStrokeColor: "black" },

               ],


          ]
     })
     doc.table({
          columnStyles: ["*", "*", "*", "*"],

          data: [
               [
                    { colSpan: 2, text: "FACTORY / WAREHOUSE ADDRESS:", align: { x: "left", y: "center" }, textStroke: 0.5, border: [1, 1, 0, 1] },
                    { colSpan: 1, text: "Eway Bill No", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    {
                         colSpan: 1, text: `:${invoice.E_Way_Bill_No ?? ''}`
                         , align: { x: "left", y: "center" }, border: [0, 1, 0, 0]
                    }
               ],
               [
                    { colSpan: 2, text: `${firm.Address_Line_1 ?? ""}, ${firm.Address_Line_2 ?? ""}, ${firm.Address_Line_3 ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 1] },
                    { colSpan: 1, text: "Buyer's Order No", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Buyer_Order_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: `CIN NO: ${firm.CIN_No ?? ""} `, align: { x: "left", y: "center" }, border: [0, 0, 0, 1], textStroke: 0.5 },
                    { colSpan: 1, text: `PAN: ${invoice.Pan_no ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0], textStroke: 0.5 },
                    { colSpan: 1, text: "Buyer's Order Date", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${formatDate(invoice.Buyer_Order_Date) ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] }
               ],
               [
                    { colSpan: 1, text: "Invoice Number ", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Invoice_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "Vehicle Number", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Vehicle_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] }
               ],
               [
                    { colSpan: 1, text: "Invoice Date", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${formatDate(invoice.Invoice_Date) ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "Transporter Name", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Transporter_Name ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] }
               ],
               [
                    { colSpan: 1, text: "Place of Supply", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${firm.Supply_Place ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: "", align: { x: "left", y: "center" }, border: [0, 1, 0, 0] }
               ],
          ]
     })

     doc.table({
          columnStyles: ["*", "*", "*", "*", "*", "*", "*", "*"],

          data: [
               [
                    { colSpan: 4, text: "Details of the Receiver (Billed to)", backgroundColor: "#eee", align: { x: "center", y: "center" } },
                    { colSpan: 4, text: "Details of the Receiver (shipping to)", backgroundColor: "#eee", align: { x: "center", y: "center" }, border: [1, 1, 1, 1] },
               ],
               [
                    { colSpan: 1, text: "Name", align: { x: "left", y: "center" }, border: [1, 0, 0, 1], textStroke: 0.5 },
                    { colSpan: 3, text: `: ${invoice.Customer_Company_Name ?? ""}`, align: { x: "left", y: "center" }, border: [1, 1, 0, 0] },
                    { colSpan: 1, text: "Name", textStroke: 0.5, align: { x: "left", y: "center" }, border: [1, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Customer_Company_Name ?? ""}`, align: { x: "left", y: "center" }, border: [1, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: "Address", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Billing_Address_Line_1 ?? ""}, ${invoice.Billing_Address_Line_2 ?? ""}, ${invoice.Billing_Address_Line_3 ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "Address", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Shipping_Address_Line_1 ?? ""}, ${invoice.Shipping_Address_Line_2 ?? ""}, ${invoice.Shipping_Address_Line_3 ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: "State", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Customer_State ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "State", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Customer_State ?? ""}`, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: "Phone No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: `: ${invoice.Phone ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: "State Code", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Customer_State_Code ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "State Code", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Customer_State_Code ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: "GSTIN", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Customer_GSTIN ?? ""}`, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: "PAN No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: `: ${invoice.Customer_Pan_no ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "GSTIN", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Customer_GSTIN ?? ""}`, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: "PAN No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: `: ${invoice.Customer_Pan_no ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 2, text: "Challan No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 2, text: `: ${invoice.Challan_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 2, text: "CIN No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 2, text: `: ${invoice.CIN_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 2, text: "Challan Date", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 2, text: `: ${formatDate(invoice.Challan_Date) ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 2, text: "", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 2, text: "", align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],

          ]
     })

      parts_data = {
          columnStyles: [15, "*", 65, 50, 50, 50, 15, 50, 15, 50, 15, 50],
          data: [
               [
                    { rowSpan: 2, colSpan: 1, text: "Sl No", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { rowSpan: 2, colSpan: 1, text: "Description", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 2, colSpan: 1, text: "HSN CODE", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 2, colSpan: 1, text: "QTY (NOS)", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 2, colSpan: 1, text: "Rate/Unit Rs.", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 2, colSpan: 1, text: "Taxable Value", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 2, text: "SGST", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 2, text: "CGST", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 2, text: "IGST", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
               ],
               [

                    { colSpan: 1, text: "%", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "Amount", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "%", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "Amount", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "%", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "Amount", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
               ],
          ]
     }

     for (let i = 0; i < calculatedData.items.length; i++) {
          let item = calculatedData.items[i];

          parts_data.data.push(
               [
                    { rowSpan: 1, colSpan: 1, text: `${i + 1}`, align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 7 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.Part_Name}`, align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.HSN}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.Qty}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.Price}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.taxableValue}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.sgstPercent}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 7 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.sgstAmount}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.cgstPercent}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 7 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.cgstAmount}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.igstPercent}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 7 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.igstAmount}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
               ]
          )
     }
     doc.table(parts_data);

     doc.table({
          columnStyles: [15, "*", 65, 50, 50, 50, 15, 50, 15, 50, 15, 50],
          data: [


               [
                    { colSpan: 3, text: `Total No of Bins: ${invoice.Bins ?? "0"} and Bags: ${invoice.Bags ?? "0"}`, align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 2, text: "Total:", align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 1, text: ` ${calculatedData.totalTaxableValue ?? ""}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 2, text: ` ${calculatedData.totalCGSTAmount ?? "0"}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 2, text: ` ${calculatedData.totalSGSTAmount ?? "0"}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 2, text: ` ${calculatedData.totalIGSTAmount ?? "0"}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 }

               ]

          ]
     })
     doc.table({
          columnStyles: ["*", "*"],
          data: [
               [
                    { rowSpan: 1, text: `Invoice Value ( In Words )` , textStroke: 0.5 },
                    { rowSpan: 2, text: `Invoice Total Rs.:  ${calculatedData.grandTotal}/-`, textStroke: 0.5, font: { size: 15 } }
               ],
               [
                    { rowSpan: 1, text: `${capitalizeWords(converter.toWords(Math.round(calculatedData.grandTotal)))} Only` , textStroke: 0 },
                     
               ]
          ]
     })
     doc.table({
          columnStyles: ["*", "*"],
          data: [
               [
                    { rowSpan: 2, text: "In Case of any dispute, that could be sought out only in the Jurisdiction of this Nimaran Industry " },
                    { rowSpan: 1, text: "For Nimaran Industry ", textStroke: 0.5 },
               ],
               [
                    { rowSpan: 1, text: "Authorised Signatory ", align: { x: "right", y: "center" }, textStroke: 0.5 },

               ]
          ]
     })

     currcopyNo = 3;
     doc.addPage();
     doc.image(imagePath, 34, 20, { width: 80 });

     doc.table({

          columnStyles: [125, "*"],
          data: [
               [
                    { rowSpan: 3, border: [1, 1, 1, 1], text: "", align: { x: "center", y: "center" }, font: { size: 24 }, textStroke: 0.5, textStrokeColor: "black" },
                    { border: [1, 1, 0, 0], text: "TAX INVOICE", align: { x: "center", y: "center" }, font: { size: 24 }, textStroke: 0.5, textStrokeColor: "black" },

               ],
               [
                    // {rowSpan:3, border: [1, 0, 1, 1], backgroundColor: "#eee", text: "Tax Invoice", align: { x: "center", y: "center" }, font: { size: 24 }, textStroke: 0.5, textStrokeColor: "black" },
                    { border: [0, 1, 0, 0], text: "NIMARAN INDUSTRIES", align: { x: "center", y: "center" }, font: { size: 20 }, textStroke: 0.5, textStrokeColor: "black" },

               ],
               [
                    // {rowSpan:3, border: [1, 0, 1, 1], backgroundColor: "#eee", text: "Tax Invoice", align: { x: "center", y: "center" }, font: { size: 24 }, textStroke: 0.5, textStrokeColor: "black" },
                    { border: [0, 1, 1, 1], text: "TRIPLICATE FOR ASSESSE", align: { x: "right", y: "center" }, font: { size: 10 }, textStroke: 0.5, textStrokeColor: "black" },

               ],


          ]
     })
     doc.table({
          columnStyles: ["*", "*", "*", "*"],

          data: [
               [
                    { colSpan: 2, text: "FACTORY / WAREHOUSE ADDRESS:", align: { x: "left", y: "center" }, textStroke: 0.5, border: [1, 1, 0, 1] },
                    { colSpan: 1, text: "Eway Bill No", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    {
                         colSpan: 1, text: `:${invoice.E_Way_Bill_No ?? ''}`
                         , align: { x: "left", y: "center" }, border: [0, 1, 0, 0]
                    }
               ],
               [
                    { colSpan: 2, text: `${firm.Address_Line_1 ?? ""}, ${firm.Address_Line_2 ?? ""}, ${firm.Address_Line_3 ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 1] },
                    { colSpan: 1, text: "Buyer's Order No", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Buyer_Order_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: `CIN NO: ${firm.CIN_No ?? ""} `, align: { x: "left", y: "center" }, border: [0, 0, 0, 1], textStroke: 0.5 },
                    { colSpan: 1, text: `PAN: ${invoice.Pan_no ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0], textStroke: 0.5 },
                    { colSpan: 1, text: "Buyer's Order Date", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${formatDate(invoice.Buyer_Order_Date) ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] }
               ],
               [
                    { colSpan: 1, text: "Invoice Number ", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Invoice_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "Vehicle Number", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Vehicle_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] }
               ],
               [
                    { colSpan: 1, text: "Invoice Date", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${formatDate(invoice.Invoice_Date) ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "Transporter Name", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Transporter_Name ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] }
               ],
               [
                    { colSpan: 1, text: "Place of Supply", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${firm.Supply_Place ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: "", align: { x: "left", y: "center" }, border: [0, 1, 0, 0] }
               ],
          ]
     })

     doc.table({
          columnStyles: ["*", "*", "*", "*", "*", "*", "*", "*"],

          data: [
               [
                    { colSpan: 4, text: "Details of the Receiver (Billed to)", backgroundColor: "#eee", align: { x: "center", y: "center" } },
                    { colSpan: 4, text: "Details of the Receiver (shipping to)", backgroundColor: "#eee", align: { x: "center", y: "center" }, border: [1, 1, 1, 1] },
               ],
               [
                    { colSpan: 1, text: "Name", align: { x: "left", y: "center" }, border: [1, 0, 0, 1], textStroke: 0.5 },
                    { colSpan: 3, text: `: ${invoice.Customer_Company_Name ?? ""}`, align: { x: "left", y: "center" }, border: [1, 1, 0, 0] },
                    { colSpan: 1, text: "Name", textStroke: 0.5, align: { x: "left", y: "center" }, border: [1, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Customer_Company_Name ?? ""}`, align: { x: "left", y: "center" }, border: [1, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: "Address", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Billing_Address_Line_1 ?? ""}, ${invoice.Billing_Address_Line_2 ?? ""}, ${invoice.Billing_Address_Line_3 ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "Address", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Shipping_Address_Line_1 ?? ""}, ${invoice.Shipping_Address_Line_2 ?? ""}, ${invoice.Shipping_Address_Line_3 ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: "State", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Customer_State ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "State", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Customer_State ?? ""}`, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: "Phone No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: `: ${invoice.Phone ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: "State Code", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Customer_State_Code ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "State Code", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Customer_State_Code ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: "GSTIN", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Customer_GSTIN ?? ""}`, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: "PAN No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: `: ${invoice.Customer_Pan_no ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "GSTIN", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Customer_GSTIN ?? ""}`, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: "PAN No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: `: ${invoice.Customer_Pan_no ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 2, text: "Challan No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 2, text: `: ${invoice.Challan_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 2, text: "CIN No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 2, text: `: ${invoice.CIN_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 2, text: "Challan Date", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 2, text: `: ${formatDate(invoice.Challan_Date) ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 2, text: "", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 2, text: "", align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],

          ]
     })

     parts_data = {
          columnStyles: [15, "*", 65, 50, 50, 50, 15, 50, 15, 50, 15, 50],
          data: [
               [
                    { rowSpan: 2, colSpan: 1, text: "Sl No", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { rowSpan: 2, colSpan: 1, text: "Description", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 2, colSpan: 1, text: "HSN CODE", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 2, colSpan: 1, text: "QTY (NOS)", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 2, colSpan: 1, text: "Rate/Unit Rs.", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 2, colSpan: 1, text: "Taxable Value", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 2, text: "SGST", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 2, text: "CGST", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 2, text: "IGST", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
               ],
               [

                    { colSpan: 1, text: "%", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "Amount", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "%", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "Amount", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "%", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "Amount", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
               ],
          ]
     }

     for (let i = 0; i < calculatedData.items.length; i++) {
          let item = calculatedData.items[i];

          parts_data.data.push(
               [
                    { rowSpan: 1, colSpan: 1, text: `${i + 1}`, align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 7 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.Part_Name}`, align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.HSN}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.Qty}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.Price}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.taxableValue}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.sgstPercent}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 7 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.sgstAmount}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.cgstPercent}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 7 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.cgstAmount}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.igstPercent}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 7 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.igstAmount}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
               ]
          )
     }
     doc.table(parts_data);

     doc.table({
          columnStyles: [15, "*", 65, 50, 50, 50, 15, 50, 15, 50, 15, 50],
          data: [


               [
                    { colSpan: 3, text: `Total No of Bins: ${invoice.Bins ?? "0"} and Bags: ${invoice.Bags ?? "0"}`, align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 2, text: "Total:", align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 1, text: ` ${calculatedData.totalTaxableValue ?? ""}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 2, text: ` ${calculatedData.totalCGSTAmount ?? "0"}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 2, text: ` ${calculatedData.totalSGSTAmount ?? "0"}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 2, text: ` ${calculatedData.totalIGSTAmount ?? "0"}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 }

               ]

          ]
     })
     doc.table({
          columnStyles: ["*", "*"],
          data: [
               [
                    { rowSpan: 1, text: `Invoice Value ( In Words )` , textStroke: 0.5 },
                    { rowSpan: 2, text: `Invoice Total Rs.:  ${calculatedData.grandTotal}/-`, textStroke: 0.5, font: { size: 15 } }
               ],
               [
                    { rowSpan: 1, text: `${capitalizeWords(converter.toWords(Math.round(calculatedData.grandTotal)))} Only` , textStroke: 0 },
                     
               ]
          ]
     })
     doc.table({
          columnStyles: ["*", "*"],
          data: [
               [
                    { rowSpan: 2, text: "In Case of any dispute, that could be sought out only in the Jurisdiction of this Nimaran Industry " },
                    { rowSpan: 1, text: "For Nimaran Industry ", textStroke: 0.5 },
               ],
               [
                    { rowSpan: 1, text: "Authorised Signatory ", align: { x: "right", y: "center" }, textStroke: 0.5 },

               ]
          ]
     })


     currcopyNo = 4;
     doc.addPage();
     doc.image(imagePath, 34, 20, { width: 80 });

     doc.table({

          columnStyles: [125, "*"],
          data: [
               [
                    { rowSpan: 3, border: [1, 1, 1, 1], text: "", align: { x: "center", y: "center" }, font: { size: 24 }, textStroke: 0.5, textStrokeColor: "black" },
                    { border: [1, 1, 0, 0], text: "TAX INVOICE", align: { x: "center", y: "center" }, font: { size: 24 }, textStroke: 0.5, textStrokeColor: "black" },

               ],
               [
                    // {rowSpan:3, border: [1, 0, 1, 1], backgroundColor: "#eee", text: "Tax Invoice", align: { x: "center", y: "center" }, font: { size: 24 }, textStroke: 0.5, textStrokeColor: "black" },
                    { border: [0, 1, 0, 0], text: "NIMARAN INDUSTRIES", align: { x: "center", y: "center" }, font: { size: 20 }, textStroke: 0.5, textStrokeColor: "black" },

               ],
               [
                    // {rowSpan:3, border: [1, 0, 1, 1], backgroundColor: "#eee", text: "Tax Invoice", align: { x: "center", y: "center" }, font: { size: 24 }, textStroke: 0.5, textStrokeColor: "black" },
                    { border: [0, 1, 1, 1], text: "EXTRA COPY", align: { x: "right", y: "center" }, font: { size: 10 }, textStroke: 0.5, textStrokeColor: "black" },

               ],


          ]
     })
     doc.table({
          columnStyles: ["*", "*", "*", "*"],

          data: [
               [
                    { colSpan: 2, text: "FACTORY / WAREHOUSE ADDRESS:", align: { x: "left", y: "center" }, textStroke: 0.5, border: [1, 1, 0, 1] },
                    { colSpan: 1, text: "Eway Bill No", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    {
                         colSpan: 1, text: `:${invoice.E_Way_Bill_No ?? ''}`
                         , align: { x: "left", y: "center" }, border: [0, 1, 0, 0]
                    }
               ],
               [
                    { colSpan: 2, text: `${firm.Address_Line_1 ?? ""}, ${firm.Address_Line_2 ?? ""}, ${firm.Address_Line_3 ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 1] },
                    { colSpan: 1, text: "Buyer's Order No", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Buyer_Order_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: `CIN NO: ${firm.CIN_No ?? ""} `, align: { x: "left", y: "center" }, border: [0, 0, 0, 1], textStroke: 0.5 },
                    { colSpan: 1, text: `PAN: ${invoice.Pan_no ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0], textStroke: 0.5 },
                    { colSpan: 1, text: "Buyer's Order Date", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${formatDate(invoice.Buyer_Order_Date) ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] }
               ],
               [
                    { colSpan: 1, text: "Invoice Number ", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Invoice_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "Vehicle Number", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Vehicle_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] }
               ],
               [
                    { colSpan: 1, text: "Invoice Date", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${formatDate(invoice.Invoice_Date) ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "Transporter Name", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Transporter_Name ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] }
               ],
               [
                    { colSpan: 1, text: "Place of Supply", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${firm.Supply_Place ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: "", align: { x: "left", y: "center" }, border: [0, 1, 0, 0] }
               ],
          ]
     })

     doc.table({
          columnStyles: ["*", "*", "*", "*", "*", "*", "*", "*"],

          data: [
               [
                    { colSpan: 4, text: "Details of the Receiver (Billed to)", backgroundColor: "#eee", align: { x: "center", y: "center" } },
                    { colSpan: 4, text: "Details of the Receiver (shipping to)", backgroundColor: "#eee", align: { x: "center", y: "center" }, border: [1, 1, 1, 1] },
               ],
               [
                    { colSpan: 1, text: "Name", align: { x: "left", y: "center" }, border: [1, 0, 0, 1], textStroke: 0.5 },
                    { colSpan: 3, text: `: ${invoice.Customer_Company_Name ?? ""}`, align: { x: "left", y: "center" }, border: [1, 1, 0, 0] },
                    { colSpan: 1, text: "Name", textStroke: 0.5, align: { x: "left", y: "center" }, border: [1, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Customer_Company_Name ?? ""}`, align: { x: "left", y: "center" }, border: [1, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: "Address", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Billing_Address_Line_1 ?? ""}, ${invoice.Billing_Address_Line_2 ?? ""}, ${invoice.Billing_Address_Line_3 ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "Address", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Shipping_Address_Line_1 ?? ""}, ${invoice.Shipping_Address_Line_2 ?? ""}, ${invoice.Shipping_Address_Line_3 ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: "State", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Customer_State ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "State", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Customer_State ?? ""}`, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: "Phone No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: `: ${invoice.Phone ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: "State Code", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Customer_State_Code ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "State Code", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 3, text: `: ${invoice.Customer_State_Code ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 1, text: "GSTIN", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Customer_GSTIN ?? ""}`, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: "PAN No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: `: ${invoice.Customer_Pan_no ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 1, text: "GSTIN", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 1, text: `: ${invoice.Customer_GSTIN ?? ""}`, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: "PAN No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 0] },
                    { colSpan: 1, text: `: ${invoice.Customer_Pan_no ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 2, text: "Challan No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 2, text: `: ${invoice.Challan_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 2, text: "CIN No", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 2, text: `: ${invoice.CIN_No ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],
               [
                    { colSpan: 2, text: "Challan Date", textStroke: 0.5, align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 2, text: `: ${formatDate(invoice.Challan_Date) ?? ""}`, align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
                    { colSpan: 2, text: "", align: { x: "left", y: "center" }, border: [0, 0, 0, 1] },
                    { colSpan: 2, text: "", align: { x: "left", y: "center" }, border: [0, 1, 0, 0] },
               ],

          ]
     })

     parts_data = {
          columnStyles: [15, "*", 65, 50, 50, 50, 15, 50, 15, 50, 15, 50],
          data: [
               [
                    { rowSpan: 2, colSpan: 1, text: "Sl No", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { rowSpan: 2, colSpan: 1, text: "Description", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 2, colSpan: 1, text: "HSN CODE", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 2, colSpan: 1, text: "QTY (NOS)", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 2, colSpan: 1, text: "Rate/Unit Rs.", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 2, colSpan: 1, text: "Taxable Value", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 2, text: "SGST", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 2, text: "CGST", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 2, text: "IGST", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 10 } },
               ],
               [

                    { colSpan: 1, text: "%", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "Amount", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "%", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "Amount", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "%", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
                    { colSpan: 1, text: "Amount", align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5, font: { size: 7 } },
               ],
          ]
     }

     for (let i = 0; i < calculatedData.items.length; i++) {
          let item = calculatedData.items[i];

          parts_data.data.push(
               [
                    { rowSpan: 1, colSpan: 1, text: `${i + 1}`, align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 7 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.Part_Name}`, align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.HSN}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.Qty}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.Price}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.taxableValue}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.sgstPercent}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 7 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.sgstAmount}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.cgstPercent}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 7 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.cgstAmount}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.igstPercent}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 7 } },
                    { rowSpan: 1, colSpan: 1, text: `${item.igstAmount}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0, font: { size: 10 } },
               ]
          )
     }
     doc.table(parts_data);

     doc.table({
          columnStyles: [15, "*", 65, 50, 50, 50, 15, 50, 15, 50, 15, 50],
          data: [


               [
                    { colSpan: 3, text: `Total No of Bins: ${invoice.Bins ?? "0"} and Bags: ${invoice.Bags ?? "0"}`, align: { x: "center", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 2, text: "Total:", align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 1, text: ` ${calculatedData.totalTaxableValue ?? ""}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 2, text: ` ${calculatedData.totalCGSTAmount ?? "0"}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 2, text: ` ${calculatedData.totalSGSTAmount ?? "0"}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 },
                    { colSpan: 2, text: ` ${calculatedData.totalIGSTAmount ?? "0"}`, align: { x: "right", y: "center" }, border: [1, 1, 1, 1], textStroke: 0.5 }

               ]

          ]
     })
     doc.table({
          columnStyles: ["*", "*"],
          data: [
               [
                    { rowSpan: 1, text: `Invoice Value ( In Words )` , textStroke: 0.5 },
                    { rowSpan: 2, text: `Invoice Total Rs.:  ${calculatedData.grandTotal}/-`, textStroke: 0.5, font: { size: 15 } }
               ],
               [
                    { rowSpan: 1, text: `${capitalizeWords(converter.toWords(Math.round(calculatedData.grandTotal)))} Only` , textStroke: 0 },
                     
               ]
          ]
     })
     doc.table({
          columnStyles: ["*", "*"],
          data: [
               [
                    { rowSpan: 2, text: "In Case of any dispute, that could be sought out only in the Jurisdiction of this Nimaran Industry " },
                    { rowSpan: 1, text: "For Nimaran Industry ", textStroke: 0.5 },
               ],
               [
                    { rowSpan: 1, text: "Authorised Signatory ", align: { x: "right", y: "center" }, textStroke: 0.5 },

               ]
          ]
     })




     doc.end();

}


module.exports = { buildPDF };
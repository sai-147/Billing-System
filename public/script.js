// ========================
// GLOBAL STATE
// ========================
let currentMode = "display";

// which tables are open in which mode
const modeState = {
  display: new Set(),
  add: new Set(),
  update: new Set(),
  delete: new Set()
};

// ========================
// MODE SWITCHING
// ========================
const modeLinks = document.querySelectorAll('.mode-link');
modeLinks.forEach(l => l.classList.remove('active'));
modeLinks[0].classList.add('active');

modeLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    const newMode = link.dataset.mode;
    if (newMode === currentMode) return;

    // hide all containers
    document.querySelectorAll(".container").forEach(div => {
      div.style.display = "none";
      div.innerHTML = "";
    });

    // update mode
    currentMode = newMode;
    // console.log(currentMode);
    // update active color
    modeLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");

    // restore tables opened in this mode
    modeState[currentMode].forEach(tableName => {
      const tableLink = document.querySelector(
        `.table-link[data-table="${tableName}"]`
      );

      if (tableLink) {
        const container = tableLink.nextElementSibling;
        container.style.display = "block";
        renderTableContent(tableName, container);
      }
    });
  });
});

// ========================
// TABLE CLICK HANDLER
// ========================
document.querySelectorAll(".table-link").forEach(link => {
  link.addEventListener("click", async (e) => {
    e.preventDefault();

    const tableName = link.dataset.table;
    const container = link.nextElementSibling;

    // toggle close
    if (container.style.display === "block") {
      container.style.display = "none";
      container.innerHTML = "";
      modeState[currentMode].delete(tableName);
      return;
    }

    // open
    container.style.display = "block";
    modeState[currentMode].add(tableName);

    await renderTableContent(tableName, container);
  });
});





// ========================
// RENDER CONTENT PER MODE
// ========================
async function renderTableContent(tableName, container) {
  container.innerHTML = "";

  // -------- DISPLAY --------
  if (currentMode === "display") {
    container.innerHTML = "Loading...";

    try {
      const res = await fetch(`/datastores/${tableName}`);

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data = await res.json();
      const rows = data.rows || data;

      if (!rows || rows.length === 0) {
        container.innerHTML = "No data found";
        return;
      }

      let html = "<table border='1'><tr>";
      Object.keys(rows[0]).forEach(col => {
        html += `<th>${col}</th>`;
      });
      html += "</tr>";

      rows.forEach(row => {
        html += "<tr>";
        Object.values(row).forEach(val => {
          html += `<td>${val}</td>`;
        });
        html += "</tr>";
      });

      html += "</table>";
      container.innerHTML = html;

    } catch (err) {
      console.error(err);
      container.innerHTML = "Failed to load data";
    }

  }

  // -------- ADD --------
  else if (currentMode === "add") {
    if (tableName == "Customer") {
      container.innerHTML = `
        <form class="addForm" data-table="Customer">
          <h2>Customer Details</h2>

          <table>
            <!-- Company Info -->
            <tr>
              <td><label>Company Name *</label></td>
              <td><input type="text" name="Company_Name" maxlength="100" required></td>
            </tr>
            <tr>
              <td><label>GSTIN *</label></td>
              <td><input type="text" name="GSTIN" maxlength="15"></td>
            </tr>
            <tr>
            <td><label>PAN No *</label></td>
            <td><input type="text" name="Pan_no" maxlength="10" required></td>
          </tr>
            <tr>
              <td><label>Phone</label></td>
              <td><input type="tel" name="Phone" maxlength="15"></td>
            </tr>
            <tr>
              <td><label>CIN No:</label></td>
              <td><input type="text" name="CIN_No" maxlength="30"></td>
            </tr>
            <tr>
              <td><label>Email</label></td>
              <td><input type="email" name="Email" maxlength="100"></td>
            </tr>
            <tr>
              <td><label>GPS</label></td>
              <td><input type="text" name="GPS" maxlength="30"></td>
            </tr>
            

            <!-- Billing Address -->
            <tr>
              <td colspan="2"><h3>Billing Address</h3></td>
            </tr>
            <tr>
              <td><label>Address Line 1</label></td>
              <td><textarea name="Billing_Address_Line_1"></textarea></td>
            </tr>
            <tr>
              <td><label>Address Line 2</label></td>
              <td><textarea name="Billing_Address_Line_2"></textarea></td>
            </tr>
            <tr>
              <td><label>Address Line 3</label></td>
              <td><textarea name="Billing_Address_Line_3"></textarea></td>
            </tr>
            <tr>
              <td><label>State</label></td>
              <td><input type="text" name="State" maxlength="50"></td>
            </tr>
            <tr>
              <td><label>State Code</label></td>
              <td><input type="text" name="State_Code" maxlength="2"></td>
            </tr>

            <!-- Shipping Address -->
            <tr>
              <td colspan="2"><h3>Shipping Address</h3></td>
            </tr>
            <tr>
              <td><label>Address Line 1</label></td>
              <td><textarea name="Shipping_Address_Line_1"></textarea></td>
            </tr>
            <tr>
              <td><label>Address Line 2</label></td>
              <td><textarea name="Shipping_Address_Line_2"></textarea></td>
            </tr>
            <tr>
              <td><label>Address Line 3</label></td>
              <td><textarea name="Shipping_Address_Line_3"></textarea></td>
            </tr>
            <tr>
              <td><label>Shipping_State</label></td>
              <td><input type="text" name="Shipping_State" maxlength="50"></td>
            </tr><tr>
              <td><label>Shipping_State_Code</label></td>
              <td><input type="text" name="Shipping_State_Code" maxlength="2"></td>
            </tr>
            
            <tr>
      <td colspan="2" align="center">
        <div class="msg"></div>
      </td>
    </tr>
            <!-- Submit -->
            <tr>
              <td colspan="2" style="text-align:center;">
                <button type="submit">Save Customer</button>
              </td>
            </tr>
          </table>
          
        </form>

      `;
    }
    else if (tableName == "Firm_Table") {
      container.innerHTML = `
      <form class="addForm" data-table="Firm_Table">

        <h2>Firm Details</h2>

        <table>
          <tr>
            <td><label>Firm Name *</label></td>
            <td><input type="text" name="Firm_name" maxlength="100" required></td>
          </tr>

          <tr>
            <td><label>PAN No *</label></td>
            <td><input type="text" name="Pan_no" maxlength="10" required></td>
          </tr>

          <tr>
            <td><label>GSTIN *</label></td>
            <td><input type="text" name="GSTIN" maxlength="15"></td>
          </tr>
          
          <tr>
            <td><label>CIN_No</label></td>
            <td><input type="text" name="CIN_No" maxlength="50"></td>
          </tr>
          

          <tr>
            <td><label>Phone</label></td>
            <td><input type="tel" name="Phone" maxlength="15"></td>
          </tr>

          <tr>
            <td><label>Email</label></td>
            <td><input type="email" name="email" maxlength="100"></td>
          </tr>

          <tr>
            <td><label>GPS</label></td>
            <td><input type="text" name="GPS" maxlength="30"></td>
          </tr>

          <tr>
            <td colspan="2"><h3>Address</h3></td>
          </tr>

          <tr>
            <td><label>Address Line 1</label></td>
            <td><textarea name="Address_Line_1"></textarea></td>
          </tr>

          <tr>
            <td><label>Address Line 2</label></td>
            <td><textarea name="Address_Line_2"></textarea></td>
          </tr>

          <tr>
            <td><label>Address Line 3</label></td>
            <td><textarea name="Address_Line_3"></textarea></td>
          </tr>

          <tr>
            <td><label>State</label></td>
            <td><input type="text" name="State" maxlength="50"></td>
          </tr>

          <tr>
            <td><label>State Code</label></td>
            <td><input type="text" name="State_Code" maxlength="2"></td>
          </tr>

          <tr>
            <td><label>Supply Place</label></td>
            <td><input type="text" name="Supply_Place" maxlength="100"></td>
          </tr>

          <tr>
            <td colspan="2"><h3>Bank Details</h3></td>
          </tr>

          <tr>
            <td><label>Bank Name</label></td>
            <td><input type="text" name="Bank_Name" maxlength="100"></td>
          </tr>

          <tr>
            <td><label>Bank Account No</label></td>
            <td><input type="text" name="Bank_Account_No" maxlength="20"></td>
          </tr>

          <tr>
            <td><label>Bank IFSC</label></td>
            <td><input type="text" name="Bank_Branch_IFSC" maxlength="11"></td>
          </tr>

          <tr>
            <td><label>Bank Branch</label></td>
            <td><input type="text" name="Bank_Branch" maxlength="100"></td>
          </tr>

          <tr>
            <td colspan="2"><h3>Proprietor Details</h3></td>
          </tr>

          <tr>
            <td><label>Proprietor Name</label></td>
            <td><input type="text" name="Proprietary_Name" maxlength="100"></td>
          </tr>

          <tr>
            <td><label>Proprietor Phone</label></td>
            <td><input type="tel" name="Proprietary_Phone" maxlength="15"></td>
          </tr>

          <tr>
            <td><label>Proprietor Email</label></td>
            <td><input type="email" name="Proprietary_Email" maxlength="100"></td>
          <tr>
      <td colspan="2" align="center">
        <div class="msg"></div>
      </td>
    </tr>
            <td colspan="2" align="center">
              <button type="submit">Save Firm</button>
            </td>
          </tr>

        </table>
        
        </form>

      `
    }
    else if (tableName == "sample_table") {
      container.innerHTML = `
        <form class="addForm" data-table="sample_table">
          <h2>Sample Table</h2>

          <table>
            <tr>
              <td><label>Name *</label></td>
              <td>
                <input type="text" name="name" maxlength="50" required>
              </td>
            <tr>
      <td colspan="2" align="center">
        <div class="msg"></div>
      </td>
    </tr>
              <td colspan="2" align="center">
                <button type="submit">Save</button>
              </td>
            </tr>
          </table>
        
        </form>

      `
    }
    else if (tableName == "Parts") {
      container.innerHTML = `
        <form class="addForm" data-table="Parts">
  <h2>Add Part</h2>
      <div>!! Make sure HSN is entered in Tax table for successful entry!!</div>
  <table>
    <tr>
      <td><label>Part No *</label></td>
      <td>
        <input type="text" name="Part_No" maxlength="50" required>
      </td>
    </tr>

    <tr>
      <td><label>Part Name *</label></td>
      <td>
        <input type="text" name="Part_Name" maxlength="100" required>
      </td>
    </tr>

    <tr>
      <td><label>Price *</label></td>
      <td>
        <input type="number" name="Price" step="0.01" required>
      </td>
    </tr>

    <tr>
      <td><label>HSN</label></td>
      <td>
        <input type="text" name="HSN" maxlength="10">
      </td>
    </tr>
    <tr>
      <td colspan="2" align="center">
        <div class="msg"></div>
      </td>
    </tr>
    <tr>
      <td colspan="2" align="center">
        <button type="submit">Save Part</button>
      </td>
    </tr>
  </table>

</form>

      `
    }
    else if (tableName == "Tax") {
      container.innerHTML = `
      <form class="addForm" data-table="Tax">
  <h2>Add Tax Details</h2>

  <table>
    <tr>
      <td><label>HSN *</label></td>
      <td>
        <input type="text" name="HSN" maxlength="10" required>
      </td>
    </tr>

    <tr>
      <td><label>SGST (%) *</label></td>
      <td>
        <input type="number" name="SGST" step="0.01" required>
      </td>
    </tr>

    <tr>
      <td><label>CGST (%) *</label></td>
      <td>
        <input type="number" name="CGST" step="0.01" required>
      </td>
    </tr>

    <tr>
      <td><label>IGST (%) *</label></td>
      <td>
        <input type="number" name="IGST" step="0.01" required>
      </td>
    <tr>
      <td colspan="2" align="center">
        <div class="msg"></div>
      </td>
    </tr>
      <td colspan="2" align="center">
        <button type="submit">Save Tax</button>
      </td>
    </tr>
  </table>

  
</form>

      `;
    }
    // document.querySelectorAll(".addForm").forEach(form => {
    //   form.addEventListener("submit", async function (e) {
    //     e.preventDefault();

    //     const table = form.dataset.table;
    //     const formData = new FormData(form);
    //     const data = Object.fromEntries(formData.entries());
    //     const msg = form.querySelector(".msg");
    //     msg.innerText = "Saving...";
    //     try {
    //       const res = await fetch(`/datastores/add/${table}`, {
    //         method: "POST",
    //         headers: {
    //           "Content-Type": "application/json"
    //         },
    //         body: JSON.stringify(data)
    //       });
    //       if (res.ok) {
    //         msg.innerText = "Saved Successfully";
    //         form.reset();

    //         setTimeout(() => {
    //           msg.innerText = "";
    //         }, 1000); // 3 seconds
    //       } else {
    //         msg.innerText = "Insert Failed";

    //         setTimeout(() => {
    //           msg.innerText = "";
    //         }, 1000);
    //       }

    //     } catch (err) {
    //       console.error(err);
    //       msg.innerText = "Server error";
    //     }
    //   });
    // });
  }


  // ===== DELETE MODE RENDER =====
  else if (currentMode === "delete") {

    const safeTableName = tableName.replace(/[^a-zA-Z0-9]/g, '_');

    container.innerHTML = `
    <form class="deleteForm" data-table="${tableName}">
      <h2>Delete from ${tableName}</h2>

      <p style="color:red">
        !! Please ensure no dependent records exist before deleting.
      </p>

      <table>
        <tr>
          <td><label>Select entry *</label></td>
          <td>
            <input
              type="text"
              class="deleteDisplay"
              list="deleteList_${safeTableName}"
              required
            />

            <input
              type="hidden"
              name="deleteKey"
              class="deleteKey"
            />

            <datalist id="deleteList_${safeTableName}"></datalist>
          </td>
        </tr>
          <tr>
      <td colspan="2" align="center">
        <div class="msg"></div>
      </td>
    </tr>
        <tr>
          <td colspan="2" align="center">
            <button type="submit">Delete</button>
          </td>
        </tr>
      </table>

      
    </form>
  `;

    // Pre-populate the datalist immediately when the form is shown
    const form = container.querySelector('.deleteForm');
    if (form) {
      fetchDeleteList(tableName, form);
    }
  }



}



document.addEventListener("submit", async function (e) {
  const form = e.target;

  // handle ADD forms only
  if (!form.classList.contains("addForm")) return;

  e.preventDefault();

  // safety: block double clicks
  if (form.dataset.submitting === "true") return;
  form.dataset.submitting = "true";

  const table = form.dataset.table;
  const data = Object.fromEntries(new FormData(form));
  const msg = form.querySelector(".msg");

  msg.innerText = "Saving...";

  try {
    const res = await fetch(`/datastores/add/${table}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      msg.innerText = "Saved Successfully";
      alert("Saved Successfully")
      form.reset();
    } else {
      msg.innerText = "Insert Failed";
    }
  } catch (err) {
    console.error(err);
    msg.innerText = "Server error";
  }

  setTimeout(() => {
    msg.innerText = "";
    form.dataset.submitting = "false";
  }, 3000);
});

const deleteRegistry = {
  Tax: {
    url: "/datastores/dropdown/Tax",
    loaded: false,
    map: new Map(),
    display: r =>
      `HSN: ${r.HSN} | SGST: ${r.SGST} | CGST: ${r.CGST} | IGST: ${r.IGST}%`,
    key: r => r.HSN
  },

  Parts: {
    url: "/datastores/dropdown/Parts",
    loaded: false,
    map: new Map(),
    display: r =>
      `Part: ${r.Part_No} | Name: ${r.Part_Name} | HSN: ${r.HSN}`,
    key: r => r.Part_No
  },

  Customer: {
    url: "/datastores/dropdown/Customer",
    loaded: false,
    map: new Map(),
    display: r =>
      `Customer: ${r.Company_Name} | ID: ${r.Id}`,
    key: r => r.Id
  },

  Firm_Table: {
    url: "/datastores/dropdown/Firm_Table",
    loaded: false,
    map: new Map(),
    display: r =>
      `Firm: ${r.Firm_Name} | ID: ${r.Id}`,
    key: r => r.Id
  }
};


async function fetchDeleteList(tableName, form) {
  const config = deleteRegistry[tableName];
  if (!config) return;

  const datalist = form.querySelector('datalist');
  const input = form.querySelector('.deleteDisplay');

  if (!datalist || !input) return;

  // Always clear and repopulate the datalist (new form each time)
  datalist.innerHTML = "";

  // if (config.loaded) {
  //   // Use cached data for instant population
  //   config.map.forEach((key, text) => {
  //     const option = document.createElement("option");
  //     option.value = text;
  //     datalist.appendChild(option);
  //   });
  //   return;
  // }

  // Fetch fresh data if not loaded
  try {
    const res = await fetch(config.url);
    if (!res.ok) {
      throw new Error(`Failed to fetch data: ${res.status}`);
    }
    const data = await res.json();

    config.map.clear();

    data.forEach(row => {
      const text = config.display(row);
      const key = config.key(row);

      const option = document.createElement("option");
      option.value = text;
      datalist.appendChild(option);

      config.map.set(text, key);
    });

    config.loaded = true;
  } catch (error) {
    console.error("Error fetching delete list:", error);
    // Optionally show error in .msg
    const msg = form.querySelector(".msg");
    if (msg) {
      msg.textContent = "Failed to load entries. Please try again.";
      msg.style.color = "red";
    }
  }
}


document.addEventListener("change", e => {
  if (!e.target.classList.contains("deleteDisplay")) return;

  const form = e.target.closest(".deleteForm");
  if (!form) return;

  const table = form.dataset.table;
  const config = deleteRegistry[table];

  const hidden = form.querySelector(".deleteKey");
  hidden.value = config.map.get(e.target.value) || "";
});


document.addEventListener("submit", async e => {
  if (!e.target.classList.contains("deleteForm")) return;
  e.preventDefault();

  const form = e.target;
  const table = form.dataset.table;
  const key = form.querySelector(".deleteKey").value;
  const msg = form.querySelector(".msg");

  if (!key) {
    alert("Select a valid entry");
    return;
  }

  if (!confirm("Are you sure you want to delete?")) return;

  try {
    const res = await fetch(`/datastores/delete/${table}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteKey: key })
    });

    if (!res.ok) {
      throw new Error(`Delete failed: ${res.status}`);
    }

    const result = await res.json();
    msg.textContent = result.message;
    msg.style.color = "green";

    // Reset cache to force refetch
    deleteRegistry[table].loaded = false;
    deleteRegistry[table].map.clear();

    form.reset();

    // Repopulate the datalist immediately after successful delete (refreshes list)
    await fetchDeleteList(table, form);

  } catch (error) {
    console.error("Delete error:", error);
    msg.textContent = "Delete failed. Please try again.";
    msg.style.color = "red";
  }

  setTimeout(() => {
    msg.textContent = "";
  }, 1000);  // Increased timeout for better UX
});
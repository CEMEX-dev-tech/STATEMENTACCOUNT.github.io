  let csvData = [];
  let currentCustomerRows = [];
  let loginAttempts = 0; // contador de intentos 

  // ✅ Cargar CSV normal (sin cifrado)
  async function loadCSV() {
    try {
      const res = await fetch("data.csv");
      if (!res.ok) throw new Error("No se pudo descargar data.csv");

      const csvText = await res.text();

      // 📊 Parsear CSV con PapaParse
      const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: h => h.trim()
      });

      csvData = parsed.data;
      console.log("✅ CSV cargado correctamente con", csvData.length, "filas.");
    } catch (err) {
      console.error("❌ Error cargando el CSV:", err);
      alert("Error loading data file. Please try again later.");
    }
  }

  // 🚀 Llamar a la función al cargar la página
  loadCSV();

  const selectedColumns = [
    "BRANCH",
    "BRANCH NAME",
    "DIVISION",
    "DOC.TYPE",
    "# DOCUMENT",
    "ISSUED DATE",
    "NET DUE DATE",
    "DUE DAYS",
    "AMOUNT",
    "BALANCE",
    "CUR.",
    "NOT OVERDUE",
    "1 TO 30 DD",
    "31 TO 60 DD",
    "> TO 60 - DD"
  ];

  const totalColumns = [
    "AMOUNT",
    "BALANCE",
    "NOT OVERDUE",
    "1 TO 30 DD",
    "31 TO 60 DD",
    "> TO 60 - DD"
  ];
  const secondGroupColumns = [
    "# DOCUMENT",
    "DOC.TYPE",
    "ISSUED DATE",
    "AMOUNT",
    "CLEARING",
    "COMMITTED",
    "BALANCE"
  ];

  const secondGroupTotals = [
    "AMOUNT",
    "CLEARING",
    "COMMITTED",
    "BALANCE"
  ];

  let selectedCustomer = null; // guarda el cliente que pasa la primera validación
  
  function checkCustomer(){
    const customerId = document.getElementById("customerIdInput").value.trim();
    selectedCustomer = csvData.find(r => r["CUSTOMER"] && r["CUSTOMER"].trim() === customerId);
  
    if(selectedCustomer){
      document.querySelector('button[onclick="checkCustomer()"]').style.display = "none";
      // Mostrar campo para CODE
      document.getElementById("codeLabel").style.display = "block";
      document.getElementById("codeInput").style.display = "block";
      document.getElementById("codeButton").style.display = "block";
    } else {
      document.getElementById("errorMsg").style.display = "block";
    }
  }
 
  function checkCode() {
    const codeEntered = document.getElementById("codeInput").value.trim();

    if (
      selectedCustomer &&
      selectedCustomer["CODE"] &&
      selectedCustomer["CODE"].trim() === codeEntered
    ) {
      // ✅ Si el código es correcto
      loginAttempts = 0; // resetear intentos
      currentCustomerRows = csvData.filter(
        r => r["CUSTOMER"].trim() === selectedCustomer["CUSTOMER"].trim()
      );
      populateCompanyFilter(currentCustomerRows);
      showData(currentCustomerRows);

      // Ocultar login y mostrar dataScreen
      document.getElementById("loginScreen").style.display = "none";
      document.getElementById("dataScreen").style.display = "flex";
      document.getElementById("dataScreen").scrollTop = 0; // ✅ asegura vista al inicio
    } else {
      // ❌ Si el código es incorrecto
      loginAttempts++;
      document.getElementById("errorMsg").style.display = "block";

      if (loginAttempts >= 3) {
        // ❌ Bloqueo total tras 3 intentos
        document.getElementById("loginScreen").innerHTML = `
          <div class="ribbon" style="margin-top:200px; animation:none; text-align:center; font-size:1.8rem; padding:30px 60px;">
            Access blocked after 3 failed attempts.<br><br>           
            For further assistance, please reach out to your assigned sales representative 💼      
          </div>
        `;
      }
    }
  }   
  function goBack(){
    document.getElementById("dataScreen").style.display = "none";
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("customerIdInput").value = "";
    document.getElementById("codeInput").value = "";
    document.getElementById("codeLabel").style.display = "none";
    document.getElementById("codeInput").style.display = "none";
    document.getElementById("codeButton").style.display = "none";
    document.getElementById("errorMsg").style.display = "none";
    document.querySelector('button[onclick="checkCustomer()"]').style.display = "inline-block";
  }

  function populateCompanyFilter(rows){
    const select = document.getElementById("companyFilter");
    select.innerHTML = `<option value="">All</option>`;
    const uniqueCodes = [...new Set(rows.map(r => r["COMPANY CODE2"]))];
    uniqueCodes.forEach(code => {
      if(code){
        const opt = document.createElement("option");
        opt.value = code;
        opt.textContent = code;
        select.appendChild(opt);
      }
    });
  }

  function applyCompanyFilter(){
    const selectedCode = document.getElementById("companyFilter").value;
    let filtered = currentCustomerRows;
    if(selectedCode){
      filtered = currentCustomerRows.filter(r => r["COMPANY CODE2"] === selectedCode);
    }
    showData(filtered);
  }
  
function renderBalanceBubble(total, title){
  return `
    <div style="
      display:inline-block;
      background:#0600b6;
      color:white;
      padding:10px 20px;
      border-radius:25px;
      font-weight:bold;
      font-size:1.5rem;
      margin:1rem 0;
      font-family:'Outfit', sans-serif;">
      ${title}: $${total.toLocaleString()}
    </div>
  `;
}
  
function renderInfoBubble(label, value){
  return `
    <div style="
      display:inline-block;
      background:#0600b6;
      color:white;
      padding:10px 20px;
      border-radius:25px;
      font-weight:bold;
      font-size:1.5rem;
      margin:0.5rem;
      font-family:'Outfit', sans-serif;">
      ${label}: ${value}
    </div>
  `;
}

function renderSecondGroupTable(data, title) {
  if (data.length === 0) return "";

  let totals = {};
  secondGroupTotals.forEach(c => totals[c] = 0);
 
  let html = `<h2> ${title}</h2>`;
  html += `<div class="table-wrapper"><table><thead><tr>`;

  secondGroupColumns.forEach(c => {
    html += `<th>${c}<br><input type="text" placeholder="🔍" 
      onkeyup="filterColumn(this, '${c}', '${title}')"
      style="width:90%; font-size:0.9rem; padding:2px 5px; border:1px solid #ccc; border-radius:4px;"></th>`;
  });
  html += "</tr></thead><tbody id='body_" + title.replace(/\s+/g,'_') + "'>";

  data.forEach(r => {
    html += "<tr>";
    secondGroupColumns.forEach(c => {
      let value = r[c] ?? "";

      if(secondGroupTotals.includes(c) && value){
        let num = parseFloat(value.toString().replace(/,/g,""));
        if(!isNaN(num)) totals[c] += num;
      }

      if(secondGroupTotals.includes(c) && value !== ""){
        let num = parseFloat(value.toString().replace(/,/g,""));
        html += `<td>${!isNaN(num) ? num.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) : value}</td>`;
      } else {
        html += `<td>${value}</td>`;
      }
    });
    html += "</tr>";
  });

  html += "</tbody><tfoot><tr>";
  secondGroupColumns.forEach(c => {
    if(secondGroupTotals.includes(c)){
      html += `<td><b>${totals[c] ? totals[c].toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) : "0.00"}</b></td>`;
    } else if(c === secondGroupColumns[0]){
      html += "<td><b>Totals</b></td>";
    } else {
      html += "<td></td>";
    }
  });
  html += "</tr></tfoot></table></div>";
  return html;
}

function showData(rows){
  const container = document.getElementById("tableContainer");
  container.innerHTML = ""; // limpiar antes
  
  if(rows.length === 0){
    container.innerHTML = "<p>No data available for this Customer.</p>";
    return;
  }
  const customerName = rows[0]["CUSTOMER NAME"] || "N/A";
  const customerId = rows[0]["CUSTOMER"] || "N/A";
  const creditLimit = rows[0]["CREDIT LIMIT"] || "0";

  // 👉 Renderizas las 3 burbujas arriba
  const infoContainer = document.getElementById("infoBubbles");
  infoContainer.innerHTML = `
    ${renderInfoBubble("Customer", customerName)}
    ${renderInfoBubble("Customer Code", customerId)}
    ${renderInfoBubble("Credit Limit", "$"+Number(creditLimit).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
  `;
  // Categorías de documentos
  const firstGroupDocs = ["Bounced Cheque","Invoice","Debit Note","Invoice I. L"];
  const secondGroupDocs = ["Payment","Credit Note","Transfer","Refund"];

  // Separar registros
  const firstGroup = rows.filter(r => firstGroupDocs.includes((r["DOC.TYPE"]||"").trim()));
  const secondGroup = rows.filter(r => secondGroupDocs.includes((r["DOC.TYPE"]||"").trim()));

  let overdueTotal = 0;
  rows.forEach(r => {
    ["1 TO 30 DD", "31 TO 60 DD", "> TO 60 - DD"].forEach(c => {
      let value = r[c] ?? 0;
      let num = parseFloat(value.toString().replace(/,/g, ""));
      if (!isNaN(num)) overdueTotal += num;
    });
  });
  let secondGroupTotalBalance = 0;
    secondGroup.forEach(r => {
      let val = parseFloat((r["BALANCE"]||"0").toString().replace(/,/g,""));
      if(!isNaN(val)) secondGroupTotalBalance += val;
    });
  
    // 👉 Calcular cobertura
    let coverage = 0;
    if (overdueTotal > 0) {
      coverage = Math.abs(secondGroupTotalBalance) / overdueTotal;
    }
  

function renderTable(data, title) {
  if (data.length === 0) return "";

  let totals = {};
  totalColumns.forEach(c => totals[c] = 0);

  // Encabezado con filtros
  let html = `<h2> ${title}</h2>`;
  html += `<div class="table-wrapper"><table><thead><tr>`;

  selectedColumns.forEach(c => {
    html += `<th>${c}<br><input type="text" placeholder="🔍" 
      onkeyup="filterColumn(this, '${c}', '${title}')"
      style="width:90%; font-size:0.9rem; padding:2px 5px; border:1px solid #ccc; border-radius:4px;"></th>`;
  });
  html += "</tr></thead><tbody id='body_" + title.replace(/\s+/g,'_') + "'>";

  data.forEach(r => {
    html += "<tr>";
    selectedColumns.forEach(c => {
      let value = r[c] ?? "";

      // Calcular totales
      if(totalColumns.includes(c) && value){
        let num = parseFloat(value.toString().replace(/,/g,""));
        if(!isNaN(num)) totals[c] += num;
      }

      // Color según días vencidos
      if(c === "DUE DAYS" && value !== ""){
        let num = parseFloat(value);
        let color = "black";
        if(num < 0) color = "green";
        else if(num === 0) color = "orange";
        else if(num > 0) color = "red";
        html += `<td style="color:${color}; font-weight:bold;">${value}</td>`;
      } 
      else if(totalColumns.includes(c) && value !== "") {
        let num = parseFloat(value.toString().replace(/,/g,""));
        html += `<td>${!isNaN(num) ? num.toLocaleString("en-US", {minimumFractionDigits:2,maximumFractionDigits:2}) : value}</td>`;
      } else {
        html += `<td>${value}</td>`;
      }
    });
    html += "</tr>";
  });

  // Fila de totales
  html += "</tbody><tfoot><tr>";
  selectedColumns.forEach(c => {
    if(totalColumns.includes(c)){
      html += `<td><b>${totals[c] ? totals[c].toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) : "0.00"}</b></td>`;
    } else if(c === selectedColumns[0]){
      html += "<td><b>Totals</b></td>";
    } else {
      html += "<td></td>";
    }
  });
  html += "</tr></tfoot></table></div>";
  return html;
}
 
// Total del Balance del primer grupo
  let totalFirstBalance = firstGroup.reduce((acc, row) => {
    let num = parseFloat((row["BALANCE"]||"0").toString().replace(/,/g,""));
    return acc + (isNaN(num) ? 0 : num);
  },0);
  
  // Total del Balance del segundo grupo
  let totalSecondBalance = secondGroup.reduce((acc, row) => {
    let num = parseFloat((row["BALANCE"]||"0").toString().replace(/,/g,""));
    return acc + (isNaN(num) ? 0 : num);
  },0);
  
  const bubblesContainer = document.getElementById("bubblesContainer");
  bubblesContainer.innerHTML = `
    
    <div style="display:flex; justify-content:center; margin-top:0.5rem;">
      <table style="
        border-collapse:collapse; 
        font-family:'Outfit',sans-serif; 
        font-size:1.5rem; 
        min-width:400px;
        border-radius:12px;   
        overflow:hidden;      
        box-shadow:0 2px 6px rgba(0,0,0,0.15);
      ">
        <tr>
          <th style="background:#0600b6; color:white; padding:6px 12px; text-align:center;">Metric</th>
          <th style="background:#0600b6; color:white; padding:6px 12px; text-align:center;">Value</th>
        </tr>
        <tr>
          <td style="padding:6px 12px; text-align:center;">Total Portfolio</td>
          <td style="padding:6px 12px; text-align:center;">$${totalFirstBalance.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px; font-weight:bold; color:#f7212e; text-align:center;">Total Overdue</td>
          <td style="padding:6px 12px; font-weight:bold; color:#f7212e; text-align:center;">$${overdueTotal.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px; text-align:center;">Credit Balance</td>
          <td style="padding:6px 12px; text-align:center;">$${totalSecondBalance.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px; font-weight:bold; color:#0600b6; text-align:center;">Net Portfolio</td>
          <td style="padding:6px 12px; font-weight:bold; color:#0600b6; text-align:center;">
            $${(totalFirstBalance + totalSecondBalance).toLocaleString()}
          </td>
        </tr>
      </table>
    </div>
  `;

  // Renderizar tablas debajo
  container.innerHTML = "";
  container.innerHTML += renderTable(firstGroup,"BALANCES");
  container.innerHTML += renderSecondGroupTable(secondGroup,"PAYMENT - CREDIT BALANCE");
}  
  
async function exportPDF() { 
  const { jsPDF } = window.jspdf; 
  const element = document.getElementById("dataScreen"); 
  if (!element) return alert("❌ No se encontró el contenido para exportar."); 

  // Mensaje temporal 
  const loadingMsg = document.createElement("div"); 
  loadingMsg.textContent = " "; 
  Object.assign(loadingMsg.style, { 
    fontSize: "1.2rem", 
    color: "#0600b6", 
    textAlign: "center", 
    marginTop: "10px" 
  }); 
  element.prepend(loadingMsg); 

  // 👉 No tocamos estilos inline: solo aplicamos una clase que fuerza zoom=1 
  document.body.classList.add("exporting-capture"); 
  try { 
    if (document.fonts && document.fonts.ready) { 
      try { 
        await document.fonts.ready; 
      } catch (_) {} 
    } 
    window.scrollTo(0, 0); 

    // Clonar contenido a tamaño real para que no se corte 
    const clone = element.cloneNode(true); 
    const realWidth = element.scrollWidth; 
    const realHeight = element.scrollHeight;
    const extendedWidth = realWidth * 3;  // aumenta 3x el ancho de captura
    const extendedHeight = realHeight * 1.2; // opcional para evitar recorte inferior

    
    Object.assign(clone.style, { 
      width: extendedWidth + "px",   // ✅ usa extendedWidth aquí      
      height: extendedHeight + "px",
      maxWidth: "none", 
      maxHeight: "none", 
      position: "absolute", 
      left: "-9999px", 
      top: "0", 
      background: "#ffffff", 
      overflow: "visible",
      transform: "scale(1)",        // ✅ evita compresión visual
      transformOrigin: "top left"
    });

    document.body.appendChild(clone); 

    const canvas = await html2canvas(clone, { 
      scale: 3, // alta nitidez 
      useCORS: true, 
      backgroundColor: "#ffffff", 
      logging: false, 
      windowWidth: realWidth, 
      windowHeight: realHeight 
    }); 

    document.body.removeChild(clone); 

    const imgData = canvas.toDataURL("image/jpeg", 0.85); 
    const pdfW = canvas.width * 0.2646; // px → mm 
    const pdfH = canvas.height * 0.2646; 

    const pdf = new jsPDF({ 
      orientation: pdfW > pdfH ? "l" : "p", 
      unit: "mm", 
      format: [pdfW, pdfH] 
    }); 

    pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH); 
    pdf.save("Account_Statement_Full.pdf"); 
  } catch (err) { 
    console.error("❌ Error al generar el PDF:", err); 
    alert("Ocurrió un error al generar el PDF."); 
  } finally { 
    // 🔄 Siempre vuelve al estado original quitando la clase 
    if (loadingMsg && loadingMsg.parentNode) loadingMsg.remove(); 
    // pequeño delay para evitar parpadeos en algunos navegadores 
    setTimeout(() => document.body.classList.remove("exporting-capture"), 1); 
  } 
}



function exportExcel() {
  if (currentCustomerRows.length === 0) {
    alert("No data to export");
    return;
  }

  // Convierte JSON a hoja de Excel
  const ws = XLSX.utils.json_to_sheet(currentCustomerRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Account Statement");

  // Exporta como .xlsx
  XLSX.writeFile(wb, "Account_Statement.xlsx");
}

function filterColumn(input, columnName, tableTitle) {
  const filter = input.value.toLowerCase();
  const tableBody = document.getElementById('body_' + tableTitle.replace(/\s+/g, '_'));
  if (!tableBody) return;

  const rows = tableBody.getElementsByTagName("tr");
  const headers = tableBody.parentElement.querySelectorAll("th");
  const index = Array.from(headers).findIndex(th => th.textContent.includes(columnName));
  if (index === -1) return;

  // 🔹 Mostrar/ocultar filas según filtro
  for (let row of rows) {
    const cell = row.getElementsByTagName("td")[index];
    if (cell) {
      const textValue = cell.textContent || cell.innerText;
      row.style.display = textValue.toLowerCase().includes(filter) ? "" : "none";
    }
  }

  // 🔹 Recalcular totales visibles
  const tfoot = tableBody.parentElement.querySelector("tfoot tr");
  if (!tfoot) return;

  const totalCells = tfoot.getElementsByTagName("td");
  const visibleRows = Array.from(rows).filter(r => r.style.display !== "none");

  // Determinar qué columnas son numéricas
  const numericCols = [];
  headers.forEach((th, i) => {
    if (th.textContent.match(/amount|balance|overdue|dd|clearing|committed/i)) numericCols.push(i);
  });

  // Recalcular valores
  numericCols.forEach(i => {
    let sum = 0;
    visibleRows.forEach(r => {
      const td = r.getElementsByTagName("td")[i];
      if (td) {
        let num = parseFloat(td.textContent.replace(/,/g, ""));
        if (!isNaN(num)) sum += num;
      }
    });

    if (totalCells[i]) {
      totalCells[i].innerHTML = `<b>${sum.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}</b>`;
    }
  });
}

  const lastUpdate = "23/10/2025"; // <-- cámbiala cada vez que actualices el CSV
  document.getElementById("currentDate").textContent = lastUpdate;
    
  window.oncontextmenu = () => false; 
  document.addEventListener("keydown", e => {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && ["I", "C", "J"].includes(e.key.toUpperCase())) ||
      (e.ctrlKey && ["U", "S"].includes(e.key.toUpperCase()))
    ) {
      e.preventDefault();
      alert("⚠️ Developer tools are disabled on this page.");
    }
  });
 
  setInterval(() => {
    const threshold = 160;
    const start = performance.now();
    debugger;
    const delay = performance.now() - start;
    if (delay > threshold) {
      alert("⚠️ Developer tools detected. Please close them to continue.");
      window.location.href = "about:blank"; 
    }
  }, 1000);





  /* https://www.youtube.com/watch?v=dQw4w9WgXcQ

  https://www.youtube.com/watch?v=dQw4w9WgXcQ

  https://www.youtube.com/watch?v=dQw4w9WgXcQ  */


document.addEventListener("DOMContentLoaded", () => {
  const appModal = document.getElementById("app-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalMessage = document.getElementById("modal-message");
  const modalOkBtn = document.getElementById("modal-ok-btn");

  const showNotification = (title, message, type = "info") => {
    return new Promise((resolve) => {
      modalTitle.textContent = title;
      modalMessage.innerHTML = message;

      const header = modalTitle.parentElement;
      const existingIcon = header.querySelector(".modal-icon");
      if (existingIcon) header.removeChild(existingIcon);

      let iconHtml = "";
      if (type === "success") {
        iconHtml = `<svg class="modal-icon success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" /></svg>`;
      } else if (type === "error" || type === "confirm") {
        iconHtml = `<svg class="modal-icon error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" /></svg>`;
      }
      if (iconHtml) header.insertAdjacentHTML("afterbegin", iconHtml);

      const modalFooter = modalOkBtn.parentElement;
      let cancelBtn = document.getElementById("modal-cancel-btn");
      if (type === "confirm") {
        if (!cancelBtn) {
          modalFooter.insertAdjacentHTML(
            "afterbegin",
            `<button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>`
          );
          cancelBtn = document.getElementById("modal-cancel-btn");
        }
        modalFooter.style.display = "flex";
        modalFooter.style.gap = "1rem";
        cancelBtn.style.display = "inline-flex";
      } else {
        if (cancelBtn) cancelBtn.style.display = "none";
        modalFooter.style.display = "block";
      }

      appModal.classList.add("visible");

      const handleClose = (result) => {
        appModal.classList.remove("visible");
        okBtn.removeEventListener("click", okHandler);
        if (cancelBtn) {
          cancelBtn.removeEventListener("click", cancelHandler);
        }
        resolve(result);
      };

      const okHandler = () => handleClose(true);
      const cancelHandler = () => handleClose(false);

      const okBtn = document.getElementById("modal-ok-btn");
      okBtn.addEventListener("click", okHandler);

      if (cancelBtn && type === "confirm") {
        cancelBtn.addEventListener("click", cancelHandler);
      }
    });
  };

  const initializeAdminPage = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/login.html";
      return;
    }

    let currentPage = 1;
    let currentSearch = "";
    const recordsPerPage = 10;
    let debounceTimer;
    let parsedBulkData = [];
    let latestGeneratedData = null;

    const logoutBtn = document.getElementById("logout-btn");
    const createTabBtn = document.getElementById("create-tab-btn");
    const manageTabBtn = document.getElementById("manage-tab-btn");
    const findTabBtn = document.getElementById("find-tab-btn");
    const bulkAddTabBtn = document.getElementById("bulk-add-tab-btn");

    const createView = document.getElementById("create-view");
    const manageView = document.getElementById("manage-view");
    const findView = document.getElementById("find-view");
    const bulkAddView = document.getElementById("bulk-add-view");

    const pageTitle = document.getElementById("page-title");
    const pageSubtitle = document.getElementById("page-subtitle");

    const generateForm = document.getElementById("generate-form");
    const roleSelect = document.getElementById("role-select");
    const otherRoleGroup = document.getElementById("other-role-group");
    const otherRoleInput = document.getElementById("other-role-input");

    const searchInput = document.getElementById("search-input");
    const tableBody = document.getElementById("certificates-table-body");
    const pageInfo = document.getElementById("page-info");
    const prevPageBtn = document.getElementById("prev-page-btn");
    const nextPageBtn = document.getElementById("next-page-btn");

    const editModal = document.getElementById("edit-modal");
    const editForm = document.getElementById("edit-form");
    const editCancelBtn = document.getElementById("edit-cancel-btn");

    const findForm = document.getElementById("find-form");
    const findControlNoInput = document.getElementById("find-control-no-input");
    const findResultContainer = document.getElementById(
      "find-result-container"
    );
    const foundRecipientNameEl = document.getElementById(
      "found-recipient-name"
    );
    const generatedQrCodeImg = document.getElementById("generated-qr-code");
    const generatedControlNumberEl = document.getElementById(
      "generated-control-number"
    );
    const saveQrBtn = document.getElementById("save-qr-btn");
    const copyQrImageBtn = document.getElementById("copy-qr-image-btn");
    const copyControlNoBtn = document.getElementById("copy-control-no-btn");

    const bulkDataInput = document.getElementById("bulk-data-input");
    const previewBulkBtn = document.getElementById("preview-bulk-btn");
    const processBulkBtn = document.getElementById("process-bulk-btn");
    const bulkPreviewArea = document.getElementById("bulk-preview-area");
    const bulkResultsContainer = document.getElementById('bulk-results-container');

    const API_BASE_URL =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
        ? "http://localhost:3001/api"
        : "/api";

    const fetchCertificates = async (page, search) => {
      try {
        tableBody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;
        const response = await fetch(
          `${API_BASE_URL}/certificates?page=${page}&limit=${recordsPerPage}&search=${search}`
        );
        if (!response.ok) throw new Error("Failed to fetch data");
        const { data, total } = await response.json();
        renderTable(data);
        renderPagination(total);
      } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="5">Error loading data. Please try again.</td></tr>`;
      }
    };

    const renderTable = (certificates) => {
      tableBody.innerHTML = "";
      if (certificates.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No certificates found.</td></tr>`;
        return;
      }
      certificates.forEach((cert) => {
        const row = document.createElement("tr");
        row.innerHTML = `
                    <td>${cert.recipient_name}</td>
                    <td>${cert.event_name}</td>
                    <td>${new Date(cert.date_given).toLocaleDateString()}</td>
                    <td>${cert.control_number}</td>
                    <td class="actions-cell">
                        <button class="btn btn-edit" data-id="${
                          cert.control_number
                        }">Edit</button>
                        <button class="btn btn-delete" data-id="${
                          cert.control_number
                        }">Delete</button>
                    </td>
                `;
        tableBody.appendChild(row);
      });
    };

    const renderPagination = (total) => {
      const totalPages = Math.ceil(total / recordsPerPage);
      pageInfo.textContent = `Page ${currentPage} of ${
        totalPages || 1
      } (${total} total records)`;
      prevPageBtn.disabled = currentPage <= 1;
      nextPageBtn.disabled = currentPage >= totalPages;
    };

    const setActiveTab = (activeTab) => {
      [createTabBtn, manageTabBtn, findTabBtn, bulkAddTabBtn].forEach((btn) =>
        btn.classList.remove("active")
      );
      [createView, manageView, findView, bulkAddView].forEach((view) =>
        view.classList.add("hidden")
      );
      if (activeTab === "create") {
        createTabBtn.classList.add("active");
        createView.classList.remove("hidden");
        pageTitle.textContent = "Create Certificate";
        pageSubtitle.textContent =
          "Fill in the details for a single certificate.";
      } else if (activeTab === "manage") {
        manageTabBtn.classList.add("active");
        manageView.classList.remove("hidden");
        pageTitle.textContent = "Manage Certificates";
        pageSubtitle.textContent =
          "Search, view, edit, or delete existing certificates.";
        fetchCertificates(currentPage, currentSearch);
      } else if (activeTab === "find") {
        findTabBtn.classList.add("active");
        findView.classList.remove("hidden");
        pageTitle.textContent = "Find Existing Certificate";
        pageSubtitle.textContent =
          "Enter a control number to re-generate its QR code.";
      } else if (activeTab === "bulk") {
        bulkAddTabBtn.classList.add("active");
        bulkAddView.classList.remove("hidden");
        pageTitle.textContent = "Bulk Add Certificates";
        pageSubtitle.textContent =
          "Create multiple certificates by pasting data from a spreadsheet.";
      }
    };

    const handleSearch = (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentPage = 1;
        currentSearch = e.target.value;
        fetchCertificates(currentPage, currentSearch);
      }, 300);
    };

    const handleTableClick = (e) => {
      const editBtn = e.target.closest(".btn-edit");
      const deleteBtn = e.target.closest(".btn-delete");
      if (editBtn) handleEdit(editBtn.dataset.id);
      if (deleteBtn) handleDelete(deleteBtn.dataset.id);
    };

    const handleEdit = async (controlNumber) => {
    try {
        const response = await fetch(`${API_BASE_URL}/verify/${controlNumber}`);
        if (!response.ok) throw new Error('Certificate not found');
        const data = await response.json();
        
        editForm.querySelector('#edit-control-number').textContent = data.control_number;
        editForm.querySelector('#edit-recipient-name').value = data.recipient_name;
        editForm.querySelector('#edit-event-name').value = data.event_name;
        editForm.querySelector('#edit-certificate-type').value = data.certificate_type;
        editForm.querySelector('#edit-role').value = data.role;
        editForm.querySelector('#edit-date-given').value = data.date_given;
        editModal.classList.add('visible');
    } catch (error) {
        showNotification('Error', error.message, 'error');
    }
};

    const handleDelete = async (controlNumber) => {
      const confirmed = await showNotification(
        "Confirm Deletion",
        `Are you sure you want to delete certificate <strong>${controlNumber}</strong>? This cannot be undone.`,
        "confirm"
      );
      if (!confirmed) return;
      try {
        const response = await fetch(
          `${API_BASE_URL}/certificates/${controlNumber}`,
          { method: "DELETE" }
        );
        if (!response.ok) throw new Error("Failed to delete");
        showNotification(
          "Success",
          "Certificate deleted successfully.",
          "success"
        );
        fetchCertificates(currentPage, currentSearch);
      } catch (error) {
        showNotification("Error", "Could not delete certificate.", "error");
      }
    };

    const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    const controlNumber = editForm.querySelector('#edit-control-number').textContent;
    const updatedData = {
        recipient_name: editForm.querySelector('#edit-recipient-name').value,
        event_name: editForm.querySelector('#edit-event-name').value,
        certificate_type: editForm.querySelector('#edit-certificate-type').value,
        role: editForm.querySelector('#edit-role').value,
        date_given: editForm.querySelector('#edit-date-given').value,
    };
    try {
        const response = await fetch(`${API_BASE_URL}/certificates/${controlNumber}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        if (!response.ok) throw new Error('Update failed');
        editModal.classList.remove('visible');
        await showNotification('Success', 'Certificate updated successfully.', 'success');
        fetchCertificates(currentPage, currentSearch);
    } catch (error) {
        showNotification('Error', 'Could not update certificate.', 'error');
    }
};

    const displayFoundResult = async (certData) => {
      try {
        const qrCodeUrl = await QRCode.toDataURL(certData.control_number, {
          width: 200,
        });
        latestGeneratedData = {
          control_number: certData.control_number,
          qr_code_url: qrCodeUrl,
        };
        foundRecipientNameEl.textContent = certData.recipient_name;
        generatedQrCodeImg.src = qrCodeUrl;
        generatedControlNumberEl.textContent = `Certificate ID: ${certData.control_number}`;
        findResultContainer.classList.remove("hidden");
      } catch (err) {
        showNotification("QR Error", "Could not generate QR code.", "error");
      }
    };

    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "/login.html";
    });
    createTabBtn.addEventListener("click", () => setActiveTab("create"));
    manageTabBtn.addEventListener("click", () => setActiveTab("manage"));
    findTabBtn.addEventListener("click", () => setActiveTab("find"));
    bulkAddTabBtn.addEventListener("click", () => setActiveTab("bulk"));

    roleSelect.addEventListener("change", () => {
      otherRoleGroup.classList.toggle("hidden", roleSelect.value !== "Other");
      otherRoleInput.required = roleSelect.value === "Other";
    });
    generateForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      let roleValue =
        roleSelect.value === "Other"
          ? otherRoleInput.value.trim()
          : roleSelect.value;
      if (roleSelect.value === "Other" && !roleValue) {
        showNotification("Input Required", "Please specify the role.", "error");
        return;
      }
      const certificateData = {
        encoder_email: document.getElementById("encoder-email").value.trim(),
        encoder_name: document.getElementById("encoder-name").value.trim(),
        recipient_name: document.getElementById("recipient-name").value.trim(),
        certificate_type: document.getElementById("certificate-type").value,
        role: roleValue,
        event_name: document.getElementById("event-name").value.trim(),
        venue: document.getElementById("venue").value.trim(),
        theme: document.getElementById("theme").value.trim(),
        date_given: document.getElementById("date-given").value,
      };
      try {
        const response = await fetch(`${API_BASE_URL}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(certificateData),
        });
        if (response.ok) {
          const resultData = await response.json();
          await showNotification(
            "Success!",
            `Certificate generated successfully.<br>Control Number: <strong>${resultData.control_number}</strong>`,
            "success"
          );
          generateForm.reset();
        } else {
          const errorData = await response.json();
          showNotification("Error", errorData.message, "error");
        }
      } catch (error) {
        showNotification(
          "Connection Error",
          "Could not connect to the server.",
          "error"
        );
      }
    });

    searchInput.addEventListener("input", handleSearch);
    prevPageBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        fetchCertificates(currentPage, currentSearch);
      }
    });
    nextPageBtn.addEventListener("click", () => {
      currentPage++;
      fetchCertificates(currentPage, currentSearch);
    });

    tableBody.addEventListener("click", handleTableClick);
    editForm.addEventListener("submit", handleEditFormSubmit);
    editCancelBtn.addEventListener("click", () =>
      editModal.classList.remove("visible")
    );

    findForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const controlNo = findControlNoInput.value.trim();
      if (!controlNo) return;
      try {
        const response = await fetch(`${API_BASE_URL}/verify/${controlNo}`);
        if (response.ok) {
          const certData = await response.json();
          await displayFoundResult(certData);
        } else {
          showNotification(
            "Not Found",
            "Certificate with that control number was not found.",
            "error"
          );
          findResultContainer.classList.add("hidden");
        }
      } catch (error) {
        showNotification(
          "Connection Error",
          "Error connecting to the server.",
          "error"
        );
      }
    });
    saveQrBtn.addEventListener("click", () => {
      if (!latestGeneratedData) return;
      const link = document.createElement("a");
      link.href = latestGeneratedData.qr_code_url;
      link.download = `qr-code-${latestGeneratedData.control_number}.png`;
      link.click();
    });
    copyQrImageBtn.addEventListener("click", async () => {
      if (!latestGeneratedData) return;
      try {
        const response = await fetch(latestGeneratedData.qr_code_url);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        showNotification(
          "Copied!",
          "QR Code image copied to clipboard!",
          "success"
        );
      } catch (err) {
        showNotification(
          "Copy Failed",
          "Failed to copy QR image. This feature may not be supported by your browser.",
          "error"
        );
      }
    });
    copyControlNoBtn.addEventListener("click", () => {
      if (!latestGeneratedData) return;
      navigator.clipboard
        .writeText(latestGeneratedData.control_number)
        .then(() => {
          showNotification(
            "Copied!",
            "Control number copied to clipboard!",
            "success"
          );
        });
    });

    previewBulkBtn.addEventListener('click', () => {
    const textData = bulkDataInput.value.trim();
    if (!textData) {
       
        bulkResultsContainer.innerHTML = `
            <div class="card-header-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <h3>Bulk Import Preview</h3>
            </div>
            <div id="bulk-preview-area">
                <p class="card-subtitle">Text area is empty. Paste data to preview.</p>
            </div>`;
        return;
    }
    
    const rows = textData.split('\n').filter(row => row.trim() !== '');
    let validCount = 0;
    let errorCount = 0;
    let tableRowsHTML = '';

    parsedBulkData = rows.map(row => {
        const columns = row.split('\t');
        if (columns.length !== 11) {
            errorCount++;
            tableRowsHTML += `<tr class="error-row"><td colspan="3">Error: Row does not have 11 columns.</td></tr>`;
            return null;
        }
        validCount++;
        const cert = {
            recipient_name: columns[3].trim(),
            event_name: columns[4].trim(),
            control_number: columns[10].trim(),
            full_data: { timestamp: columns[0].trim(), encoder_email: columns[1].trim(), encoder_name: columns[2].trim(), recipient_name: columns[3].trim(), event_name: columns[4].trim(), certificate_type: columns[5].trim(), role: columns[6].trim(), venue: columns[7].trim(), theme: columns[8].trim(), date_given: columns[9].trim(), control_number: columns[10].trim() }
        };
        tableRowsHTML += `<tr><td>${cert.recipient_name}</td><td>${cert.event_name}</td><td>${cert.control_number}</td></tr>`;
        return cert;
    }).filter(cert => cert !== null);
    
    const finalPreviewHTML = `
        <div class="card-header-icon">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             <h3>Bulk Import Preview</h3>
        </div>
        <div id="bulk-preview-area">
            <p class="preview-summary">
                <span class="summary-valid">${validCount} valid</span> / 
                <span class="summary-invalid">${errorCount} error</span>
            </p>
            <div class="preview-table-wrapper">
                <table class="preview-table">
                    <thead><tr><th>Recipient</th><th>Event</th><th>Control No.</th></tr></thead>
                    <tbody>${tableRowsHTML}</tbody>
                </table>
            </div>
        </div>
    `;
    
    bulkResultsContainer.innerHTML = finalPreviewHTML;
    processBulkBtn.disabled = !(validCount > 0 && errorCount === 0);
});
    
    processBulkBtn.addEventListener('click', async () => {
    if (parsedBulkData.length === 0) return;

    processBulkBtn.disabled = true;
    previewBulkBtn.disabled = true;

    bulkResultsContainer.innerHTML = `<p style="text-align:center; padding: 2rem;">Processing ${parsedBulkData.length} records...</p>`;

    const certificatesToInsert = parsedBulkData.map(cert => cert.full_data);

    try {
        const response = await fetch(`${API_BASE_URL}/generate-bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ certificates: certificatesToInsert }),
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const resultData = await response.json();
        
        let successfulCount = 0;
        let failedCount = 0;
        let resultsTableHTML = `
            <table class="preview-table results-table">
                <thead>
                    <tr>
                        <th>Control Number</th>
                        <th>Status</th>
                        <th>Message</th>
                    </tr>
                </thead>
                <tbody>
        `;

        resultData.results.forEach(result => {
            if (result.status === 'success') {
                successfulCount++;
                resultsTableHTML += `<tr class="success-row"><td>${result.control_number}</td><td>Success</td><td>-</td></tr>`;
            } else {
                failedCount++;
                resultsTableHTML += `<tr class="failed-row"><td>${result.control_number}</td><td>Failed</td><td class="message-col">${result.message}</td></tr>`;
            }
        });
        resultsTableHTML += `</tbody></table>`;

        bulkResultsContainer.innerHTML = `
            <div class="card-header-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:24px; height:24px; color:var(--success-color);"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h3>Import Complete</h3>
            </div>
            <div id="bulk-preview-area">
                 <p class="preview-summary">
                    <span class="summary-valid">${successfulCount} successful</span> / 
                    <span class="summary-invalid">${failedCount} failed</span>
                </p>
                <div class="preview-table-wrapper">${resultsTableHTML}</div>
            </div>
        `;
        
    } catch (error) {
        bulkResultsContainer.innerHTML = `<p class="summary-invalid" style="text-align: center; padding: 2rem;">A server error occurred. Please check the console and try again.</p>`;
        console.error('Bulk process error:', error);
    } finally {
        bulkDataInput.value = '';
        parsedBulkData = [];
        previewBulkBtn.disabled = false;
        processBulkBtn.disabled = true;
    }
});

    setActiveTab("create");
  };

  initializeAdminPage();
});

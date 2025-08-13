//     https://www.youtube.com/watch?v=dQw4w9WgXcQ

//     https://www.youtube.com/watch?v=dQw4w9WgXcQ

//     https://www.youtube.com/watch?v=dQw4w9WgXcQ 

document.addEventListener('DOMContentLoaded', () => {
    const adminFormView = document.getElementById('admin-form-view');
    const generationResultView = document.getElementById('generation-result-view');
    const bulkAddView = document.getElementById('bulk-add-view');
    const findView = document.getElementById('find-view');
    const showFindBtn = document.getElementById('show-find-btn');
    const showBulkBtn = document.getElementById('show-bulk-btn');
    const findForm = document.getElementById('find-form');
    const findControlNoInput = document.getElementById('find-control-no-input');
    const generateForm = document.getElementById('generate-form');
    const encoderEmailInput = document.getElementById('encoder-email');
    const encoderNameInput = document.getElementById('encoder-name');
    const recipientNameInput = document.getElementById('recipient-name');
    const certificateTypeInput = document.getElementById('certificate-type');
    const roleSelect = document.getElementById('role-select');
    const otherRoleGroup = document.getElementById('other-role-group');
    const otherRoleInput = document.getElementById('other-role-input');
    const eventNameInput = document.getElementById('event-name');
    const venueInput = document.getElementById('venue');
    const themeInput = document.getElementById('theme');
    const dateGivenInput = document.getElementById('date-given');
    const generatedQrCodeImg = document.getElementById('generated-qr-code');
    const generatedControlNumberEl = document.getElementById('generated-control-number');
    const saveQrBtn = document.getElementById('save-qr-btn');
    const copyControlNoBtn = document.getElementById('copy-control-no-btn');
    const generateNewBtn = document.getElementById('generate-new-btn');
    const bulkDataInput = document.getElementById('bulk-data-input');
    const processBulkBtn = document.getElementById('process-bulk-btn');
    const bulkStatus = document.getElementById('bulk-status');
    const progressBarContainer = document.getElementById('progress-bar-container');

    let API_BASE_URL;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        API_BASE_URL = 'http://localhost:3001/api';
    } else {
        API_BASE_URL = '/api';
    }

    let latestGeneratedData = null;

    const showRightPanelView = (view) => {
        findView.classList.add('hidden');
        bulkAddView.classList.add('hidden');
        generationResultView.classList.add('hidden');
        view.classList.remove('hidden');
    };

    const displayGeneratedResult = async (controlNumber) => {
        try {
            const qrCodeUrl = await QRCode.toDataURL(controlNumber);
            latestGeneratedData = {
                control_number: controlNumber,
                qr_code_url: qrCodeUrl
            };
            generatedQrCodeImg.src = qrCodeUrl;
            generatedControlNumberEl.textContent = controlNumber;
            showRightPanelView(generationResultView);
        } catch (err) {
            console.error('QR generation error:', err);
            displayError('Could not generate QR code.');
        }
    };

    const displayError = (message) => {
        alert(message || 'An unknown error occurred.');
    };

    const resetToFormView = () => {
        generateForm.reset();
        findForm.reset();
        otherRoleGroup.classList.add('hidden');
        progressBarContainer.classList.add('hidden');
        bulkStatus.classList.add('hidden');
        bulkDataInput.value = '';
        showRightPanelView(findView);
        showFindBtn.classList.add('active');
        showBulkBtn.classList.remove('active');
        latestGeneratedData = null;
    };

    showFindBtn.addEventListener('click', () => {
        showRightPanelView(findView);
        showFindBtn.classList.add('active');
        showBulkBtn.classList.remove('active');
    });

    showBulkBtn.addEventListener('click', () => {
        showRightPanelView(bulkAddView);
        showBulkBtn.classList.add('active');
        showFindBtn.classList.remove('active');
    });

    findForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const controlNo = findControlNoInput.value.trim();
        if (!controlNo) return;
        const response = await fetch(`${API_BASE_URL}/verify/${controlNo}`);
        if (response.ok) {
            displayGeneratedResult(controlNo);
        } else {
            displayError('Certificate with that control number was not found.');
        }
    });

    generateForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        let roleValue = roleSelect.value;
        if (roleValue === 'Other') {
            roleValue = otherRoleInput.value.trim();
        }

        const certificateData = {
            encoder_email: encoderEmailInput.value.trim(),
            encoder_name: encoderNameInput.value.trim(),
            recipient_name: recipientNameInput.value.trim(),
            certificate_type: certificateTypeInput.value,
            role: roleValue,
            event_name: eventNameInput.value.trim(),
            venue: venueInput.value.trim(),
            theme: themeInput.value.trim(),
            date_given: dateGivenInput.value
        };

        if (roleSelect.value === 'Other' && !roleValue) {
            displayError('Please specify the role.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(certificateData),
            });

            if (response.ok) {
                const resultData = await response.json();
                displayGeneratedResult(resultData.control_number);
            } else {
                const errorData = await response.json();
                displayError(errorData.message);
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            displayError('Could not connect to the server.');
        }
    });

    roleSelect.addEventListener('change', () => {
        if (roleSelect.value === 'Other') {
            otherRoleGroup.classList.remove('hidden');
            otherRoleInput.required = true;
        } else {
            otherRoleGroup.classList.add('hidden');
            otherRoleInput.required = false;
        }
    });

    saveQrBtn.addEventListener('click', () => {
        if (!latestGeneratedData) return;
        const link = document.createElement('a');
        link.href = latestGeneratedData.qr_code_url;
        link.download = `qr-code-${latestGeneratedData.control_number}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    copyControlNoBtn.addEventListener('click', () => {
        if (!latestGeneratedData) return;
        navigator.clipboard.writeText(latestGeneratedData.control_number).then(() => {
            const originalText = copyControlNoBtn.textContent;
            copyControlNoBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyControlNoBtn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy control number.');
        });
    });

    generateNewBtn.addEventListener('click', resetToFormView);

    processBulkBtn.addEventListener('click', async () => {
    const textData = bulkDataInput.value.trim();
    if (!textData) {
        displayError('Please paste data into the text area.');
        return;
    }

    const rows = textData.split('\n').filter(row => row.trim() !== '');
    const certificates = rows.map(row => {
        const columns = row.split('\t');
        if (columns.length !== 11) {
            console.error('Skipping malformed row (expected 11 columns):', row);
            return null;
        }
        return {
            timestamp:        columns[0].trim(),
            encoder_email:    columns[1].trim(),
            encoder_name:     columns[2].trim(),
            recipient_name:   columns[3].trim(),
            event_name:       columns[4].trim(),
            certificate_type: columns[5].trim(),
            role:             columns[6].trim(),
            venue:            columns[7].trim(),
            theme:            columns[8].trim(),
            date_given:       columns[9].trim(),
            control_number:   columns[10].trim()
        };
    }).filter(cert => cert !== null);

    if (certificates.length === 0) {
        displayError("No valid data rows found. Please check format and ensure you're pasting exactly 11 columns of data per row.");
        return;
    }

    const progressBarSlider = document.querySelector('#progress-bar-container .progress-bar-slider');
    progressBarSlider.style.width = '0%';

    progressBarContainer.classList.remove('hidden');
    bulkStatus.classList.remove('hidden');
    bulkStatus.textContent = `Processing ${certificates.length} certificates...`;
    processBulkBtn.disabled = true;

    let successfulCount = 0;
    let failedCount = 0;

    for (let i = 0; i < certificates.length; i++) {
        const cert = certificates[i];
        try {
            const response = await fetch(`${API_BASE_URL}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cert),
            });
            
            if (response.ok) {
                successfulCount++;
            } else {
                failedCount++;
                const errorData = await response.json();
                console.error(`Error with certificate for ${cert.recipient_name}:`, errorData.message);
            }
        } catch (error) {
            failedCount++;
            console.error(`Network error for certificate ${cert.recipient_name}:`, error);
        }

        const processedCount = i + 1;
        const progressPercentage = (processedCount / certificates.length) * 100;
        
        progressBarSlider.style.width = `${progressPercentage}%`;
        bulkStatus.textContent = `Processing... ${processedCount} of ${certificates.length}`;
    }

    let statusMessage = `Finished! Successfully added ${successfulCount} certificates.`;
    if (failedCount > 0) {
        statusMessage += ` ${failedCount} failed. Check developer console for details.`;
    }
    
    bulkStatus.textContent = statusMessage;
    bulkDataInput.value = '';
    processBulkBtn.disabled = false;
});

    resetToFormView();
});
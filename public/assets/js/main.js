  /* https://www.youtube.com/watch?v=dQw4w9WgXcQ

  https://www.youtube.com/watch?v=dQw4w9WgXcQ

  https://www.youtube.com/watch?v=dQw4w9WgXcQ  */

document.addEventListener('DOMContentLoaded', () => {
    const appModal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalOkBtn = document.getElementById('modal-ok-btn');

    const showModal = (title, message, type = 'info') => {
        modalTitle.textContent = title;
        modalMessage.innerHTML = message;

        const header = modalTitle.parentElement;
        const existingIcon = header.querySelector('.modal-icon');
        if (existingIcon) {
            header.removeChild(existingIcon);
        }

        let iconHtml = '';
        if (type === 'success') {
            iconHtml = `<svg class="modal-icon success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" /></svg>`;
        } else if (type === 'error') {
            iconHtml = `<svg class="modal-icon error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" /></svg>`;
        }

        if (iconHtml) {
            header.insertAdjacentHTML('afterbegin', iconHtml);
        }

        appModal.classList.add('visible');

        return new Promise((resolve) => {
            const closeModal = () => {
                appModal.classList.remove('visible');
                modalOkBtn.removeEventListener('click', closeModal);
                appModal.removeEventListener('click', overlayClose);
                resolve();
            };
            const overlayClose = (e) => {
                if (e.target === appModal) {
                    closeModal();
                }
            };
            modalOkBtn.addEventListener('click', closeModal);
            appModal.addEventListener('click', overlayClose);
        });
    };

    const verificationForm = document.getElementById('verification-form');
    const certNoInput = document.getElementById('certificate-no-input');
    const submitBtn = document.getElementById('submit-btn');
    const scanQrBtn = document.getElementById('scan-qr-btn');
    const resultContainer = document.getElementById('result-container');
    const errorMessageEl = document.getElementById('error-message');
    const verifyAnotherLink = document.getElementById('verify-another-link');
    
    let API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
        ? 'http://localhost:3001/api' 
        : '/api';
        
    const initialPreviewHTML = resultContainer.innerHTML;
    let html5QrCode;
    
    let isProcessing = false;

    const showLoadingState = (isLoading) => {
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        if (isLoading) {
            submitBtn.disabled = true;
            scanQrBtn.disabled = true;
            certNoInput.disabled = true;
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
            errorMessageEl.classList.add('hidden');
            verifyAnotherLink.classList.add('hidden');
        } else {
            submitBtn.disabled = false;
            scanQrBtn.disabled = false;
            certNoInput.disabled = false;
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    };

    const displayError = (message) => {
        errorMessageEl.textContent = message || 'An unknown error occurred.';
        errorMessageEl.classList.remove('hidden');
        resultContainer.innerHTML = initialPreviewHTML;
        resultContainer.classList.remove('verified');
        verifyAnotherLink.classList.remove('hidden');
    };

    const resetToFormView = () => {
        stopScanner();
        certNoInput.value = '';
        errorMessageEl.classList.add('hidden');
        resultContainer.innerHTML = initialPreviewHTML;
        resultContainer.classList.remove('verified');
        verifyAnotherLink.classList.add('hidden');
        let scannerView = document.getElementById('scanner-view');
        if (scannerView) {
            scannerView.classList.add('hidden');
        }
        verificationForm.classList.remove('hidden');
        showLoadingState(false);
        isProcessing = false; 
    };

    const displayVerificationResult = (data) => {
        verifyAnotherLink.classList.remove('hidden');
        resultContainer.classList.add('verified');

        const date = new Date(data.date_given);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
        });

        const shareUrl = `${window.location.origin}${window.location.pathname}?id=${data.control_number}`;
        window.history.pushState({ path: shareUrl }, '', shareUrl);

        const resultHTML = `
            <div class="verified-result-card">
                <div class="verified-header">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" /></svg>
                    <span>VERIFIED CERTIFICATE</span>
                </div>
                <h2 class="recipient-name">${data.recipient_name}</h2>
                <span class="cert-type-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
                    ${data.certificate_type}
                </span>
                <div class="details-list">
                    <div class="detail-item">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" /></svg>
                        <div class="text"><span class="label">Event Name</span><span class="value">${data.event_name}</span></div>
                    </div>
                    <div class="detail-item">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
                        <div class="text"><span class="label">Theme</span><span class="value">${data.theme || 'N/A'}</span></div>
                    </div>
                    <div class="detail-item">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <div class="text"><span class="label">Date Given</span><span class="value">${formattedDate}</span></div>
                    </div>
                    <div class="detail-item">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                        <div class="text"><span class="label">Venue</span><span class="value">${data.venue}</span></div>
                    </div>
                     <div class="detail-item">
                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                        <div class="text"><span class="label">Role</span><span class="value">${data.role}</span></div>
                    </div>
                </div>
                <div class="result-footer">
                    <span class="certificate-id">Certificate ID: ${data.control_number}</span>
                    <button id="share-btn" class="btn btn-secondary">Share Certificate</button>
                </div>
            </div>`;
        resultContainer.innerHTML = resultHTML;

        document.getElementById('share-btn').addEventListener('click', () => {
             navigator.clipboard.writeText(shareUrl).then(() => {
                showModal('Link Copied', 'Verification link copied to clipboard!', 'success');
            });
        });
    };

    const verifyCertificate = async (certId) => {
        if (!certId) return;
        stopScanner();
        showLoadingState(true);
        try {
            const response = await fetch(`${API_BASE_URL}/verify/${certId}`);
            if (response.ok) {
                const data = await response.json();
                displayVerificationResult(data);
            } else {
                const errorData = await response.json();
                displayError(errorData.message || `Certificate ${certId} not found.`);
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            displayError('Could not connect to the verification server.');
        } finally {
            showLoadingState(false);
        }
    };
    
    const checkUrlForCertId = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const certId = urlParams.get('id');
        if (certId) {
            certNoInput.value = certId;
            verifyCertificate(certId);
        }
    };

    const stopScanner = () => {
        if (html5QrCode && html5QrCode.isScanning) {
            
            return html5QrCode.stop();
        }
        return Promise.resolve();
    };

    const startScanner = () => {
        let scannerView = document.getElementById('scanner-view');
        const cardBody = verificationForm.parentElement;
        
        if (!scannerView) {
            cardBody.insertAdjacentHTML('beforeend', `
                <div class="scanner-container hidden" id="scanner-view">
                    <div id="qr-reader"></div>
                    <button type="button" id="enter-manual-btn" class="btn btn-secondary">Enter Manually</button>
                </div>
            `);
            scannerView = document.getElementById('scanner-view');
            document.getElementById('enter-manual-btn').addEventListener('click', () => {
                stopScanner();
                scannerView.classList.add('hidden');
                verificationForm.classList.remove('hidden');
                isProcessing = false; 
            });
        }
        
        verificationForm.classList.add('hidden');
        verifyAnotherLink.classList.add('hidden');
        scannerView.classList.remove('hidden');
        
        if (!html5QrCode) {
           html5QrCode = new Html5Qrcode("qr-reader");
        }
        
        const onScanSuccess = (decodedText, decodedResult) => {
          
            if (isProcessing) {
                return; 
            }
            isProcessing = true;

            stopScanner().then(() => {
                certNoInput.value = decodedText;
                scannerView.classList.add('hidden');
                verificationForm.classList.remove('hidden');
                verifyCertificate(decodedText);
            }).catch(err => {
                console.error("Error while stopping scanner:", err);
                verifyCertificate(decodedText);
            });
        };
        
        html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess)
        .catch((err) => {
            console.error("QR Code scanner error:", err);
            showModal("Scanner Error", "Could not start QR scanner. Please check camera permissions.", 'error');
            resetToFormView();
        });
    };

    verificationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        verifyCertificate(certNoInput.value.trim());
    });
    
    verifyAnotherLink.addEventListener('click', resetToFormView);
    scanQrBtn.addEventListener('click', startScanner);
    
    checkUrlForCertId();
});
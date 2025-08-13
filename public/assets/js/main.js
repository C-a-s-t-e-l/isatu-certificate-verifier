//     https://www.youtube.com/watch?v=dQw4w9WgXcQ

//     https://www.youtube.com/watch?v=dQw4w9WgXcQ

//     https://www.youtube.com/watch?v=dQw4w9WgXcQ 

document.addEventListener('DOMContentLoaded', () => {
   
    const formView = document.getElementById('form-view');
    const scannerView = document.getElementById('scanner-view');
    const resultView = document.getElementById('result-view');

    const verificationForm = document.getElementById('verification-form');
    const certNoInput = document.getElementById('certificate-no-input');
    
    const scanQrBtn = document.getElementById('scan-qr-btn');
    const scanAgainBtn = document.getElementById('scan-again-btn');
    const enterManualBtn = document.getElementById('enter-manual-btn');
    const verifyAgainBtn = document.getElementById('verify-again-btn');

    const resultTypeEl = document.getElementById('result-type');
    const resultRecipientEl = document.getElementById('result-recipient');

    const qrReaderElement = document.getElementById('qr-reader');

    const resultEventEl = document.getElementById('result-event');
    const resultThemeEl = document.getElementById('result-theme');
    const resultDateEl = document.getElementById('result-date');

    let API_BASE_URL;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        API_BASE_URL = 'http://localhost:3001/api'; 
    } else {
        API_BASE_URL = '/api'; 
    }
    let html5QrCode;

    const showContentView = (view) => {
        formView.classList.add('hidden');
        scannerView.classList.add('hidden');
        view.classList.remove('hidden');
    };
    
    const displayVerificationResult = (data) => {
    resultRecipientEl.textContent = data.recipient_name || 'N/A';
    resultTypeEl.textContent = data.certificate_type || 'N/A';
    resultEventEl.textContent = data.event_name || 'N/A';
    resultThemeEl.textContent = data.theme || 'N/A';

    if (data.date_given) {
        const date = new Date(data.date_given);
        resultDateEl.textContent = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC' 
        });
    } else {
        resultDateEl.textContent = 'N/A';
    }
    
    resultView.classList.remove('hidden'); 
};
    
    const displayError = (message) => {
        alert(message || 'An unknown error occurred.');
        
        resultView.classList.add('hidden');
    };

    const verifyCertificate = async (certId) => {
        if (!certId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/verify/${certId}`);
            if (response.ok) {
                const data = await response.json();
                displayVerificationResult(data);
            } else {
                const errorData = await response.json();
                displayError(errorData.message || `Certificate ${certId} not found.`);
                resetToFormView();
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            displayError('Could not connect to the verification server.');
            resetToFormView();
        }
    };
    
    const startScanner = () => {
        resultView.classList.add('hidden'); 
        if (!html5QrCode) {
           html5QrCode = new Html5Qrcode("qr-reader");
        }
        showContentView(scannerView);
        html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText, decodedResult) => {
                html5QrCode.stop();
                showContentView(formView); 
                verifyCertificate(decodedText);
            },
            (errorMessage) => {  }
        ).catch((err) => {
            console.error("QR Code scanner error:", err);
            displayError("Could not start QR scanner. Please check camera permissions.");
            resetToFormView();
        });
    };

    const stopScanner = () => {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().catch(err => console.error("Error stopping scanner:", err));
        }
    };
    
    const resetToFormView = () => {
        stopScanner();
        certNoInput.value = '';
        resultView.classList.add('hidden');
        showContentView(formView); 
    };

    verificationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const certId = certNoInput.value.trim();
        verifyCertificate(certId);
    });

    scanQrBtn.addEventListener('click', () => {
        startScanner();
    });
    
    scanAgainBtn.addEventListener('click', () => {
        stopScanner();
        startScanner();
    });

    enterManualBtn.addEventListener('click', () => {
        resetToFormView();
    });

    verifyAgainBtn.addEventListener('click', () => {
        resetToFormView();
    });
});
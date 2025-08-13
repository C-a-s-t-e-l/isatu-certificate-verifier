require('dotenv').config();

//     https://www.youtube.com/watch?v=dQw4w9WgXcQ

//     https://www.youtube.com/watch?v=dQw4w9WgXcQ

//     https://www.youtube.com/watch?v=dQw4w9WgXcQ 

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const qrcode = require('qrcode');
const path = require('path');

const app = express();
const PORT = 3001;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));


app.get('/api/verify/:controlNumber', async (req, res) => {
    const { controlNumber } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('certificates')
            .select('*')
            .eq('control_number', controlNumber)
            .single(); 

        if (error) {
            console.error('Supabase error:', error.message);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ message: 'Certificate not found.' });
            }
            throw error;
        }

        if (data) {
            res.status(200).json(data);
        }

    } catch (err) {
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
});


app.post('/api/generate', async (req, res) => {
    const certData = req.body;

    if (!certData.recipient_name || !certData.event_name) {
        return res.status(400).json({ message: 'Recipient and Event Name are required.' });
    }

    try {
        let controlNumber = certData.control_number;

        if (!controlNumber || controlNumber.toUpperCase() === 'N/A') {
            const typePrefix = certData.certificate_type.startsWith('App') ? 'CA' : (certData.certificate_type.startsWith('Part') ? 'CP' : 'CR');
            
            const { data: lastCert, error: findError } = await supabase
                .from('certificates')
                .select('control_number')
                .like('control_number', `ISATU-SR-${typePrefix}-%`)
                .order('control_number', { ascending: false })
                .limit(1)
                .single();
            
            let nextNum = 1;
            if (lastCert) {
                nextNum = parseInt(lastCert.control_number.split('-').pop(), 10) + 1;
            } else if (findError && findError.code !== 'PGRST116') {
                 throw findError;
            }
            
            controlNumber = `ISATU-SR-${typePrefix}-25-${String(nextNum).padStart(5, '0')}`;
        }
        
        const newCertificateData = {
            ...certData,
            control_number: controlNumber,
            timestamp: certData.timestamp && certData.timestamp !== 'N/A' ? new Date(certData.timestamp).toISOString() : new Date().toISOString()
        };

        const { error: insertError } = await supabase
            .from('certificates')
            .insert([newCertificateData]);

        if (insertError) {
            console.error('Supabase insert error:', insertError.message);
            if (insertError.code === '23505') {
                 return res.status(409).json({ message: `Error: Control Number ${controlNumber} already exists.` });
            }
            throw insertError;
        }

        const qrCodeDataUrl = await qrcode.toDataURL(controlNumber);
        
        res.status(201).json({
            control_number: controlNumber,
            qr_code_url: qrCodeDataUrl,
            message: 'Certificate added successfully.'
        });

    } catch (err) {
        console.error('Server error during certificate generation:', err);
        res.status(500).json({ message: 'Server error during certificate processing.' });
    }
});


if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Development server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
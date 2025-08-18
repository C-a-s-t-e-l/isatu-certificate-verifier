require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const qrcode = require('qrcode');
const path = require('path');
const excel = require('exceljs');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = 3001;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json()); 
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/certificates', async (req, res) => {
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 10, 10);
    const searchQuery = req.query.search || '';
    const offset = (page - 1) * limit;

    try {
        let query = supabase
            .from('certificates')
            .select('control_number, recipient_name, event_name, date_given', { count: 'exact' });

        if (searchQuery) {
            query = query.or(`recipient_name.ilike.%${searchQuery}%,event_name.ilike.%${searchQuery}%,control_number.ilike.%${searchQuery}%`);
        }

        const { data, error, count } = await query
            .order('timestamp', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.status(200).json({
            data,
            total: count,
            page,
            limit
        });

    } catch (err) {
        console.error('Error fetching certificates:', err);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
});

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

app.get('/api/analytics/summary', async (req, res) => {
    try {
        const { period } = req.query;
        let trendRpc = 'count_monthly';
        if (period === 'daily') trendRpc = 'count_daily';
        if (period === 'yearly') trendRpc = 'count_yearly';

        const [
            totalCertsRes, 
            byTypeRes, 
            trendsRes,
            monthlyRes, 
            topEventsRes, 
            topEncodersRes, 
            topRecipientsRes
        ] = await Promise.all([
            supabase.from('certificates').select('*', { count: 'exact', head: true }),
            supabase.rpc('count_by_type'),
            supabase.rpc(trendRpc),
            supabase.rpc('count_monthly'), 
            supabase.rpc('top_events'),
            supabase.rpc('top_encoders'),
            supabase.rpc('top_recipients')
        ]);
        
        const errors = [totalCertsRes.error, byTypeRes.error, trendsRes.error, monthlyRes.error, topEventsRes.error, topEncodersRes.error, topRecipientsRes.error].filter(Boolean);
        if (errors.length > 0) {
            console.error('Analytics error:', errors);
            throw new Error('Failed to fetch analytics data.');
        }

        const totalEvents = new Set(topEventsRes.data.map(e => e.event)).size;
        const totalRecipients = new Set(topRecipientsRes.data.map(r => r.recipient)).size;
        const busiestMonth = monthlyRes.data.length ? monthlyRes.data.reduce((prev, current) => (prev.count > current.count) ? prev : current).month : 'N/A';
        
        res.json({
            totalCerts: totalCertsRes.count,
            totalEvents,
            totalRecipients,
            busiestMonth,
            byType: byTypeRes.data,
            trends: trendsRes.data,
            topEvents: topEventsRes.data,
            topEncoders: topEncodersRes.data,
            topRecipients: topRecipientsRes.data,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/export/:format', async (req, res) => {
    const { format } = req.params;
    const { ids } = req.body || {};
    const searchQuery = req.query.search || '';

    try {
        let query = supabase.from('certificates').select('*');

        if (ids && ids.length > 0) {
            query = query.in('control_number', ids);
        } else if (searchQuery) {
            query = query.or(`recipient_name.ilike.%${searchQuery}%,event_name.ilike.%${searchQuery}%,control_number.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query.order('timestamp', { ascending: false });
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).send('No data to export.');

        const fileName = `isatu-sr-export-${new Date().toISOString().slice(0,10)}`;
        
        if (format === 'xlsx') {
            const workbook = new excel.Workbook();
            const worksheet = workbook.addWorksheet('Certificates');
            worksheet.columns = [
                { header: 'Control Number', key: 'control_number', width: 30 },
                { header: 'Recipient Name', key: 'recipient_name', width: 30 },
                { header: 'Event Name', key: 'event_name', width: 40 },
                { header: 'Date Given', key: 'date_given', width: 15 },
                { header: 'Type', key: 'certificate_type', width: 15 },
                { header: 'Role', key: 'role', width: 20 },
                { header: 'Encoder Name', key: 'encoder_name', width: 30 },
                { header: 'Timestamp', key: 'timestamp', width: 25 },
            ];
            worksheet.addRows(data);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);
            await workbook.xlsx.write(res);
            res.end();
        } else if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}.pdf`);
            doc.pipe(res);
            
            doc.fontSize(16).text('ISATU Student Republic - Certificate Export', { align: 'center' });
            doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
            doc.moveDown(2);

            const tableTop = doc.y;
            const headers = ['Control No.', 'Recipient', 'Event', 'Date', 'Type'];
            const colWidths = [120, 150, 200, 60, 80];
            
            let i = 0;
            headers.forEach(header => {
                doc.fontSize(10).text(header, 30 + i, tableTop, { width: colWidths[headers.indexOf(header)], align: 'left' });
                i += colWidths[headers.indexOf(header)];
            });
            doc.y = tableTop + 20;

            data.forEach(cert => {
                const rowY = doc.y;
                doc.fontSize(8).text(cert.control_number, 30, rowY, { width: 120 });
                doc.text(cert.recipient_name, 150, rowY, { width: 150 });
                doc.text(cert.event_name, 300, rowY, { width: 200 });
                doc.text(new Date(cert.date_given).toLocaleDateString(), 500, rowY, { width: 60 });
                doc.text(cert.certificate_type, 560, rowY, { width: 80 });
                doc.moveDown(1.5);
                if (doc.y > 500) {
                    doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
                    doc.y = 40;
                }
            });

            doc.end();
        } else {
            res.status(400).send('Invalid format requested.');
        }

    } catch (err) {
        console.error(`Error exporting to ${format}:`, err);
        res.status(500).send(`Failed to export data to ${format}.`);
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
                .from('certificates').select('control_number').like('control_number', `ISATU-SR-${typePrefix}-%`)
                .order('control_number', { ascending: false }).limit(1).single();
            let nextNum = 1;
            if (lastCert) {
                nextNum = parseInt(lastCert.control_number.split('-').pop(), 10) + 1;
            } else if (findError && findError.code !== 'PGRST116') {
                 throw findError;
            }
            controlNumber = `ISATU-SR-${typePrefix}-25-${String(nextNum).padStart(5, '0')}`;
        }
        const newCertificateData = { ...certData, control_number: controlNumber, timestamp: certData.timestamp && certData.timestamp !== 'N/A' ? new Date(certData.timestamp).toISOString() : new Date().toISOString() };
        const { error: insertError } = await supabase.from('certificates').insert([newCertificateData]);
        if (insertError) {
            console.error('Supabase insert error:', insertError.message);
            if (insertError.code === '23505') { return res.status(409).json({ message: `Error: Control Number ${controlNumber} already exists.` }); }
            throw insertError;
        }
        const qrCodeDataUrl = await qrcode.toDataURL(controlNumber);
        res.status(201).json({ control_number: controlNumber, qr_code_url: qrCodeDataUrl, message: 'Certificate added successfully.' });
    } catch (err) {
        console.error('Server error during certificate generation:', err);
        res.status(500).json({ message: 'Server error during certificate processing.' });
    }
});

app.put('/api/certificates/:control_number', async (req, res) => {
    const { control_number } = req.params;
    const updatedData = req.body;

    delete updatedData.control_number;

    try {
        const { error } = await supabase
            .from('certificates')
            .update(updatedData)
            .eq('control_number', control_number);

        if (error) throw error;

        res.status(200).json({ message: 'Certificate updated successfully.' });
    } catch (err) {
        console.error('Error updating certificate:', err);
        res.status(500).json({ message: 'Failed to update certificate.' });
    }
});

app.delete('/api/certificates/:control_number', async (req, res) => {
    const { control_number } = req.params;

    try {
        const { error } = await supabase
            .from('certificates')
            .delete()
            .eq('control_number', control_number);

        if (error) throw error;

        res.status(200).json({ message: 'Certificate deleted successfully.' });
    } catch (err) {
        console.error('Error deleting certificate:', err);
        res.status(500).json({ message: 'Failed to delete certificate.' });
    }
});

app.post('/api/generate-bulk', async (req, res) => {
    const certificates = req.body.certificates;

    if (!certificates || !Array.isArray(certificates) || certificates.length === 0) {
        return res.status(400).json({ message: 'No certificate data provided.' });
    }

    const { data, error } = await supabase
        .from('certificates')
        .insert(certificates, {
            
        });
        
    
    if (error && error.code === '23505') { 
        const results = [];
        for (const cert of certificates) {
            const { data: singleData, error: singleError } = await supabase
                .from('certificates')
                .insert(cert);

            if (singleError) {
                results.push({ 
                    control_number: cert.control_number, 
                    status: 'failed', 
                    message: singleError.code === '23505' ? 'Duplicate Control Number' : singleError.message 
                });
            } else {
                results.push({ control_number: cert.control_number, status: 'success' });
            }
        }
        return res.status(207).json({ message: 'Partial success. Some records failed.', results });
    }

    if (error) {
        return res.status(500).json({ message: error.message });
    }

    const successResults = certificates.map(cert => ({ control_number: cert.control_number, status: 'success' }));
    res.status(201).json({ message: 'All certificates added successfully.', results: successResults });
});


if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Development server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
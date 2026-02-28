const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path'); // Adicione isso
require('dotenv').config();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- MUDAMOS PARA /api/reports ---
app.get('/api/reports', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('approved', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar dados" });
    }
});

app.post('/api/reports', async (req, res) => {
    try {
        const { offender_steam_id, description, image, reporter } = req.body;
        const { data, error } = await supabase
            .from('reports')
            .insert([{ offender_steam_id, description, image, reporter, approved: false }]);

        if (error) throw error;
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Erro ao salvar denúncia" });
    }
});


app.use(express.static(path.join(__dirname, 'public'))); 

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Terminal ativo na porta ${PORT}`);
});
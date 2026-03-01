const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Configurações de Segurança e Limite de Dados
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ROTA GET: 
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


app.post( '/api/reports', async (req, res) => {
    try {
        const { offender_steam_id, description, image, reporter } = req.body;
        
        const { data, error } = await supabase
            .from('reports')
            .insert([{ 
                offender_steam_id, 
                description, 
                image, 
                reporter,
                approved: false // aprova manualmente no painel do Supabase
            }]);

        if (error) throw error;
        res.status(201).json({ success: true });
    } catch (error) {
        console.error("Erro Supabase:", error.message);
        res.status(500).json({ error: "Erro ao salvar denúncia" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Terminal ativo na porta ${PORT}`);
});
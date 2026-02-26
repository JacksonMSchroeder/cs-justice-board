const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configurações essenciais
app.use(cors());
app.use(express.json());

// Conexão com Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ROTA PARA O MURAL (Puxar dados) - Removido o /api para combinar com seu HTML
app.get('/reports', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json(error);
    }
});

// ROTA PARA CRIAR DENÚNCIA (Enviar dados)
app.post('/reports', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reports')
            .insert([req.body]);

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(400).json(error);
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Backend rodando em http://localhost:${PORT}`));

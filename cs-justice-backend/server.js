const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();

// configuração do cors - aceita requisições de qualquer lugar, importante para Vercel
app.use(cors());
app.use(express.json());

// Variáveis do RENDER/Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ROTA RAIZ: Para você testar se o servidor está vivo no link principal
app.get('/', (req, res) => {
    res.send('🚀 Backend do CS-Justice rodando com sucesso!');
});

// ROTA PARA O MURAL: Puxar denúncias aprovadas
app.get('/reports', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            //.eq('approved', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar denúncias:', error);
        res.status(400).json(error);
    }
});

// ROTA PARA CRIAR DENÚNCIA
app.post('/reports', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reports')
            .insert([req.body]);

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Erro ao criar denúncia:', error);
        res.status(400).json(error);
    }
});

// LIGAR O SERVIDOR
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
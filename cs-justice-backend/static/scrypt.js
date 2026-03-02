const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios'); 
const path = require('path');
const multer = require('multer'); //  multer
require('dotenv').config();

const app = express();

// --- CONFIGURAÇÕES DO MULTER 
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 } // LIMITE PARA UM CLIPE OU AUDIO  >TESTAR<
});

// ---  SEGURANÇA  ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Banco de dados
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- API ---

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
        console.error("Erro ao buscar dados:", error.message);
        res.status(500).json({ error: "Erro ao buscar dados" });
    }
});

// 2ROTA POST:
app.post('/api/reports', upload.single('arquivo'), async (req, res) => {
    try {
        const { offender_steam_id, description, reporter } = req.body;
        const file = req.file; // video, audio, imagem
        const STEAM_API_KEY = process.env.STEAM_API_KEY; 

        let evidenceUrl = null;

        // storage no supa
        if (file) {
            const fileExt = path.extname(file.originalname);
            const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('evidencias')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // pegar a URL  
            const { data: urlData } = supabase.storage
                .from('evidencias')
                .getPublicUrl(fileName);
            
            evidenceUrl = urlData.publicUrl;
        }

        // Nome e Avatar 
        let nomeOficial = "Não Identificado";
        let fotoOficial = "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg";
        let estaBanido = false; 

        try {
            const steamRes = await axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${offender_steam_id}`);
            const player = steamRes.data.response.players[0];
            if (player) {
                nomeOficial = player.personaname;
                fotoOficial = player.avatarfull; 
            }
        } catch (apiErr) {
            console.error("Erro na API de Summaries da Valve");
        }

        // Verificar Bans
        try {
            const banRes = await axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${STEAM_API_KEY}&steamids=${offender_steam_id}`);
            const banData = banRes.data.players[0];
            if (banData && (banData.VACBanned || banData.NumberOfGameBans > 0)) {
                estaBanido = true;
            }
        } catch (banErr) {
            console.error("Erro na API de Bans da Valve");
        }

        //  tabela 'reports'
        const { data, error } = await supabase
            .from('reports')
            .insert([{ 
                offender_steam_id, 
                description, 
                evidence_url: evidenceUrl, //  Storage DO SUPA
                reporter,
                offender_name: nomeOficial,
                avatarsteam: fotoOficial,
                vac_status: estaBanido,
                approved: false 
            }]);

        if (error) throw error;
        res.status(201).json({ success: true });

    } catch (error) {
        console.error("Erro Geral no Servidor:", error.message);
        res.status(500).json({ error: "Erro ao processar denúncia" });
    }
});

// ---  ARQUIVOS ESTATICOS ---
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'static', 'index.html')));
app.get('/mural', (req, res) => res.sendFile(path.join(__dirname, 'static', 'mural.html')));
app.get('/contato', (req, res) => res.sendFile(path.join(__dirname, 'static', 'contato.html')));
app.get('/lei', (req, res) => res.sendFile(path.join(__dirname, 'static', 'lei.html')));

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'static', 'index.html')));

// --- INICIALIZAÇÃO ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 ==========================================`);
    console.log(`   TERMINAL CS:JUSTIÇA ATIVO NA PORTA ${PORT}`);
    console.log(`   SISTEMA DE MÍDIA (STORAGE): ATIVO`);
    console.log(`   SISTEMA DE VERIFICAÇÃO VALVE: ONLINE`);
    console.log(`==========================================\n`);
});
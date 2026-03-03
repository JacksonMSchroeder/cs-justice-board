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

// SEGURANÇA  
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
        const STEAM_API_KEY = process.env.STEAM_API_KEY; 
        const file = req.file; 
        
        let finalEvidenceUrl = null;

        // 1. logica da storage
        if (file) {
            const fileName = `${Date.now()}-${file.originalname}`;
            const { data: storageData, error: storageError } = await supabase.storage
                .from('evidencias') // certifique-se que o bucket tem esse nome
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (storageError) throw storageError;

            const { data: urlData } = supabase.storage
                .from('evidencias')
                .getPublicUrl(fileName);
            
            finalEvidenceUrl = urlData.publicUrl;
        }

        // 2. COD VALVE
        let offender_name = "Não Identificado";
        let avatarsteam = "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg";
        let vac_status = "Limpa";

        try {
            const [resSteam, resBans] = await Promise.all([
                axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${offender_steam_id}`),
                axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${STEAM_API_KEY}&steamids=${offender_steam_id}`)
            ]);

            const player = resSteam.data.response.players[0];
            if (player) {
                offender_name = player.personaname;
                avatarsteam = player.avatarfull;
            }

            const banData = resBans.data.players[0];
            if (banData && (banData.VACBanned || banData.NumberOfGameBans > 0)) {
                vac_status = "Banido";
            }
        } catch (e) { 
            console.error("Erro na comunicação com a API da Valve:", e.message); 
        }

        // SALVAR NO BANCO
        const { error: dbError } = await supabase
            .from('reports')
            .insert([{ 
                offender_steam_id, 
                description, 
                evidence_url: finalEvidenceUrl, // var existe
                reporter, 
                offender_name,
                avatarsteam,
                vac_status,
                approved: false 
            }]);
        
        if (dbError) throw dbError;
        res.status(201).json({ success: true });

    } catch (error) {
        console.error("Erro POST:", error.message);
        res.status(500).json({ error: "Erro ao salvar denúncia" });
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
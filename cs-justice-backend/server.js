require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const helmet = require('helmet');
const multer = require('multer');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 5000; 
const DOMAIN = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.set('trust proxy', 1);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "https://avatars.steamstatic.com", "https://*.steamstatic.com", "https://*.supabase.co", "https://via.placeholder.com", "https://*.steamcommunity.com"],
            "script-src": ["'self'", "'unsafe-inline'"],
            "connect-src": ["'self'", "https://*.supabase.co"]
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'cs-justice-secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000,
        secure: !!process.env.RENDER_EXTERNAL_URL,
        sameSite: process.env.RENDER_EXTERNAL_URL ? 'none' : 'lax'
    }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new SteamStrategy({
    returnURL: `${DOMAIN}/auth/steam/return`,
    realm: `${DOMAIN}/`,
    apiKey: process.env.STEAM_API_KEY
}, (identifier, profile, done) => {
    return done(null, profile);
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'static')));


app.get('/auth/steam', passport.authenticate('steam'));
app.get('/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/contato'); 
});

app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
});

app.get('/api/user-status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ 
            logged: true, 
            user: { 
                name: req.user.displayName, 
                avatar: req.user.photos[2].value, 
                steamid: req.user.id 
            } 
        });
    } else {
        res.json({ logged: false });
    }
});


app.post('/api/reports', upload.single('arquivo'), async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Faça login via Steam para enviar." });
    }

    try {
        let { offender_steam_id, description } = req.body;
        let finalSteamId = offender_steam_id;

        
        if (finalSteamId.includes('steamcommunity.com')) {
            const urlPath = finalSteamId.replace(/\/$/, ""); 
            const lastPart = urlPath.split('/').pop();

            if (urlPath.includes('/profiles/')) {
                finalSteamId = lastPart;
            } 
            else if (urlPath.includes('/id/')) {
                const resolveRes = await axios.get(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/`, {
                    params: { key: process.env.STEAM_API_KEY, vanityurl: lastPart }
                });
                if (resolveRes.data.response.success === 1) {
                    finalSteamId = resolveRes.data.response.steamid;
                }
            }
        }

        
        let offenderName = `ID:${finalSteamId}`; 
        let offenderAvatar = "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg";
        let vacStatus = "Sincronizando...";

        try {
            
            const playerRes = await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`, {
                params: { key: process.env.STEAM_API_KEY, steamids: finalSteamId }
            });

            const playerData = playerRes.data.response.players[0];
            if (playerData) {
                
                offenderName = playerData.personaname || `ID:${finalSteamId}`;
                offenderAvatar = playerData.avatarfull || playerData.avatar;
                console.log(`✅ SUCESSO: Nick capturado da Steam -> ${offenderName}`);
            }

            
            const banRes = await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/`, {
                params: { key: process.env.STEAM_API_KEY, steamids: finalSteamId }
            });

            const banInfo = banRes.data.players[0];
            if (banInfo) {
                vacStatus = banInfo.VACBanned ? "BANIDO (VAC)" : (banInfo.CommunityBanned ? "BANIDO (COMUNIDADE)" : "LIMPA");
            }
        } catch (steamErr) {
            console.error("❌ ERRO STEAM API:", steamErr.message);
        }

        
        let fileUrl = null;
        if (req.file) {
            const fileName = `proof-${Date.now()}${path.extname(req.file.originalname)}`;
            const { data, error: uploadError } = await supabase.storage
                .from('evidencias')
                .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

            if (uploadError) throw uploadError;
            const { data: publicUrl } = supabase.storage.from('evidencias').getPublicUrl(fileName);
            fileUrl = publicUrl.publicUrl;
        }

        
        const { error: dbError } = await supabase.from('reports').insert([{
            reporter: req.user.displayName,
            offender_steam_id: String(finalSteamId),
            offender_name: String(offenderName),
            description: description,
            status: 'PENDENTE',
            approved: false,
            avatarsteam: offenderAvatar, 
            vac_status: vacStatus,
            evidence_url: fileUrl
        }]);

        if (dbError) throw dbError;
        res.status(200).json({ success: true });

    } catch (err) {
        console.error("❌ ERRO GERAL NO SERVER:", err);
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});


app.get('/api/reports', async (req, res) => {
    const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('approved', true) 
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json(error);
    res.json(data);
});


app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'static', 'index.html')));
app.get('/mural', (req, res) => res.sendFile(path.join(__dirname, 'static', 'mural.html')));
app.get('/lei', (req, res) => res.sendFile(path.join(__dirname, 'static', 'lei.html')));
app.get('/contato', (req, res) => res.sendFile(path.join(__dirname, 'static', 'contato.html')));

app.listen(PORT, () => console.log(`🚀 SERVIDOR RODANDO NA PORTA ${PORT}`));
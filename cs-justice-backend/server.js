require('dotenv').config();
const express = require('express');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const session = require('express-session');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_KEY;

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

async function supabaseQuery(table, method, body = null) {
    const options = {
        method,
        headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${SB_URL}/rest/v1/${table}`, options);
    return res.json();
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new SteamStrategy({
    returnURL: `${BASE_URL}/auth/steam/return`,
    realm: `${BASE_URL}/`,
    apiKey: process.env.STEAM_API_KEY
}, (identifier, profile, done) => done(null, profile)));

app.use(session({
    secret: 'cs-justica-secret',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'static')));

app.get('/api/user-status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ 
            logged: true, 
            user: { 
                name: req.user.displayName, 
                avatar: req.user.photos[0].value 
            } 
        });
    } else {
        res.json({ logged: false });
    }
});

app.get('/api/reports', async (req, res) => {
    try {
        const data = await supabaseQuery('reports?select=*&order=created_at.desc', 'GET');
        res.json(data);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/reports', upload.single('arquivo'), async (req, res) => {
    try {
        const { reporter, offender_steam_id, description } = req.body;
        let evidence_url = null;

        if (req.file) {
            const fileName = `${Date.now()}-${req.file.originalname}`;
            const uploadRes = await fetch(`${SB_URL}/storage/v1/object/evidences/${fileName}`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${SB_KEY}`, 
                    'apikey': SB_KEY, 
                    'Content-Type': req.file.mimetype 
                },
                body: req.file.buffer
            });
            if (uploadRes.ok) {
                evidence_url = `${SB_URL}/storage/v1/object/public/evidences/${fileName}`;
            }
        }

        await supabaseQuery('reports', 'POST', {
            reporter, 
            offender_steam_id, 
            description, 
            evidence_url,
            vac_status: 'Consultando...', 
            avatarsteam: 'https://via.placeholder.com/150'
        });

        res.status(200).json({ success: true });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

app.get('/auth/steam', passport.authenticate('steam'));

app.get('/auth/steam/return', 
    passport.authenticate('steam', { failureRedirect: '/' }), 
    (req, res) => res.redirect('/')
);

app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
});

app.get('*', (req, res) => {
    const pages = ['mural', 'lei', 'contato'];
    const url = req.path.replace('/', '');
    const targetFile = pages.includes(url) ? `${url}.html` : 'index.html';
    res.sendFile(path.join(__dirname, 'static', targetFile));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em: ${BASE_URL}`);
});
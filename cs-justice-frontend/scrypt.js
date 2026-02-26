// NAVEGAÇÃO NAS 4PAGGINAS (index, lei, mural, contato) 
const botoes = document.querySelectorAll('.nav-item');

const secoes = document.querySelectorAll('.janela');

botoes.forEach(botao => {
    botao.addEventListener('click', function(event) {
        
        event.preventDefault();

        
        const idAlvo = this.getAttribute('href'); 

       
        secoes.forEach(s => s.classList.remove('active'));

        
        const secaoAlvo = document.querySelector(idAlvo);
        if (secaoAlvo) {
            secaoAlvo.classList.add('active');
        }
    });
});

document.getElementById('arquivo').addEventListener('change', function() {  //para aparecer o arquivo apra a pessoa
    var fileName = this.files[0] ? this.files[0].name : "Nenhum arquivo selecionado";
    document.getElementById('file-name').textContent = fileName;
});


//Para o mural pag e logs 
// Banco de dados "fake"
const denuncias = [
    { data: "24/02/2026", user: "TOXICO_LOBBY", msg: "Discurso de ódio detectado no chat de voz." },
    { data: "25/02/2026", user: "GRIFEIRO_MASTER", msg: "Injúria racial durante o round pistol." },
    { data: "25/02/2026", user: "SILENCE_PLZ", msg: "Xenofobia contra jogadores do Nordeste." },
    { data: "26/02/2026", user: "REPORT_HATER", msg: "Ofensas graves após perder o clutch." }
];

let paginaAtual = 1;
const itensPorPagina = 2; // Quantos cards aparecem por vez

function renderizarMural() {
    const container = document.getElementById('mural-logs');
    if (!container) return;
    
    container.innerHTML = ""; // Limpa o que tem dentro

    let inicio = (paginaAtual - 1) * itensPorPagina;
    let fim = inicio + itensPorPagina;
    const itensPaginados = denuncias.slice(inicio, fim);

    itensPaginados.forEach(item => {
        const logHtml = `
            <div class="log-entry">
                <span class="log-date">[${item.data}]</span> 
                <span class="log-user">${item.user}:</span> 
                <span class="log-msg">${item.msg}</span>
            </div>
        `;
        container.innerHTML += logHtml;
    });

    document.getElementById('page-number').innerText = `PÁGINA ${paginaAtual}`;
    document.getElementById('prevBtn').disabled = paginaAtual === 1;
    document.getElementById('nextBtn').disabled = fim >= denuncias.length;
}

// Botões
document.getElementById('prevBtn').addEventListener('click', () => {
    if (paginaAtual > 1) { paginaAtual--; renderizarMural(); }
});

document.getElementById('nextBtn').addEventListener('click', () => {
    if ((paginaAtual * itensPorPagina) < denuncias.length) { paginaAtual++; renderizarMural(); }
});

renderizarMural();
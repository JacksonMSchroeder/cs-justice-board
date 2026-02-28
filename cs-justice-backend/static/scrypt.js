const botoes = document.querySelectorAll('.nav-item');
const secoes = document.querySelectorAll('.janela');

botoes.forEach(botao => {
    botao.addEventListener('click', function(event) {
        // só faz quando link começar com # (âncora)
    const idAlvo = this.getAttribute('href');
        if (idAlvo.startsWith('#')) {
            event.preventDefault();
            secoes.forEach(s => s.classList.remove('active'));
            const secaoAlvo = document.querySelector(idAlvo);
            if (secaoAlvo) {
                secaoAlvo.classList.add('active');
            }
        }
    });
});

//  UPLOAD 
const inputArquivo = document.getElementById('arquivo');
if (inputArquivo) {
    inputArquivo.addEventListener('change', function() {
        const fileName = this.files[0] ? this.files[0].name : "Nenhum arquivo selecionado";
        const displayNome = document.getElementById('file-name');
        if (displayNome) {
            displayNome.textContent = fileName;
        }
    });
}
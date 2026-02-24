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
import { openDB } from "idb";

let db;
async function criarDB(){
    try {
        db = await openDB('banco', 2, {
            upgrade(db, oldVersion, newVersion, transaction){
                switch  (oldVersion) {
                    case 0://cria um objeto de armazenamento chamado anotação
                    case 1:
                        const store = db.createObjectStore('anotacao', {
                            keyPath: 'titulo'
                        });
                        store.createIndex('id', 'id');
                        console.log("banco de dados criado!");
                }
                if (oldVersion < 2) {//versao antiga
                    const store = transaction.objectStore('anotacao');
                    store.createIndex('titulo', 'titulo', { unique: false });//indica que os titulos n precisam ser unicos
                }
            }
        });
        console.log("banco de dados aberto!");
    }catch (e) {
        console.log('Erro ao criar/abrir banco: ' + e.message);
    }
}

window.addEventListener('DOMContentLoaded', async event =>{
    criarDB();
    document.getElementById('btnCadastro').addEventListener('click', adicionarAnotacao);
    document.getElementById('btnCarregar').addEventListener('click', buscarTodasAnotacoes);
    document.getElementById('btnBuscar').addEventListener('click', buscarAnotacao);
    document.getElementById('btnRemover').addEventListener('click', removerAnotacao);
    document.getElementById('btnAtualizar').addEventListener('click', atualizarAnotacao);
});

async function buscarAnotacao() {
    let busca = document.getElementById("busca").value;//obtem o valor com ID busca
    const tx = await db.transaction('anotacao', 'readonly');//transição de leitura, objeto vinculado ao armazenamento chamado "anotação"
    const store = tx.objectStore('anotacao');//objeto de armazenamento
    const index = store.index('titulo');//a pesquisa sera feita com base nos titulos
    const anotacoes = await index.getAll(IDBKeyRange.only(busca));//usa para buscar todos os titulos correspondentes
    if (anotacoes.length > 0) {//gera as anotações encontradas
        const divLista = anotacoes.map(anotacao => {
            return `<div class="item">
                <p>Anotação</p>
                <p>Título: ${anotacao.titulo}</p>
                <p>Descrição: ${anotacao.descricao}</p>
                <p>Data: ${anotacao.data}</p>
                <p>Categoria: ${anotacao.categoria}</p>
            </div>`;
        });
        listagem(divLista.join(' '));//todas as anotações encontradas são unidas em uma string usando o join
    } else {
        listagem('<p>Nenhuma anotação encontrada com o título especificado.</p>');//se não encontrar
    }
}


async function buscarTodasAnotacoes(){
    if(db == undefined){//verifica se é indefinida
        console.log("O banco de dados está fechado.");//se for indefinido
    }
    const tx = await db.transaction('anotacao', 'readonly');//inicia uma transição de leitura no db
    const store = await tx.objectStore('anotacao');//objeto de armazenamento
    const anotacoes = await store.getAll();//obtem todas as anotações
    if(anotacoes){//verifica se anotações existe
        const divLista = anotacoes.map(anotacao => {
            return `<div class="item">
                    <p>Anotação</p>
                    <p>${anotacao.categoria} </p>
                    <p>${anotacao.titulo} </p>
                    <p> ${anotacao.data} </p>
                    <p>${anotacao.descricao}</p>
                   </div>`;
        });
        listagem(divLista.join(' '));
    }
}

async function adicionarAnotacao() {
    let titulo = document.getElementById("titulo").value;//obtem valor do titulo
    let descricao = document.getElementById("descricao").value;
    let data = document.getElementById("data").value;
    let categoria = document.getElementById("categoria").value;

    if (!titulo || !descricao || !data) {//verifica se os campos obrigatorios estao preenchidos 
        console.log('Preencha todos os campos obrigatórios (Título, Descrição e Data).');
        return;
    }
    
    const tx = await db.transaction('anotacao', 'readwrite')
    const store = tx.objectStore('anotacao');
    try {
        await store.add({ titulo: titulo, descricao: descricao, data: data, categoria: categoria }); //adiciona uma nova anotação
        await tx.done;//aguarda a conclusao
        limparCampos();//para limpar os campos do formulario
        console.log('Registro adicionado com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar registro:', error);
        tx.abort();
    }
}

async function removerAnotacao() {
    const tituloParaRemover = prompt('Digite o título da anotação que deseja remover:');
    if (!tituloParaRemover) {//se o usuario cancelou a operação
        console.log('Operação de remoção cancelada.');
        return;
    }
    const tx = await db.transaction('anotacao', 'readwrite');
    const store = tx.objectStore('anotacao');
    try {
        await store.delete(tituloParaRemover);//remove a anotação 
        await tx.done;//aguarda a conclusao
        console.log('Anotação removida com sucesso!');
        buscarTodasAnotacoes();//atualiza as anotações para refletir a remoção
    } catch (error) {
        console.error('Erro ao remover a anotação:', error);
        tx.abort();//evita que as alterações se apliquem ao bd
    }
}


async function atualizarAnotacao() {
    const tituloParaAtualizar = prompt('Digite o título da anotação que deseja atualizar:');
    if (!tituloParaAtualizar) {
        console.log('Operação de atualização cancelada.');
        return;
    }
    const tx = await db.transaction('anotacao', 'readwrite');
    const store = tx.objectStore('anotacao');
    const anotacaoExistente = await store.get(tituloParaAtualizar);
    if (!anotacaoExistente) {
        console.log('Anotação não encontrada.');
        return;
    }

    // Solicite ao usuário que atualize os campos desejados
    const novaDescricao = prompt('Nova descrição:');
    const novaData = prompt('Nova data (no formato yyyy-mm-dd):');
    
    // Solicite ao usuário que selecione uma nova 
    const categoriasExistentes = ['trabalho', 'estudos', 'pessoal', 'academia', 'casa', 'formula 1'];
    const novaCategoria = prompt(`Nova categoria (${categoriasExistentes.join(', ')}):`);

    // Validar a data no formato yyyy-mm-dd
    if (novaData && !/^\d{4}-\d{2}-\d{2}$/.test(novaData)) {
        console.log('Formato de data inválido. Use o formato yyyy-mm-dd.');
        return;
    }

    // Validar se a nova categoria está entre as categorias existentes
    if (novaCategoria && !categoriasExistentes.includes(novaCategoria)) {
        console.log('Categoria inválida. Escolha uma das categorias existentes.');
        return;
    }

    // Atualize os campos na anotação existente
    if (novaDescricao) {
        anotacaoExistente.descricao = novaDescricao;
    }
    if (novaData) {
        anotacaoExistente.data = novaData;
    }
    if (novaCategoria) {
        anotacaoExistente.categoria = novaCategoria;
    }
    try {
        await store.put(anotacaoExistente);
        await tx.done;
        console.log('Anotação atualizada com sucesso!');
        buscarTodasAnotacoes();
    } catch (error) {
        console.error('Erro ao atualizar a anotação:', error);
        tx.abort();
    }
}


//limpa os campos e da um valor vazio
function limparCampos() {
    document.getElementById("titulo").value = '';
    document.getElementById("descricao").value = '';
    document.getElementById("data").value = '';
}

function listagem(text){
    document.getElementById('resultados').innerHTML = text;
}
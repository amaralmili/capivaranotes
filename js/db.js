import { openDB } from "idb";

let db;
async function criarDB(){
    try {
        db = await openDB('banco', 2, {
            upgrade(db, oldVersion, newVersion, transaction){
                switch  (oldVersion) {
                    case 0:
                    case 1:
                        const store = db.createObjectStore('anotacao', {
                            keyPath: 'titulo'
                        });
                        store.createIndex('id', 'id');
                        console.log("banco de dados criado!");
                }
                if (oldVersion < 2) {
                    const store = transaction.objectStore('anotacao');
                    store.createIndex('titulo', 'titulo', { unique: false });
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
    let busca = document.getElementById("busca").value;
    const tx = await db.transaction('anotacao', 'readonly');
    const store = tx.objectStore('anotacao');
    const index = store.index('titulo');
    const anotacoes = await index.getAll(IDBKeyRange.only(busca));
    if (anotacoes.length > 0) {
        const divLista = anotacoes.map(anotacao => {
            return `<div class="item">
                <p>Anotação</p>
                <p>Título: ${anotacao.titulo}</p>
                <p>Descrição: ${anotacao.descricao}</p>
                <p>Data: ${anotacao.data}</p>
                <p>Categoria: ${anotacao.categoria}</p>
            </div>`;
        });
        listagem(divLista.join(' '));
    } else {
        listagem('<p>Nenhuma anotação encontrada com o título especificado.</p>');
    }
}


async function buscarTodasAnotacoes(){
    if(db == undefined){
        console.log("O banco de dados está fechado.");
    }
    const tx = await db.transaction('anotacao', 'readonly');
    const store = await tx.objectStore('anotacao');
    const anotacoes = await store.getAll();
    if(anotacoes){
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
    let titulo = document.getElementById("titulo").value;
    let descricao = document.getElementById("descricao").value;
    let data = document.getElementById("data").value;
    let categoria = document.getElementById("categoria").value;

    if (!titulo || !descricao || !data) {
        console.log('Preencha todos os campos obrigatórios (Título, Descrição e Data).');
        return;
    }
    
    const tx = await db.transaction('anotacao', 'readwrite')
    const store = tx.objectStore('anotacao');
    try {
        await store.add({ titulo: titulo, descricao: descricao, data: data, categoria: categoria });
        await tx.done;
        limparCampos();
        console.log('Registro adicionado com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar registro:', error);
        tx.abort();
    }
}

async function removerAnotacao() {
    const tituloParaRemover = prompt('Digite o título da anotação que deseja remover:');
    if (!tituloParaRemover) {
        console.log('Operação de remoção cancelada.');
        return;
    }
    const tx = await db.transaction('anotacao', 'readwrite');
    const store = tx.objectStore('anotacao');
    try {
        await store.delete(tituloParaRemover);
        await tx.done;
        console.log('Anotação removida com sucesso!');
        buscarTodasAnotacoes(); 
    } catch (error) {
        console.error('Erro ao remover a anotação:', error);
        tx.abort();
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


function limparCampos() {
    document.getElementById("titulo").value = '';
    document.getElementById("descricao").value = '';
    document.getElementById("data").value = '';
}

function listagem(text){
    document.getElementById('resultados').innerHTML = text;
}
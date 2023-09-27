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

function limparCampos() {
    document.getElementById("titulo").value = '';
    document.getElementById("descricao").value = '';
    document.getElementById("data").value = '';
}

function listagem(text){
    document.getElementById('resultados').innerHTML = text;
}
# rotas/curriculo_rotas.py
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
import mimetypes
from datetime import datetime
from servicos.token_servico import TokenServico
import tempfile
from servicos.extracao_servico import ExtracaoServico
from servicos.processamento_curriculo_servico import ProcessamentoCurriculoServico
from bson.objectid import ObjectId
from banco_de_dados.repositorios.curriculo_repositorio import CurriculoRepositorio


# Criando o Blueprint para rotas de currículo
curriculo_bp = Blueprint('curriculo', __name__)


# Função auxiliar para verificar se o token é válido
def verificar_autenticacao():
    """Verifica se o usuário está autenticado através do token JWT."""
    header_autorizacao = request.headers.get('Authorization')

    if not header_autorizacao or not header_autorizacao.startswith('Bearer '):
        return False, None, "Token não fornecido"

    token = header_autorizacao.split(' ')[1]
    token_servico = TokenServico()
    return token_servico.validar_token(token)


def validar_pdf(arquivo_bytes):
    """Valida se o arquivo é um PDF verificando o cabeçalho."""
    # Verifica se o arquivo começa com a assinatura de PDF: %PDF-
    return arquivo_bytes.startswith(b'%PDF-')


@curriculo_bp.route('/upload', methods=['POST'])
def upload_curriculo():
    """Rota para upload de currículo em formato PDF, extração e processamento de texto."""
    # Verifica autenticação
    autenticado, usuario_id, mensagem = verificar_autenticacao()

    if not autenticado:
        return jsonify({'mensagem': mensagem}), 401

    # Verifica se um arquivo foi enviado
    if 'curriculo' not in request.files:
        return jsonify({'mensagem': 'Nenhum arquivo enviado'}), 400

    arquivo = request.files['curriculo']

    # Verifica se o arquivo tem um nome
    if arquivo.filename == '':
        return jsonify({'mensagem': 'Nome do arquivo vazio'}), 400

    # Obtém o nome seguro do arquivo
    nome_arquivo = secure_filename(arquivo.filename)

    # Verifica se a extensão é .pdf
    if not nome_arquivo.lower().endswith('.pdf'):
        return jsonify({'mensagem': 'O arquivo deve ter extensão .pdf'}), 400

    # Lê o conteúdo do arquivo
    conteudo_arquivo = arquivo.read()

    # Verifica se é um PDF válido verificando a assinatura do arquivo
    if not validar_pdf(conteudo_arquivo):
        return jsonify({'mensagem': 'O arquivo não é um PDF válido'}), 400

    # Verifica o tamanho do arquivo (limite de 5MB)
    tamanho_maximo = 5 * 1024 * 1024  # 5MB em bytes
    if len(conteudo_arquivo) > tamanho_maximo:
        return jsonify({'mensagem': 'O arquivo excede o tamanho máximo de 5MB'}), 400

    try:
        # 1. Extrai o texto do PDF
        extracao_servico = ExtracaoServico()
        sucesso_extracao, texto_extraido, erro_extracao = extracao_servico.extrair_texto_pdf(conteudo_arquivo)

        if not sucesso_extracao:
            return jsonify({'mensagem': erro_extracao}), 400

        # 2. Processa o texto com IA para extrair dados estruturados
        processamento_servico = ProcessamentoCurriculoServico()
        sucesso_proc, dados_curriculo, erro_proc = processamento_servico.processar_curriculo(texto_extraido)

        if not sucesso_proc:
            return jsonify({'mensagem': erro_proc}), 400

        # 3. Salva os dados no banco usando o repositório
        db = current_app.config['MONGODB_DB']
        curriculo_repo = CurriculoRepositorio(db)

        sucesso_salvar = curriculo_repo.salvar_curriculo_processado(
            usuario_id,
            dados_curriculo,
            texto_extraido
        )

        if not sucesso_salvar:
            return jsonify({'mensagem': 'Erro ao salvar os dados do currículo no banco de dados'}), 500

        # 4. Retorna sucesso e um resumo dos dados extraídos
        return jsonify({
            'mensagem': 'Currículo processado e salvo com sucesso',
            'nome_arquivo': nome_arquivo,
            'dados_extraidos': {
                'nome': dados_curriculo.get('nome_completo', ''),
                'email': dados_curriculo.get('email', ''),
                'perfil': dados_curriculo.get('perfil', {}).get('titulo', ''),
                'experiencias': len(dados_curriculo.get('experiencias', [])),
                'formacao': len(dados_curriculo.get('formacao', [])),
                'habilidades': len(dados_curriculo.get('habilidades_tecnicas', [])),
                'idiomas': len(dados_curriculo.get('idiomas', []))
            }
        }), 201

    except Exception as e:
        return jsonify({'mensagem': f'Erro ao processar currículo: {str(e)}'}), 500
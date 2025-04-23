from flask import Blueprint, request, jsonify, current_app
from servicos.validacao_servico import ValidacaoServico
from banco_de_dados.repositorios.vaga_repositorio import VagaRepositorio
from modelos.vaga_modelo import VagaModelo
from servicos.vaga_analisador_servico import VagaAnalisadorServico
import os
import json
from bson.objectid import ObjectId
from datetime import datetime

# Criando o Blueprint para rotas de vaga
vaga_bp = Blueprint('vaga', __name__)

class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super(MongoJSONEncoder, self).default(obj)

# Função auxiliar para converter dicionários com ObjectId para JSON
def json_response(data):
    return json.loads(json.dumps(data, cls=MongoJSONEncoder))

@vaga_bp.route('/adicionar', methods=['POST'])
def adicionar_vaga():
    """
    Rota para adicionar vagas a partir do texto da vaga.
    Utiliza o serviço de análise para extrair informações estruturadas.
    """
    # Obtém dados da requisição
    dados = request.get_json()

    # Validação básica dos dados
    if not dados:
        return jsonify({'mensagem': 'Dados não fornecidos'}), 400

    # Verifica se o texto da vaga foi fornecido
    texto_vaga = dados.get('texto_vaga')
    if not texto_vaga:
        return jsonify({'mensagem': 'Texto da vaga é obrigatório'}), 400

    try:
        # Obtém a conexão com o banco de dados
        db = current_app.config['MONGODB_DB']

        # Cria o repositório
        vaga_repositorio = VagaRepositorio(db)

        # Cria o serviço de análise de vagas
        # Obtém a chave da API do Anthropic do ambiente
        api_key = os.getenv('ANTHROPIC_API_KEY')
        analisador_servico = VagaAnalisadorServico(api_key=api_key)

        # Extrai metadados adicionais que podem ter sido fornecidos junto com o texto
        metadados = {}
        if dados.get('empresa'):
            metadados['empresa'] = dados.get('empresa')
        if dados.get('fonte'):
            metadados['fonte'] = dados.get('fonte')
        if dados.get('recrutador_id'):
            metadados['recrutador_id'] = dados.get('recrutador_id')

        # Analisa o texto da vaga
        vaga_modelo = analisador_servico.extrair_estrutura_vaga(texto_vaga, dados_adicionais=metadados)

        # Gera palavras-chave se não foram geradas automaticamente
        if not vaga_modelo.modelo.get('palavras_chave') or len(vaga_modelo.modelo.get('palavras_chave', [])) < 5:
            palavras_chave = analisador_servico.gerar_palavras_chave(vaga_modelo)
            vaga_modelo.modelo['palavras_chave'] = palavras_chave

        # Gera resumo se não foi gerado automaticamente
        if not vaga_modelo.modelo.get('resumo'):
            resumo = analisador_servico.gerar_resumo(vaga_modelo)
            vaga_modelo.modelo['resumo'] = resumo

        # Insere a vaga no banco de dados
        vaga_id = vaga_repositorio.inserir(vaga_modelo)

        if not vaga_id:
            return jsonify({'mensagem': 'Erro ao inserir vaga'}), 500

        # Retorna sucesso e ID da vaga
        return jsonify({
            'mensagem': 'Vaga analisada e cadastrada com sucesso',
            'vaga_id': vaga_id,
            'vaga': json_response(vaga_modelo.to_dict())  # Use a função auxiliar aqui
        }), 201

    except Exception as e:
        return jsonify({'mensagem': f'Erro ao processar vaga: {str(e)}'}), 500


@vaga_bp.route('/listar', methods=['GET'])
def listar_vagas():
    """Rota para listar vagas ativas."""
    # Obtém parâmetros de paginação
    pagina = int(request.args.get('pagina', 1))
    limite = int(request.args.get('limite', 20))

    # Obtém a conexão com o banco de dados
    db = current_app.config['MONGODB_DB']

    # Cria o repositório
    vaga_repositorio = VagaRepositorio(db)

    try:
        # Busca as vagas ativas
        vagas = vaga_repositorio.buscar_vagas_ativas(limite=limite, pagina=pagina)

        # Converte as vagas para dicionários
        vagas_dict = [vaga.to_dict() for vaga in vagas]

        # Retorna a lista de vagas
        return jsonify({
            'total': len(vagas_dict),
            'pagina': pagina,
            'limite': limite,
            'vagas': json_response(vagas_dict)  # Use a função auxiliar aqui
        }), 200

    except Exception as e:
        return jsonify({'mensagem': f'Erro ao listar vagas: {str(e)}'}), 500


@vaga_bp.route('/<vaga_id>', methods=['GET'])
def obter_vaga(vaga_id):
    """Rota para obter detalhes de uma vaga específica."""
    # Obtém a conexão com o banco de dados
    db = current_app.config['MONGODB_DB']

    # Cria o repositório
    vaga_repositorio = VagaRepositorio(db)

    try:
        # Busca a vaga pelo ID
        vaga = vaga_repositorio.buscar_por_id(vaga_id)

        if not vaga:
            return jsonify({'mensagem': 'Vaga não encontrada'}), 404

        # Incrementa o contador de visualizações
        vaga_repositorio.atualizar_estatisticas(vaga_id, 'visualizacoes')

        # Retorna os dados da vaga
        return jsonify({
            'vaga': json_response(vaga.to_dict())  # Use a função auxiliar aqui
        }), 200

    except Exception as e:
        return jsonify({'mensagem': f'Erro ao obter vaga: {str(e)}'}), 500
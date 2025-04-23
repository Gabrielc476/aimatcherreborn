from flask import Blueprint, request, jsonify, current_app
from servicos.matching_ai_servico import MatchingAIServico
from banco_de_dados.repositorios.matching_repositorio import MatchingRepositorio
from banco_de_dados.repositorios.usuario_repositorio import UsuarioRepositorio
from banco_de_dados.repositorios.vaga_repositorio import VagaRepositorio
from servicos.token_servico import TokenServico
import json
from bson.objectid import ObjectId
from datetime import datetime

# Criando o Blueprint para rotas de matching
matching_bp = Blueprint('matching', __name__)


# Classe auxiliar para converter ObjectId para string em JSON
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


# Função auxiliar para verificar autenticação
def verificar_autenticacao():
    """Verifica se o usuário está autenticado através do token JWT."""
    header_autorizacao = request.headers.get('Authorization')

    if not header_autorizacao or not header_autorizacao.startswith('Bearer '):
        return False, None, "Token não fornecido"

    token = header_autorizacao.split(' ')[1]
    token_servico = TokenServico()
    return token_servico.validar_token(token)


@matching_bp.route('/analisar', methods=['POST'])
def analisar_matching():
    """
    Rota para solicitar análise de compatibilidade entre um currículo e uma vaga.
    Utiliza o Claude 3.7 com extended thinking para análise profunda.
    """
    # Verifica autenticação
    autenticado, usuario_id, mensagem = verificar_autenticacao()
    if not autenticado:
        return jsonify({'mensagem': mensagem}), 401

    # Obtém dados da requisição
    dados = request.get_json()

    # Validação básica
    if not dados:
        return jsonify({'mensagem': 'Dados não fornecidos'}), 400

    # Se não for informado o ID do usuário no payload, usa o ID do token
    if not dados.get('usuario_id'):
        dados['usuario_id'] = usuario_id

    # Valida se o ID da vaga foi informado
    vaga_id = dados.get('vaga_id')
    if not vaga_id:
        return jsonify({'mensagem': 'ID da vaga é obrigatório'}), 400

    # Obtém o ID do usuário (pode ser diferente do autenticado, se for admin)
    usuario_id_analise = dados.get('usuario_id')

    try:
        # Obtém a conexão com o banco de dados
        db = current_app.config['MONGODB_DB']

        # Cria os repositórios
        usuario_repo = UsuarioRepositorio(db)
        vaga_repo = VagaRepositorio(db)
        matching_repo = MatchingRepositorio(db)

        # Verifica se o usuário existe
        usuario = usuario_repo.buscar_por_id(usuario_id_analise)
        print(usuario)
        print(usuario_id_analise)
        if not usuario:
            return jsonify({'mensagem': 'Usuário não encontrado'}), 404

        # Verifica se a vaga existe
        vaga = vaga_repo.buscar_por_id(vaga_id)
        if not vaga:
            return jsonify({'mensagem': 'Vaga não encontrada'}), 404

        # Obtém a chave da API do Anthropic
        api_key = current_app.config.get('ANTHROPIC_API_KEY')

        # Cria o serviço de matching com IA
        matching_servico = MatchingAIServico(
            usuario_repositorio=usuario_repo,
            vaga_repositorio=vaga_repo,
            matching_repositorio=matching_repo,
            api_key=api_key
        )

        # Realiza a análise de compatibilidade
        matching = matching_servico.analisar_compatibilidade(usuario_id_analise, vaga_id)

        if not matching:
            return jsonify({'mensagem': 'Erro ao realizar análise de compatibilidade'}), 500

        # Retorna o resultado
        return jsonify({
            'mensagem': 'Análise de compatibilidade realizada com sucesso',
            'matching': json_response(matching.to_dict())
        }), 200

    except Exception as e:
        return jsonify({'mensagem': f'Erro ao processar análise: {str(e)}'}), 500


@matching_bp.route('/usuario/<usuario_id>', methods=['GET'])
def obter_matchings_usuario(usuario_id):
    """
    Rota para obter todos os matchings de um usuário.
    """
    # Verifica autenticação
    autenticado, token_usuario_id, mensagem = verificar_autenticacao()
    if not autenticado:
        return jsonify({'mensagem': mensagem}), 401

    # Verifica se o usuário está acessando seus próprios matchings ou se é admin
    # (aqui seria necessário implementar uma verificação de admin)
    if token_usuario_id != usuario_id and not request.args.get('admin'):
        return jsonify({'mensagem': 'Acesso não autorizado'}), 403

    # Parâmetros de paginação
    pagina = int(request.args.get('pagina', 1))
    limite = int(request.args.get('limite', 10))

    try:
        # Obtém a conexão com o banco de dados
        db = current_app.config['MONGODB_DB']

        # Cria o repositório
        matching_repo = MatchingRepositorio(db)

        # Obtém os matchings
        matchings = matching_repo.buscar_por_usuario(
            usuario_id=usuario_id,
            limite=limite,
            pagina=pagina
        )

        # Obtém o total de matchings
        total = matching_repo.contar_por_usuario(usuario_id)

        # Converte para dicionários
        matchings_dict = [m.to_dict() for m in matchings]

        # Retorna o resultado
        return jsonify({
            'total': total,
            'pagina': pagina,
            'limite': limite,
            'matchings': json_response(matchings_dict)
        }), 200

    except Exception as e:
        return jsonify({'mensagem': f'Erro ao obter matchings: {str(e)}'}), 500


@matching_bp.route('/vaga/<vaga_id>', methods=['GET'])
def obter_matchings_vaga(vaga_id):
    """
    Rota para obter todos os matchings para uma vaga.
    """
    # Verifica autenticação
    autenticado, usuario_id, mensagem = verificar_autenticacao()
    if not autenticado:
        return jsonify({'mensagem': mensagem}), 401

    # Aqui seria necessário implementar uma verificação se o usuário
    # tem permissão para acessar os matchings da vaga (ex: recrutador, admin)

    # Parâmetros de paginação e filtro
    pagina = int(request.args.get('pagina', 1))
    limite = int(request.args.get('limite', 20))
    score_minimo = float(request.args.get('score_minimo', 0))

    try:
        # Obtém a conexão com o banco de dados
        db = current_app.config['MONGODB_DB']

        # Cria o repositório
        matching_repo = MatchingRepositorio(db)

        # Obtém os matchings
        matchings = matching_repo.buscar_por_vaga(
            vaga_id=vaga_id,
            limite=limite,
            score_minimo=score_minimo,
            pagina=pagina
        )

        # Obtém o total de matchings
        total = matching_repo.contar_por_vaga(vaga_id, score_minimo)

        # Converte para dicionários
        matchings_dict = [m.to_dict() for m in matchings]

        # Retorna o resultado
        return jsonify({
            'total': total,
            'pagina': pagina,
            'limite': limite,
            'matchings': json_response(matchings_dict)
        }), 200

    except Exception as e:
        return jsonify({'mensagem': f'Erro ao obter matchings: {str(e)}'}), 500


@matching_bp.route('/<usuario_id>/<vaga_id>', methods=['GET'])
def obter_matching(usuario_id, vaga_id):
    """
    Rota para obter um matching específico.
    """
    # Verifica autenticação
    autenticado, token_usuario_id, mensagem = verificar_autenticacao()
    if not autenticado:
        return jsonify({'mensagem': mensagem}), 401

    # Verifica se o usuário está acessando seu próprio matching ou se é admin
    if token_usuario_id != usuario_id and not request.args.get('admin'):
        return jsonify({'mensagem': 'Acesso não autorizado'}), 403

    try:
        # Obtém a conexão com o banco de dados
        db = current_app.config['MONGODB_DB']

        # Cria o repositório
        matching_repo = MatchingRepositorio(db)

        # Obtém o matching
        matching = matching_repo.buscar(usuario_id, vaga_id)

        if not matching:
            return jsonify({'mensagem': 'Matching não encontrado'}), 404

        # Retorna o resultado
        return jsonify({
            'matching': json_response(matching.to_dict())
        }), 200

    except Exception as e:
        return jsonify({'mensagem': f'Erro ao obter matching: {str(e)}'}), 500


@matching_bp.route('/<usuario_id>/<vaga_id>', methods=['DELETE'])
def excluir_matching(usuario_id, vaga_id):
    """
    Rota para excluir um matching específico.
    """
    # Verifica autenticação
    autenticado, token_usuario_id, mensagem = verificar_autenticacao()
    if not autenticado:
        return jsonify({'mensagem': mensagem}), 401

    # Verifica se o usuário está excluindo seu próprio matching ou se é admin
    if token_usuario_id != usuario_id and not request.args.get('admin'):
        return jsonify({'mensagem': 'Acesso não autorizado'}), 403

    try:
        # Obtém a conexão com o banco de dados
        db = current_app.config['MONGODB_DB']

        # Cria o repositório
        matching_repo = MatchingRepositorio(db)

        # Exclui o matching
        sucesso = matching_repo.excluir(usuario_id, vaga_id)

        if not sucesso:
            return jsonify({'mensagem': 'Matching não encontrado ou erro ao excluir'}), 404

        # Retorna o resultado
        return jsonify({
            'mensagem': 'Matching excluído com sucesso'
        }), 200

    except Exception as e:
        return jsonify({'mensagem': f'Erro ao excluir matching: {str(e)}'}), 500


@matching_bp.route('/recalcular/<usuario_id>/<vaga_id>', methods=['POST'])
def recalcular_matching(usuario_id, vaga_id):
    """
    Rota para recalcular um matching existente.
    """
    # Verifica autenticação
    autenticado, token_usuario_id, mensagem = verificar_autenticacao()
    if not autenticado:
        return jsonify({'mensagem': mensagem}), 401

    # Verifica se o usuário está recalculando seu próprio matching ou se é admin
    if token_usuario_id != usuario_id and not request.args.get('admin'):
        return jsonify({'mensagem': 'Acesso não autorizado'}), 403

    try:
        # Obtém a conexão com o banco de dados
        db = current_app.config['MONGODB_DB']

        # Cria os repositórios
        usuario_repo = UsuarioRepositorio(db)
        vaga_repo = VagaRepositorio(db)
        matching_repo = MatchingRepositorio(db)

        # Verifica se o usuário existe
        usuario = usuario_repo.buscar_por_id(usuario_id)
        if not usuario:
            return jsonify({'mensagem': 'Usuário não encontrado'}), 404

        # Verifica se a vaga existe
        vaga = vaga_repo.buscar_por_id(vaga_id)
        if not vaga:
            return jsonify({'mensagem': 'Vaga não encontrada'}), 404

        # Obtém a chave da API do Anthropic
        api_key = current_app.config.get('ANTHROPIC_API_KEY')

        # Cria o serviço de matching com IA
        matching_servico = MatchingAIServico(
            usuario_repositorio=usuario_repo,
            vaga_repositorio=vaga_repo,
            matching_repositorio=matching_repo,
            api_key=api_key
        )

        # Realiza a análise de compatibilidade
        matching = matching_servico.analisar_compatibilidade(usuario_id, vaga_id)

        if not matching:
            return jsonify({'mensagem': 'Erro ao recalcular matching'}), 500

        # Retorna o resultado
        return jsonify({
            'mensagem': 'Matching recalculado com sucesso',
            'matching': json_response(matching.to_dict())
        }), 200

    except Exception as e:
        return jsonify({'mensagem': f'Erro ao recalcular matching: {str(e)}'}), 500
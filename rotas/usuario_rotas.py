from flask import Blueprint, request, jsonify, current_app
from servicos.validacao_servico import ValidacaoServico
from servicos.autenticacao_servico import AutenticacaoServico
from servicos.token_servico import TokenServico
from banco_de_dados.repositorios.usuario_repositorio import UsuarioRepositorio
from modelos.usuario_modelo import UsuarioModelo

# Criando o Blueprint para rotas de usuário
usuario_bp = Blueprint('usuario', __name__)


@usuario_bp.route('/cadastro', methods=['POST'])
def cadastro():
    """Rota para cadastro de usuários."""
    # Obtém dados da requisição
    dados = request.get_json()

    # 1. VALIDAÇÃO
    # Valida os dados de cadastro
    validacao_servico = ValidacaoServico()
    valido, mensagem = validacao_servico.validar_dados_cadastro(dados)

    if not valido:
        return jsonify({'mensagem': mensagem}), 400

    # 2. AUTENTICAÇÃO/REGISTRO
    # Obtém a conexão com o banco de dados
    db = current_app.config['MONGODB_DB']

    # Cria o repositório
    repositorio = UsuarioRepositorio(db)

    # Cria o serviço de autenticação
    autenticacao_servico = AutenticacaoServico(repositorio)

    # Registra o usuário
    sucesso, usuario_id, mensagem = autenticacao_servico.registrar_usuario(dados)

    if not sucesso:
        return jsonify({'mensagem': mensagem}), 409

    # Retorna sucesso e ID do usuário
    return jsonify({
        'mensagem': 'Usuário cadastrado com sucesso',
        'usuario_id': usuario_id
    }), 201


@usuario_bp.route('/login', methods=['POST'])
def login():
    """Rota para login de usuários."""
    # Obtém dados da requisição
    dados = request.get_json()

    # 1. VALIDAÇÃO
    # Valida os dados de login
    validacao_servico = ValidacaoServico()
    valido, mensagem = validacao_servico.validar_dados_login(dados)

    if not valido:
        return jsonify({'mensagem': mensagem}), 400

    # 2. AUTENTICAÇÃO
    # Obtém a conexão com o banco de dados
    db = current_app.config['MONGODB_DB']

    # Cria o repositório
    repositorio = UsuarioRepositorio(db)

    # Cria o serviço de autenticação
    autenticacao_servico = AutenticacaoServico(repositorio)

    # Autentica o usuário
    autenticado, usuario, mensagem = autenticacao_servico.autenticar_usuario(
        dados.get('email'),
        dados.get('senha')
    )

    if not autenticado:
        return jsonify({'mensagem': mensagem}), 401

    # 3. GERAÇÃO DE TOKEN
    # Cria o serviço de token
    token_servico = TokenServico()

    # Gera o token JWT
    token = token_servico.gerar_token(str(usuario['_id']))

    # Retorna o token e informações básicas do usuário
    return jsonify({
        'mensagem': 'Login realizado com sucesso',
        'token': token,
        'usuario': {
            'id': str(usuario['_id']),
            'nome': usuario.get('nome_completo', ''),
            'email': usuario.get('email', '')
        }
    }), 200


@usuario_bp.route('/verificar-token', methods=['GET'])
def verificar_token():
    """Rota para verificar a validade de um token."""
    # Obtém o token do cabeçalho de autorização
    header_autorizacao = request.headers.get('Authorization')

    if not header_autorizacao or not header_autorizacao.startswith('Bearer '):
        return jsonify({'mensagem': 'Token não fornecido'}), 401

    # Extrai o token
    token = header_autorizacao.split(' ')[1]

    # Cria o serviço de token
    token_servico = TokenServico()

    # Valida o token
    valido, usuario_id, mensagem = token_servico.validar_token(token)

    if not valido:
        return jsonify({'mensagem': mensagem}), 401

    # Retorna sucesso
    return jsonify({
        'mensagem': 'Token válido',
        'usuario_id': usuario_id
    }), 200


@usuario_bp.route('/atualizar-token', methods=['POST'])
def atualizar_token():
    """Rota para atualizar um token existente (refresh token)."""
    # Obtém o token do corpo da requisição
    dados = request.get_json()
    token_atual = dados.get('token')

    if not token_atual:
        return jsonify({'mensagem': 'Token não fornecido'}), 400

    # Cria o serviço de token
    token_servico = TokenServico()

    # Gera um novo token
    sucesso, novo_token, mensagem = token_servico.obter_novo_token(token_atual)

    if not sucesso:
        return jsonify({'mensagem': mensagem}), 401

    # Retorna o novo token
    return jsonify({
        'mensagem': 'Token atualizado com sucesso',
        'token': novo_token
    }), 200
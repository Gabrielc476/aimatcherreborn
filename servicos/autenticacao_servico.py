from werkzeug.security import check_password_hash, generate_password_hash


class AutenticacaoServico:
    """
    Serviço responsável pela autenticação de usuários.
    """

    def __init__(self, usuario_repositorio):
        """
        Inicializa o serviço de autenticação.

        Args:
            usuario_repositorio: Repositório de usuários
        """
        self.usuario_repositorio = usuario_repositorio

    def autenticar_usuario(self, email, senha):
        """
        Autentica um usuário pelo email e senha.

        Args:
            email (str): Email do usuário
            senha (str): Senha do usuário

        Returns:
            tuple: (autenticado, usuario, mensagem)
                - autenticado (bool): True se autenticado, False caso contrário
                - usuario (dict): Dados do usuário ou None se não autenticado
                - mensagem (str): Mensagem de erro ou None se autenticado
        """
        # Busca o usuário no banco de dados
        usuario = self.usuario_repositorio.buscar_por_email(email)

        # Verifica se o usuário existe
        if not usuario:
            return False, None, "Usuário não encontrado"

        # Verifica se o usuário está ativo
        if usuario.get('status') != 'ativo':
            return False, None, "Usuário inativo ou bloqueado"

        # Verifica se a senha está correta
        if not check_password_hash(usuario['senha_hash'], senha):
            return False, None, "Senha incorreta"

        # Atualiza o timestamp de último acesso
        self.usuario_repositorio.atualizar(
            str(usuario['_id']),
            {'ultimo_acesso': self.obter_data_atual()}
        )

        # Autenticação bem-sucedida
        return True, usuario, None

    def registrar_usuario(self, dados_usuario):
        """
        Registra um novo usuário.

        Args:
            dados_usuario (dict): Dados do usuário

        Returns:
            tuple: (sucesso, usuario_id, mensagem)
                - sucesso (bool): True se registrado, False caso contrário
                - usuario_id (str): ID do usuário registrado ou None
                - mensagem (str): Mensagem de erro ou None se registrado
        """
        # Verifica se o email já está em uso
        email = dados_usuario.get('email')
        usuario_existente = self.usuario_repositorio.buscar_por_email(email)

        if usuario_existente:
            return False, None, "Email já está em uso"

        # Cria o hash da senha
        senha = dados_usuario.get('senha')
        dados_usuario['senha_hash'] = generate_password_hash(senha)

        # Remove a senha em texto puro
        if 'senha' in dados_usuario:
            del dados_usuario['senha']

        # Define o status como ativo
        dados_usuario['status'] = 'ativo'

        # Insere o usuário no banco de dados
        try:
            usuario_id = self.usuario_repositorio.inserir(dados_usuario)
            return True, usuario_id, None
        except Exception as e:
            return False, None, f"Erro ao registrar usuário: {str(e)}"

    @staticmethod
    def obter_data_atual():
        """Retorna a data atual em formato ISO."""
        from datetime import datetime
        return datetime.now().isoformat()
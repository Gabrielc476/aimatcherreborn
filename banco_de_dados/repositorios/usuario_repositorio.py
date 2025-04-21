from datetime import datetime
from bson.objectid import ObjectId


class UsuarioRepositorio:
    """
    Repositório para operações básicas de usuários no MongoDB.
    Apenas insere e recupera dados, sem validações ou lógica de negócio.
    """

    def __init__(self, db):
        """
        Inicializa o repositório.

        Args:
            db: Conexão com o banco de dados MongoDB
        """
        self.colecao = db['usuarios']

        # Cria um índice único no email
        self.colecao.create_index('email', unique=True)

    def inserir(self, usuario_dados):
        """
        Insere um novo usuário no banco de dados.

        Args:
            usuario_dados: Dicionário com os dados do usuário

        Returns:
            str: ID do usuário inserido ou None se ocorrer um erro
        """
        # Adiciona timestamps
        usuario_dados['data_criacao'] = datetime.now().isoformat()
        usuario_dados['ultimo_acesso'] = datetime.now().isoformat()

        # Insere no banco
        resultado = self.colecao.insert_one(usuario_dados)

        # Retorna o ID
        return str(resultado.inserted_id)

    def buscar_por_email(self, email):
        """
        Busca um usuário pelo email.

        Args:
            email: Email do usuário

        Returns:
            dict: Documento do usuário ou None se não encontrado
        """
        return self.colecao.find_one({"email": email})

    def buscar_por_id(self, usuario_id):
        """
        Busca um usuário pelo ID.

        Args:
            usuario_id: ID do usuário

        Returns:
            dict: Documento do usuário ou None se não encontrado
        """
        try:
            return self.colecao.find_one({"_id": ObjectId(usuario_id)})
        except:
            return None

    def atualizar(self, usuario_id, dados_atualizacao):
        """
        Atualiza dados do usuário.

        Args:
            usuario_id: ID do usuário
            dados_atualizacao: Dicionário com os dados a atualizar

        Returns:
            bool: True se atualizado com sucesso, False caso contrário
        """
        resultado = self.colecao.update_one(
            {"_id": ObjectId(usuario_id)},
            {"$set": dados_atualizacao}
        )
        return resultado.modified_count > 0
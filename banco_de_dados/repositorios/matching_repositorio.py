from datetime import datetime
from bson.objectid import ObjectId
from modelos.matching_modelo import MatchingModelo


class MatchingRepositorio:
    """
    Repositório para operações relacionadas aos resultados de matching no MongoDB.
    """

    def __init__(self, db):
        """
        Inicializa o repositório.

        Args:
            db: Conexão com o banco de dados MongoDB
        """
        self.colecao = db['matchings']

        # Cria índices para facilitar a busca
        self.colecao.create_index([("usuario_id", 1), ("vaga_id", 1)], unique=True)
        self.colecao.create_index("usuario_id")
        self.colecao.create_index("vaga_id")
        self.colecao.create_index("score_matching")
        self.colecao.create_index("data_matching")

    def salvar(self, matching):
        """
        Salva ou atualiza um resultado de matching no banco de dados.

        Args:
            matching (MatchingModelo): Modelo de matching a ser salvo

        Returns:
            str: ID do documento inserido/atualizado ou None se falhar
        """
        try:
            # Converte para dicionário se for um objeto MatchingModelo
            if isinstance(matching, MatchingModelo):
                dados = matching.to_dict()
            else:
                dados = matching

            # Adiciona ou atualiza timestamp
            dados['atualizado_em'] = datetime.now().isoformat()

            # Verifica se já existe um documento com mesmo usuario_id e vaga_id
            existente = self.colecao.find_one({
                "usuario_id": dados['usuario_id'],
                "vaga_id": dados['vaga_id']
            })

            if existente:
                # Atualiza o documento existente
                resultado = self.colecao.update_one(
                    {"_id": existente['_id']},
                    {"$set": dados}
                )
                return str(existente['_id']) if resultado.modified_count > 0 else None
            else:
                # Insere um novo documento
                dados['criado_em'] = datetime.now().isoformat()
                resultado = self.colecao.insert_one(dados)
                return str(resultado.inserted_id)

        except Exception as e:
            print(f"Erro ao salvar matching: {str(e)}")
            return None

    def buscar(self, usuario_id, vaga_id):
        """
        Busca um resultado de matching específico.

        Args:
            usuario_id (str): ID do usuário
            vaga_id (str): ID da vaga

        Returns:
            MatchingModelo: Resultado do matching ou None se não encontrado
        """
        try:
            documento = self.colecao.find_one({
                "usuario_id": usuario_id,
                "vaga_id": vaga_id
            })

            if documento:
                # Converte para MatchingModelo
                matching = MatchingModelo()
                matching.from_dict(documento)
                return matching

            return None

        except Exception as e:
            print(f"Erro ao buscar matching: {str(e)}")
            return None

    def buscar_por_usuario(self, usuario_id, limite=10, pagina=1):
        """
        Busca os resultados de matching para um usuário.

        Args:
            usuario_id (str): ID do usuário
            limite (int): Número máximo de resultados
            pagina (int): Número da página para paginação

        Returns:
            list: Lista de resultados de matching (objetos MatchingModelo)
        """
        try:
            skip = (pagina - 1) * limite
            documentos = list(self.colecao.find(
                {"usuario_id": usuario_id}
            ).sort("score_matching", -1).skip(skip).limit(limite))

            # Converte para lista de MatchingModelo
            matchings = []
            for doc in documentos:
                matching = MatchingModelo()
                matching.from_dict(doc)
                matchings.append(matching)

            return matchings

        except Exception as e:
            print(f"Erro ao buscar matchings por usuário: {str(e)}")
            return []

    def buscar_por_vaga(self, vaga_id, limite=50, score_minimo=0, pagina=1):
        """
        Busca os candidatos com maior score de matching para uma vaga.

        Args:
            vaga_id (str): ID da vaga
            limite (int): Número máximo de resultados
            score_minimo (float): Score mínimo para filtrar resultados
            pagina (int): Número da página para paginação

        Returns:
            list: Lista de resultados de matching (objetos MatchingModelo)
        """
        try:
            skip = (pagina - 1) * limite
            documentos = list(self.colecao.find({
                "vaga_id": vaga_id,
                "score_matching": {"$gte": score_minimo}
            }).sort("score_matching", -1).skip(skip).limit(limite))

            # Converte para lista de MatchingModelo
            matchings = []
            for doc in documentos:
                matching = MatchingModelo()
                matching.from_dict(doc)
                matchings.append(matching)

            return matchings

        except Exception as e:
            print(f"Erro ao buscar matchings por vaga: {str(e)}")
            return []

    def contar_por_vaga(self, vaga_id, score_minimo=0):
        """
        Conta quantos matchings existem para uma vaga.

        Args:
            vaga_id (str): ID da vaga
            score_minimo (float): Score mínimo para filtrar resultados

        Returns:
            int: Número de matchings
        """
        try:
            return self.colecao.count_documents({
                "vaga_id": vaga_id,
                "score_matching": {"$gte": score_minimo}
            })
        except Exception as e:
            print(f"Erro ao contar matchings por vaga: {str(e)}")
            return 0

    def contar_por_usuario(self, usuario_id):
        """
        Conta quantos matchings existem para um usuário.

        Args:
            usuario_id (str): ID do usuário

        Returns:
            int: Número de matchings
        """
        try:
            return self.colecao.count_documents({
                "usuario_id": usuario_id
            })
        except Exception as e:
            print(f"Erro ao contar matchings por usuário: {str(e)}")
            return 0

    def excluir(self, usuario_id, vaga_id):
        """
        Exclui um resultado de matching.

        Args:
            usuario_id (str): ID do usuário
            vaga_id (str): ID da vaga

        Returns:
            bool: True se excluído com sucesso, False caso contrário
        """
        try:
            resultado = self.colecao.delete_one({
                "usuario_id": usuario_id,
                "vaga_id": vaga_id
            })

            return resultado.deleted_count > 0

        except Exception as e:
            print(f"Erro ao excluir matching: {str(e)}")
            return False

    def excluir_por_vaga(self, vaga_id):
        """
        Exclui todos os matchings relacionados a uma vaga.

        Args:
            vaga_id (str): ID da vaga

        Returns:
            int: Número de documentos excluídos
        """
        try:
            resultado = self.colecao.delete_many({"vaga_id": vaga_id})
            return resultado.deleted_count
        except Exception as e:
            print(f"Erro ao excluir matchings por vaga: {str(e)}")
            return 0

    def excluir_por_usuario(self, usuario_id):
        """
        Exclui todos os matchings relacionados a um usuário.

        Args:
            usuario_id (str): ID do usuário

        Returns:
            int: Número de documentos excluídos
        """
        try:
            resultado = self.colecao.delete_many({"usuario_id": usuario_id})
            return resultado.deleted_count
        except Exception as e:
            print(f"Erro ao excluir matchings por usuário: {str(e)}")
            return 0
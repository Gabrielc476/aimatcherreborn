from datetime import datetime
from bson.objectid import ObjectId
from modelos.vaga_modelo import VagaModelo


class VagaRepositorio:
    """
    Repositório para operações básicas de vagas no MongoDB.
    Realiza operações de CRUD para vagas no sistema de matching de currículos.
    """

    def __init__(self, db):
        """
        Inicializa o repositório.

        Args:
            db: Conexão com o banco de dados MongoDB
        """
        self.colecao = db['vagas']

        # Cria índices para facilitar buscas
        self.colecao.create_index([("titulo", 1), ("empresa.nome", 1)])
        self.colecao.create_index("status")
        self.colecao.create_index("palavras_chave")
        self.colecao.create_index("data_publicacao")

    def inserir(self, vaga_dados):
        """
        Insere uma nova vaga no banco de dados.

        Args:
            vaga_dados: Pode ser um dicionário ou uma instância de VagaModelo

        Returns:
            str: ID da vaga inserida ou None se ocorrer um erro
        """
        # Verifica se é um objeto VagaModelo e converte para dicionário se necessário
        if isinstance(vaga_dados, VagaModelo):
            vaga_dict = vaga_dados.to_dict()
        else:
            # Cria um novo modelo e atualiza com os dados recebidos
            vaga_modelo = VagaModelo()
            vaga_modelo.from_dict(vaga_dados)
            vaga_dict = vaga_modelo.to_dict()

        # Adiciona timestamps
        agora = datetime.now().isoformat()
        vaga_dict['criado_em'] = agora
        vaga_dict['atualizado_em'] = agora
        vaga_dict['data_publicacao'] = vaga_dict.get('data_publicacao', agora)

        # Insere no banco
        resultado = self.colecao.insert_one(vaga_dict)

        # Retorna o ID
        return str(resultado.inserted_id)

    def buscar_por_id(self, vaga_id):
        """
        Busca uma vaga pelo ID.

        Args:
            vaga_id: ID da vaga

        Returns:
            VagaModelo: Modelo da vaga ou None se não encontrado
        """
        try:
            vaga_dict = self.colecao.find_one({"_id": ObjectId(vaga_id)})
            if vaga_dict:
                vaga_modelo = VagaModelo()
                vaga_modelo.from_dict(vaga_dict)
                return vaga_modelo
            return None
        except:
            return None

    def buscar_por_titulo_empresa(self, titulo, empresa_nome):
        """
        Busca vagas pelo título e nome da empresa.

        Args:
            titulo: Título da vaga
            empresa_nome: Nome da empresa

        Returns:
            list: Lista de objetos VagaModelo encontrados
        """
        vagas_dict = list(self.colecao.find({
            "titulo": titulo,
            "empresa.nome": empresa_nome
        }))

        # Converte para objetos VagaModelo
        vagas = []
        for vaga_dict in vagas_dict:
            vaga_modelo = VagaModelo()
            vaga_modelo.from_dict(vaga_dict)
            vagas.append(vaga_modelo)

        return vagas

    def buscar_vagas_ativas(self, limite=20, pagina=1):
        """
        Busca vagas com status ativo.

        Args:
            limite: Número máximo de resultados
            pagina: Número da página para paginação

        Returns:
            list: Lista de objetos VagaModelo ativos
        """
        skip = (pagina - 1) * limite
        vagas_dict = list(self.colecao.find(
            {"status": "ativa"}
        ).sort("data_publicacao", -1).skip(skip).limit(limite))

        # Converte para objetos VagaModelo
        vagas = []
        for vaga_dict in vagas_dict:
            vaga_modelo = VagaModelo()
            vaga_modelo.from_dict(vaga_dict)
            vagas.append(vaga_modelo)

        return vagas

    def buscar_por_palavras_chave(self, palavras_chave, limite=20, pagina=1):
        """
        Busca vagas que contenham determinadas palavras-chave.

        Args:
            palavras_chave: Lista de palavras-chave
            limite: Número máximo de resultados
            pagina: Número da página para paginação

        Returns:
            list: Lista de objetos VagaModelo encontrados
        """
        skip = (pagina - 1) * limite
        vagas_dict = list(self.colecao.find(
            {"palavras_chave": {"$in": palavras_chave}}
        ).sort("data_publicacao", -1).skip(skip).limit(limite))

        # Converte para objetos VagaModelo
        vagas = []
        for vaga_dict in vagas_dict:
            vaga_modelo = VagaModelo()
            vaga_modelo.from_dict(vaga_dict)
            vagas.append(vaga_modelo)

        return vagas

    def atualizar(self, vaga_id, dados_atualizacao):
        """
        Atualiza dados da vaga.

        Args:
            vaga_id: ID da vaga
            dados_atualizacao: Dicionário com os dados a atualizar ou objeto VagaModelo

        Returns:
            bool: True se atualizado com sucesso, False caso contrário
        """
        # Verifica se é um objeto VagaModelo e converte para dicionário se necessário
        if isinstance(dados_atualizacao, VagaModelo):
            dados_dict = dados_atualizacao.to_dict()
        else:
            dados_dict = dados_atualizacao

        # Adiciona timestamp de atualização
        dados_dict['atualizado_em'] = datetime.now().isoformat()

        resultado = self.colecao.update_one(
            {"_id": ObjectId(vaga_id)},
            {"$set": dados_dict}
        )
        return resultado.modified_count > 0

    def atualizar_estatisticas(self, vaga_id, campo, incremento=1):
        """
        Incrementa um campo de estatísticas da vaga.

        Args:
            vaga_id: ID da vaga
            campo: Campo a ser incrementado (visualizacoes, candidaturas, etc)
            incremento: Valor a incrementar (padrão: 1)

        Returns:
            bool: True se atualizado com sucesso, False caso contrário
        """
        campo_completo = f"estatisticas.{campo}"
        resultado = self.colecao.update_one(
            {"_id": ObjectId(vaga_id)},
            {"$inc": {campo_completo: incremento}}
        )
        return resultado.modified_count > 0

    def adicionar_candidatura(self, vaga_id, usuario_id):
        """
        Adiciona um usuário à lista de candidaturas da vaga.

        Args:
            vaga_id: ID da vaga
            usuario_id: ID do usuário candidato

        Returns:
            bool: True se adicionado com sucesso, False caso contrário
        """
        # Também incrementa o contador de candidaturas
        resultado = self.colecao.update_one(
            {"_id": ObjectId(vaga_id)},
            {
                "$addToSet": {"candidaturas": usuario_id},
                "$inc": {"estatisticas.candidaturas": 1},
                "$set": {"atualizado_em": datetime.now().isoformat()}
            }
        )
        return resultado.modified_count > 0

    def encerrar_vaga(self, vaga_id, motivo="preenchida"):
        """
        Encerra uma vaga (muda o status para encerrada).

        Args:
            vaga_id: ID da vaga
            motivo: Motivo do encerramento (preenchida, cancelada, etc)

        Returns:
            bool: True se encerrada com sucesso, False caso contrário
        """
        return self.atualizar(vaga_id, {
            "status": "encerrada",
            "motivo_encerramento": motivo
        })

    def excluir(self, vaga_id):
        """
        Exclui uma vaga do banco de dados.

        Args:
            vaga_id: ID da vaga

        Returns:
            bool: True se excluída com sucesso, False caso contrário
        """
        resultado = self.colecao.delete_one({"_id": ObjectId(vaga_id)})
        return resultado.deleted_count > 0
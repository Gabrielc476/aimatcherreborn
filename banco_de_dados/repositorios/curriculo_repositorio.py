# banco_de_dados/repositorios/curriculo_repositorio.py
from datetime import datetime
from bson.objectid import ObjectId


class CurriculoRepositorio:
    """
    Repositório para operações relacionadas a currículos no MongoDB.
    """

    def __init__(self, db):
        """
        Inicializa o repositório.

        Args:
            db: Conexão com o banco de dados MongoDB
        """
        self.db = db
        self.colecao_usuarios = db['usuarios']

    def salvar_curriculo_processado(self, usuario_id, dados_curriculo, texto_original=None):
        """
        Salva os dados processados do currículo no documento do usuário.

        Args:
            usuario_id (str): ID do usuário
            dados_curriculo (dict): Dados estruturados do currículo extraídos pela IA
            texto_original (str, optional): Texto original extraído do PDF

        Returns:
            bool: True se salvo com sucesso, False caso contrário
        """
        try:
            # Prepara os dados para atualização
            atualizacao = {
                'curriculo_processado': dados_curriculo,
                'curriculo_atualizado_em': datetime.now().isoformat()
            }

            # Adiciona o texto original se fornecido
            if texto_original:
                atualizacao['curriculo_texto_original'] = texto_original

            # Atualiza campos do modelo de usuário com dados do currículo
            self._atualizar_perfil_usuario(usuario_id, dados_curriculo)

            # Salva o currículo processado
            resultado = self.colecao_usuarios.update_one(
                {"_id": ObjectId(usuario_id)},
                {"$set": atualizacao}
            )

            return resultado.modified_count > 0

        except Exception as e:
            print(f"Erro ao salvar currículo processado: {str(e)}")
            return False

    def _atualizar_perfil_usuario(self, usuario_id, dados_curriculo):
        """
        Atualiza o perfil do usuário com dados relevantes do currículo.

        Args:
            usuario_id (str): ID do usuário
            dados_curriculo (dict): Dados estruturados do currículo

        Returns:
            bool: True se atualizado com sucesso, False caso contrário
        """
        try:
            # Mapeamento entre campos do currículo e campos do modelo de usuário
            atualizacoes = {}

            # Dados básicos
            if 'nome_completo' in dados_curriculo and dados_curriculo['nome_completo']:
                atualizacoes['nome_completo'] = dados_curriculo['nome_completo']

            if 'email' in dados_curriculo and dados_curriculo['email']:
                # Não sobrescreve o email se já existe um (manter o email de login)
                usuario = self.colecao_usuarios.find_one({"_id": ObjectId(usuario_id)})
                if not usuario.get('email') and dados_curriculo['email']:
                    atualizacoes['email'] = dados_curriculo['email']

            if 'telefone' in dados_curriculo and dados_curriculo['telefone']:
                atualizacoes['telefone'] = dados_curriculo['telefone']

            # Perfil profissional
            perfil = dados_curriculo.get('perfil', {})
            if perfil:
                atualizacoes['perfil'] = {
                    'titulo': perfil.get('titulo', ''),
                    'resumo_profissional': perfil.get('resumo_profissional', ''),
                    'anos_experiencia': perfil.get('anos_experiencia', 0),
                    'pretensao_salarial': perfil.get('pretensao_salarial', 0),
                    'disponibilidade': perfil.get('disponibilidade', '')
                }

            # Experiência profissional
            if 'experiencias' in dados_curriculo and dados_curriculo['experiencias']:
                atualizacoes['experiencias'] = dados_curriculo['experiencias']

            # Formação acadêmica
            if 'formacao' in dados_curriculo and dados_curriculo['formacao']:
                atualizacoes['formacao'] = dados_curriculo['formacao']

            # Habilidades técnicas
            if 'habilidades_tecnicas' in dados_curriculo and dados_curriculo['habilidades_tecnicas']:
                atualizacoes['habilidades_tecnicas'] = dados_curriculo['habilidades_tecnicas']

            # Certificações
            if 'certificacoes' in dados_curriculo and dados_curriculo['certificacoes']:
                atualizacoes['certificacoes'] = dados_curriculo['certificacoes']

            # Idiomas
            if 'idiomas' in dados_curriculo and dados_curriculo['idiomas']:
                atualizacoes['idiomas'] = dados_curriculo['idiomas']

            # Preferências
            if 'preferencias' in dados_curriculo and dados_curriculo['preferencias']:
                atualizacoes['preferencias'] = dados_curriculo['preferencias']

            # Links
            if 'links' in dados_curriculo and dados_curriculo['links']:
                atualizacoes['links'] = dados_curriculo['links']

            # Palavras-chave para matching
            if 'palavras_chave' in dados_curriculo and dados_curriculo['palavras_chave']:
                atualizacoes['palavras_chave'] = dados_curriculo['palavras_chave']

            # Só atualiza se houver dados a serem atualizados
            if atualizacoes:
                resultado = self.colecao_usuarios.update_one(
                    {"_id": ObjectId(usuario_id)},
                    {"$set": atualizacoes}
                )
                return resultado.modified_count > 0

            return True

        except Exception as e:
            print(f"Erro ao atualizar perfil do usuário com dados do currículo: {str(e)}")
            return False

    def obter_curriculo_processado(self, usuario_id):
        """
        Obtém os dados processados do currículo de um usuário.

        Args:
            usuario_id (str): ID do usuário

        Returns:
            dict: Dados do currículo processado ou None se não encontrado
        """
        try:
            usuario = self.colecao_usuarios.find_one(
                {"_id": ObjectId(usuario_id)},
                {"curriculo_processado": 1}
            )

            if usuario and 'curriculo_processado' in usuario:
                return usuario['curriculo_processado']

            return None

        except Exception as e:
            print(f"Erro ao obter currículo processado: {str(e)}")
            return None

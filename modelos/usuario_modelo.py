class UsuarioModelo:
    """
    Modelo de dados estruturado para usuários no sistema de matching de currículos.
    Projetado para facilitar preenchimento via IA generativa.
    """

    def __init__(self):
        """
        Inicializa o modelo com a estrutura de dados padrão.
        """
        self.modelo = {
            # Dados básicos do usuário
            "nome_completo": "",
            "email": "",
            "senha_hash": "",
            "telefone": "",
            "data_nascimento": "",
            "data_criacao": "",
            "ultimo_acesso": "",
            "status": "ativo",  # ativo, inativo, bloqueado

            # Perfil profissional
            "perfil": {
                "titulo": "",  # Ex: "Desenvolvedor Full Stack Senior"
                "resumo_profissional": "",  # Resumo curto da carreira
                "anos_experiencia": 0,  # Número total de anos de experiência
                "salario_atual": 0,
                "pretensao_salarial": 0,
                "disponibilidade": "",  # Imediata, 30 dias, etc.
            },

            # Experiência profissional
            "experiencias": [
                {
                    "empresa": "",
                    "cargo": "",
                    "descricao": "",
                    "data_inicio": "",
                    "data_fim": "",
                    "atual": False,
                    "tecnologias_utilizadas": [],
                    "realizacoes": []
                }
            ],

            # Formação acadêmica
            "formacao": [
                {
                    "instituicao": "",
                    "curso": "",
                    "grau": "",  # Superior, Pós-graduação, Mestrado, Doutorado
                    "area": "",
                    "data_inicio": "",
                    "data_fim": "",
                    "concluido": True
                }
            ],

            # Habilidades técnicas
            "habilidades_tecnicas": [
                {
                    "nome": "",  # Ex: "Python"
                    "nivel": "",  # Básico, Intermediário, Avançado, Especialista
                    "anos_experiencia": 0,
                    "projetos_relevantes": []
                }
            ],

            # Certificações
            "certificacoes": [
                {
                    "nome": "",
                    "emissor": "",
                    "data_obtencao": "",
                    "data_validade": "",
                    "codigo_validacao": ""
                }
            ],

            # Idiomas
            "idiomas": [
                {
                    "nome": "",  # Ex: "Inglês"
                    "nivel_leitura": "",  # Básico, Intermediário, Avançado, Fluente
                    "nivel_escrita": "",
                    "nivel_conversacao": ""
                }
            ],

            # Preferências de trabalho
            "preferencias": {
                "modalidades": [],  # Remoto, Híbrido, Presencial
                "cidades_interesse": [],
                "cargos_interesse": [],
                "areas_interesse": [],
                "tipo_contrato": [],  # CLT, PJ, Freelancer
                "tamanho_empresa": [],  # Startup, Pequena, Média, Grande
                "disponibilidade_viagens": "",  # Sim, Não, Eventualmente
                "disponibilidade_mudanca": False
            },

            # Palavras-chave para matching
            "palavras_chave": [],  # Lista de termos para matching com vagas

            # Links externos e perfis
            "links": {
                "linkedin": "",
                "github": "",
                "portfolio": "",
                "outros": []
            },

            # Histórico de interações com vagas
            "interacoes_vagas": {
                "salvas": [],  # IDs das vagas salvas
                "aplicadas": [],  # IDs das vagas aplicadas
                "rejeitadas": [],  # IDs das vagas rejeitadas
                "entrevistas": []  # IDs das vagas com entrevistas
            },

            # Configurações do sistema
            "configuracoes": {
                "notificacoes_email": True,
                "visibilidade_perfil": "publico",  # publico, privado, recrutadores
                "matching_automatico": True,
                "ultima_atualizacao_perfil": ""
            }
        }

    def to_dict(self):
        """Retorna o modelo como dicionário para inserção no MongoDB"""
        return self.modelo

    def from_dict(self, dados):
        """
        Atualiza o modelo a partir de um dicionário

        Args:
            dados (dict): Dicionário com dados para atualizar o modelo
        """
        # Atualiza apenas os campos que existem no modelo
        for chave, valor in dados.items():
            if chave in self.modelo:
                self.modelo[chave] = valor

        return self
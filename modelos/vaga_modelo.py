class VagaModelo:
    """
    Modelo de dados estruturado para vagas no sistema de matching de currículos.
    Projetado para facilitar a criação e busca de vagas, com campos otimizados para matching.
    """

    def __init__(self):
        """
        Inicializa o modelo com a estrutura de dados padrão para vagas.
        """
        self.modelo = {
            # Dados básicos da vaga
            "titulo": "",  # Ex: "Desenvolvedor Full Stack Senior"
            "descricao": "",  # Descrição detalhada da vaga
            "resumo": "",  # Resumo curto da vaga
            "data_publicacao": "",  # Data em que a vaga foi publicada
            "data_expiracao": "",  # Data limite para inscrições
            "status": "ativa",  # ativa, pausada, encerrada, preenchida

            # Informações da empresa
            "empresa": {
                "nome": "",  # Nome da empresa
                "descricao": "",  # Descrição breve da empresa
                "tamanho": "",  # Startup, Pequena, Média, Grande
                "setor": "",  # Setor de atuação
                "site": "",  # Site da empresa
                "linkedin": "",  # Perfil LinkedIn da empresa
                "logo_url": ""  # URL para o logo da empresa
            },

            # Detalhes da vaga
            "localizacao": {
                "pais": "",
                "estado": "",
                "cidade": "",
                "bairro": "",
                "endereco": "",
                "coordenadas": {
                    "latitude": 0.0,
                    "longitude": 0.0
                }
            },

            # Modalidade e tipo de contrato
            "modalidade": "",  # Remoto, Híbrido, Presencial
            "tipo_contrato": "",  # CLT, PJ, Freelancer, Estágio
            "jornada": "",  # Integral, Meio período, Flexível
            "nivel": "",  # Júnior, Pleno, Sênior, Especialista, Diretor

            # Remuneração e benefícios
            "faixa_salarial": {
                "minimo": 0,  # Valor mínimo da faixa salarial
                "maximo": 0,  # Valor máximo da faixa salarial
                "moeda": "BRL"  # Código da moeda
            },
            "beneficios": [],  # Lista de benefícios oferecidos

            # Requisitos da vaga
            "requisitos": {
                "formacao": {
                    "nivel": "",  # Superior, Pós-graduação, Mestrado, Doutorado
                    "area": "",  # Área de formação
                    "obrigatorio": True  # Se a formação é obrigatória
                },
                "experiencia": {
                    "tempo_minimo": 0,  # Tempo mínimo de experiência em anos
                    "nivel": "",  # Júnior, Pleno, Sênior
                    "areas": []  # Áreas em que precisa ter experiência
                },
                "habilidades_tecnicas": [
                    {
                        "nome": "",  # Nome da habilidade
                        "nivel": "",  # Básico, Intermediário, Avançado
                        "obrigatorio": True
                    }
                ],
                "habilidades_comportamentais": [],
                "idiomas": [
                    {
                        "nome": "",  # Ex: "Inglês"
                        "nivel": "",  # Básico, Intermediário, Avançado, Fluente
                        "obrigatorio": True
                    }
                ],
                "certificacoes": [
                    {
                        "nome": "",  # Nome da certificação
                        "obrigatorio": False
                    }
                ],
                "disponibilidade": {
                    "viagens": False,  # Disponibilidade para viagens
                    "mudanca": False,  # Disponibilidade para mudança
                    "inicio_imediato": False
                }
            },

            # Processo seletivo
            "processo_seletivo": {
                "etapas": [],  # Lista de etapas do processo
                "responsavel": "",  # Responsável pelo processo
                "email_contato": ""  # Email para contato
            },

            # Palavras-chave para matching
            "palavras_chave": [],  # Lista de termos para matching com currículos

            # Estatísticas da vaga
            "estatisticas": {
                "visualizacoes": 0,
                "candidaturas": 0,
                "candidatos_avaliados": 0
            },

            # Candidaturas relacionadas
            "candidaturas": [],  # Lista de IDs dos usuários candidatos

            # Recrutador responsável
            "recrutador_id": "",  # ID do recrutador responsável pela vaga

            # Metadados
            "criado_por": "",  # ID do usuário que criou a vaga
            "criado_em": "",  # Data de criação da vaga
            "atualizado_em": "",  # Data da última atualização
            "atualizado_por": ""  # ID do usuário que atualizou
        }

    def to_dict(self):
        """Retorna o modelo como dicionário para inserção no MongoDB"""
        return self.modelo

    def from_dict(self, dados):
        """
        Atualiza o modelo a partir de um dicionário
        """
        # Preservar _id sempre que existir
        if '_id' in dados:
            self.modelo['_id'] = dados['_id']

        # Atualiza os campos que existem no modelo
        for chave, valor in dados.items():
            if chave in self.modelo:
                self.modelo[chave] = valor
        return self
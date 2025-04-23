class MatchingModelo:
    """
    Modelo para armazenar e estruturar os resultados de matching entre um currículo e uma vaga.
    Otimizado para análise pelo Claude 3.7 com extended thinking.
    """

    def __init__(self):
        """
        Inicializa o modelo com a estrutura de dados padrão para resultados de matching.
        """
        self.modelo = {
            # Identificadores e metadados
            "usuario_id": "",  # ID do usuário/candidato
            "vaga_id": "",  # ID da vaga
            "data_matching": "",  # Data em que o matching foi realizado

            # Resumos para contextualização rápida
            "resumo_candidato": "",  # Breve resumo do perfil do candidato
            "resumo_vaga": "",  # Breve resumo da vaga

            # Score geral de matching
            "score_matching": 0.0,  # Pontuação de 0 a 100

            # Análise detalhada por categorias
            "categorias": {
                "habilidades_tecnicas": {
                    "score": 0.0,  # Score de 0 a 100
                    "peso": 0.3,  # Peso na pontuação final
                    "correspondentes": [],  # Habilidades que o candidato possui
                    "faltantes": [],  # Habilidades que o candidato precisa desenvolver
                    "excedentes": [],  # Habilidades adicionais do candidato não requisitadas
                    "analise_qualitativa": "",  # Análise contextual pelo Claude
                    "nivel_relevancia": ""  # Quão crítica é esta categoria para a vaga
                },

                "experiencia": {
                    "score": 0.0,
                    "peso": 0.25,
                    "tempo_atende": False,  # Se atende ao tempo mínimo
                    "areas_correspondentes": [],  # Áreas de experiência que correspondem
                    "areas_faltantes": [],  # Áreas de experiência que faltam
                    "relevancia_experiencia": "",  # Avaliação qualitativa da relevância
                    "analise_qualitativa": "",
                    "nivel_relevancia": ""
                },

                "formacao": {
                    "score": 0.0,
                    "peso": 0.15,
                    "nivel_atende": False,  # Se o nível de formação é suficiente
                    "area_atende": False,  # Se a área de formação é adequada
                    "formacao_alternativa_relevante": False,  # Se possui formação alternativa relevante
                    "analise_qualitativa": "",
                    "nivel_relevancia": ""
                },

                "idiomas": {
                    "score": 0.0,
                    "peso": 0.1,
                    "correspondentes": [],  # Idiomas que correspondem
                    "faltantes": [],  # Idiomas que faltam
                    "analise_qualitativa": "",
                    "nivel_relevancia": ""
                },

                "localizacao_disponibilidade": {
                    "score": 0.0,
                    "peso": 0.1,
                    "localizacao_compativel": False,
                    "disponibilidade_compativel": False,
                    "analise_qualitativa": "",
                    "nivel_relevancia": ""
                },

                "soft_skills_cultura": {
                    "score": 0.0,
                    "peso": 0.1,
                    "correspondentes": [],
                    "faltantes": [],
                    "analise_qualitativa": "",
                    "nivel_relevancia": ""
                }
            },

            # Análise dos fatores de diferenciação
            "diferenciais": {
                "pontos_fortes": [],  # Aspectos que destacam o candidato positivamente
                "pontos_fracos": [],  # Aspectos que prejudicam a candidatura
                "vantagens_competitivas": []  # Características que diferenciam o candidato
            },

            # Recomendações personalizadas
            "recomendacoes": {
                "gerais": "",  # Recomendação geral
                "habilidades_tecnicas": "",  # Recomendações específicas de habilidades
                "experiencia": "",  # Recomendações de experiência
                "formacao": "",  # Recomendações de formação
                "desenvolvimento": "",  # Plano de desenvolvimento sugerido
                "abordagem_entrevista": "",  # Como se apresentar em entrevista para esta vaga
                "prioridade_acao": []  # Lista ordenada de ações prioritárias
            },

            # Análise de compatibilidade cultural e organizacional
            "compatibilidade_cultural": {
                "score": 0.0,
                "fatores_positivos": [],
                "fatores_negativos": [],
                "analise": ""
            },

            # Probabilidade de sucesso na candidatura
            "probabilidade_sucesso": {
                "score": 0.0,
                "justificativa": "",
                "fatores_criticos": []
            },

            # Meta-análise do matching (análise da análise)
            "meta_analise": {
                "confiabilidade": 0.0,  # Quão confiável é esta avaliação
                "fatores_incertos": [],  # Fatores com informações insuficientes
                "potencial_desenvolvimento": 0.0,  # Potencial do candidato se desenvolver
                "observacoes": ""  # Observações adicionais
            }
        }

    def to_dict(self):
        """Retorna o modelo como dicionário para inserção no MongoDB."""
        return self.modelo

    def from_dict(self, dados):
        """
        Atualiza o modelo a partir de um dicionário.

        Args:
            dados (dict): Dicionário com dados para atualizar o modelo.
        """
        # Atualiza apenas os campos que existem no modelo
        for chave, valor in dados.items():
            if chave in self.modelo:
                self.modelo[chave] = valor

        return self
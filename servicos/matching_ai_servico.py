from datetime import datetime
import json
import os
from anthropic import Anthropic
from modelos.matching_modelo import MatchingModelo


class MatchingAIServico:
    """
    Serviço responsável por utilizar o Claude 3.7 com extended thinking para realizar
    análises avançadas de compatibilidade entre currículos e vagas.
    """

    def __init__(self, usuario_repositorio, vaga_repositorio, matching_repositorio=None, api_key=None):
        """
        Inicializa o serviço de matching com IA.

        Args:
            usuario_repositorio: Repositório para acessar dados de usuários/currículos
            vaga_repositorio: Repositório para acessar dados de vagas
            matching_repositorio: Repositório opcional para salvar resultados de matching
            api_key (str, optional): Chave de API do Anthropic Claude
        """
        self.usuario_repositorio = usuario_repositorio
        self.vaga_repositorio = vaga_repositorio
        self.matching_repositorio = matching_repositorio

        # Obtém a chave da API (do parâmetro ou variável de ambiente)
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')

        if not self.api_key:
            raise ValueError("Chave da API do Anthropic não fornecida ou definida no ambiente")

        # Inicializa o cliente do Anthropic
        self.cliente = Anthropic(api_key=self.api_key)

        # Define o modelo do Claude a ser usado
        self.modelo = "claude-3-7-sonnet-20250219"

        # Define os pesos padrão para as categorias (podem ser ajustados por vaga)
        self.pesos_padrao = {
            "habilidades_tecnicas": 0.3,
            "experiencia": 0.25,
            "formacao": 0.15,
            "idiomas": 0.1,
            "localizacao_disponibilidade": 0.1,
            "soft_skills_cultura": 0.1
        }

    def analisar_compatibilidade(self, usuario_id, vaga_id):
        """
        Realiza a análise de compatibilidade entre um usuário e uma vaga usando Claude.

        Args:
            usuario_id (str): ID do usuário
            vaga_id (str): ID da vaga

        Returns:
            MatchingModelo: Resultado da análise ou None se falhar
        """
        try:
            # Busca os dados do usuário e da vaga
            usuario = self.usuario_repositorio.buscar_por_id(usuario_id)
            vaga = self.vaga_repositorio.buscar_por_id(vaga_id)

            if not usuario or not vaga:
                return None

            # Inicializa o modelo de matching
            matching = MatchingModelo()
            matching.modelo["usuario_id"] = usuario_id
            matching.modelo["vaga_id"] = vaga_id
            matching.modelo["data_matching"] = datetime.now().isoformat()

            # Prepara os dados para enviar ao Claude
            prompt = self._criar_prompt_analise(usuario, vaga)

            # Chama a API do Claude com extended thinking
            resposta = self.cliente.messages.create(
                model=self.modelo,
                max_tokens=4000,
                temperature=0.2,
                system=self._criar_system_prompt(),
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            # Extrai e processa a resposta
            resultado = self._processar_resposta_claude(resposta.content[0].text)

            # Atualiza o modelo de matching com o resultado
            self._atualizar_modelo_matching(matching, resultado)

            # Salva o resultado no repositório, se disponível
            if self.matching_repositorio:
                self.matching_repositorio.salvar(matching)

            return matching

        except Exception as e:
            print(f"Erro ao analisar compatibilidade: {str(e)}")
            return None

    def _criar_system_prompt(self):
        """
        Cria o prompt de sistema para o Claude.

        Returns:
            str: Prompt de sistema
        """
        return """
        Você é um analista especializado em matching de currículos e vagas com amplo conhecimento em 
        recrutamento, desenvolvimento de carreira e mercado de trabalho. Sua tarefa é analisar 
        profundamente a compatibilidade entre um currículo e uma vaga, fornecendo insights detalhados.

        Sua análise deve ser:
        1. Profunda - utilize o modo de pensamento estendido para examinar todos os aspectos relevantes
        2. Contextual - considere o mercado, a indústria e tendências relevantes
        3. Balanceada - avalie tanto pontos fortes quanto áreas a desenvolver
        4. Acionável - forneça recomendações práticas e específicas
        5. Quantitativa E qualitativa - atribua scores, mas também explique o raciocínio

        Sua resposta deve estar estruturada em formato JSON, seguindo exatamente o esquema fornecido,
        sem comentários adicionais. A análise deve ser completa, imparcial e focada em ajudar o 
        candidato a entender e melhorar suas chances.
        """

    def _criar_prompt_analise(self, usuario, vaga_dict):
        """
        Cria o prompt para o Claude analisar a compatibilidade.

        Args:
            usuario (dict): Dados do usuário/currículo
            vaga_dict (dict): Dados da vaga

        Returns:
            str: Prompt formatado
        """
        # Extrai informações relevantes do usuário para o prompt
        experiencias = usuario.get('experiencias', [])
        formacao = usuario.get('formacao', [])
        habilidades = usuario.get('habilidades_tecnicas', [])
        idiomas = usuario.get('idiomas', [])

        # Obtém o modelo da vaga como dicionário
        if hasattr(vaga_dict, 'to_dict'):
            vaga = vaga_dict.to_dict()
        else:
            vaga = vaga_dict

        # Formata o prompt
        prompt = f"""
        # Análise de Compatibilidade entre Currículo e Vaga

        Realize uma análise detalhada da compatibilidade entre este currículo e esta vaga. 
        Use extended thinking para examinar todos os aspectos da compatibilidade, incluindo 
        habilidades técnicas, experiência, formação, idiomas, localização e fit cultural.

        ## CURRÍCULO DO CANDIDATO:
        ```json
        {json.dumps({
            "perfil": usuario.get('perfil', {}),
            "experiencias": experiencias,
            "formacao": formacao,
            "habilidades_tecnicas": habilidades,
            "idiomas": idiomas,
            "preferencias": usuario.get('preferencias', {}),
            "palavras_chave": usuario.get('palavras_chave', [])
        }, indent=2)}
        ```

        ## DESCRIÇÃO DA VAGA:
        ```json
        {json.dumps({
            "titulo": vaga.get('titulo', ''),
            "descricao": vaga.get('descricao', ''),
            "empresa": vaga.get('empresa', {}),
            "localizacao": vaga.get('localizacao', {}),
            "modalidade": vaga.get('modalidade', ''),
            "tipo_contrato": vaga.get('tipo_contrato', ''),
            "nivel": vaga.get('nivel', ''),
            "requisitos": vaga.get('requisitos', {}),
            "palavras_chave": vaga.get('palavras_chave', [])
        }, indent=2)}
        ```

        ## ANÁLISE SOLICITADA:

        Forneça uma análise completa conforme o formato JSON abaixo. Todos os campos devem ser preenchidos:

        ```json
        {
        "categorias": {
        "habilidades_tecnicas": {
        "score": 0.0,
                    "correspondentes": [],
                    "faltantes": [],
                    "excedentes": [],
                    "analise_qualitativa": "",
                    "nivel_relevancia": ""
                },
                "experiencia": {
        "score": 0.0,
                    "tempo_atende": false,
                    "areas_correspondentes": [],
                    "areas_faltantes": [],
                    "relevancia_experiencia": "",
                    "analise_qualitativa": "",
                    "nivel_relevancia": ""
                },
                "formacao": {
        "score": 0.0,
                    "nivel_atende": false,
                    "area_atende": false,
                    "formacao_alternativa_relevante": false,
                    "analise_qualitativa": "",
                    "nivel_relevancia": ""
                },
                "idiomas": {
        "score": 0.0,
                    "correspondentes": [],
                    "faltantes": [],
                    "analise_qualitativa": "",
                    "nivel_relevancia": ""
                },
                "localizacao_disponibilidade": {
        "score": 0.0,
                    "localizacao_compativel": false,
                    "disponibilidade_compativel": false,
                    "analise_qualitativa": "",
                    "nivel_relevancia": ""
                },
                "soft_skills_cultura": {
        "score": 0.0,
                    "correspondentes": [],
                    "faltantes": [],
                    "analise_qualitativa": "",
                    "nivel_relevancia": ""
                }
            },
            "score_matching": 0.0,
            "resumo_candidato": "",
            "resumo_vaga": "",
            "diferenciais": {
        "pontos_fortes": [],
                "pontos_fracos": [],
                "vantagens_competitivas": []
            },
            "recomendacoes": {
        "gerais": "",
                "habilidades_tecnicas": "",
                "experiencia": "",
                "formacao": "",
                "desenvolvimento": "",
                "abordagem_entrevista": "",
                "prioridade_acao": []
            },
            "compatibilidade_cultural": {
        "score": 0.0,
                "fatores_positivos": [],
                "fatores_negativos": [],
                "analise": ""
            },
            "probabilidade_sucesso": {
        "score": 0.0,
                "justificativa": "",
                "fatores_criticos": []
            },
            "meta_analise": {
        "confiabilidade": 0.0,
                "fatores_incertos": [],
                "potencial_desenvolvimento": 0.0,
                "observacoes": ""
            }
        }
        ```

        Responda APENAS com o JSON contendo a análise, sem texto adicional antes ou depois.
        """

        return prompt

    def _processar_resposta_claude(self, resposta_texto):
        """
        Processa e extrai a estrutura JSON da resposta do Claude.
        """
        try:
            # Sanitiza caracteres % para evitar problemas de formatação
            resposta_texto = resposta_texto.replace('%', '%%')

            # Extrai o JSON da resposta
            import re
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', resposta_texto)

            if json_match:
                json_str = json_match.group(1)
                # Sanitiza novamente o conteúdo JSON
                json_str = json_str.replace('%', '%%')
                return json.loads(json_str)

            # Se não encontrou entre ``` ```, tenta extrair todo o texto como JSON
            return json.loads(resposta_texto)

        except Exception as e:
            print(f"Erro ao processar resposta do Claude: {str(e)}")
            return None

    def _atualizar_modelo_matching(self, matching, resultado):
        """
        Atualiza o modelo de matching com os resultados da análise do Claude.

        Args:
            matching (MatchingModelo): Modelo a ser atualizado
            resultado (dict): Resultados da análise do Claude

        Returns:
            None
        """
        if not resultado:
            return

        # Atualiza as categorias
        if "categorias" in resultado:
            matching.modelo["categorias"] = resultado["categorias"]

        # Atualiza score geral
        if "score_matching" in resultado:
            matching.modelo["score_matching"] = resultado["score_matching"]

        # Atualiza resumos
        if "resumo_candidato" in resultado:
            matching.modelo["resumo_candidato"] = resultado["resumo_candidato"]

        if "resumo_vaga" in resultado:
            matching.modelo["resumo_vaga"] = resultado["resumo_vaga"]

        # Atualiza diferenciais
        if "diferenciais" in resultado:
            matching.modelo["diferenciais"] = resultado["diferenciais"]

        # Atualiza recomendações
        if "recomendacoes" in resultado:
            matching.modelo["recomendacoes"] = resultado["recomendacoes"]

        # Atualiza compatibilidade cultural
        if "compatibilidade_cultural" in resultado:
            matching.modelo["compatibilidade_cultural"] = resultado["compatibilidade_cultural"]

        # Atualiza probabilidade de sucesso
        if "probabilidade_sucesso" in resultado:
            matching.modelo["probabilidade_sucesso"] = resultado["probabilidade_sucesso"]

        # Atualiza meta-análise
        if "meta_analise" in resultado:
            matching.modelo["meta_analise"] = resultado["meta_analise"]

    def buscar_matchings_por_usuario(self, usuario_id, limite=10):
        """
        Busca os resultados de matching para um usuário específico.

        Args:
            usuario_id (str): ID do usuário
            limite (int): Número máximo de resultados

        Returns:
            list: Lista de resultados de matching ou lista vazia se falhar
        """
        if not self.matching_repositorio:
            return []

        return self.matching_repositorio.buscar_por_usuario(usuario_id, limite)

    def buscar_matching(self, usuario_id, vaga_id):
        """
        Busca um resultado de matching específico.

        Args:
            usuario_id (str): ID do usuário
            vaga_id (str): ID da vaga

        Returns:
            MatchingModelo: Resultado do matching ou None se não encontrado
        """
        if not self.matching_repositorio:
            return None

        return self.matching_repositorio.buscar(usuario_id, vaga_id)
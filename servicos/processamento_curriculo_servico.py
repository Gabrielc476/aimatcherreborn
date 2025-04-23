# servicos/processamento_curriculo_servico.py
import os
import json
import re
import requests
from datetime import datetime
from dotenv import load_dotenv


class ProcessamentoCurriculoServico:
    """
    Serviço responsável pelo processamento de currículos utilizando
    a API do Claude 3.7 com modo de pensamento estendido.
    """

    def __init__(self):
        """Inicializa o serviço de processamento de currículos."""
        # Carrega variáveis de ambiente
        load_dotenv()

        # Obtém a chave da API do Anthropic do ambiente
        self.api_key = os.getenv('ANTHROPIC_API_KEY')

        if not self.api_key:
            raise ValueError("A chave da API do Anthropic não está definida no arquivo .env")

        # URL base da API do Anthropic
        self.api_url = "https://api.anthropic.com/v1/messages"

        # Modelo do Claude a ser usado
        self.modelo = "claude-3-7-sonnet-20250219"

    def _criar_prompt_extracao(self, texto_curriculo):
        """
        Cria o prompt para o Claude extrair informações do currículo.

        Args:
            texto_curriculo (str): Texto extraído do currículo em PDF

        Returns:
            str: Prompt formatado para enviar ao Claude
        """
        prompt = f"""
        Você é um assistente especializado em análise de currículos. Analise o seguinte currículo e extraia as informações solicitadas no formato JSON especificado. Use o modo de pensamento estendido para analisar cuidadosamente o texto e extrair dados precisos.

        CURRÍCULO:
        ```
        {texto_curriculo}
        ```

        INSTRUÇÕES:
        Extraia as informações deste currículo e organize-as no seguinte formato JSON:

        {{
            "nome_completo": "", // Nome completo da pessoa
            "email": "", // Email de contato
            "telefone": "", // Número de telefone
            "data_nascimento": "", // Data de nascimento (formato YYYY-MM-DD)

            "perfil": {{
                "titulo": "", // Ex: "Desenvolvedor Full Stack Senior"
                "resumo_profissional": "", // Resumo curto da carreira
                "anos_experiencia": 0, // Número total de anos de experiência (número)
                "pretensao_salarial": 0, // Pretensão salarial se mencionada (número)
                "disponibilidade": "" // Imediata, 30 dias, etc.
            }},

            "experiencias": [
                {{
                    "empresa": "", // Nome da empresa
                    "cargo": "", // Cargo ocupado
                    "descricao": "", // Descrição das atividades
                    "data_inicio": "", // Data de início (formato YYYY-MM ou YYYY-MM-DD)
                    "data_fim": "", // Data de término (formato YYYY-MM ou YYYY-MM-DD)
                    "atual": false, // true se for o emprego atual
                    "tecnologias_utilizadas": [], // Lista de tecnologias mencionadas
                    "realizacoes": [] // Lista de realizações importantes
                }}
            ],

            "formacao": [
                {{
                    "instituicao": "", // Nome da instituição
                    "curso": "", // Nome do curso
                    "grau": "", // Superior, Pós-graduação, Mestrado, Doutorado
                    "area": "", // Área de estudo
                    "data_inicio": "", // Data de início (formato YYYY-MM ou YYYY)
                    "data_fim": "", // Data de conclusão (formato YYYY-MM ou YYYY)
                    "concluido": true // true se concluído, false se em andamento
                }}
            ],

            "habilidades_tecnicas": [
                {{
                    "nome": "", // Ex: "Python"
                    "nivel": "", // Básico, Intermediário, Avançado, Especialista
                    "anos_experiencia": 0, // Anos de experiência com essa habilidade (número)
                    "projetos_relevantes": [] // Lista de projetos relevantes mencionados
                }}
            ],

            "certificacoes": [
                {{
                    "nome": "", // Nome da certificação
                    "emissor": "", // Instituição emissora
                    "data_obtencao": "", // Data de obtenção (formato YYYY-MM ou YYYY)
                    "data_validade": "", // Data de validade se mencionada (formato YYYY-MM ou YYYY)
                    "codigo_validacao": "" // Código de validação se mencionado
                }}
            ],

            "idiomas": [
                {{
                    "nome": "", // Ex: "Inglês"
                    "nivel_leitura": "", // Básico, Intermediário, Avançado, Fluente
                    "nivel_escrita": "", // Básico, Intermediário, Avançado, Fluente
                    "nivel_conversacao": "" // Básico, Intermediário, Avançado, Fluente
                }}
            ],

            "preferencias": {{
                "modalidades": [], // Remoto, Híbrido, Presencial
                "cidades_interesse": [], // Lista de cidades de interesse
                "cargos_interesse": [], // Lista de cargos de interesse
                "areas_interesse": [], // Lista de áreas de interesse
                "tipo_contrato": [], // CLT, PJ, Freelancer
                "tamanho_empresa": [], // Startup, Pequena, Média, Grande
                "disponibilidade_viagens": "", // Sim, Não, Eventualmente
                "disponibilidade_mudanca": false // true se disponível para mudança
            }},

            "palavras_chave": [], // Lista de termos-chave relevantes para matching com vagas

            "links": {{
                "linkedin": "", // URL do LinkedIn
                "github": "", // URL do GitHub
                "portfolio": "", // URL do portfólio
                "outros": [] // Lista de outros links relevantes
            }}
        }}

        IMPORTANTE: Responda APENAS com o JSON, sem texto adicional antes ou depois. Não inclua comentários (texto após //) no JSON final.
        """
        return prompt

    def _extrair_json_da_resposta(self, texto):
        """
        Extrai o objeto JSON de uma resposta de texto, lidando com possíveis
        textos adicionais antes ou depois.

        Args:
            texto (str): Texto que contém um objeto JSON

        Returns:
            dict: Objeto JSON extraído ou None se não encontrado
        """
        try:
            # Tenta primeira abordagem: usar expressão regular para encontrar um objeto JSON
            json_pattern = r'(\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}))*\})'
            matches = re.findall(json_pattern, texto)

            if matches:
                # Pega o match mais longo, que provavelmente é o JSON completo
                json_match = max(matches, key=len)
                return json.loads(json_match)

            # Segunda abordagem: buscar o primeiro { e o último }
            json_start = texto.find('{')
            json_end = texto.rfind('}') + 1

            if json_start != -1 and json_end > json_start:
                json_str = texto[json_start:json_end]
                return json.loads(json_str)

            return None
        except Exception as e:
            print(f"Erro ao extrair JSON: {str(e)}")
            return None

    def processar_curriculo(self, texto_curriculo):
        """
        Processa o texto do currículo usando a API do Claude 3.7.

        Args:
            texto_curriculo (str): Texto extraído do currículo em PDF

        Returns:
            tuple: (sucesso, dados, erro)
                - sucesso (bool): True se processado com sucesso, False caso contrário
                - dados (dict): Dados estruturados do currículo ou None se falhou
                - erro (str): Mensagem de erro ou None se sucesso
        """
        if not texto_curriculo:
            return False, None, "Texto do currículo vazio ou não fornecido"

        try:
            # Cria o prompt para o Claude
            prompt = self._criar_prompt_extracao(texto_curriculo)

            # Configura os headers para a requisição
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }

            # Configura o corpo da requisição
            data = {
                "model": self.modelo,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 4000,
                "temperature": 0.2,
                "system": "Você é um assistente especializado em extrair dados precisos de currículos. Responda apenas com o JSON solicitado, sem texto adicional antes ou depois."
            }

            # Faz a requisição para a API do Anthropic
            response = requests.post(self.api_url, headers=headers, json=data)

            # Verifica se a requisição foi bem-sucedida
            if response.status_code != 200:
                return False, None, f"Erro na API do Claude: {response.status_code} - {response.text}"

            # Processa a resposta
            resposta_json = response.json()
            conteudo = resposta_json["content"][0]["text"]

            # Extrai o JSON da resposta
            dados_curriculo = self._extrair_json_da_resposta(conteudo)

            if not dados_curriculo:
                # Salva a resposta para debug
                with open('debug_resposta_claude.txt', 'w', encoding='utf-8') as f:
                    f.write(conteudo)
                return False, None, "Não foi possível extrair JSON válido da resposta do Claude"

            # Adiciona metadados
            dados_curriculo["_metadata"] = {
                "data_processamento": datetime.now().isoformat(),
                "modelo_ia": self.modelo,
                "versao_servico": "1.0.0"
            }

            return True, dados_curriculo, None

        except Exception as e:
            return False, None, f"Erro ao processar currículo: {str(e)}"
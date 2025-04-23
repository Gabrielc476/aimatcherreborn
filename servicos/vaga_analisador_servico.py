import os
import json
import re
from datetime import datetime
from anthropic import Anthropic
from modelos.vaga_modelo import VagaModelo


class VagaAnalisadorServico:
    """
    Serviço responsável por analisar textos de vagas de emprego usando IA
    e estruturá-los no formato do VagaModelo.
    """

    def __init__(self, api_key=None):
        """
        Inicializa o serviço de análise de vagas.

        Args:
            api_key (str, optional): Chave de API do Anthropic Claude.
                Se não fornecida, tentará obter da variável de ambiente ANTHROPIC_API_KEY.
        """
        # Utiliza a chave fornecida ou busca da variável de ambiente
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')

        if not self.api_key:
            raise ValueError(
                "API key do Anthropic Claude não encontrada. Forneça como parâmetro ou defina a variável de ambiente ANTHROPIC_API_KEY.")

        # Inicializa o cliente do Anthropic Claude
        self.cliente = Anthropic(api_key=self.api_key)

        # Modelo a ser usado (Claude 3.7 Sonnet)
        self.modelo = "claude-3-7-sonnet-20250219"

    def extrair_estrutura_vaga(self, texto_vaga, dados_adicionais=None):
        """
        Analisa o texto de uma vaga e extrai uma estrutura completa no formato do VagaModelo.

        Args:
            texto_vaga (str): Texto completo da vaga de emprego
            dados_adicionais (dict, optional): Dados adicionais que já se conhece sobre a vaga

        Returns:
            VagaModelo: Objeto com a estrutura de dados da vaga
        """
        # Preparar o sistema de prompt para o Claude
        system_prompt = """
        Você é um assistente especializado em analisar e estruturar descrições de vagas de emprego.
        Sua tarefa é extrair informações detalhadas de um texto de vaga e organizá-las em uma estrutura JSON específica.
        Use raciocínio detalhado para extrair o máximo de informações possível, mesmo quando implícitas.
        Se uma informação não estiver presente, deixe o campo vazio ou use valores padrão apropriados.
        Faça inferências razoáveis quando necessário, mas indique claramente no campo "observacoes" quais informações foram inferidas.
        """

        # Criar o prompt do usuário com o texto da vaga e a estrutura desejada
        user_prompt = f"""
        Analise o seguinte texto de vaga de emprego e extraia todas as informações possíveis para preencher a estrutura JSON abaixo.
        Use raciocínio avançado para identificar informações implícitas e contextuais.

        TEXTO DA VAGA:
        {texto_vaga}

        ESTRUTURA JSON DESEJADA:
        ```json
        {{
            "titulo": "",                 
            "descricao": "",              
            "resumo": "",                 
            "status": "ativa",            

            "empresa": {{
                "nome": "",               
                "descricao": "",          
                "tamanho": "",            
                "setor": ""              
            }},

            "localizacao": {{
                "pais": "",
                "estado": "",
                "cidade": ""
            }},

            "modalidade": "",             
            "tipo_contrato": "",          
            "jornada": "",                
            "nivel": "",                  

            "faixa_salarial": {{
                "minimo": 0,              
                "maximo": 0,              
                "moeda": "BRL"            
            }},
            "beneficios": [],             

            "requisitos": {{
                "formacao": {{
                    "nivel": "",          
                    "area": "",           
                    "obrigatorio": true   
                }},
                "experiencia": {{
                    "tempo_minimo": 0,    
                    "nivel": "",          
                    "areas": []           
                }},
                "habilidades_tecnicas": [],
                "habilidades_comportamentais": [],
                "idiomas": []
            }},

            "processo_seletivo": {{
                "etapas": [],             
                "email_contato": ""       
            }},

            "palavras_chave": [],

            "observacoes": ""
        }}
        ```

        Retorne apenas o JSON preenchido, sem explicações adicionais.
        """

        try:
            # Fazer a chamada para a API do Claude com extended thinking habilitado
            resposta = self.cliente.messages.create(
                model=self.modelo,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=4000,
                temperature=0.1,
                # Os parâmetros de "extended thinking" seriam definidos aqui
                # Este é um placeholder para quando estiver disponível na API
            )

            # Extrair o JSON da resposta
            conteudo = resposta.content[0].text
            # Encontrar o JSON entre os delimitadores ```json e ```
            match = re.search(r'```json\s*([\s\S]*?)\s*```', conteudo)
            if match:
                json_str = match.group(1)
            else:
                # Se não encontrar os delimitadores, assume que toda a resposta é o JSON
                json_str = conteudo

            # Converter a string JSON para dicionário
            dados_vaga_dict = json.loads(json_str)

            # Criar objeto VagaModelo
            vaga_modelo = VagaModelo()
            vaga_modelo.from_dict(dados_vaga_dict)

            # Mesclar com dados adicionais, se fornecidos
            if dados_adicionais:
                for chave, valor in dados_adicionais.items():
                    if isinstance(valor, dict) and chave in vaga_modelo.modelo and isinstance(vaga_modelo.modelo[chave],
                                                                                              dict):
                        # Para campos aninhados, fazemos uma mesclagem recursiva
                        self._mesclar_dict_recursivo(vaga_modelo.modelo[chave], valor)
                    else:
                        # Para campos simples, substituímos diretamente
                        vaga_modelo.modelo[chave] = valor

            # Adicionar metadados
            agora = datetime.now().isoformat()
            vaga_modelo.modelo["data_publicacao"] = vaga_modelo.modelo.get("data_publicacao", agora)
            vaga_modelo.modelo["criado_em"] = agora
            vaga_modelo.modelo["atualizado_em"] = agora

            # Inicializar estatísticas
            vaga_modelo.modelo["estatisticas"] = {
                "visualizacoes": 0,
                "candidaturas": 0,
                "candidatos_avaliados": 0
            }

            # Inicializar lista de candidaturas
            vaga_modelo.modelo["candidaturas"] = []

            return vaga_modelo

        except Exception as e:
            print(f"Erro ao analisar vaga: {str(e)}")
            # Retornar uma estrutura vazia em caso de erro
            return self._criar_estrutura_vazia()

    def _mesclar_dict_recursivo(self, dict_destino, dict_origem):
        """
        Mescla dois dicionários recursivamente, atualizando o dicionário de destino.

        Args:
            dict_destino (dict): Dicionário que será atualizado
            dict_origem (dict): Dicionário com os valores para atualizar
        """
        for chave, valor in dict_origem.items():
            if chave in dict_destino and isinstance(dict_destino[chave], dict) and isinstance(valor, dict):
                self._mesclar_dict_recursivo(dict_destino[chave], valor)
            else:
                dict_destino[chave] = valor

    def _criar_estrutura_vazia(self):
        """
        Cria uma estrutura vazia no formato do VagaModelo.

        Returns:
            VagaModelo: Objeto com estrutura vazia inicializada
        """
        # Criar uma instância de VagaModelo
        return VagaModelo()

    def gerar_palavras_chave(self, vaga_modelo):
        """
        Gera automaticamente palavras-chave relevantes para a vaga.

        Args:
            vaga_modelo (VagaModelo): Dados estruturados da vaga

        Returns:
            list: Lista de palavras-chave relevantes
        """
        # Verificar se é um objeto VagaModelo
        if not isinstance(vaga_modelo, VagaModelo):
            vaga_temp = VagaModelo()
            vaga_temp.from_dict(vaga_modelo)
            vaga_modelo = vaga_temp

        # Obter o dicionário para trabalhar com os dados
        dados_vaga = vaga_modelo.to_dict()

        # Concatenar informações relevantes para enviar ao Claude
        habilidades_tecnicas = []
        for habilidade in dados_vaga.get('requisitos', {}).get('habilidades_tecnicas', []):
            if isinstance(habilidade, dict):
                habilidades_tecnicas.append(habilidade.get('nome', ''))
            else:
                habilidades_tecnicas.append(str(habilidade))

        areas_experiencia = dados_vaga.get('requisitos', {}).get('experiencia', {}).get('areas', [])

        info_relevante = f"""
        Título: {dados_vaga.get('titulo', '')}
        Descrição: {dados_vaga.get('descricao', '')}
        Requisitos Técnicos: {', '.join(habilidades_tecnicas)}
        Nível: {dados_vaga.get('nivel', '')}
        Áreas de Experiência: {', '.join(areas_experiencia)}
        """

        prompt = f"""
        Com base nas informações desta vaga, gere uma lista de palavras-chave relevantes para matching com currículos.
        Inclua termos técnicos, habilidades, tecnologias, cargos similares e áreas de atuação.
        Limite-se a no máximo 20 palavras-chave.

        Informações da vaga:
        {info_relevante}

        Retorne apenas a lista de palavras-chave separadas por vírgula, sem explicações adicionais.
        """

        try:
            resposta = self.cliente.messages.create(
                model=self.modelo,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.3
            )

            # Extrair a lista de palavras-chave
            palavras_chave = resposta.content[0].text.strip().split(',')

            # Limpar e processar cada palavra-chave
            palavras_chave = [palavra.strip().lower() for palavra in palavras_chave]

            # Remover duplicatas e palavras vazias
            palavras_chave = list(set(palavra for palavra in palavras_chave if palavra))

            return palavras_chave

        except Exception as e:
            print(f"Erro ao gerar palavras-chave: {str(e)}")
            return []

    def gerar_resumo(self, vaga_modelo, max_caracteres=300):
        """
        Gera um resumo conciso da descrição da vaga.

        Args:
            vaga_modelo (VagaModelo ou str): Objeto da vaga ou texto da descrição
            max_caracteres (int): Número máximo de caracteres para o resumo

        Returns:
            str: Resumo da vaga
        """
        # Extrair a descrição da vaga
        if isinstance(vaga_modelo, VagaModelo):
            descricao_completa = vaga_modelo.modelo.get('descricao', '')
        elif isinstance(vaga_modelo, dict):
            descricao_completa = vaga_modelo.get('descricao', '')
        else:
            # Assume que é string
            descricao_completa = vaga_modelo

        if not descricao_completa:
            return ""

        prompt = f"""
        Crie um resumo conciso e atrativo desta descrição de vaga em até {max_caracteres} caracteres:

        {descricao_completa}

        O resumo deve destacar os pontos principais da vaga e atrair candidatos qualificados.
        Retorne apenas o resumo, sem explicações adicionais.
        """

        try:
            resposta = self.cliente.messages.create(
                model=self.modelo,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )

            resumo = resposta.content[0].text.strip()

            # Garantir que o resumo não ultrapasse o tamanho máximo
            if len(resumo) > max_caracteres:
                resumo = resumo[:max_caracteres - 3] + "..."

            return resumo

        except Exception as e:
            print(f"Erro ao gerar resumo: {str(e)}")
            # Se falhar, retorna as primeiras palavras da descrição
            return descricao_completa[:max_caracteres - 3] + "..." if len(
                descricao_completa) > max_caracteres else descricao_completa
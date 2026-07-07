// src/infrastructure/ai/google-genai.service.ts

import { Injectable } from '@nestjs/common';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { AIService } from '../../domain/services/ai.service';
import { DetalhesMatching } from '../../domain/entities/matching.entity';
import { RequisitosVaga } from '../../domain/entities/vaga.entity';

@Injectable()
export class GoogleGenAIService implements AIService {
  private ai: GoogleGenAI;
  private readonly modelName: string;
  private readonly isThinking: boolean;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash'; // Permite configurar Gemma 4 ou Gemini via .env
    this.isThinking = this.modelName.includes('thinking');

    if (!apiKey) {
      console.warn('GEMINI_API_KEY não configurada no arquivo .env. O serviço de IA não funcionará.');
      return;
    }

    this.ai = new GoogleGenAI({ apiKey });
  }

  private buildConfig(systemInstruction?: string, responseSchema?: Schema, temperature?: number): any {
    const config: any = {
      responseMimeType: 'application/json',
    };
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (responseSchema) {
      config.responseSchema = responseSchema;
    }
    if (this.isThinking) {
      config.temperature = 1.0;
      config.thinkingConfig = {
        thinkingBudget: 2048
      };
    } else if (temperature !== undefined) {
      config.temperature = temperature;
    }
    return config;
  }

  async extrairDadosCurriculo(textoCurriculo: string): Promise<any> {
    this.checkClientInitialized();
    console.log(textoCurriculo)

    const systemInstruction = `Você é um sistema especializado em extração e estruturação de dados de currículos. 
Sua tarefa é extrair as informações do texto do currículo fornecido e organizá-las no formato JSON especificado.

Siga estas diretrizes para garantir a maior acurácia e compatibilidade de dados:
1. Para cada habilidade em 'habilidades_tecnicas', calcule o campo 'anos_experiencia' de forma lógica: identifique todas as experiências profissionais ('experiencias') onde o candidato utilizou aquela tecnologia/ferramenta e some as durações dessas experiências. Se houver sobreposição de períodos, compute a duração da sobreposição apenas uma vez. Não chute valores aleatórios.
2. Identifique as principais realizações, projetos relevantes, conquistas ou entregas de valor realizadas pelo candidato em cada experiência profissional e preencha a lista 'principais_realizacoes'.
3. Mapeie as modalidades de trabalho desejadas ('preferencias.modalidades') estritamente para um ou mais dos seguintes valores: 'REMOTO', 'HIBRIDO', 'PRESENCIAL'. Se nenhuma for explícita ou não estiver presente no currículo, deixe o array vazio.
4. Mapeie o nível de proficiência dos idiomas de forma realista. Se o candidato listar apenas um nível geral para um idioma (ex: 'Inglês Avançado'), replique esse nível de forma consistente nos campos de leitura, escrita e conversação (ex: 'AVANCADO').
5. Seja preciso e extraia o que está escrito. Não invente informações fictícias.
6. Identifique projetos pessoais, acadêmicos ou open source relevantes citados no currículo que não estejam atrelados diretamente a uma experiência profissional, extraindo o nome, descrição, tecnologias utilizadas e link/URL se disponíveis no array 'projetos'.`;

    const prompt = `Extraia os dados do seguinte currículo:\n\n${textoCurriculo}`;

    // Schema para validação do retorno do currículo
    const cvSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        nome_completo: { type: Type.STRING },
        email: { type: Type.STRING },
        telefone: { type: Type.STRING },
        data_nascimento: { type: Type.STRING, description: 'Formato YYYY-MM-DD' },
        perfil: {
          type: Type.OBJECT,
          properties: {
            titulo: { type: Type.STRING },
            resumo_profissional: { type: Type.STRING },
            anos_experiencia: { type: Type.INTEGER },
            pretensao_salarial: { type: Type.NUMBER },
            disponibilidade: { type: Type.STRING }
          },
          required: ['anos_experiencia']
        },
        experiencias: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              empresa: { type: Type.STRING },
              cargo: { type: Type.STRING },
              descricao: { type: Type.STRING },
              data_inicio: { type: Type.STRING, description: 'Formato YYYY-MM ou YYYY-MM-DD' },
              data_fim: { type: Type.STRING, description: 'Formato YYYY-MM ou YYYY-MM-DD se não for atual' },
              atual: { type: Type.BOOLEAN },
              tecnologias_utilizadas: { type: Type.ARRAY, items: { type: Type.STRING } },
              principais_realizacoes: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Lista de principais realizações, projetos e entregas de destaque nesta experiência' }
            },
            required: ['empresa', 'cargo', 'data_inicio', 'atual']
          }
        },
        formacao: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              instituicao: { type: Type.STRING },
              curso: { type: Type.STRING },
              grau: { type: Type.STRING },
              area: { type: Type.STRING },
              data_inicio: { type: Type.STRING },
              data_fim: { type: Type.STRING },
              concluido: { type: Type.BOOLEAN }
            },
            required: ['instituicao', 'curso', 'concluido']
          }
        },
        habilidades_tecnicas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              nome: { type: Type.STRING },
              nivel: { type: Type.STRING },
              anos_experiencia: { type: Type.INTEGER }
            },
            required: ['nome']
          }
        },
        certificacoes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              nome: { type: Type.STRING },
              emissor: { type: Type.STRING },
              data_obtencao: { type: Type.STRING },
              data_validade: { type: Type.STRING },
              codigo_validacao: { type: Type.STRING }
            },
            required: ['nome', 'emissor']
          }
        },
        idiomas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              nome: { type: Type.STRING },
              nivel_leitura: { type: Type.STRING },
              nivel_escrita: { type: Type.STRING },
              nivel_conversacao: { type: Type.STRING }
            },
            required: ['nome']
          }
        },
        preferencias: {
          type: Type.OBJECT,
          properties: {
            modalidades: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.STRING,
                enum: ['REMOTO', 'HIBRIDO', 'PRESENCIAL']
              } 
            },
            cidades_interesse: { type: Type.ARRAY, items: { type: Type.STRING } },
            cargos_interesse: { type: Type.ARRAY, items: { type: Type.STRING } },
            tipo_contrato: { type: Type.ARRAY, items: { type: Type.STRING } },
            disponibilidade_mudanca: { type: Type.BOOLEAN }
          }
        },
        projetos: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              nome: { type: Type.STRING },
              descricao: { type: Type.STRING },
              tecnologias: { type: Type.ARRAY, items: { type: Type.STRING } },
              url: { type: Type.STRING, description: 'Link do repositório ou demonstração do projeto se disponível' }
            },
            required: ['nome']
          }
        },
        palavras_chave: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['nome_completo', 'email', 'habilidades_tecnicas']
    };

    const isGemma = this.modelName.toLowerCase().includes('gemma');
    let activeInstruction = systemInstruction;
    if (isGemma) {
      activeInstruction += `\nVocê deve retornar o relatório no seguinte formato JSON estrito:
{
  "nome_completo": "string",
  "email": "string",
  "telefone": "string",
  "localizacao": {
    "cidade": "string",
    "estado": "string",
    "pais": "string"
  },
  "sobre": "string",
  "objetivo_profissional": "string",
  "habilidades_tecnicas": [
    {
      "nome": "string",
      "nivel": "string",
      "anos_experiencia": 0
    }
  ],
  "habilidades_comportamentais": ["string"],
  "experiencia_profissional": [
    {
      "empresa": "string",
      "cargo": "string",
      "periodo": "string",
      "atividades": "string",
      "tecnologias": ["string"],
      "atual": false
    }
  ],
  "formacao_academica": [
    {
      "instituicao": "string",
      "curso": "string",
      "nivel": "string",
      "status": "string",
      "ano_conclusao": 0
    }
  ],
  "idiomas": [
    {
      "idioma": "string",
      "nivel": "string"
    }
  ],
  "dados_complementares": {
    "pretensao_salarial": 0,
    "disponibilidade_inicio": "string",
    "modelo_trabalho_preferido": "string",
    "disponibilidade_mudanca": false
  },
  "projetos": [
    {
      "nome": "string",
      "descricao": "string",
      "tecnologias": ["string"],
      "url": "string"
    }
  ],
  "palavras_chave": ["string"]
}`;
    }

    const response = await this.generateContentWithFallback({
      contents: prompt,
      config: this.buildConfig(activeInstruction, isGemma ? undefined : cvSchema)
    });

    if (!response.text) {
      throw new Error('A IA retornou uma resposta vazia ao processar o currículo.');
    }

    return JSON.parse(this.cleanJsonResponse(response.text));
  }

  async extrairEstruturaVaga(textoVaga: string): Promise<Partial<RequisitosVaga> & any> {
    this.checkClientInitialized();

    const systemInstruction = `Você é um assistente especializado em recrutamento. Sua tarefa é analisar a descrição de uma vaga de emprego e extrair as informações estruturadas em JSON.`;
    const prompt = `Analise a seguinte vaga e extraia suas propriedades:\n\n${textoVaga}`;

    const vagaSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        titulo: { type: Type.STRING },
        empresa: {
          type: Type.OBJECT,
          properties: {
            nome: { type: Type.STRING },
            setor: { type: Type.STRING }
          }
        },
        localizacao: {
          type: Type.OBJECT,
          properties: {
            cidade: { type: Type.STRING },
            estado: { type: Type.STRING }
          }
        },
        modalidade: { type: Type.STRING, description: 'Deve ser REMOTO, HIBRIDO ou PRESENCIAL' },
        tipo_contrato: { type: Type.STRING },
        nivel: { type: Type.STRING, description: 'Junior, Pleno, Senior ou Especialista' },
        faixa_salarial: {
          type: Type.OBJECT,
          properties: {
            minimo: { type: Type.NUMBER },
            maximo: { type: Type.NUMBER }
          }
        },
        resumo: { type: Type.STRING },
        requisitos: {
          type: Type.OBJECT,
          properties: {
            formacao: {
              type: Type.OBJECT,
              properties: {
                nivel: { type: Type.STRING },
                area: { type: Type.STRING },
                obrigatorio: { type: Type.BOOLEAN }
              }
            },
            experiencia: {
              type: Type.OBJECT,
              properties: {
                tempo_minimo: { type: Type.INTEGER },
                areas: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            habilidades_tecnicas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nome: { type: Type.STRING },
                  nivel: { type: Type.STRING },
                  obrigatorio: { type: Type.BOOLEAN }
                },
                required: ['nome', 'obrigatorio']
              }
            },
            habilidades_comportamentais: { type: Type.ARRAY, items: { type: Type.STRING } },
            idiomas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nome: { type: Type.STRING },
                  nivel: { type: Type.STRING },
                  obrigatorio: { type: Type.BOOLEAN }
                },
                required: ['nome', 'obrigatorio']
              }
            }
          }
        },
        palavras_chave: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['titulo', 'requisitos']
    };

    const isGemma = this.modelName.toLowerCase().includes('gemma');
    let activeInstruction = systemInstruction;
    if (isGemma) {
      activeInstruction += `\nVocê deve retornar o relatório no seguinte formato JSON estrito:
{
  "titulo": "string",
  "empresa": {
    "nome": "string",
    "setor": "string"
  },
  "localizacao": {
    "cidade": "string",
    "estado": "string"
  },
  "modalidade": "string (REMOTO, HIBRIDO ou PRESENCIAL)",
  "tipo_contrato": "string",
  "nivel": "string (Junior, Pleno, Senior ou Especialista)",
  "faixa_salarial": {
    "minimo": 0,
    "maximo": 0
  },
  "resumo": "string",
  "requisitos": {
    "formacao": {
      "nivel": "string",
      "area": "string",
      "obrigatorio": false
    },
    "experiencia": {
      "tempo_minimo": 0,
      "areas": ["string"]
    },
    "habilidades_tecnicas": [
      {
        "nome": "string",
        "nivel": "string",
        "obrigatorio": false
      }
    ],
    "habilidades_comportamentais": ["string"],
    "idiomas": [
      {
        "nome": "string",
        "nivel": "string",
        "obrigatorio": false
      }
    ]
  },
  "palavras_chave": ["string"]
}`;
    }

    const response = await this.generateContentWithFallback({
      contents: prompt,
      config: this.buildConfig(activeInstruction, isGemma ? undefined : vagaSchema)
    });

    return JSON.parse(this.cleanJsonResponse(response.text));
  }

  async analisarCompatibilidade(dadosCurriculo: any, dadosVaga: any): Promise<DetalhesMatching & { score: number }> {
    this.checkClientInitialized();

    const systemInstruction = `Você é um especialista em recrutamento e seleção de pessoas (Tech Recruiter). 
Sua tarefa é analisar detalhadamente a compatibilidade entre o perfil estruturado de um candidato (currículo) e os requisitos estruturados de uma vaga de emprego.
Use raciocínio lógico profundo para avaliar cada item. Atribua um score geral de 0 a 100 e scores para cada categoria.
Você deve retornar o relatório completo em formato JSON estrito conforme o esquema fornecido.`;

    const prompt = `Analise a compatibilidade entre este candidato e esta vaga:
Candidato: ${JSON.stringify(dadosCurriculo)}
Vaga: ${JSON.stringify(dadosVaga)}`;

    const categoriaSchema = (extraProps: Record<string, Schema> = {}): Schema => ({
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        peso: { type: Type.NUMBER },
        analiseQualitativa: { type: Type.STRING },
        nivelRelevancia: { type: Type.STRING },
        ...extraProps
      },
      required: ['score', 'peso', 'analiseQualitativa', 'nivelRelevancia']
    });

    const matchingSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        categorias: {
          type: Type.OBJECT,
          properties: {
            habilidadesTecnicas: categoriaSchema({
              correspondentes: { type: Type.ARRAY, items: { type: Type.STRING } },
              faltantes: { type: Type.ARRAY, items: { type: Type.STRING } },
              excedentes: { type: Type.ARRAY, items: { type: Type.STRING } }
            }),
            experiencia: categoriaSchema({
              tempoAtende: { type: Type.BOOLEAN },
              areasCorrespondentes: { type: Type.ARRAY, items: { type: Type.STRING } },
              areasFaltantes: { type: Type.ARRAY, items: { type: Type.STRING } }
            }),
            formacao: categoriaSchema({
              nivelAtende: { type: Type.BOOLEAN },
              areaAtende: { type: Type.BOOLEAN },
              formacaoAlternativaRelevante: { type: Type.BOOLEAN }
            }),
            idiomas: categoriaSchema({
              correspondentes: { type: Type.ARRAY, items: { type: Type.STRING } },
              faltantes: { type: Type.ARRAY, items: { type: Type.STRING } }
            }),
            localizacaoDisponibilidade: categoriaSchema({
              localizacaoCompativel: { type: Type.BOOLEAN },
              disponibilidadeCompativel: { type: Type.BOOLEAN }
            }),
            softSkillsCultura: categoriaSchema({
              correspondentes: { type: Type.ARRAY, items: { type: Type.STRING } },
              faltantes: { type: Type.ARRAY, items: { type: Type.STRING } }
            })
          },
          required: ['habilidadesTecnicas', 'experiencia', 'formacao', 'idiomas', 'localizacaoDisponibilidade', 'softSkillsCultura']
        },
        resumoCandidato: { type: Type.STRING },
        resumoVaga: { type: Type.STRING },
        diferenciais: {
          type: Type.OBJECT,
          properties: {
            pontosFortes: { type: Type.ARRAY, items: { type: Type.STRING } },
            pontosFracos: { type: Type.ARRAY, items: { type: Type.STRING } },
            vantagensCompetitivas: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['pontosFortes', 'pontosFracos']
        },
        recomendacoes: {
          type: Type.OBJECT,
          properties: {
            gerais: { type: Type.STRING },
            habilidadesTecnicas: { type: Type.STRING },
            experiencia: { type: Type.STRING },
            formacao: { type: Type.STRING },
            desenvolvimento: { type: Type.STRING },
            abordagemEntrevista: { type: Type.STRING },
            prioridadeAcao: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['gerais', 'desenvolvimento', 'prioridadeAcao']
        },
        compatibilidadeCultural: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            fatoresPositivos: { type: Type.ARRAY, items: { type: Type.STRING } },
            fatoresNegativos: { type: Type.ARRAY, items: { type: Type.STRING } },
            analise: { type: Type.STRING }
          },
          required: ['score', 'analise']
        },
        probabilidadeSucesso: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            justificativa: { type: Type.STRING },
            fatoresCriticos: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['score', 'justificativa']
        },
        metaAnalise: {
          type: Type.OBJECT,
          properties: {
            confiabilidade: { type: Type.NUMBER },
            fatoresIncertos: { type: Type.ARRAY, items: { type: Type.STRING } },
            potencialDesenvolvimento: { type: Type.NUMBER },
            observacoes: { type: Type.STRING }
          },
          required: ['confiabilidade', 'potencialDesenvolvimento']
        }
      },
      required: ['score', 'categorias', 'resumoCandidato', 'resumoVaga', 'diferenciais', 'recomendacoes', 'compatibilidadeCultural', 'probabilidadeSucesso', 'metaAnalise']
    };

    const isGemma = this.modelName.toLowerCase().includes('gemma');
    let activeInstruction = systemInstruction;
    if (isGemma) {
      activeInstruction += `\nVocê deve retornar o relatório no seguinte formato JSON estrito:
{
  "score": 0 a 100,
  "categorias": {
    "habilidadesTecnicas": { "score": 0 a 100, "peso": 0 a 1, "analiseQualitativa": "...", "nivelRelevancia": "...", "correspondentes": ["..."], "faltantes": ["..."], "excedentes": ["..."] },
    "experiencia": { "score": 0 a 100, "peso": 0 a 1, "analiseQualitativa": "...", "nivelRelevancia": "...", "tempoAtende": true/false, "areasCorrespondentes": ["..."], "areasFaltantes": ["..."] },
    "formacao": { "score": 0 a 100, "peso": 0 a 1, "analiseQualitativa": "...", "nivelRelevancia": "...", "nivelAtende": true/false, "areaAtende": true/false, "formacaoAlternativaRelevante": true/false },
    "idiomas": { "score": 0 a 100, "peso": 0 a 1, "analiseQualitativa": "...", "nivelRelevancia": "...", "correspondentes": ["..."], "faltantes": ["..."] },
    "localizacaoDisponibilidade": { "score": 0 a 100, "peso": 0 a 1, "analiseQualitativa": "...", "nivelRelevancia": "...", "localizacaoCompativel": true/false, "disponibilidadeCompativel": true/false },
    "softSkillsCultura": { "score": 0 a 100, "peso": 0 a 1, "analiseQualitativa": "...", "nivelRelevancia": "...", "correspondentes": ["..."], "faltantes": ["..."] }
  },
  "resumoCandidato": "...",
  "resumoVaga": "...",
  "diferenciais": {
    "pontosFortes": ["..."],
    "pontosFracos": ["..."],
    "vantagensCompetitivas": ["..."]
  },
  "recomendacoes": {
    "gerais": "...",
    "habilidadesTecnicas": "...",
    "experiencia": "...",
    "formacao": "...",
    "desenvolvimento": "...",
    "abordagemEntrevista": "...",
    "prioridadeAcao": ["..."]
  },
  "compatibilidadeCultural": {
    "score": 0 a 100,
    "fatoresPositivos": ["..."],
    "fatoresNegativos": ["..."],
    "analise": "..."
  },
  "probabilidadeSucesso": {
    "score": 0 a 100,
    "justificativa": "...",
    "fatoresCriticos": ["..."]
  },
  "metaAnalise": {
    "confiabilidade": 0 a 1,
    "fatoresIncertos": ["..."],
    "potencialDesenvolvimento": 0 a 1,
    "observacoes": "..."
  }
}`;
    }

    const config = this.buildConfig(activeInstruction, isGemma ? undefined : matchingSchema);

    const response = await this.generateContentWithFallback({
      contents: prompt,
      config
    });

    const parsedResult = JSON.parse(this.cleanJsonResponse(response.text));

    // Mapeamos a propriedade "score" da raiz para "score_matching" se necessário, 
    // mas na nossa entidade é "score". Retornamos o objeto mapeado para o formato da interface.
    return {
      categorias: parsedResult.categorias,
      resumoCandidato: parsedResult.resumoCandidato,
      resumoVaga: parsedResult.resumoVaga,
      diferenciais: parsedResult.diferenciais,
      recomendacoes: parsedResult.recomendacoes,
      compatibilidadeCultural: parsedResult.compatibilidadeCultural,
      probabilidadeSucesso: parsedResult.probabilidadeSucesso,
      metaAnalise: parsedResult.metaAnalise,
      score: parsedResult.score
    } as any;
  }

  async gerarPalavrasChave(dadosVaga: any): Promise<string[]> {
    this.checkClientInitialized();

    const prompt = `Com base nas informações estruturadas desta vaga, gere uma lista de até 15 palavras-chave relevantes para busca e matching de candidatos.
Retorne apenas uma lista simples de termos.
Vaga: ${JSON.stringify(dadosVaga)}`;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        palavras_chave: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['palavras_chave']
    };

    const isGemma = this.modelName.toLowerCase().includes('gemma');
    const response = await this.generateContentWithFallback({
      contents: prompt,
      config: this.buildConfig(undefined, isGemma ? undefined : schema)
    });

    const res = JSON.parse(this.cleanJsonResponse(response.text));
    return res.palavras_chave || [];
  }

  async gerarResumoVaga(dadosVaga: any): Promise<string> {
    this.checkClientInitialized();

    const prompt = `Crie um resumo conciso (máximo 300 caracteres) e atrativo desta vaga para ser exibido em uma listagem.
Vaga: ${JSON.stringify(dadosVaga)}`;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        resumo: { type: Type.STRING }
      },
      required: ['resumo']
    };

    const isGemma = this.modelName.toLowerCase().includes('gemma');
    const response = await this.generateContentWithFallback({
      contents: prompt,
      config: this.buildConfig(undefined, isGemma ? undefined : schema)
    });

    const res = JSON.parse(this.cleanJsonResponse(response.text));
    return res.resumo || '';
  }

  private async generateContentWithFallback(params: { contents: any; config?: any }): Promise<any> {
    try {
      return await this.callWithRetry(() => this.ai.models.generateContent({
        model: this.modelName,
        contents: params.contents,
        config: params.config
      }));
    } catch (primaryError: any) {
      const fallbackModel = 'gemini-3.1-flash-lite';
      if (this.modelName !== fallbackModel) {
        console.warn(`Erro no modelo principal '${this.modelName}'. Tentando fallback com '${fallbackModel}'... Erro:`, primaryError.message || primaryError);
        try {
          return await this.callWithRetry(() => this.ai.models.generateContent({
            model: fallbackModel,
            contents: params.contents,
            config: params.config
          }));
        } catch (fallbackError: any) {
          console.error(`Erro também no modelo de fallback '${fallbackModel}':`, fallbackError.message || fallbackError);
          throw fallbackError;
        }
      }
      throw primaryError;
    }
  }

  private async callWithRetry<T>(fn: () => Promise<T>, retries = 5, delay = 4000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const isTransient = 
        retries > 0 && 
        (
          error?.status === 500 || 
          error?.status === 429 || 
          error?.status === 503 ||
          error?.code === 500 ||
          error?.code === 429 ||
          error?.code === 503 ||
          String(error).includes('INTERNAL') ||
          String(error).includes('ResourceExhausted') ||
          String(error).includes('500') ||
          String(error).includes('503')
        );

      if (isTransient) {
        console.warn(`Gemini API returned a transient error. Retrying in ${delay}ms... (${retries} retries left). Error:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callWithRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  private checkClientInitialized(): void {
    if (!this.ai) {
      throw new Error('Google Gen AI Client não inicializado. Verifique se a GEMINI_API_KEY está configurada.');
    }
  }

  private cleanJsonResponse(text: string | null | undefined): string {
    if (!text) return '{}';
    let clean = text.trim();
    
    // Remove delimitadores markdown se presentes no início/fim de forma simples
    if (clean.startsWith('```')) {
      const match = clean.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
      if (match) {
        clean = match[1].trim();
      }
    }
    
    // Tenta isolar o objeto {...} ou array [...] principal caso a resposta contenha texto conversacional no entorno
    const firstBrace = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');
    
    let startIdx = -1;
    let endIdx = -1;
    
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = clean.lastIndexOf('}');
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = clean.lastIndexOf(']');
    }
    
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      clean = clean.substring(startIdx, endIdx + 1);
    }
    
    return clean.trim();
  }
}

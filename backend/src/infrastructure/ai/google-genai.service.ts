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

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash'; // Permite configurar Gemma 4 ou Gemini via .env

    if (!apiKey) {
      console.warn('GEMINI_API_KEY não configurada no arquivo .env. O serviço de IA não funcionará.');
      return;
    }

    this.ai = new GoogleGenAI({ apiKey });
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
5. Seja preciso e extraia o que está escrito. Não invente informações fictícias.`;

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
        palavras_chave: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['nome_completo', 'email', 'habilidades_tecnicas']
    };

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: cvSchema,
      }
    });

    if (!response.text) {
      throw new Error('A IA retornou uma resposta vazia ao processar o currículo.');
    }

    return JSON.parse(response.text);
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

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: vagaSchema,
      }
    });

    return JSON.parse(response.text || '{}');
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

    // Configura o modelo. Se for Gemma 4 ou modelo com suporte a thinking, adicionamos as opções apropriadas.
    const isThinkingModel = this.modelName.includes('thinking') || this.modelName.includes('gemma4') || this.modelName.includes('pro');

    const config: any = {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: matchingSchema,
    };

    if (isThinkingModel) {
      config.temperature = 1.0;
      config.thinkingConfig = {
        thinkingBudget: 2048
      };
    }

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config
    });

    const parsedResult = JSON.parse(response.text || '{}');

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

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const res = JSON.parse(response.text || '{}');
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

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const res = JSON.parse(response.text || '{}');
    return res.resumo || '';
  }

  private checkClientInitialized(): void {
    if (!this.ai) {
      throw new Error('Google Gen AI Client não inicializado. Verifique se a GEMINI_API_KEY está configurada.');
    }
  }
}

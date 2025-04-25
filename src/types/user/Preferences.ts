// types/Preferences.ts
/**
 * Interface representing work preferences
 */
export interface Preferences {
  modalidades: ("Remoto" | "Híbrido" | "Presencial")[];
  cidades_interesse: string[];
  cargos_interesse: string[];
  areas_interesse: string[];
  tipo_contrato: ("CLT" | "PJ" | "Freelancer")[];
  tamanho_empresa: ("Startup" | "Pequena" | "Média" | "Grande")[];
  disponibilidade_viagens: "Sim" | "Não" | "Eventualmente";
  disponibilidade_mudanca: boolean;
}

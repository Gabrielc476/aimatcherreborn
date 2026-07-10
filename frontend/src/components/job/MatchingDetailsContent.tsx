"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Matching } from "@/types/matching/Matching";

interface MatchingDetailsContentProps {
  matching: Matching;
}

export function MatchingDetailsContent({ matching }: MatchingDetailsContentProps) {
  if (!matching || !matching.analise) return null;

  return (
    <div className="space-y-4">
      {/* Overview score */}
      <div className="flex justify-between items-center border rounded-lg p-4 bg-muted/20">
        <div>
          <h3 className="text-lg font-medium">Compatibilidade geral</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
            {matching.analise.resumoCandidato}
          </p>
        </div>
        <div className="text-center shrink-0 ml-4">
          <div className="text-3xl font-bold text-primary">
            {Math.round(matching.score)}%
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">
            Score de compatibilidade
          </div>
        </div>
      </div>

      {/* Categories breakdown */}
      <div className="space-y-4 pt-2">
        <h3 className="text-lg font-medium">Detalhamento por categorias</h3>

        <Accordion type="single" collapsible defaultValue="habilidades" className="space-y-2">
          {/* Technical Skills */}
          {matching.analise.categorias.habilidadesTecnicas && (
            <AccordionItem value="habilidades" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="py-3 px-4 hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-center w-full pr-4">
                  <span className="font-medium">Habilidades Técnicas</span>
                  <span className="font-semibold text-primary">
                    {Math.round(matching.analise.categorias.habilidadesTecnicas.score)}%
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 pt-0 border-t bg-card">
                <div className="space-y-3 pt-4">
                  {matching.analise.categorias.habilidadesTecnicas.correspondentes && 
                   matching.analise.categorias.habilidadesTecnicas.correspondentes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                        Pontos fortes:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {matching.analise.categorias.habilidadesTecnicas.correspondentes.map(
                          (skill: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400"
                            >
                              {skill}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {matching.analise.categorias.habilidadesTecnicas.faltantes && 
                   matching.analise.categorias.habilidadesTecnicas.faltantes.length > 0 && (
                    <div className="pt-1">
                      <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                        Áreas para desenvolvimento:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {matching.analise.categorias.habilidadesTecnicas.faltantes.map(
                          (skill: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-xs font-medium text-red-400"
                            >
                              {skill}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <p className="text-sm leading-relaxed text-muted-foreground pt-1">
                    {matching.analise.categorias.habilidadesTecnicas.analiseQualitativa}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Experience */}
          {matching.analise.categorias.experiencia && (
            <AccordionItem value="experience" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="py-3 px-4 hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-center w-full pr-4">
                  <span className="font-medium">Experiência</span>
                  <span className="font-semibold text-primary">
                    {Math.round(matching.analise.categorias.experiencia.score)}%
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 pt-0 border-t bg-card">
                <div className="text-sm pt-4 space-y-3">
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">Tempo de experiência:</span>{" "}
                    {matching.analise.categorias.experiencia.tempoAtende ? (
                      <span className="text-green-700 font-medium">Atende aos requisitos</span>
                    ) : (
                      <span className="text-red-700 font-medium">Não atende aos requisitos</span>
                    )}
                  </p>

                  {matching.analise.categorias.experiencia.areasCorrespondentes && 
                   matching.analise.categorias.experiencia.areasCorrespondentes.length > 0 && (
                    <div className="pt-1">
                      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                        Áreas de experiência compatíveis:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {matching.analise.categorias.experiencia.areasCorrespondentes.map(
                          (area: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400"
                            >
                              {area}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <p className="leading-relaxed text-muted-foreground pt-1">
                    {matching.analise.categorias.experiencia.analiseQualitativa}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Education */}
          {matching.analise.categorias.formacao && (
            <AccordionItem value="education" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="py-3 px-4 hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-center w-full pr-4">
                  <span className="font-medium">Formação</span>
                  <span className="font-semibold text-primary">
                    {Math.round(matching.analise.categorias.formacao.score)}%
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 pt-0 border-t bg-card">
                <div className="text-sm pt-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">Nível acadêmico:</span>{" "}
                      {matching.analise.categorias.formacao.nivelAtende ? (
                        <span className="text-green-700 font-medium">Adequado</span>
                      ) : (
                        <span className="text-red-700 font-medium">Não adequado</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">Área de formação:</span>{" "}
                      {matching.analise.categorias.formacao.areaAtende ? (
                        <span className="text-green-700 font-medium">Compatível</span>
                      ) : (
                        <span className="text-red-700 font-medium">Não compatível</span>
                      )}
                    </div>
                  </div>

                  <p className="leading-relaxed text-muted-foreground border-t pt-2">
                    {matching.analise.categorias.formacao.analiseQualitativa}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Languages */}
          {matching.analise.categorias.idiomas && (
            <AccordionItem value="languages" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="py-3 px-4 hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-center w-full pr-4">
                  <span className="font-medium">Idiomas</span>
                  <span className="font-semibold text-primary">
                    {Math.round(matching.analise.categorias.idiomas.score)}%
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 pt-0 border-t bg-card">
                <div className="text-sm pt-4 space-y-3">
                  {matching.analise.categorias.idiomas.correspondentes && 
                   matching.analise.categorias.idiomas.correspondentes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                        Idiomas compatíveis:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {matching.analise.categorias.idiomas.correspondentes.map(
                          (language: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400"
                            >
                              {language}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {matching.analise.categorias.idiomas.faltantes && 
                   matching.analise.categorias.idiomas.faltantes.length > 0 && (
                    <div className="pt-1">
                      <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                        Idiomas necessários:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {matching.analise.categorias.idiomas.faltantes.map(
                          (language: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-xs font-medium text-red-400"
                            >
                              {language}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <p className="leading-relaxed text-muted-foreground pt-1">
                    {matching.analise.categorias.idiomas.analiseQualitativa}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>

      {/* Recommendations */}
      {matching.analise.recomendacoes && (
        <Card className="shadow-sm border">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-base font-bold">Recomendações</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-sm leading-relaxed space-y-3">
            <p className="text-muted-foreground">{matching.analise.recomendacoes.gerais}</p>

            {matching.analise.recomendacoes.prioridadeAcao && 
             matching.analise.recomendacoes.prioridadeAcao.length > 0 && (
              <div className="pt-2">
                <span className="font-semibold text-foreground block mb-1">Ações prioritárias:</span>
                <ul className="list-disc pl-5 space-y-1">
                  {matching.analise.recomendacoes.prioridadeAcao.map(
                    (action, index) => (
                      <li key={index} className="text-muted-foreground">
                        {action}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Success probability */}
      {matching.analise.probabilidadeSucesso && (
        <Card className="shadow-sm border">
          <CardHeader className="py-4 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-bold">
                Probabilidade de sucesso
              </CardTitle>
              <div className="text-lg font-bold text-primary">
                {Math.round(matching.analise.probabilidadeSucesso.score)}%
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              {matching.analise.probabilidadeSucesso.justificativa}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MatchingDetailsContent;

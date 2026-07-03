// src/components/resume/ResumeEditForm.tsx
import { useEffect } from "react";
import { useResumeEdit } from "@/lib/hooks/useResumeEdit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle,
  AlertCircle,
  Plus,
  Trash,
  User,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  Globe,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { User as UserType } from "@/types/user/User";

// Define a schema for personal info section
const personalInfoSchema = z.object({
  nomeCompleto: z
    .string()
    .min(3, "Nome completo deve ter pelo menos 3 caracteres"),
  telefone: z.string().optional(),
  dataNascimento: z.string().optional(),
  perfil: z.object({
    titulo: z
      .string()
      .min(3, "Título profissional deve ter pelo menos 3 caracteres"),
    resumoProfissional: z.string().optional(),
    anosExperiencia: z.coerce.number().min(0),
    pretensaoSalarial: z.coerce.number().min(0).optional(),
    disponibilidade: z.string().optional(),
  }),
  links: z.object({
    linkedin: z.string().url("URL inválida").optional().or(z.literal("")),
    github: z.string().url("URL inválida").optional().or(z.literal("")),
    portfolio: z.string().url("URL inválida").optional().or(z.literal("")),
  }),
});

// Experience schema
const experienceSchema = z.object({
  experiencias: z.array(
    z.object({
      empresa: z.string().min(2, "Nome da empresa é obrigatório"),
      cargo: z.string().min(2, "Cargo é obrigatório"),
      descricao: z.string().optional(),
      dataInicio: z.string().min(1, "Data de início é obrigatória"),
      dataFim: z.string().optional().or(z.literal("")),
      atual: z.boolean().default(false),
      tecnologias: z.array(z.string()).default([]),
      realizacoes: z.array(z.string()).default([]),
    })
  ),
});

// Education schema
const educationSchema = z.object({
  formacoes: z.array(
    z.object({
      instituicao: z.string().min(2, "Instituição é obrigatória"),
      curso: z.string().min(2, "Curso é obrigatório"),
      grau: z.string().min(2, "Grau é obrigatório"),
      area: z.string().optional(),
      dataInicio: z.string().min(1, "Data de início é obrigatória"),
      dataFim: z.string().optional().or(z.literal("")),
      concluido: z.boolean().default(true),
    })
  ),
});

// Skills schema
const skillsSchema = z.object({
  habilidades: z.array(
    z.object({
      nome: z.string().min(1, "Nome da habilidade é obrigatório"),
      nivel: z.string().min(1, "Nível é obrigatório"),
      anosExperiencia: z.coerce.number().min(0),
      projetosRelevantes: z.array(z.string()).default([]),
    })
  ),
});

// Languages schema
const languagesSchema = z.object({
  idiomas: z.array(
    z.object({
      nome: z.string().min(1, "Nome do idioma é obrigatório"),
      nivelLeitura: z.string().min(1, "Nível de leitura é obrigatório"),
      nivelEscrita: z.string().min(1, "Nível de escrita é obrigatório"),
      nivelConversacao: z
        .string()
        .min(1, "Nível de conversação é obrigatório"),
    })
  ),
});

// Certifications schema
const certificationsSchema = z.object({
  certificacoes: z.array(
    z.object({
      nome: z.string().min(1, "Nome da certificação é obrigatório"),
      emissor: z.string().min(1, "Emissor é obrigatório"),
      dataObtencao: z.string().min(1, "Data de obtenção é obrigatória"),
      dataValidade: z.string().optional().or(z.literal("")),
      codigoValidade: z.string().optional(),
    })
  ),
});

// Combine all schemas into the main form schema
const resumeFormSchema = personalInfoSchema
  .merge(experienceSchema)
  .merge(educationSchema)
  .merge(skillsSchema)
  .merge(languagesSchema)
  .merge(certificationsSchema);

// Infer the form values type from the schema
type ResumeFormValues = z.infer<typeof resumeFormSchema>;

interface ResumeEditFormProps {
  userId?: string;
  onSuccess?: () => void;
  redirectPath?: string;
}

export function ResumeEditForm({
  userId,
  onSuccess,
  redirectPath = "/dashboard",
}: ResumeEditFormProps) {
  const { userData, isLoading, error, success, updateResume, fetchUserData } =
    useResumeEdit(userId);

  // Initialize form with react-hook-form
  const form = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeFormSchema) as any,
    defaultValues: {
      nomeCompleto: "",
      telefone: "",
      dataNascimento: "",
      perfil: {
        titulo: "",
        resumoProfissional: "",
        anosExperiencia: 0,
        pretensaoSalarial: 0,
        disponibilidade: "",
      },
      links: {
        linkedin: "",
        github: "",
        portfolio: "",
      },
      experiencias: [],
      formacoes: [],
      habilidades: [],
      idiomas: [],
      certificacoes: [],
    },
  });

  // Set up field arrays for dynamic fields
  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({ control: form.control as any, name: "experiencias" });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({ control: form.control as any, name: "formacoes" });

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({
    control: form.control as any,
    name: "habilidades",
  });

  const {
    fields: languageFields,
    append: appendLanguage,
    remove: removeLanguage,
  } = useFieldArray({ control: form.control as any, name: "idiomas" });

  const {
    fields: certificationFields,
    append: appendCertification,
    remove: removeCertification,
  } = useFieldArray({ control: form.control as any, name: "certificacoes" });

  // Update form when userData changes
  useEffect(() => {
    if (userData) {
      // Reset form with user data
      form.reset({
        nomeCompleto: userData.nomeCompleto || "",
        telefone: userData.telefone || "",
        dataNascimento: userData.dataNascimento || "",
        perfil: {
          titulo: userData.perfil?.titulo || "",
          resumoProfissional: userData.perfil?.resumoProfissional || "",
          anosExperiencia: userData.perfil?.anosExperiencia || 0,
          pretensaoSalarial: userData.perfil?.pretensaoSalarial || 0,
          disponibilidade: userData.perfil?.disponibilidade || "",
        },
        links: {
          linkedin: userData.links?.linkedin || "",
          github: userData.links?.github || "",
          portfolio: userData.links?.portfolio || "",
        },
        experiencias: userData.experiencias || [],
        formacoes: userData.formacoes || [],
        habilidades: userData.habilidades || [],
        idiomas: userData.idiomas || [],
        certificacoes: userData.certificacoes || [],
      });
    }
  }, [userData, form]);

  // Handle form submission
  const onSubmit = async (data: ResumeFormValues) => {
    const updateSuccess = await updateResume(data as Partial<UserType>);

    if (updateSuccess) {
      if (onSuccess) {
        onSuccess();
      } else if (redirectPath) {
        // Wait a moment to show success message
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 2000);
      }
    }
  };

  // Handle a refresh of data
  const handleRefresh = () => {
    fetchUserData();
  };

  // Empty states for field arrays
  const emptyExperience = {
    empresa: "",
    cargo: "",
    descricao: "",
    dataInicio: "",
    dataFim: "",
    atual: false,
    tecnologias: [],
    realizacoes: [],
  };

  const emptyEducation = {
    instituicao: "",
    curso: "",
    grau: "",
    area: "",
    dataInicio: "",
    dataFim: "",
    concluido: true,
  };

  const emptySkill = {
    nome: "",
    nivel: "Intermediário",
    anosExperiencia: 0,
    projetosRelevantes: [],
  };

  const emptyLanguage = {
    nome: "",
    nivelLeitura: "Intermediário",
    nivelEscrita: "Intermediário",
    nivelConversacao: "Intermediário",
  };

  const emptyCertification = {
    nome: "",
    emissor: "",
    dataObtencao: "",
    dataValidade: "",
    codigoValidade: "",
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Editar Currículo</CardTitle>
          <CardDescription>
            Revise e edite as informações extraídas do seu currículo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Dados atualizados com sucesso!</AlertTitle>
              <AlertDescription>
                Seu currículo foi atualizado no sistema.
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Carregando dados do currículo...</p>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit as any)}
                className="space-y-8"
              >
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">
                      Informações Pessoais
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nomeCompleto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(00) 00000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataNascimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de nascimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="perfil.titulo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título profissional</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Desenvolvedor Full Stack"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="perfil.resumoProfissional"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resumo profissional</FormLabel>
                        <FormControl>
                          <textarea
                            className="w-full min-h-[100px] rounded-md border border-input px-3 py-2 text-sm"
                            placeholder="Breve descrição da sua carreira e objetivos"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="perfil.anosExperiencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Anos de experiência</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="perfil.pretensaoSalarial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pretensão salarial</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="R$"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="perfil.disponibilidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disponibilidade</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Imediata, 30 dias"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="links.linkedin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn</FormLabel>
                          <FormControl>
                            <Input placeholder="URL do LinkedIn" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="links.github"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GitHub</FormLabel>
                          <FormControl>
                            <Input placeholder="URL do GitHub" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="links.portfolio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Portfólio</FormLabel>
                          <FormControl>
                            <Input placeholder="URL do portfólio" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Experience Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">
                        Experiência Profissional
                      </h2>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendExperience(emptyExperience)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>

                  {experienceFields.length === 0 ? (
                    <div className="text-center py-4 border rounded-md border-dashed">
                      <p className="text-muted-foreground">
                        Nenhuma experiência profissional cadastrada
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => appendExperience(emptyExperience)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Adicionar Experiência
                      </Button>
                    </div>
                  ) : (
                    experienceFields.map((field, index) => (
                      <Card key={field.id} className="relative">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute right-2 top-2"
                          onClick={() => removeExperience(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>

                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`experiencias.${index}.empresa`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Empresa</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Nome da empresa"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`experiencias.${index}.cargo`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cargo</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Seu cargo" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`experiencias.${index}.descricao`}
                            render={({ field }) => (
                              <FormItem className="mb-4">
                                <FormLabel>Descrição das atividades</FormLabel>
                                <FormControl>
                                  <textarea
                                    className="w-full min-h-[100px] rounded-md border border-input px-3 py-2 text-sm"
                                    placeholder="Descreva suas principais atividades e responsabilidades"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`experiencias.${index}.dataInicio`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Data de início</FormLabel>
                                  <FormControl>
                                    <Input type="month" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`experiencias.${index}.dataFim`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Data de término</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="month"
                                      {...field}
                                      disabled={form.getValues(
                                        `experiencias.${index}.atual`
                                      )}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`experiencias.${index}.atual`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-end space-x-3 rounded-md">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="h-4 w-4"
                                    />
                                  </FormControl>
                                  <FormLabel>Emprego atual</FormLabel>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`experiencias.${index}.tecnologias`}
                            render={({ field }) => (
                              <FormItem className="mb-4">
                                <FormLabel>Tecnologias utilizadas</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Separe as tecnologias por vírgula (ex: React, Node.js, MongoDB)"
                                    value={
                                      Array.isArray(field.value)
                                        ? field.value.join(", ")
                                        : field.value
                                    }
                                    onChange={(e) => {
                                      try {
                                        const value = e.target.value;
                                        // Only process as array when submitting or when focusing out
                                        field.onChange(value);
                                      } catch (error) {
                                        console.error(
                                          "Error processing input:",
                                          error
                                        );
                                        field.onChange(e.target.value);
                                      }
                                    }}
                                    onBlur={(e) => {
                                      // Process as array when field loses focus
                                      const value = e.target.value;
                                      if (typeof value === "string") {
                                        field.onChange(
                                          value
                                            .split(",")
                                            .map((item) => item.trim())
                                            .filter(Boolean)
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Lista de tecnologias, frameworks e ferramentas
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`experiencias.${index}.realizacoes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Principais realizações</FormLabel>
                                <FormControl>
                                  <textarea
                                    className="w-full min-h-[100px] rounded-md border border-input px-3 py-2 text-sm"
                                    placeholder="Uma realização por linha"
                                    // Use a controlled component approach
                                    value={
                                      Array.isArray(field.value)
                                        ? field.value.join("\n")
                                        : ""
                                    }
                                    // Make this a regular input that doesn't process on every keystroke
                                    onChange={(e) => {
                                      // Get the raw input value
                                      const rawValue = e.target.value;

                                      // Store the raw lines
                                      const lines = rawValue.split("\n");

                                      // Update the field with minimal processing
                                      field.onChange(lines);
                                    }}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Liste suas principais conquistas e realizações
                                  nesta posição
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* Education Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">
                        Formação Acadêmica
                      </h2>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendEducation(emptyEducation)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>

                  {educationFields.length === 0 ? (
                    <div className="text-center py-4 border rounded-md border-dashed">
                      <p className="text-muted-foreground">
                        Nenhuma formação acadêmica cadastrada
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => appendEducation(emptyEducation)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Adicionar Formação
                      </Button>
                    </div>
                  ) : (
                    educationFields.map((field, index) => (
                      <Card key={field.id} className="relative">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute right-2 top-2"
                          onClick={() => removeEducation(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>

                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`formacoes.${index}.instituicao`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Instituição</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Nome da instituição"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`formacoes.${index}.curso`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Curso</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Nome do curso"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`formacoes.${index}.grau`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Grau</FormLabel>
                                  <FormControl>
                                    <select
                                      className="w-full h-9 rounded-md border border-input px-3 py-1 text-sm"
                                      {...field}
                                    >
                                      <option value="">Selecione o grau</option>
                                      <option value="Técnico">Técnico</option>
                                      <option value="Superior">Superior</option>
                                      <option value="Pós-graduação">
                                        Pós-graduação
                                      </option>
                                      <option value="MBA">MBA</option>
                                      <option value="Mestrado">Mestrado</option>
                                      <option value="Doutorado">
                                        Doutorado
                                      </option>
                                    </select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`formacoes.${index}.area`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Área</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Ex: Ciência da Computação"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`formacoes.${index}.dataInicio`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Data de início</FormLabel>
                                  <FormControl>
                                    <Input type="month" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`formacoes.${index}.dataFim`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Data de conclusão</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="month"
                                      {...field}
                                      disabled={
                                        !form.getValues(
                                          `formacoes.${index}.concluido`
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`formacoes.${index}.concluido`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-end space-x-3 rounded-md">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="h-4 w-4"
                                    />
                                  </FormControl>
                                  <FormLabel>Concluído</FormLabel>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* Skills Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">
                        Habilidades Técnicas
                      </h2>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendSkill(emptySkill)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>

                  {skillFields.length === 0 ? (
                    <div className="text-center py-4 border rounded-md border-dashed">
                      <p className="text-muted-foreground">
                        Nenhuma habilidade técnica cadastrada
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => appendSkill(emptySkill)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Adicionar Habilidade
                      </Button>
                    </div>
                  ) : (
                    skillFields.map((field, index) => (
                      <Card key={field.id} className="relative">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute right-2 top-2"
                          onClick={() => removeSkill(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>

                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`habilidades.${index}.nome`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Habilidade</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Ex: Python, React"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`habilidades.${index}.nivel`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nível</FormLabel>
                                  <FormControl>
                                    <select
                                      className="w-full h-9 rounded-md border border-input px-3 py-1 text-sm"
                                      {...field}
                                    >
                                      <option value="Básico">Básico</option>
                                      <option value="Intermediário">
                                        Intermediário
                                      </option>
                                      <option value="Avançado">Avançado</option>
                                      <option value="Especialista">
                                        Especialista
                                      </option>
                                    </select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`habilidades.${index}.anosExperiencia`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Anos de experiência</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`habilidades.${index}.projetosRelevantes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Projetos relevantes</FormLabel>
                                <FormControl>
                                  <textarea
                                    className="w-full min-h-[60px] rounded-md border border-input px-3 py-2 text-sm"
                                    placeholder="Um projeto por linha"
                                    value={
                                      Array.isArray(field.value)
                                        ? field.value.join("\n")
                                        : ""
                                    }
                                    // Use keyDown event to handle Enter key properly
                                    onKeyDown={(e) => {
                                      // Allow normal Enter key behavior
                                      if (e.key === "Enter") {
                                        // Don't prevent default - let the textarea handle the newline
                                        return;
                                      }
                                    }}
                                    onChange={(e) => {
                                      // Get the raw text with all spaces and line breaks preserved
                                      const rawText = e.target.value;

                                      // Simply split by newlines without additional processing
                                      const projects = rawText.split("\n");

                                      // Update the field value
                                      field.onChange(projects);
                                    }}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Liste projetos em que utilizou esta habilidade
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* Languages Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">Idiomas</h2>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendLanguage(emptyLanguage)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>

                  {languageFields.length === 0 ? (
                    <div className="text-center py-4 border rounded-md border-dashed">
                      <p className="text-muted-foreground">
                        Nenhum idioma cadastrado
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => appendLanguage(emptyLanguage)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Adicionar Idioma
                      </Button>
                    </div>
                  ) : (
                    languageFields.map((field, index) => (
                      <Card key={field.id} className="relative">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute right-2 top-2"
                          onClick={() => removeLanguage(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>

                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormField
                              control={form.control}
                              name={`idiomas.${index}.nome`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Idioma</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Ex: Inglês, Espanhol"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`idiomas.${index}.nivelLeitura`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Leitura</FormLabel>
                                  <FormControl>
                                    <select
                                      className="w-full h-9 rounded-md border border-input px-3 py-1 text-sm"
                                      {...field}
                                    >
                                      <option value="Básico">Básico</option>
                                      <option value="Intermediário">
                                        Intermediário
                                      </option>
                                      <option value="Avançado">Avançado</option>
                                      <option value="Fluente">Fluente</option>
                                    </select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`idiomas.${index}.nivelEscrita`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Escrita</FormLabel>
                                  <FormControl>
                                    <select
                                      className="w-full h-9 rounded-md border border-input px-3 py-1 text-sm"
                                      {...field}
                                    >
                                      <option value="Básico">Básico</option>
                                      <option value="Intermediário">
                                        Intermediário
                                      </option>
                                      <option value="Avançado">Avançado</option>
                                      <option value="Fluente">Fluente</option>
                                    </select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`idiomas.${index}.nivelConversacao`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Conversação</FormLabel>
                                  <FormControl>
                                    <select
                                      className="w-full h-9 rounded-md border border-input px-3 py-1 text-sm"
                                      {...field}
                                    >
                                      <option value="Básico">Básico</option>
                                      <option value="Intermediário">
                                        Intermediário
                                      </option>
                                      <option value="Avançado">Avançado</option>
                                      <option value="Fluente">Fluente</option>
                                    </select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* Certifications Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">Certificações</h2>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendCertification(emptyCertification)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>

                  {certificationFields.length === 0 ? (
                    <div className="text-center py-4 border rounded-md border-dashed">
                      <p className="text-muted-foreground">
                        Nenhuma certificação cadastrada
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => appendCertification(emptyCertification)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Adicionar Certificação
                      </Button>
                    </div>
                  ) : (
                    certificationFields.map((field, index) => (
                      <Card key={field.id} className="relative">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute right-2 top-2"
                          onClick={() => removeCertification(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>

                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`certificacoes.${index}.nome`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome da certificação</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Ex: AWS Certified Developer"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`certificacoes.${index}.emissor`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Emissor</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Ex: Amazon Web Services"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`certificacoes.${index}.dataObtencao`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Data de obtenção</FormLabel>
                                  <FormControl>
                                    <Input type="month" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`certificacoes.${index}.dataValidade`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Data de validade</FormLabel>
                                  <FormControl>
                                    <Input type="month" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`certificacoes.${index}.codigoValidade`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Código de validação</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Código ou credencial ID"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isLoading}
                  >
                    Cancelar alterações
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ResumeEditForm;

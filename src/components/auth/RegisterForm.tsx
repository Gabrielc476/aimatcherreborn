import { useState } from "react";
import { useRegister } from "../../lib/hooks/useRegister";
import { RegisterRequest } from "@/types/auth/RegisterRequest";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface RegisterFormProps {
  onSuccess?: () => void;
  redirectPath?: string;
}

// Form validation schema
const registerFormSchema = z
  .object({
    nome_completo: z.string().min(3, {
      message: "O nome deve ter pelo menos 3 caracteres.",
    }),
    email: z.string().email({
      message: "Digite um email válido.",
    }),
    senha: z.string().min(8, {
      message: "A senha deve ter pelo menos 8 caracteres.",
    }),
    confirmacao_senha: z.string(),
  })
  .refine((data) => data.senha === data.confirmacao_senha, {
    message: "As senhas não correspondem",
    path: ["confirmacao_senha"],
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export function RegisterForm({
  onSuccess,
  redirectPath = "/login",
}: RegisterFormProps) {
  const { register, isLoading, error, success } = useRegister();

  // Initialize form with react-hook-form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      nome_completo: "",
      email: "",
      senha: "",
      confirmacao_senha: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    // Remove confirmation password before sending to API
    const { confirmacao_senha, ...registerData } = data;

    const registerSuccess = await register(registerData as RegisterRequest);

    if (registerSuccess) {
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Criar conta</CardTitle>
        <CardDescription>
          Registre-se para começar a usar o sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>
              Registro realizado com sucesso! Redirecionando para o login...
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome_completo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input placeholder="João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="joao@exemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmacao_senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full mt-6" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrar"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <a href="/login" className="text-primary hover:underline">
            Faça login
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}

export default RegisterForm;

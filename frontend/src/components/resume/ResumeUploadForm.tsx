// src/components/resume/ResumeUploadForm.tsx
import { useState, useRef } from "react";
import { useResumeUpload } from "@/lib/hooks/useResumeUpload";
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
import { FileUp, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { AuthApi } from "@/lib/api/authApi";
import { useRouter } from "next/navigation";

interface ResumeUploadFormProps {
  onSuccess?: () => void;
  redirectPath?: string;
}

export function ResumeUploadForm({
  onSuccess,
  redirectPath = "/resume/edit",
}: ResumeUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { uploadResume, isLoading, error, success, uploadResponse } =
    useResumeUpload();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      return;
    }

    try {
      const uploadSuccess = await uploadResume(selectedFile);

      if (uploadSuccess && uploadResponse) {
        // Ensure the user data gets refreshed upon successful upload
        // Wait a bit for server-side processing to complete
        const userId = AuthApi.getCurrentUserId();
        if (userId) {
          try {
            // Attempt to fetch the updated user data
            const response = await AuthApi.getUserDetails(userId);
            if (response.status === 200 && response.data) {
              // Update local storage with the new user data
              localStorage.setItem(
                AuthApi.USER_KEY,
                JSON.stringify(response.data)
              );
            }
          } catch (err) {
            console.error("Failed to refresh user data after upload:", err);
          }
        }

        // Wait a moment to show success message before redirecting
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else if (redirectPath) {
            // Get the current user ID for the redirect
            const userId = AuthApi.getCurrentUserId();
            if (userId) {
              // Construct the full path with the user ID
              const fullRedirectPath = redirectPath.startsWith("/")
                ? `/${userId}${redirectPath}`
                : `/${userId}/${redirectPath}`;

              router.push(fullRedirectPath);
            } else {
              // Fallback to window.location if router is not available or userId can't be found
              window.location.href = redirectPath;
            }
          }
        }, 3000);
      }
    } catch (error) {
      console.error("Error during upload:", error);
    }
  };

  const handleButtonClick = () => {
    // Trigger file input click when button is clicked
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Upload de Currículo</CardTitle>
        <CardDescription>
          Faça upload do seu currículo em formato PDF para análise
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
            <AlertTitle>Upload concluído com sucesso!</AlertTitle>
            <AlertDescription>
              {uploadResponse ? (
                <div className="mt-2">
                  <p>Dados extraídos:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Nome: {uploadResponse.dadosExtraidos.nome}</li>
                    <li>Email: {uploadResponse.dadosExtraidos.email}</li>
                    <li>Perfil: {uploadResponse.dadosExtraidos.perfil}</li>
                    <li>
                      {uploadResponse.dadosExtraidos.experiencias} experiências
                    </li>
                    <li>{uploadResponse.dadosExtraidos.formacao} formações</li>
                    <li>
                      {uploadResponse.dadosExtraidos.habilidades} habilidades
                    </li>
                    <li>{uploadResponse.dadosExtraidos.idiomas} idiomas</li>
                  </ul>
                  <p className="mt-2">Redirecionando para edição...</p>
                </div>
              ) : (
                "Seu currículo foi processado com sucesso!"
              )}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resume-file">Arquivo de Currículo (PDF)</Label>

            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                id="resume-file"
                name="resume-file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="sr-only"
                required
              />

              <Button
                type="button"
                variant="outline"
                onClick={handleButtonClick}
                className="flex-1"
              >
                <FileUp className="h-4 w-4 mr-2" />
                {selectedFile ? selectedFile.name : "Selecionar arquivo"}
              </Button>

              {selectedFile && (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-auto whitespace-nowrap"
                >
                  {isLoading ? "Enviando..." : "Enviar"}
                  {!isLoading && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              )}
            </div>

            {selectedFile && (
              <p className="text-sm text-muted-foreground mt-1">
                Arquivo selecionado: {selectedFile.name} (
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Formatos suportados: PDF (máximo 5MB)
        </p>
      </CardFooter>
    </Card>
  );
}

export default ResumeUploadForm;

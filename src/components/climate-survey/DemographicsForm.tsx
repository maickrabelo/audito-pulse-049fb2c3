import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { demographicOptions } from "@/data/gptwQuestions";

export interface Demographics {
  gender: string;
  ageRange: string;
  tenure: string;
  education: string;
  role: string;
  department: string;
}

interface DemographicsFormProps {
  values: Demographics;
  onChange: (field: keyof Demographics, value: string) => void;
  departments: string[];
}

export function DemographicsForm({ values, onChange, departments }: DemographicsFormProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">Dados Demográficos</h3>
        <p className="text-sm text-muted-foreground">
          Estas informações são confidenciais e serão utilizadas apenas para análise estatística
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Departamento */}
        <div className="space-y-2">
          <Label htmlFor="department">Departamento/Área</Label>
          <Select value={values.department} onValueChange={(val) => onChange('department', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione seu departamento" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gênero */}
        <div className="space-y-2">
          <Label htmlFor="gender">Gênero</Label>
          <Select value={values.gender} onValueChange={(val) => onChange('gender', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {demographicOptions.gender.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Faixa Etária */}
        <div className="space-y-2">
          <Label htmlFor="ageRange">Faixa Etária</Label>
          <Select value={values.ageRange} onValueChange={(val) => onChange('ageRange', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {demographicOptions.ageRange.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tempo de Empresa */}
        <div className="space-y-2">
          <Label htmlFor="tenure">Tempo de Empresa</Label>
          <Select value={values.tenure} onValueChange={(val) => onChange('tenure', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {demographicOptions.tenure.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Escolaridade */}
        <div className="space-y-2">
          <Label htmlFor="education">Escolaridade</Label>
          <Select value={values.education} onValueChange={(val) => onChange('education', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {demographicOptions.education.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cargo */}
        <div className="space-y-2">
          <Label htmlFor="role">Nível de Cargo</Label>
          <Select value={values.role} onValueChange={(val) => onChange('role', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {demographicOptions.role.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

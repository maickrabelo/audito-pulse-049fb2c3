export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          created_at: string
          error_message: string | null
          error_stack: string | null
          event_type: string
          id: string
          metadata: Json | null
          page_path: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contract_signed: boolean | null
          contract_signed_at: string | null
          contract_signed_ip: string | null
          contract_url: string | null
          cpf: string
          created_at: string
          email: string
          endereco_completo: string
          estado_civil: string
          first_access_completed: boolean | null
          id: string
          nome_completo: string
          phone: string | null
          profissao: string
          referral_code: string
          rejection_reason: string | null
          rg: string
          status: string
          terms_accepted: boolean | null
          terms_accepted_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contract_signed?: boolean | null
          contract_signed_at?: string | null
          contract_signed_ip?: string | null
          contract_url?: string | null
          cpf: string
          created_at?: string
          email: string
          endereco_completo: string
          estado_civil: string
          first_access_completed?: boolean | null
          id?: string
          nome_completo: string
          phone?: string | null
          profissao: string
          referral_code?: string
          rejection_reason?: string | null
          rg: string
          status?: string
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contract_signed?: boolean | null
          contract_signed_at?: string | null
          contract_signed_ip?: string | null
          contract_url?: string | null
          cpf?: string
          created_at?: string
          email?: string
          endereco_completo?: string
          estado_civil?: string
          first_access_completed?: boolean | null
          id?: string
          nome_completo?: string
          phone?: string | null
          profissao?: string
          referral_code?: string
          rejection_reason?: string | null
          rg?: string
          status?: string
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          company_id: string | null
          completion_tokens: number
          cost_usd: number
          created_at: string
          function_name: string
          id: string
          metadata: Json
          model: string
          prompt_tokens: number
          report_id: string | null
          total_tokens: number
        }
        Insert: {
          company_id?: string | null
          completion_tokens?: number
          cost_usd?: number
          created_at?: string
          function_name: string
          id?: string
          metadata?: Json
          model: string
          prompt_tokens?: number
          report_id?: string | null
          total_tokens?: number
        }
        Update: {
          company_id?: string | null
          completion_tokens?: number
          cost_usd?: number
          created_at?: string
          function_name?: string
          id?: string
          metadata?: Json
          model?: string
          prompt_tokens?: number
          report_id?: string | null
          total_tokens?: number
        }
        Relationships: []
      }
      analises_tecnicas: {
        Row: {
          conclusao_tecnica: string
          created_at: string
          emitido_em: string
          evidencias_avaliadas: string | null
          fatores_identificados: string | null
          id: string
          necessita_monitoramento: boolean
          necessita_pgr: boolean
          necessita_treinamento: boolean
          pilares_confirmados: Database["public"]["Enums"]["pilar_psicossocial"][]
          recomendacoes: string | null
          report_id: string
          responsavel_id: string | null
          updated_at: string
        }
        Insert: {
          conclusao_tecnica: string
          created_at?: string
          emitido_em?: string
          evidencias_avaliadas?: string | null
          fatores_identificados?: string | null
          id?: string
          necessita_monitoramento?: boolean
          necessita_pgr?: boolean
          necessita_treinamento?: boolean
          pilares_confirmados?: Database["public"]["Enums"]["pilar_psicossocial"][]
          recomendacoes?: string | null
          report_id: string
          responsavel_id?: string | null
          updated_at?: string
        }
        Update: {
          conclusao_tecnica?: string
          created_at?: string
          emitido_em?: string
          evidencias_avaliadas?: string | null
          fatores_identificados?: string | null
          id?: string
          necessita_monitoramento?: boolean
          necessita_pgr?: boolean
          necessita_treinamento?: boolean
          pilares_confirmados?: Database["public"]["Enums"]["pilar_psicossocial"][]
          recomendacoes?: string | null
          report_id?: string
          responsavel_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analises_tecnicas_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analises_tecnicas_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports_public"
            referencedColumns: ["id"]
          },
        ]
      }
      burnout_answers: {
        Row: {
          answer_value: number
          created_at: string | null
          id: string
          question_number: number
          response_id: string
        }
        Insert: {
          answer_value: number
          created_at?: string | null
          id?: string
          question_number: number
          response_id: string
        }
        Update: {
          answer_value?: number
          created_at?: string | null
          id?: string
          question_number?: number
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "burnout_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "burnout_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      burnout_assessments: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          start_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "burnout_assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "burnout_assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      burnout_departments: {
        Row: {
          assessment_id: string
          created_at: string | null
          employee_count: number | null
          id: string
          name: string
          order_index: number | null
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          employee_count?: number | null
          id?: string
          name: string
          order_index?: number | null
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          employee_count?: number | null
          id?: string
          name?: string
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "burnout_departments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "burnout_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      burnout_responses: {
        Row: {
          assessment_id: string
          completed_at: string | null
          created_at: string | null
          demographics: Json | null
          department: string | null
          id: string
          respondent_token: string
          risk_level: string | null
          total_score: number | null
        }
        Insert: {
          assessment_id: string
          completed_at?: string | null
          created_at?: string | null
          demographics?: Json | null
          department?: string | null
          id?: string
          respondent_token: string
          risk_level?: string | null
          total_score?: number | null
        }
        Update: {
          assessment_id?: string
          completed_at?: string | null
          created_at?: string | null
          demographics?: Json | null
          department?: string | null
          id?: string
          respondent_token?: string
          risk_level?: string | null
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "burnout_responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "burnout_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rate_limits: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          request_count: number | null
          session_id: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          request_count?: number | null
          session_id: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          request_count?: number | null
          session_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      classificacao_versoes: {
        Row: {
          autor_id: string | null
          competencia:
            | Database["public"]["Enums"]["competencia_denuncia"]
            | null
          confianca: number | null
          created_at: string
          id: string
          justificativa: string | null
          origem: string
          parte_amo: string | null
          parte_empresa: string | null
          payload: Json | null
          pilares: Database["public"]["Enums"]["pilar_psicossocial"][]
          prioridade: Database["public"]["Enums"]["prioridade_denuncia"] | null
          report_id: string
          risco_grave_imediato:
            | Database["public"]["Enums"]["risco_imediato"]
            | null
          versao: number
        }
        Insert: {
          autor_id?: string | null
          competencia?:
            | Database["public"]["Enums"]["competencia_denuncia"]
            | null
          confianca?: number | null
          created_at?: string
          id?: string
          justificativa?: string | null
          origem: string
          parte_amo?: string | null
          parte_empresa?: string | null
          payload?: Json | null
          pilares?: Database["public"]["Enums"]["pilar_psicossocial"][]
          prioridade?: Database["public"]["Enums"]["prioridade_denuncia"] | null
          report_id: string
          risco_grave_imediato?:
            | Database["public"]["Enums"]["risco_imediato"]
            | null
          versao: number
        }
        Update: {
          autor_id?: string | null
          competencia?:
            | Database["public"]["Enums"]["competencia_denuncia"]
            | null
          confianca?: number | null
          created_at?: string
          id?: string
          justificativa?: string | null
          origem?: string
          parte_amo?: string | null
          parte_empresa?: string | null
          payload?: Json | null
          pilares?: Database["public"]["Enums"]["pilar_psicossocial"][]
          prioridade?: Database["public"]["Enums"]["prioridade_denuncia"] | null
          report_id?: string
          risco_grave_imediato?:
            | Database["public"]["Enums"]["risco_imediato"]
            | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "classificacao_versoes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classificacao_versoes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports_public"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_surveys: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "climate_surveys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "climate_surveys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          emergency_contacts: Json | null
          id: string
          logo_url: string | null
          max_employees: number | null
          name: string
          notification_email_1: string | null
          notification_email_2: string | null
          notification_email_3: string | null
          phone: string | null
          referred_by_affiliate_id: string | null
          referred_by_partner_id: string | null
          slug: string | null
          soc_export_code: string | null
          soc_unit_code: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          emergency_contacts?: Json | null
          id?: string
          logo_url?: string | null
          max_employees?: number | null
          name: string
          notification_email_1?: string | null
          notification_email_2?: string | null
          notification_email_3?: string | null
          phone?: string | null
          referred_by_affiliate_id?: string | null
          referred_by_partner_id?: string | null
          slug?: string | null
          soc_export_code?: string | null
          soc_unit_code?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          emergency_contacts?: Json | null
          id?: string
          logo_url?: string | null
          max_employees?: number | null
          name?: string
          notification_email_1?: string | null
          notification_email_2?: string | null
          notification_email_3?: string | null
          phone?: string | null
          referred_by_affiliate_id?: string | null
          referred_by_partner_id?: string | null
          slug?: string | null
          soc_export_code?: string | null
          soc_unit_code?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_referred_by_affiliate_id_fkey"
            columns: ["referred_by_affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_referred_by_partner_id_fkey"
            columns: ["referred_by_partner_id"]
            isOneToOne: false
            referencedRelation: "licensed_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      company_sst_assignments: {
        Row: {
          assigned_at: string | null
          company_id: string
          id: string
          sst_manager_id: string
        }
        Insert: {
          assigned_at?: string | null
          company_id: string
          id?: string
          sst_manager_id: string
        }
        Update: {
          assigned_at?: string | null
          company_id?: string
          id?: string
          sst_manager_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_sst_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_sst_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_sst_assignments_sst_manager_id_fkey"
            columns: ["sst_manager_id"]
            isOneToOne: false
            referencedRelation: "sst_managers"
            referencedColumns: ["id"]
          },
        ]
      }
      comunicacoes: {
        Row: {
          assunto: string | null
          canal: string
          created_at: string
          destinatario: string
          erro: string | null
          evento: string
          id: string
          report_id: string | null
          status_entrega: string
          template: string | null
        }
        Insert: {
          assunto?: string | null
          canal?: string
          created_at?: string
          destinatario: string
          erro?: string | null
          evento: string
          id?: string
          report_id?: string | null
          status_entrega?: string
          template?: string | null
        }
        Update: {
          assunto?: string | null
          canal?: string
          created_at?: string
          destinatario?: string
          erro?: string | null
          evento?: string
          id?: string
          report_id?: string | null
          status_entrega?: string
          template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comunicacoes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicacoes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports_public"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_auditoria: {
        Row: {
          acao: string
          antes: Json | null
          ator_id: string | null
          ator_papel: string | null
          created_at: string
          depois: Json | null
          entidade: string
          entidade_id: string | null
          id: string
          ip: string | null
          justificativa: string | null
          report_id: string | null
        }
        Insert: {
          acao: string
          antes?: Json | null
          ator_id?: string | null
          ator_papel?: string | null
          created_at?: string
          depois?: Json | null
          entidade: string
          entidade_id?: string | null
          id?: string
          ip?: string | null
          justificativa?: string | null
          report_id?: string | null
        }
        Update: {
          acao?: string
          antes?: Json | null
          ator_id?: string | null
          ator_papel?: string | null
          created_at?: string
          depois?: Json | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          ip?: string | null
          justificativa?: string | null
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_auditoria_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_auditoria_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports_public"
            referencedColumns: ["id"]
          },
        ]
      }
      feriados: {
        Row: {
          abrangencia: string
          company_id: string | null
          created_at: string
          data: string
          descricao: string
          id: string
        }
        Insert: {
          abrangencia?: string
          company_id?: string | null
          created_at?: string
          data: string
          descricao: string
          id?: string
        }
        Update: {
          abrangencia?: string
          company_id?: string | null
          created_at?: string
          data?: string
          descricao?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feriados_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feriados_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      hseit_answers: {
        Row: {
          answer_value: number
          created_at: string
          id: string
          question_number: number
          response_id: string
        }
        Insert: {
          answer_value: number
          created_at?: string
          id?: string
          question_number: number
          response_id: string
        }
        Update: {
          answer_value?: number
          created_at?: string
          id?: string
          question_number?: number
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hseit_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "hseit_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      hseit_assessments: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hseit_assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hseit_assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      hseit_departments: {
        Row: {
          assessment_id: string
          created_at: string
          employee_count: number
          id: string
          name: string
          order_index: number
        }
        Insert: {
          assessment_id: string
          created_at?: string
          employee_count?: number
          id?: string
          name: string
          order_index?: number
        }
        Update: {
          assessment_id?: string
          created_at?: string
          employee_count?: number
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "hseit_departments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "hseit_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      hseit_responses: {
        Row: {
          assessment_id: string
          completed_at: string | null
          created_at: string
          demographics: Json | null
          department: string | null
          id: string
          respondent_token: string
        }
        Insert: {
          assessment_id: string
          completed_at?: string | null
          created_at?: string
          demographics?: Json | null
          department?: string | null
          id?: string
          respondent_token: string
        }
        Update: {
          assessment_id?: string
          completed_at?: string | null
          created_at?: string
          demographics?: Json | null
          department?: string | null
          id?: string
          respondent_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "hseit_responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "hseit_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      licensed_partners: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cnpj: string
          contract_signed: boolean | null
          contract_signed_at: string | null
          contract_signed_ip: string | null
          contract_url: string | null
          created_at: string
          email: string
          endereco_completo: string
          first_access_completed: boolean | null
          id: string
          nome_fantasia: string
          phone: string | null
          razao_social: string
          referral_code: string
          rejection_reason: string | null
          status: string
          terms_accepted: boolean | null
          terms_accepted_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cnpj: string
          contract_signed?: boolean | null
          contract_signed_at?: string | null
          contract_signed_ip?: string | null
          contract_url?: string | null
          created_at?: string
          email: string
          endereco_completo: string
          first_access_completed?: boolean | null
          id?: string
          nome_fantasia: string
          phone?: string | null
          razao_social: string
          referral_code?: string
          rejection_reason?: string | null
          status?: string
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cnpj?: string
          contract_signed?: boolean | null
          contract_signed_at?: string | null
          contract_signed_ip?: string | null
          contract_url?: string | null
          created_at?: string
          email?: string
          endereco_completo?: string
          first_access_completed?: boolean | null
          id?: string
          nome_fantasia?: string
          phone?: string | null
          razao_social?: string
          referral_code?: string
          rejection_reason?: string | null
          status?: string
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      parametros_canal: {
        Row: {
          anexo_max_mb: number
          anexo_max_qtd: number
          anexo_tipos_permitidos: string[]
          aprovadores_encerramento: number
          canais_notificacao: string[]
          company_id: string | null
          confianca_minima: number
          created_at: string
          id: string
          lembretes_complementacao: number
          min_grupo_indicadores: number
          politica_cpf: string
          prazo_complementacao_dias: number
          prioridade_risco_indeterminado: Database["public"]["Enums"]["prioridade_denuncia"]
          prioridade_risco_nao: Database["public"]["Enums"]["prioridade_denuncia"]
          retencao_cpf_hash_meses: number
          retencao_denuncia_meses: number
          uf_calendario: string
          updated_at: string
        }
        Insert: {
          anexo_max_mb?: number
          anexo_max_qtd?: number
          anexo_tipos_permitidos?: string[]
          aprovadores_encerramento?: number
          canais_notificacao?: string[]
          company_id?: string | null
          confianca_minima?: number
          created_at?: string
          id?: string
          lembretes_complementacao?: number
          min_grupo_indicadores?: number
          politica_cpf?: string
          prazo_complementacao_dias?: number
          prioridade_risco_indeterminado?: Database["public"]["Enums"]["prioridade_denuncia"]
          prioridade_risco_nao?: Database["public"]["Enums"]["prioridade_denuncia"]
          retencao_cpf_hash_meses?: number
          retencao_denuncia_meses?: number
          uf_calendario?: string
          updated_at?: string
        }
        Update: {
          anexo_max_mb?: number
          anexo_max_qtd?: number
          anexo_tipos_permitidos?: string[]
          aprovadores_encerramento?: number
          canais_notificacao?: string[]
          company_id?: string | null
          confianca_minima?: number
          created_at?: string
          id?: string
          lembretes_complementacao?: number
          min_grupo_indicadores?: number
          politica_cpf?: string
          prazo_complementacao_dias?: number
          prioridade_risco_indeterminado?: Database["public"]["Enums"]["prioridade_denuncia"]
          prioridade_risco_nao?: Database["public"]["Enums"]["prioridade_denuncia"]
          retencao_cpf_hash_meses?: number
          retencao_denuncia_meses?: number
          uf_calendario?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parametros_canal_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parametros_canal_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_prospects: {
        Row: {
          company_name: string
          contact_name: string | null
          converted_company_id: string | null
          created_at: string
          email: string | null
          id: string
          notes: string | null
          partner_id: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_name: string
          contact_name?: string | null
          converted_company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          partner_id: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_name?: string | null
          converted_company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          partner_id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_prospects_converted_company_id_fkey"
            columns: ["converted_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_prospects_converted_company_id_fkey"
            columns: ["converted_company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_prospects_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "licensed_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_representatives: {
        Row: {
          cpf: string
          created_at: string
          id: string
          is_primary: boolean | null
          nome: string
          partner_id: string
          rg: string
        }
        Insert: {
          cpf: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          nome: string
          partner_id: string
          rg: string
        }
        Update: {
          cpf?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          nome?: string
          partner_id?: string
          rg?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_representatives_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "licensed_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_acao: {
        Row: {
          acao: string
          concluido_em: string | null
          created_at: string
          evidencia_conclusao: string | null
          id: string
          observacoes: string | null
          prazo: string
          report_id: string
          responsavel_id: string | null
          responsavel_nome: string
          status: string
          subtratativa_id: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          acao: string
          concluido_em?: string | null
          created_at?: string
          evidencia_conclusao?: string | null
          id?: string
          observacoes?: string | null
          prazo: string
          report_id: string
          responsavel_id?: string | null
          responsavel_nome: string
          status?: string
          subtratativa_id?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          acao?: string
          concluido_em?: string | null
          created_at?: string
          evidencia_conclusao?: string | null
          id?: string
          observacoes?: string | null
          prazo?: string
          report_id?: string
          responsavel_id?: string | null
          responsavel_nome?: string
          status?: string
          subtratativa_id?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planos_acao_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_acao_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_acao_subtratativa_id_fkey"
            columns: ["subtratativa_id"]
            isOneToOne: false
            referencedRelation: "subtratativas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          full_name: string | null
          id: string
          must_change_password: boolean | null
          sst_manager_id: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          must_change_password?: boolean | null
          sst_manager_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          must_change_password?: boolean | null
          sst_manager_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_sst_manager_id_fkey"
            columns: ["sst_manager_id"]
            isOneToOne: false
            referencedRelation: "sst_managers"
            referencedColumns: ["id"]
          },
        ]
      }
      report_access_audit: {
        Row: {
          accessed_at: string
          id: string
          justification: string | null
          report_id: string
          user_id: string
          user_role: string | null
        }
        Insert: {
          accessed_at?: string
          id?: string
          justification?: string | null
          report_id: string
          user_id: string
          user_role?: string | null
        }
        Update: {
          accessed_at?: string
          id?: string
          justification?: string | null
          report_id?: string
          user_id?: string
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_access_audit_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_access_audit_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports_public"
            referencedColumns: ["id"]
          },
        ]
      }
      report_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          report_id: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          report_id?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_attachments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_attachments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports_public"
            referencedColumns: ["id"]
          },
        ]
      }
      report_updates: {
        Row: {
          created_at: string
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
          report_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
          report_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
          report_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_updates_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_updates_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports_public"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          acao_recomendada: Json
          aceite_politica_privacidade: boolean
          ai_classification:
            | Database["public"]["Enums"]["report_classification"]
            | null
          ai_classification_rationale: string | null
          ai_summary: string | null
          amo_validated_at: string | null
          amo_validated_by: string | null
          amo_validated_classification:
            | Database["public"]["Enums"]["report_classification"]
            | null
          amo_validation_notes: string | null
          autorizacao_para_contato: boolean
          canal_de_contato: string | null
          category: string
          classificado_em: string | null
          classificado_por: string | null
          company_id: string
          competencia:
            | Database["public"]["Enums"]["competencia_denuncia"]
            | null
          confianca_ia: number | null
          created_at: string
          dados_faltantes: Json
          data_fim_ocorrencia: string | null
          data_inicio_ocorrencia: string | null
          declaracao_de_boa_fe: boolean
          department: string | null
          description: string
          documentos_sugeridos: Json
          empresa_confirmou_recebimento_em: string | null
          escalation_sent_at: string | null
          estado: Database["public"]["Enums"]["estado_denuncia"]
          evidencias_disponiveis: string | null
          ha_risco_imediato_informado: boolean | null
          ia_schema_valido: boolean
          id: string
          is_anonymous: boolean
          justificativa_humana: string | null
          local_ocorrencia: string | null
          parte_amo: string | null
          parte_empresa: string | null
          periodo_descritivo: string | null
          pessoas_envolvidas: string | null
          pilares: Database["public"]["Enums"]["pilar_psicossocial"][]
          prioridade: Database["public"]["Enums"]["prioridade_denuncia"] | null
          reporter_email: string | null
          reporter_name: string | null
          reporter_phone: string | null
          risco_grave_imediato:
            | Database["public"]["Enums"]["risco_imediato"]
            | null
          snapshot_cargo: string | null
          snapshot_cbo: string | null
          snapshot_ghe: string | null
          snapshot_unidade: string | null
          status: string
          testemunhas: string | null
          title: string
          tracking_code: string | null
          trechos_relevantes: Json
          triador_id: string | null
          updated_at: string
          urgency: string
          versao_classificacao: number
        }
        Insert: {
          acao_recomendada?: Json
          aceite_politica_privacidade?: boolean
          ai_classification?:
            | Database["public"]["Enums"]["report_classification"]
            | null
          ai_classification_rationale?: string | null
          ai_summary?: string | null
          amo_validated_at?: string | null
          amo_validated_by?: string | null
          amo_validated_classification?:
            | Database["public"]["Enums"]["report_classification"]
            | null
          amo_validation_notes?: string | null
          autorizacao_para_contato?: boolean
          canal_de_contato?: string | null
          category: string
          classificado_em?: string | null
          classificado_por?: string | null
          company_id: string
          competencia?:
            | Database["public"]["Enums"]["competencia_denuncia"]
            | null
          confianca_ia?: number | null
          created_at?: string
          dados_faltantes?: Json
          data_fim_ocorrencia?: string | null
          data_inicio_ocorrencia?: string | null
          declaracao_de_boa_fe?: boolean
          department?: string | null
          description: string
          documentos_sugeridos?: Json
          empresa_confirmou_recebimento_em?: string | null
          escalation_sent_at?: string | null
          estado?: Database["public"]["Enums"]["estado_denuncia"]
          evidencias_disponiveis?: string | null
          ha_risco_imediato_informado?: boolean | null
          ia_schema_valido?: boolean
          id?: string
          is_anonymous?: boolean
          justificativa_humana?: string | null
          local_ocorrencia?: string | null
          parte_amo?: string | null
          parte_empresa?: string | null
          periodo_descritivo?: string | null
          pessoas_envolvidas?: string | null
          pilares?: Database["public"]["Enums"]["pilar_psicossocial"][]
          prioridade?: Database["public"]["Enums"]["prioridade_denuncia"] | null
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          risco_grave_imediato?:
            | Database["public"]["Enums"]["risco_imediato"]
            | null
          snapshot_cargo?: string | null
          snapshot_cbo?: string | null
          snapshot_ghe?: string | null
          snapshot_unidade?: string | null
          status?: string
          testemunhas?: string | null
          title: string
          tracking_code?: string | null
          trechos_relevantes?: Json
          triador_id?: string | null
          updated_at?: string
          urgency?: string
          versao_classificacao?: number
        }
        Update: {
          acao_recomendada?: Json
          aceite_politica_privacidade?: boolean
          ai_classification?:
            | Database["public"]["Enums"]["report_classification"]
            | null
          ai_classification_rationale?: string | null
          ai_summary?: string | null
          amo_validated_at?: string | null
          amo_validated_by?: string | null
          amo_validated_classification?:
            | Database["public"]["Enums"]["report_classification"]
            | null
          amo_validation_notes?: string | null
          autorizacao_para_contato?: boolean
          canal_de_contato?: string | null
          category?: string
          classificado_em?: string | null
          classificado_por?: string | null
          company_id?: string
          competencia?:
            | Database["public"]["Enums"]["competencia_denuncia"]
            | null
          confianca_ia?: number | null
          created_at?: string
          dados_faltantes?: Json
          data_fim_ocorrencia?: string | null
          data_inicio_ocorrencia?: string | null
          declaracao_de_boa_fe?: boolean
          department?: string | null
          description?: string
          documentos_sugeridos?: Json
          empresa_confirmou_recebimento_em?: string | null
          escalation_sent_at?: string | null
          estado?: Database["public"]["Enums"]["estado_denuncia"]
          evidencias_disponiveis?: string | null
          ha_risco_imediato_informado?: boolean | null
          ia_schema_valido?: boolean
          id?: string
          is_anonymous?: boolean
          justificativa_humana?: string | null
          local_ocorrencia?: string | null
          parte_amo?: string | null
          parte_empresa?: string | null
          periodo_descritivo?: string | null
          pessoas_envolvidas?: string | null
          pilares?: Database["public"]["Enums"]["pilar_psicossocial"][]
          prioridade?: Database["public"]["Enums"]["prioridade_denuncia"] | null
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          risco_grave_imediato?:
            | Database["public"]["Enums"]["risco_imediato"]
            | null
          snapshot_cargo?: string | null
          snapshot_cbo?: string | null
          snapshot_ghe?: string | null
          snapshot_unidade?: string | null
          status?: string
          testemunhas?: string | null
          title?: string
          tracking_code?: string | null
          trechos_relevantes?: Json
          triador_id?: string | null
          updated_at?: string
          urgency?: string
          versao_classificacao?: number
        }
        Relationships: [
          {
            foreignKeyName: "reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_prazos: {
        Row: {
          alerta_enviado_em: string | null
          concluido_em: string | null
          created_at: string
          em_atraso: boolean
          evento: string
          id: string
          iniciado_em: string
          limite_em: string | null
          motivo_pausa: string | null
          pausado_em: string | null
          report_id: string
          total_pausa_segundos: number
          updated_at: string
        }
        Insert: {
          alerta_enviado_em?: string | null
          concluido_em?: string | null
          created_at?: string
          em_atraso?: boolean
          evento: string
          id?: string
          iniciado_em?: string
          limite_em?: string | null
          motivo_pausa?: string | null
          pausado_em?: string | null
          report_id: string
          total_pausa_segundos?: number
          updated_at?: string
        }
        Update: {
          alerta_enviado_em?: string | null
          concluido_em?: string | null
          created_at?: string
          em_atraso?: boolean
          evento?: string
          id?: string
          iniciado_em?: string
          limite_em?: string | null
          motivo_pausa?: string | null
          pausado_em?: string | null
          report_id?: string
          total_pausa_segundos?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sla_prazos_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_prazos_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports_public"
            referencedColumns: ["id"]
          },
        ]
      }
      soc_employees: {
        Row: {
          cargo: string | null
          cbo: string | null
          company_id: string
          cpf_hash: string
          cpf_last4: string | null
          created_at: string
          ghe: string | null
          id: string
          matricula: string | null
          setor: string | null
          situacao: string | null
          synced_at: string
          unidade: string | null
          updated_at: string
        }
        Insert: {
          cargo?: string | null
          cbo?: string | null
          company_id: string
          cpf_hash: string
          cpf_last4?: string | null
          created_at?: string
          ghe?: string | null
          id?: string
          matricula?: string | null
          setor?: string | null
          situacao?: string | null
          synced_at?: string
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          cargo?: string | null
          cbo?: string | null
          company_id?: string
          cpf_hash?: string
          cpf_last4?: string | null
          created_at?: string
          ghe?: string | null
          id?: string
          matricula?: string | null
          setor?: string | null
          situacao?: string | null
          synced_at?: string
          unidade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "soc_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soc_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      soc_sync_logs: {
        Row: {
          company_id: string
          error_message: string | null
          finished_at: string | null
          id: string
          started_at: string
          status: string
          total_employees: number | null
          triggered_by: string | null
        }
        Insert: {
          company_id: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
          total_employees?: number | null
          triggered_by?: string | null
        }
        Update: {
          company_id?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
          total_employees?: number | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soc_sync_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soc_sync_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_evidencia: {
        Row: {
          atendida_em: string | null
          attachment_id: string | null
          created_at: string
          descricao: string | null
          destinatario: string
          documento: string
          id: string
          prazo_limite: string | null
          report_id: string
          solicitado_por: string | null
          status: string
          subtratativa_id: string | null
          updated_at: string
        }
        Insert: {
          atendida_em?: string | null
          attachment_id?: string | null
          created_at?: string
          descricao?: string | null
          destinatario?: string
          documento: string
          id?: string
          prazo_limite?: string | null
          report_id: string
          solicitado_por?: string | null
          status?: string
          subtratativa_id?: string | null
          updated_at?: string
        }
        Update: {
          atendida_em?: string | null
          attachment_id?: string | null
          created_at?: string
          descricao?: string | null
          destinatario?: string
          documento?: string
          id?: string
          prazo_limite?: string | null
          report_id?: string
          solicitado_por?: string | null
          status?: string
          subtratativa_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_evidencia_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "report_attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_evidencia_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_evidencia_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_evidencia_subtratativa_id_fkey"
            columns: ["subtratativa_id"]
            isOneToOne: false
            referencedRelation: "subtratativas"
            referencedColumns: ["id"]
          },
        ]
      }
      sst_managers: {
        Row: {
          address: string | null
          cnpj: string | null
          contract_expires_at: string | null
          contract_signed_at: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          max_companies: number
          name: string
          onboarding_completed_pages: Json | null
          phone: string | null
          slug: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          contract_expires_at?: string | null
          contract_signed_at?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          max_companies?: number
          name: string
          onboarding_completed_pages?: Json | null
          phone?: string | null
          slug?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          contract_expires_at?: string | null
          contract_signed_at?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          max_companies?: number
          name?: string
          onboarding_completed_pages?: Json | null
          phone?: string | null
          slug?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sst_portal_documents: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          file_name: string
          file_url: string
          id: string
          target_sst_manager_ids: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name: string
          file_url: string
          id?: string
          target_sst_manager_ids?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name?: string
          file_url?: string
          id?: string
          target_sst_manager_ids?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sst_portal_messages: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_pinned: boolean | null
          target_sst_manager_ids: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          target_sst_manager_ids?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          target_sst_manager_ids?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sst_portal_trainings: {
        Row: {
          category: string | null
          content_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          target_sst_manager_ids: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          target_sst_manager_ids?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          target_sst_manager_ids?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          base_price_cents: number
          created_at: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_employees: number | null
          min_employees: number
          name: string
          price_per_employee_cents: number | null
          slug: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string | null
        }
        Insert: {
          base_price_cents: number
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_employees?: number | null
          min_employees: number
          name: string
          price_per_employee_cents?: number | null
          slug: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price_cents?: number
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_employees?: number | null
          min_employees?: number
          name?: string
          price_per_employee_cents?: number | null
          slug?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          company_id: string
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          employee_count: number
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          employee_count: number
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          employee_count?: number
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subtratativas: {
        Row: {
          concluida_em: string | null
          conclusao: string | null
          created_at: string
          escopo: Database["public"]["Enums"]["escopo_subtratativa"]
          estado: Database["public"]["Enums"]["estado_denuncia"]
          id: string
          prazo_limite: string | null
          report_id: string
          responsavel_id: string | null
          resumo: string
          updated_at: string
        }
        Insert: {
          concluida_em?: string | null
          conclusao?: string | null
          created_at?: string
          escopo: Database["public"]["Enums"]["escopo_subtratativa"]
          estado?: Database["public"]["Enums"]["estado_denuncia"]
          id?: string
          prazo_limite?: string | null
          report_id: string
          responsavel_id?: string | null
          resumo: string
          updated_at?: string
        }
        Update: {
          concluida_em?: string | null
          conclusao?: string | null
          created_at?: string
          escopo?: Database["public"]["Enums"]["escopo_subtratativa"]
          estado?: Database["public"]["Enums"]["estado_denuncia"]
          id?: string
          prazo_limite?: string | null
          report_id?: string
          responsavel_id?: string | null
          resumo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtratativas_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtratativas_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports_public"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_answers: {
        Row: {
          answer_text: string | null
          answer_value: string | null
          created_at: string
          id: string
          question_id: string
          response_id: string
        }
        Insert: {
          answer_text?: string | null
          answer_value?: string | null
          created_at?: string
          id?: string
          question_id: string
          response_id: string
        }
        Update: {
          answer_text?: string | null
          answer_value?: string | null
          created_at?: string
          id?: string
          question_id?: string
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_departments: {
        Row: {
          created_at: string
          employee_count: number
          id: string
          name: string
          order_index: number
          survey_id: string
        }
        Insert: {
          created_at?: string
          employee_count?: number
          id?: string
          name: string
          order_index?: number
          survey_id: string
        }
        Update: {
          created_at?: string
          employee_count?: number
          id?: string
          name?: string
          order_index?: number
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_departments_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "climate_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_required: boolean
          options: Json | null
          order_index: number
          question_text: string
          question_type: Database["public"]["Enums"]["survey_question_type"]
          survey_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          order_index?: number
          question_text: string
          question_type?: Database["public"]["Enums"]["survey_question_type"]
          survey_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          order_index?: number
          question_text?: string
          question_type?: Database["public"]["Enums"]["survey_question_type"]
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "climate_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          completed_at: string | null
          created_at: string
          demographics: Json | null
          department: string | null
          id: string
          respondent_token: string
          survey_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          demographics?: Json | null
          department?: string | null
          id?: string
          respondent_token: string
          survey_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          demographics?: Json | null
          department?: string | null
          id?: string
          respondent_token?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "climate_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      companies_public: {
        Row: {
          id: string | null
          logo_url: string | null
          name: string | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      reports_public: {
        Row: {
          category: string | null
          company_id: string | null
          created_at: string | null
          department: string | null
          id: string | null
          is_anonymous: boolean | null
          status: string | null
          title: string | null
          tracking_code: string | null
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          department?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          status?: string | null
          title?: string | null
          tracking_code?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          department?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          status?: string | null
          title?: string | null
          tracking_code?: string | null
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      count_sst_companies: {
        Args: { _sst_manager_id: string }
        Returns: number
      }
      generate_tracking_code: { Args: never; Returns: string }
      get_sst_max_companies: {
        Args: { _sst_manager_id: string }
        Returns: number
      }
      get_user_sst_manager_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_amo_team: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "company"
        | "sst"
        | "pending"
        | "partner"
        | "affiliate"
        | "apurador"
        | "comite"
        | "dpo"
        | "triador_sst"
        | "medico_trabalho"
      competencia_denuncia:
        | "SST_NR1"
        | "EMPRESA_CLIENTE"
        | "DENUNCIA_MISTA"
        | "INFORMACOES_INSUFICIENTES"
      escopo_subtratativa: "AMO" | "EMPRESA"
      estado_denuncia:
        | "RECEBIDA"
        | "VALIDACAO_DE_VINCULO"
        | "AGUARDANDO_TRIAGEM"
        | "EM_TRIAGEM"
        | "AGUARDANDO_COMPLEMENTACAO"
        | "AGUARDANDO_VALIDACAO_HUMANA"
        | "CLASSIFICADA"
        | "ALERTA_CRITICO_ATIVO"
        | "ENCAMINHADA_AMO"
        | "ENCAMINHADA_EMPRESA"
        | "EM_TRATATIVA_MISTA"
        | "AGUARDANDO_EVIDENCIAS"
        | "EM_ANALISE_TECNICA_AMO"
        | "EM_APURACAO_EMPRESA"
        | "MEDIDAS_DEFINIDAS"
        | "PLANO_DE_ACAO_ABERTO"
        | "EM_ACOMPANHAMENTO"
        | "AGUARDANDO_VALIDACAO_DE_ENCERRAMENTO"
        | "ENCERRADA"
        | "ARQUIVADA"
      pilar_psicossocial:
        | "PT-00"
        | "PT-01"
        | "PT-02"
        | "PT-03"
        | "PT-04"
        | "PT-05"
        | "PT-06"
      prioridade_denuncia: "CRITICA" | "ALTA" | "MODERADA" | "BAIXA"
      report_classification:
        | "pending_ai"
        | "4A_sst"
        | "4B_out_of_scope"
        | "4C_mixed"
        | "4D_grave_immediate"
      risco_imediato: "SIM" | "NAO" | "INDETERMINADO"
      survey_question_type:
        | "likert"
        | "single_choice"
        | "multiple_choice"
        | "scale_0_10"
        | "open_text"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "company",
        "sst",
        "pending",
        "partner",
        "affiliate",
        "apurador",
        "comite",
        "dpo",
        "triador_sst",
        "medico_trabalho",
      ],
      competencia_denuncia: [
        "SST_NR1",
        "EMPRESA_CLIENTE",
        "DENUNCIA_MISTA",
        "INFORMACOES_INSUFICIENTES",
      ],
      escopo_subtratativa: ["AMO", "EMPRESA"],
      estado_denuncia: [
        "RECEBIDA",
        "VALIDACAO_DE_VINCULO",
        "AGUARDANDO_TRIAGEM",
        "EM_TRIAGEM",
        "AGUARDANDO_COMPLEMENTACAO",
        "AGUARDANDO_VALIDACAO_HUMANA",
        "CLASSIFICADA",
        "ALERTA_CRITICO_ATIVO",
        "ENCAMINHADA_AMO",
        "ENCAMINHADA_EMPRESA",
        "EM_TRATATIVA_MISTA",
        "AGUARDANDO_EVIDENCIAS",
        "EM_ANALISE_TECNICA_AMO",
        "EM_APURACAO_EMPRESA",
        "MEDIDAS_DEFINIDAS",
        "PLANO_DE_ACAO_ABERTO",
        "EM_ACOMPANHAMENTO",
        "AGUARDANDO_VALIDACAO_DE_ENCERRAMENTO",
        "ENCERRADA",
        "ARQUIVADA",
      ],
      pilar_psicossocial: [
        "PT-00",
        "PT-01",
        "PT-02",
        "PT-03",
        "PT-04",
        "PT-05",
        "PT-06",
      ],
      prioridade_denuncia: ["CRITICA", "ALTA", "MODERADA", "BAIXA"],
      report_classification: [
        "pending_ai",
        "4A_sst",
        "4B_out_of_scope",
        "4C_mixed",
        "4D_grave_immediate",
      ],
      risco_imediato: ["SIM", "NAO", "INDETERMINADO"],
      survey_question_type: [
        "likert",
        "single_choice",
        "multiple_choice",
        "scale_0_10",
        "open_text",
      ],
    },
  },
} as const

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
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
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
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
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
          ai_summary: string | null
          category: string
          company_id: string
          created_at: string
          department: string | null
          description: string
          id: string
          is_anonymous: boolean
          reporter_email: string | null
          reporter_name: string | null
          reporter_phone: string | null
          status: string
          title: string
          tracking_code: string | null
          updated_at: string
          urgency: string
        }
        Insert: {
          ai_summary?: string | null
          category: string
          company_id: string
          created_at?: string
          department?: string | null
          description: string
          id?: string
          is_anonymous?: boolean
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          status?: string
          title: string
          tracking_code?: string | null
          updated_at?: string
          urgency?: string
        }
        Update: {
          ai_summary?: string | null
          category?: string
          company_id?: string
          created_at?: string
          department?: string | null
          description?: string
          id?: string
          is_anonymous?: boolean
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          status?: string
          title?: string
          tracking_code?: string | null
          updated_at?: string
          urgency?: string
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
    }
    Enums: {
      app_role:
        | "admin"
        | "company"
        | "sst"
        | "pending"
        | "partner"
        | "affiliate"
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
      app_role: ["admin", "company", "sst", "pending", "partner", "affiliate"],
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

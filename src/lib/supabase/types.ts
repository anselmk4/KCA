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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          audience: string | null
          content: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_pinned: boolean | null
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          blockchain_network: string | null
          blockchain_tx_hash: string | null
          code: string
          course_id: string
          created_at: string
          enrollment_id: string | null
          expires_at: string | null
          grade: number | null
          id: string
          issued_at: string
          pdf_url: string | null
          quiz_attempt_id: string | null
          revoke_reason: string | null
          revoked_at: string | null
          status: Database["public"]["Enums"]["certificate_status"]
          student_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          blockchain_network?: string | null
          blockchain_tx_hash?: string | null
          code: string
          course_id: string
          created_at?: string
          enrollment_id?: string | null
          expires_at?: string | null
          grade?: number | null
          id?: string
          issued_at?: string
          pdf_url?: string | null
          quiz_attempt_id?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["certificate_status"]
          student_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          blockchain_network?: string | null
          blockchain_tx_hash?: string | null
          code?: string
          course_id?: string
          created_at?: string
          enrollment_id?: string | null
          expires_at?: string | null
          grade?: number | null
          id?: string
          issued_at?: string
          pdf_url?: string | null
          quiz_attempt_id?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["certificate_status"]
          student_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_quiz_attempt_id_fkey"
            columns: ["quiz_attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_course_id: string | null
          code: string
          created_at: string
          created_by: string | null
          currency: string | null
          current_uses: number | null
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          applicable_course_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          applicable_course_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_applicable_course_id_fkey"
            columns: ["applicable_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sections: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_tags: {
        Row: {
          course_id: string
          id: string
          tag_id: string
        }
        Insert: {
          course_id: string
          id?: string
          tag_id: string
        }
        Update: {
          course_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_tags_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category_id: string | null
          compare_price: number | null
          created_at: string
          currency: string | null
          description: string
          enrollment_count: number | null
          estimated_duration_hours: number | null
          id: string
          instructor_id: string
          is_featured: boolean | null
          is_free: boolean | null
          language: string | null
          level: Database["public"]["Enums"]["difficulty_level"] | null
          max_students: number | null
          preview_video_url: string | null
          price: number
          published_at: string | null
          rating_avg: number | null
          rating_count: number | null
          requires_approval: boolean | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["course_status"]
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          compare_price?: number | null
          created_at?: string
          currency?: string | null
          description?: string
          enrollment_count?: number | null
          estimated_duration_hours?: number | null
          id?: string
          instructor_id: string
          is_featured?: boolean | null
          is_free?: boolean | null
          language?: string | null
          level?: Database["public"]["Enums"]["difficulty_level"] | null
          max_students?: number | null
          preview_video_url?: string | null
          price?: number
          published_at?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          requires_approval?: boolean | null
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["course_status"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          compare_price?: number | null
          created_at?: string
          currency?: string | null
          description?: string
          enrollment_count?: number | null
          estimated_duration_hours?: number | null
          id?: string
          instructor_id?: string
          is_featured?: boolean | null
          is_free?: boolean | null
          language?: string | null
          level?: Database["public"]["Enums"]["difficulty_level"] | null
          max_students?: number | null
          preview_video_url?: string | null
          price?: number
          published_at?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          requires_approval?: boolean | null
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["course_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          enrolled_at: string
          id: string
          last_accessed_at: string | null
          progress_percent: number | null
          status: Database["public"]["Enums"]["student_status"] | null
          student_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          enrolled_at?: string
          id?: string
          last_accessed_at?: string | null
          progress_percent?: number | null
          status?: Database["public"]["Enums"]["student_status"] | null
          student_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          enrolled_at?: string
          id?: string
          last_accessed_at?: string | null
          progress_percent?: number | null
          status?: Database["public"]["Enums"]["student_status"] | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          billing_address: string | null
          billing_email: string | null
          billing_name: string | null
          created_at: string
          currency: string | null
          due_date: string | null
          id: string
          invoice_number: string
          notes: string | null
          order_id: string
          paid_at: string | null
          pdf_url: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_address?: string | null
          billing_email?: string | null
          billing_name?: string | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          order_id: string
          paid_at?: string | null
          pdf_url?: string | null
          status?: string | null
          subtotal: number
          tax_amount?: number | null
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_address?: string | null
          billing_email?: string | null
          billing_name?: string | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          order_id?: string
          paid_at?: string | null
          pdf_url?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          enrollment_id: string
          id: string
          lesson_id: string
          time_spent_seconds: number | null
          updated_at: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          lesson_id: string
          time_spent_seconds?: number | null
          updated_at?: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          lesson_id?: string
          time_spent_seconds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_preview: boolean | null
          is_published: boolean | null
          section_id: string
          sort_order: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean | null
          is_published?: boolean | null
          section_id: string
          sort_order?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean | null
          is_published?: boolean | null
          section_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          course_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          instructor_id: string
          max_attendees: number | null
          meeting_provider: string | null
          meeting_url: string | null
          recording_url: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["session_status"]
          title: string
          updated_at: string
          is_public: boolean
          allowed_user_ids: string[]
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_id: string
          max_attendees?: number | null
          meeting_provider?: string | null
          meeting_url?: string | null
          recording_url?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["session_status"]
          title: string
          updated_at?: string
          is_public?: boolean
          allowed_user_ids?: string[]
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_id?: string
          max_attendees?: number | null
          meeting_provider?: string | null
          meeting_url?: string | null
          recording_url?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          title?: string
          updated_at?: string
          is_public?: boolean
          allowed_user_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          course_id: string
          created_at: string
          discount_amount: number | null
          final_price: number
          id: string
          order_id: string
          unit_price: number
        }
        Insert: {
          course_id: string
          created_at?: string
          discount_amount?: number | null
          final_price: number
          id?: string
          order_id: string
          unit_price: number
        }
        Update: {
          course_id?: string
          created_at?: string
          discount_amount?: number | null
          final_price?: number
          id?: string
          order_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          completed_at: string | null
          coupon_id: string | null
          created_at: string
          currency: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          order_number: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax_amount: number | null
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_amount?: number | null
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_amount?: number | null
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          method: string | null
          order_id: string
          paid_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"] | null
          provider_metadata: Json | null
          provider_transaction_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          method?: string | null
          order_id: string
          paid_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"] | null
          provider_metadata?: Json | null
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          method?: string | null
          order_id?: string
          paid_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"] | null
          provider_metadata?: Json | null
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          commission_rate: number | null
          created_at: string
          currency: string | null
          id: string
          instructor_id: string
          notes: string | null
          payment_method: string | null
          payment_reference: string | null
          period_end: string | null
          period_start: string | null
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          commission_rate?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          instructor_id: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          commission_rate?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          instructor_id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          module: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          module: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          module?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          email_verified: boolean | null
          full_name: string
          id: string
          last_login_at: string | null
          level: Database["public"]["Enums"]["difficulty_level"] | null
          phone: string | null
          plan: Database["public"]["Enums"]["subscription_plan"] | null
          preferred_language: string | null
          status: Database["public"]["Enums"]["student_status"] | null
          timezone: string | null
          two_factor_enabled: boolean | null
          updated_at: string
          nationality: string | null
          website: string | null
          twitter: string | null
          linkedin: string | null
          youtube: string | null
          instagram: string | null
          specialty: string | null
          academy_name: string | null
          academy_tagline: string | null
          academic_background: string | null
          certifications: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          email_verified?: boolean | null
          full_name: string
          id: string
          last_login_at?: string | null
          level?: Database["public"]["Enums"]["difficulty_level"] | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          preferred_language?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
          timezone?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          nationality?: string | null
          website?: string | null
          twitter?: string | null
          linkedin?: string | null
          youtube?: string | null
          instagram?: string | null
          specialty?: string | null
          academy_name?: string | null
          academy_tagline?: string | null
          academic_background?: string | null
          certifications?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean | null
          full_name?: string
          id?: string
          last_login_at?: string | null
          level?: Database["public"]["Enums"]["difficulty_level"] | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          preferred_language?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
          timezone?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          nationality?: string | null
          website?: string | null
          twitter?: string | null
          linkedin?: string | null
          youtube?: string | null
          instagram?: string | null
          specialty?: string | null
          academy_name?: string | null
          academy_tagline?: string | null
          academic_background?: string | null
          certifications?: string | null
        }
        Relationships: []
      }
      program_courses: {
        Row: {
          course_id: string
          id: string
          program_id: string
          sort_order: number | null
        }
        Insert: {
          course_id: string
          id?: string
          program_id: string
          sort_order?: number | null
        }
        Update: {
          course_id?: string
          id?: string
          program_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "program_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean | null
          level: Database["public"]["Enums"]["difficulty_level"] | null
          slug: string
          sort_order: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          level?: Database["public"]["Enums"]["difficulty_level"] | null
          slug: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          level?: Database["public"]["Enums"]["difficulty_level"] | null
          slug?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          choices: Json
          correct_index: number
          created_at: string
          explanation: string | null
          id: string
          points: number | null
          quiz_id: string
          sort_order: number | null
          text: string
          updated_at: string
        }
        Insert: {
          choices?: Json
          correct_index: number
          created_at?: string
          explanation?: string | null
          id?: string
          points?: number | null
          quiz_id: string
          sort_order?: number | null
          text: string
          updated_at?: string
        }
        Update: {
          choices?: Json
          correct_index?: number
          created_at?: string
          explanation?: string | null
          id?: string
          points?: number | null
          quiz_id?: string
          sort_order?: number | null
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          question_id: string
          selected_index: number | null
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id: string
          selected_index?: number | null
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
          selected_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          completed_at: string | null
          created_at: string
          earned_points: number | null
          id: string
          passed: boolean
          quiz_id: string
          score: number
          started_at: string | null
          student_id: string
          time_spent_seconds: number | null
          total_points: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          earned_points?: number | null
          id?: string
          passed?: boolean
          quiz_id: string
          score?: number
          started_at?: string | null
          student_id: string
          time_spent_seconds?: number | null
          total_points?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          earned_points?: number | null
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          started_at?: string | null
          student_id?: string
          time_spent_seconds?: number | null
          total_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean | null
          max_attempts: number | null
          pass_percentage: number | null
          section_id: string | null
          show_correct_answers: boolean | null
          shuffle_questions: boolean | null
          sort_order: number | null
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          max_attempts?: number | null
          pass_percentage?: number | null
          section_id?: string | null
          show_correct_answers?: boolean | null
          shuffle_questions?: boolean | null
          sort_order?: number | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          max_attempts?: number | null
          pass_percentage?: number | null
          section_id?: string | null
          show_correct_answers?: boolean | null
          shuffle_questions?: boolean | null
          sort_order?: number | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          order_id: string
          payment_id: string
          processed_at: string | null
          processed_by: string | null
          provider_refund_id: string | null
          reason: string | null
          status: Database["public"]["Enums"]["refund_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          order_id: string
          payment_id: string
          processed_at?: string | null
          processed_by?: string | null
          provider_refund_id?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          order_id?: string
          payment_id?: string
          processed_at?: string | null
          processed_by?: string | null
          provider_refund_id?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          lesson_id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          lesson_id: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          lesson_id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          course_id: string
          created_at: string
          helpful_count: number | null
          id: string
          is_featured: boolean | null
          rating: number
          status: Database["public"]["Enums"]["review_status"] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          course_id: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          rating: number
          status?: Database["public"]["Enums"]["review_status"] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          course_id?: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          rating?: number
          status?: Database["public"]["Enums"]["review_status"] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_system: boolean | null
          name: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_system?: boolean | null
          name: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_system?: boolean | null
          name?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          description: string | null
          group_name: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_name?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          group_name?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_replies: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          is_internal: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_replies_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          agent_id: string | null
          category: string | null
          closed_at: string | null
          created_at: string
          id: string
          message: string
          priority: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_has_role: {
        Args: {
          check_role: Database["public"]["Enums"]["user_role"]
          check_user_id: string
        }
        Returns: boolean
      }
      user_is_admin: { Args: { check_user_id: string }; Returns: boolean }
      user_is_instructor: { Args: { check_user_id: string }; Returns: boolean }
    }
    Enums: {
      certificate_status: "ELIGIBLE" | "ISSUED" | "REVOKED" | "EXPIRED"
      course_status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED"
      difficulty_level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT"
      notification_type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "SYSTEM"
      order_status:
        | "PENDING"
        | "CONFIRMED"
        | "COMPLETED"
        | "CANCELLED"
        | "REFUNDED"
      payment_provider:
        | "STRIPE"
        | "PAYPAL"
        | "MOBILE_MONEY"
        | "CRYPTO"
        | "MANUAL"
      payment_status:
        | "PENDING"
        | "PROCESSING"
        | "PAID"
        | "FAILED"
        | "REFUNDED"
        | "PARTIALLY_REFUNDED"
        | "CANCELLED"
      payout_status: "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED"
      refund_status: "REQUESTED" | "APPROVED" | "PROCESSED" | "REJECTED"
      review_status: "PENDING" | "APPROVED" | "REJECTED"
      session_status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED"
      student_status:
        | "ACTIVE"
        | "INACTIVE"
        | "SUSPENDED"
        | "COMPLETED"
        | "AT_RISK"
      subscription_plan: "FREE" | "BASE" | "PRO" | "MAX"
      ticket_status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
      user_role:
        | "SUPER_ADMIN"
        | "ADMIN"
        | "FINANCE_ADMIN"
        | "ACADEMIC_ADMIN"
        | "SUPPORT_AGENT"
        | "INSTRUCTOR"
        | "TEACHING_ASSISTANT"
        | "STUDENT"
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
      certificate_status: ["ELIGIBLE", "ISSUED", "REVOKED", "EXPIRED"],
      course_status: ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"],
      difficulty_level: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"],
      notification_type: ["INFO", "SUCCESS", "WARNING", "ERROR", "SYSTEM"],
      order_status: [
        "PENDING",
        "CONFIRMED",
        "COMPLETED",
        "CANCELLED",
        "REFUNDED",
      ],
      payment_provider: [
        "STRIPE",
        "PAYPAL",
        "MOBILE_MONEY",
        "CRYPTO",
        "MANUAL",
        "MOKO_CARD",
      ],
      payment_status: [
        "PENDING",
        "PROCESSING",
        "PAID",
        "FAILED",
        "REFUNDED",
        "PARTIALLY_REFUNDED",
        "CANCELLED",
      ],
      payout_status: ["PENDING", "PROCESSING", "PAID", "FAILED", "CANCELLED"],
      refund_status: ["REQUESTED", "APPROVED", "PROCESSED", "REJECTED"],
      review_status: ["PENDING", "APPROVED", "REJECTED"],
      session_status: ["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"],
      student_status: [
        "ACTIVE",
        "INACTIVE",
        "SUSPENDED",
        "COMPLETED",
        "AT_RISK",
      ],
      subscription_plan: ["FREE", "BASE", "PRO", "MAX"],
      ticket_status: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      user_role: [
        "SUPER_ADMIN",
        "ADMIN",
        "FINANCE_ADMIN",
        "ACADEMIC_ADMIN",
        "SUPPORT_AGENT",
        "INSTRUCTOR",
        "TEACHING_ASSISTANT",
        "STUDENT",
      ],
    },
  },
} as const

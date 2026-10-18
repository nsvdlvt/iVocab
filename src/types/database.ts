export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: "user" | "admin";
          display_name: string | null;
          avatar_url: string | null;
          level: string | null;
          streak: number | null;
          longest_streak: number | null;
          daily_goal: number | null;
          last_activity_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: "user" | "admin";
          display_name?: string | null;
          avatar_url?: string | null;
          level?: string | null;
          streak?: number | null;
          longest_streak?: number | null;
          daily_goal?: number | null;
          last_activity_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: "user" | "admin";
          display_name?: string | null;
          avatar_url?: string | null;
          level?: string | null;
          streak?: number | null;
          longest_streak?: number | null;
          daily_goal?: number | null;
          last_activity_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      vocab_sets: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          slug: string | null;
          description: string | null;
          source_language: string | null;
          target_language: string | null;
          color: string | null;
          icon: string | null;
          visibility: string | null;
          source: string | null;
          created_at: string;
          updated_at: string;
          last_studied_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          slug?: string | null;
          description?: string | null;
          source_language?: string | null;
          target_language?: string | null;
          color?: string | null;
          icon?: string | null;
          visibility?: string | null;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
          last_studied_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          slug?: string | null;
          description?: string | null;
          source_language?: string | null;
          target_language?: string | null;
          color?: string | null;
          icon?: string | null;
          visibility?: string | null;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
          last_studied_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "vocab_sets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      vocabularies: {
        Row: {
          id: string;
          set_id: string;
          owner_id: string;
          word: string;
          ipa: string | null;
          part_of_speech: string | null;
          meaning: string;
          example: string | null;
          example_translation: string | null;
          synonyms: string[] | null;
          antonyms: string[] | null;
          note: string | null;
          image_url: string | null;
          audio_url: string | null;
          difficulty: string | null;
          source: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          fts_vector: unknown | null;
          is_starred: boolean | null;
        };
        Insert: {
          id?: string;
          set_id: string;
          owner_id: string;
          word: string;
          ipa?: string | null;
          part_of_speech?: string | null;
          meaning: string;
          example?: string | null;
          example_translation?: string | null;
          synonyms?: string[] | null;
          antonyms?: string[] | null;
          note?: string | null;
          image_url?: string | null;
          audio_url?: string | null;
          difficulty?: string | null;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          is_starred?: boolean | null;
        };
        Update: {
          id?: string;
          set_id?: string;
          owner_id?: string;
          word?: string;
          ipa?: string | null;
          part_of_speech?: string | null;
          meaning?: string;
          example?: string | null;
          example_translation?: string | null;
          synonyms?: string[] | null;
          antonyms?: string[] | null;
          note?: string | null;
          image_url?: string | null;
          audio_url?: string | null;
          difficulty?: string | null;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          is_starred?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "vocabularies_set_id_fkey";
            columns: ["set_id"];
            isOneToOne: false;
            referencedRelation: "vocab_sets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vocabularies_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      community_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      community_vocabulary_sets: {
        Row: {
          id: string;
          vocabulary_set_id: string;
          community_category_id: string;
          title_snapshot: string;
          description_snapshot: string | null;
          cover_image: string | null;
          difficulty: string;
          estimated_minutes: number | null;
          sort_order: number;
          is_featured: boolean;
          is_active: boolean;
          published_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vocabulary_set_id: string;
          community_category_id: string;
          title_snapshot: string;
          description_snapshot?: string | null;
          cover_image?: string | null;
          difficulty?: string;
          estimated_minutes?: number | null;
          sort_order?: number;
          is_featured?: boolean;
          is_active?: boolean;
          published_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vocabulary_set_id?: string;
          community_category_id?: string;
          title_snapshot?: string;
          description_snapshot?: string | null;
          cover_image?: string | null;
          difficulty?: string;
          estimated_minutes?: number | null;
          sort_order?: number;
          is_featured?: boolean;
          is_active?: boolean;
          published_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_vocabulary_sets_vocabulary_set_id_fkey";
            columns: ["vocabulary_set_id"];
            isOneToOne: false;
            referencedRelation: "vocab_sets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_vocabulary_sets_community_category_id_fkey";
            columns: ["community_category_id"];
            isOneToOne: false;
            referencedRelation: "community_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_vocabulary_sets_published_by_fkey";
            columns: ["published_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      reading_articles: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          cover_image_url: string | null;
          topic: string;
          level: string;
          estimated_reading_minutes: number;
          vocabulary_count: number;
          english_content: Json;
          vietnamese_content: Json;
          status: "draft" | "published";
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          cover_image_url?: string | null;
          topic: string;
          level: string;
          estimated_reading_minutes?: number;
          vocabulary_count?: number;
          english_content: Json;
          vietnamese_content: Json;
          status?: "draft" | "published";
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          cover_image_url?: string | null;
          topic?: string;
          level?: string;
          estimated_reading_minutes?: number;
          vocabulary_count?: number;
          english_content?: Json;
          vietnamese_content?: Json;
          status?: "draft" | "published";
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Relationships: [];
      };
      reading_highlights: {
        Row: {
          id: string;
          user_id: string;
          article_id: string;
          paragraph_id: string;
          language: "en" | "vi";
          selected_text: string;
          color: "yellow" | "green" | "blue" | "pink" | "purple";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          article_id: string;
          paragraph_id: string;
          language: "en" | "vi";
          selected_text: string;
          color: "yellow" | "green" | "blue" | "pink" | "purple";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          article_id?: string;
          paragraph_id?: string;
          language?: "en" | "vi";
          selected_text?: string;
          color?: "yellow" | "green" | "blue" | "pink" | "purple";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reading_highlights_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reading_highlights_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "reading_articles";
            referencedColumns: ["id"];
          }
        ];
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          vocabulary_id: string;
          ease_factor: number | null;
          interval: number | null;
          repetitions: number | null;
          next_review: string | null;
          last_review: string | null;
          last_grade: string | null;
          status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vocabulary_id: string;
          ease_factor?: number | null;
          interval?: number | null;
          repetitions?: number | null;
          next_review?: string | null;
          last_review?: string | null;
          last_grade?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vocabulary_id?: string;
          ease_factor?: number | null;
          interval?: number | null;
          repetitions?: number | null;
          next_review?: string | null;
          last_review?: string | null;
          last_grade?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_vocabulary_id_fkey";
            columns: ["vocabulary_id"];
            isOneToOne: false;
            referencedRelation: "vocabularies";
            referencedColumns: ["id"];
          }
        ];
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          ended_at: string | null;
          studied_words: number | null;
          remembered_words: number | null;
          study_seconds: number | null;
          reviews_completed: number | null;
          quizzes_completed: number | null;
          dictations_completed: number | null;
          sentences_completed: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          started_at?: string;
          ended_at?: string | null;
          studied_words?: number | null;
          remembered_words?: number | null;
          study_seconds?: number | null;
          reviews_completed?: number | null;
          quizzes_completed?: number | null;
          dictations_completed?: number | null;
          sentences_completed?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          started_at?: string;
          ended_at?: string | null;
          studied_words?: number | null;
          remembered_words?: number | null;
          study_seconds?: number | null;
          reviews_completed?: number | null;
          quizzes_completed?: number | null;
          dictations_completed?: number | null;
          sentences_completed?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      quiz_history: {
        Row: {
          id: string;
          user_id: string;
          score: number;
          correct_answers: number;
          total_questions: number;
          duration: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          score: number;
          correct_answers: number;
          total_questions: number;
          duration?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          score?: number;
          correct_answers?: number;
          total_questions?: number;
          duration?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_statistics: {
        Row: {
          user_id: string;
          total_words: number | null;
          learned_words: number | null;
          review_count: number | null;
          current_streak: number | null;
          longest_streak: number | null;
          total_study_time: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          total_words?: number | null;
          learned_words?: number | null;
          review_count?: number | null;
          current_streak?: number | null;
          longest_streak?: number | null;
          total_study_time?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          total_words?: number | null;
          learned_words?: number | null;
          review_count?: number | null;
          current_streak?: number | null;
          longest_streak?: number | null;
          total_study_time?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_statistics_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      sentence_practice_history: {
        Row: {
          id: string;
          user_id: string;
          vocab_set_id: string;
          vocab_id: string;
          attempt_number: number;
          overall_score: number;
          grammar_score: number;
          vocabulary_score: number;
          naturalness_score: number;
          context_score: number;
          richness_score: number;
          used_correctly: boolean;
          user_sentence: string;
          corrected_sentence: string | null;
          advanced_sentence: string | null;
          mistakes_json: Json;
          feedback_json: Json;
          feedback_language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vocab_set_id: string;
          vocab_id: string;
          attempt_number: number;
          overall_score: number;
          grammar_score: number;
          vocabulary_score: number;
          naturalness_score: number;
          context_score: number;
          richness_score: number;
          used_correctly?: boolean;
          user_sentence: string;
          corrected_sentence?: string | null;
          advanced_sentence?: string | null;
          mistakes_json?: Json;
          feedback_json?: Json;
          feedback_language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vocab_set_id?: string;
          vocab_id?: string;
          attempt_number?: number;
          overall_score?: number;
          grammar_score?: number;
          vocabulary_score?: number;
          naturalness_score?: number;
          context_score?: number;
          richness_score?: number;
          used_correctly?: boolean;
          user_sentence?: string;
          corrected_sentence?: string | null;
          advanced_sentence?: string | null;
          mistakes_json?: Json;
          feedback_json?: Json;
          feedback_language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sentence_practice_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sentence_practice_history_vocab_set_id_fkey";
            columns: ["vocab_set_id"];
            isOneToOne: false;
            referencedRelation: "vocab_sets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sentence_practice_history_vocab_id_fkey";
            columns: ["vocab_id"];
            isOneToOne: false;
            referencedRelation: "vocabularies";
            referencedColumns: ["id"];
          }
        ];
      };
      review_sessions: {
        Row: {
          id: string;
          user_id: string;
          vocabulary_set_id: string | null;
          title: string;
          description: string;
          words: Json;
          completed_words: string[];
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vocabulary_set_id?: string | null;
          title: string;
          description: string;
          words: Json;
          completed_words?: string[];
          created_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vocabulary_set_id?: string | null;
          title?: string;
          description?: string;
          words?: Json;
          completed_words?: string[];
          created_at?: string;
          expires_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          device_name: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_successful_delivery_at: string | null;
          last_failure_at: string | null;
          failure_count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          device_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_successful_delivery_at?: string | null;
          last_failure_at?: string | null;
          failure_count?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
          device_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_successful_delivery_at?: string | null;
          last_failure_at?: string | null;
          failure_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      announcement_push_deliveries: {
        Row: {
          id: string;
          announcement_id: string;
          subscription_id: string;
          user_id: string;
          status: string;
          status_code: number | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          announcement_id: string;
          subscription_id: string;
          user_id: string;
          status?: string;
          status_code?: number | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          announcement_id?: string;
          subscription_id?: string;
          user_id?: string;
          status?: string;
          status_code?: number | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          summary: string | null;
          type: "info" | "warning" | "success" | "broadcast";
          priority: "low" | "normal" | "high" | "urgent";
          target_audience: "all" | "free" | "premium" | "admin";
          status: "draft" | "scheduled" | "published" | "archived";
          action_url: string | null;
          is_active: boolean;
          start_at: string | null;
          end_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          published_at: string | null;
          delivery_channels: string;
          push_attempt_count: number;
          push_success_count: number;
          push_failure_count: number;
          push_delivered_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          summary?: string | null;
          type?: "info" | "warning" | "success" | "broadcast";
          priority?: "low" | "normal" | "high" | "urgent";
          target_audience?: "all" | "free" | "premium" | "admin";
          status?: "draft" | "scheduled" | "published" | "archived";
          action_url?: string | null;
          is_active?: boolean;
          start_at?: string | null;
          end_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          delivery_channels?: string;
          push_attempt_count?: number;
          push_success_count?: number;
          push_failure_count?: number;
          push_delivered_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          summary?: string | null;
          type?: "info" | "warning" | "success" | "broadcast";
          priority?: "low" | "normal" | "high" | "urgent";
          target_audience?: "all" | "free" | "premium" | "admin";
          status?: "draft" | "scheduled" | "published" | "archived";
          action_url?: string | null;
          is_active?: boolean;
          start_at?: string | null;
          end_at?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          delivery_channels?: string;
          push_attempt_count?: number;
          push_success_count?: number;
          push_failure_count?: number;
          push_delivered_at?: string | null;
        };
        Relationships: [];
      };
      user_announcement_reads: {
        Row: {
          user_id: string;
          announcement_id: string;
          read_at: string | null;
          dismissed_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          announcement_id: string;
          read_at?: string | null;
          dismissed_at?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          announcement_id?: string;
          read_at?: string | null;
          dismissed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          title_template: string;
          body_template: string;
          type: "info" | "warning" | "success" | "broadcast";
          delivery_channels: "in_app" | "push" | "both";
          priority: "low" | "normal" | "high" | "urgent";
          action_url: string | null;
          status: "draft" | "active" | "paused" | "archived";
          variables_used: string[];
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          title_template: string;
          body_template: string;
          type?: "info" | "warning" | "success" | "broadcast";
          delivery_channels?: "in_app" | "push" | "both";
          priority?: "low" | "normal" | "high" | "urgent";
          action_url?: string | null;
          status?: "draft" | "active" | "paused" | "archived";
          variables_used?: string[];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          title_template?: string;
          body_template?: string;
          type?: "info" | "warning" | "success" | "broadcast";
          delivery_channels?: "in_app" | "push" | "both";
          priority?: "low" | "normal" | "high" | "urgent";
          action_url?: string | null;
          status?: "draft" | "active" | "paused" | "archived";
          variables_used?: string[];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_automation_rules: {
        Row: {
          id: string;
          template_id: string;
          name: string;
          description: string | null;
          trigger_type: "scheduled" | "activity" | "inactivity" | "custom_condition";
          trigger_config: Json;
          target_audience: "all" | "learners" | "has_due_reviews" | "inactive" | "goal_not_completed" | "custom";
          conditions: Json;
          cooldown_hours: number;
          max_per_user_per_day: number;
          is_active: boolean;
          last_run_at: string | null;
          total_runs: number;
          total_sent: number;
          total_failed: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          name: string;
          description?: string | null;
          trigger_type: "scheduled" | "activity" | "inactivity" | "custom_condition";
          trigger_config?: Json;
          target_audience?: "all" | "learners" | "has_due_reviews" | "inactive" | "goal_not_completed" | "custom";
          conditions?: Json;
          cooldown_hours?: number;
          max_per_user_per_day?: number;
          is_active?: boolean;
          last_run_at?: string | null;
          total_runs?: number;
          total_sent?: number;
          total_failed?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          template_id?: string;
          name?: string;
          description?: string | null;
          trigger_type?: "scheduled" | "activity" | "inactivity" | "custom_condition";
          trigger_config?: Json;
          target_audience?: "all" | "learners" | "has_due_reviews" | "inactive" | "goal_not_completed" | "custom";
          conditions?: Json;
          cooldown_hours?: number;
          max_per_user_per_day?: number;
          is_active?: boolean;
          last_run_at?: string | null;
          total_runs?: number;
          total_sent?: number;
          total_failed?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_user_preferences: {
        Row: {
          user_id: string;
          study_reminders: boolean;
          review_reminders: boolean;
          streak_reminders: boolean;
          inactivity_reminders: boolean;
          milestone_reminders: boolean;
          quiet_hours_enabled: boolean;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          study_reminders?: boolean;
          review_reminders?: boolean;
          streak_reminders?: boolean;
          inactivity_reminders?: boolean;
          milestone_reminders?: boolean;
          quiet_hours_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          study_reminders?: boolean;
          review_reminders?: boolean;
          streak_reminders?: boolean;
          inactivity_reminders?: boolean;
          milestone_reminders?: boolean;
          quiet_hours_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_in_app_notifications: {
        Row: {
          id: string;
          user_id: string;
          template_id: string | null;
          rule_id: string | null;
          title: string;
          content: string;
          summary: string | null;
          type: "info" | "warning" | "success" | "broadcast";
          priority: "low" | "normal" | "high" | "urgent";
          action_url: string | null;
          is_read: boolean;
          read_at: string | null;
          dismissed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id?: string | null;
          rule_id?: string | null;
          title: string;
          content: string;
          summary?: string | null;
          type?: "info" | "warning" | "success" | "broadcast";
          priority?: "low" | "normal" | "high" | "urgent";
          action_url?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          dismissed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          template_id?: string | null;
          rule_id?: string | null;
          title?: string;
          content?: string;
          summary?: string | null;
          type?: "info" | "warning" | "success" | "broadcast";
          priority?: "low" | "normal" | "high" | "urgent";
          action_url?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          dismissed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_automation_runs: {
        Row: {
          id: string;
          rule_id: string;
          trigger_type: string;
          status: "running" | "completed" | "failed" | "partial";
          eligible_recipients: number;
          processed_count: number;
          in_app_sent_count: number;
          push_sent_count: number;
          skipped_count: number;
          failed_count: number;
          error_details: Json;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          rule_id: string;
          trigger_type: string;
          status?: "running" | "completed" | "failed" | "partial";
          eligible_recipients?: number;
          processed_count?: number;
          in_app_sent_count?: number;
          push_sent_count?: number;
          skipped_count?: number;
          failed_count?: number;
          error_details?: Json;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          rule_id?: string;
          trigger_type?: string;
          status?: "running" | "completed" | "failed" | "partial";
          eligible_recipients?: number;
          processed_count?: number;
          in_app_sent_count?: number;
          push_sent_count?: number;
          skipped_count?: number;
          failed_count?: number;
          error_details?: Json;
          started_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      notification_delivery_logs: {
        Row: {
          id: string;
          run_id: string | null;
          rule_id: string | null;
          template_id: string | null;
          user_id: string;
          idempotency_key: string;
          channel: "in_app" | "push" | "both";
          in_app_status: "sent" | "failed" | "skipped" | "none" | null;
          push_status: "sent" | "failed" | "skipped" | "none" | "expired" | null;
          rendered_title: string;
          rendered_body: string;
          variables_snapshot: Json;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id?: string | null;
          rule_id?: string | null;
          template_id?: string | null;
          user_id: string;
          idempotency_key: string;
          channel: "in_app" | "push" | "both";
          in_app_status?: "sent" | "failed" | "skipped" | "none" | null;
          push_status?: "sent" | "failed" | "skipped" | "none" | "expired" | null;
          rendered_title: string;
          rendered_body: string;
          variables_snapshot?: Json;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string | null;
          rule_id?: string | null;
          template_id?: string | null;
          user_id?: string;
          idempotency_key?: string;
          channel?: "in_app" | "push" | "both";
          in_app_status?: "sent" | "failed" | "skipped" | "none" | null;
          push_status?: "sent" | "failed" | "skipped" | "none" | "expired" | null;
          rendered_title?: string;
          rendered_body?: string;
          variables_snapshot?: Json;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      record_learning_progress: {
        Args: {
          p_user_id: string;
          p_count: number;
          p_duration_seconds: number;
          p_source: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      user_role_enum: "user" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

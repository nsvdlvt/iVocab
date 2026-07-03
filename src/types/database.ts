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
          display_name: string | null;
          avatar_url: string | null;
          level: string | null;
          streak: number | null;
          daily_goal: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          level?: string | null;
          streak?: number | null;
          daily_goal?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          level?: string | null;
          streak?: number | null;
          daily_goal?: number | null;
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
      reviews: {
        Row: {
          id: string;
          user_id: string;
          vocabulary_id: string;
          ease_factor: number | null;
          interval: number | null;
          repetitions: number | null;
          next_review: string;
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
          next_review?: string;
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
          next_review?: string;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

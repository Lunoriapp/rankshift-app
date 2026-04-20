export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AuditStatus = "queued" | "running" | "completed" | "failed";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "open" | "in_progress" | "completed" | "dismissed";
export type InternalLinkOpportunityStatus =
  | "open"
  | "completed"
  | "dismissed";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspaces: {
        Row: {
          id: string;
          owner_user_id: string;
          name: string;
          slug: string;
          domain: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          name: string;
          slug: string;
          domain?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          name?: string;
          slug?: string;
          domain?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pages: {
        Row: {
          id: string;
          workspace_id: string;
          url: string;
          normalized_url: string;
          path: string;
          title: string | null;
          meta_description: string | null;
          canonical_url: string | null;
          created_at: string;
          updated_at: string;
          last_crawled_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          url: string;
          normalized_url: string;
          path: string;
          title?: string | null;
          meta_description?: string | null;
          canonical_url?: string | null;
          created_at?: string;
          updated_at?: string;
          last_crawled_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          url?: string;
          normalized_url?: string;
          path?: string;
          title?: string | null;
          meta_description?: string | null;
          canonical_url?: string | null;
          created_at?: string;
          updated_at?: string;
          last_crawled_at?: string | null;
        };
      };
      audits: {
        Row: {
          id: string;
          page_id: string;
          audit_status: AuditStatus;
          audit_version: string | null;
          score: number | null;
          summary: Json;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          page_id: string;
          audit_status?: AuditStatus;
          audit_version?: string | null;
          score?: number | null;
          summary?: Json;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          page_id?: string;
          audit_status?: AuditStatus;
          audit_version?: string | null;
          score?: number | null;
          summary?: Json;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          audit_id: string;
          page_id: string;
          external_key: string;
          title: string;
          description: string | null;
          what_is_wrong: string;
          why_it_matters: string;
          what_to_do: string;
          category: string;
          priority: TaskPriority;
          status: TaskStatus;
          effort: string | null;
          source: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          audit_id: string;
          page_id: string;
          external_key: string;
          title: string;
          description?: string | null;
          what_is_wrong: string;
          why_it_matters: string;
          what_to_do: string;
          category: string;
          priority?: TaskPriority;
          status?: TaskStatus;
          effort?: string | null;
          source?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          audit_id?: string;
          page_id?: string;
          external_key?: string;
          title?: string;
          description?: string | null;
          what_is_wrong?: string;
          why_it_matters?: string;
          what_to_do?: string;
          category?: string;
          priority?: TaskPriority;
          status?: TaskStatus;
          effort?: string | null;
          source?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      internal_link_opportunities: {
        Row: {
          id: string;
          audit_id: string;
          page_id: string;
          external_key: string;
          target_page_id: string | null;
          source_url: string;
          source_title: string;
          target_url: string;
          target_title: string;
          suggested_anchor: string;
          matched_snippet: string;
          placement_hint: string;
          reason: string;
          confidence: number | null;
          status: InternalLinkOpportunityStatus;
          notes: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          audit_id: string;
          page_id: string;
          external_key: string;
          target_page_id?: string | null;
          source_url: string;
          source_title: string;
          target_url: string;
          target_title: string;
          suggested_anchor: string;
          matched_snippet: string;
          placement_hint: string;
          reason: string;
          confidence?: number | null;
          status?: InternalLinkOpportunityStatus;
          notes?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          audit_id?: string;
          page_id?: string;
          external_key?: string;
          target_page_id?: string | null;
          source_url?: string;
          source_title?: string;
          target_url?: string;
          target_title?: string;
          suggested_anchor?: string;
          matched_snippet?: string;
          placement_hint?: string;
          reason?: string;
          confidence?: number | null;
          status?: InternalLinkOpportunityStatus;
          notes?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_completion_history: {
        Row: {
          id: string;
          task_id: string;
          changed_by_user_id: string | null;
          from_status: TaskStatus | null;
          to_status: TaskStatus;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          changed_by_user_id?: string | null;
          from_status?: TaskStatus | null;
          to_status: TaskStatus;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          changed_by_user_id?: string | null;
          from_status?: TaskStatus | null;
          to_status?: TaskStatus;
          note?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
export type PageRow = Database["public"]["Tables"]["pages"]["Row"];
export type AuditRow = Database["public"]["Tables"]["audits"]["Row"];
export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type InternalLinkOpportunityRow =
  Database["public"]["Tables"]["internal_link_opportunities"]["Row"];
export type TaskCompletionHistoryRow =
  Database["public"]["Tables"]["task_completion_history"]["Row"];

export type WorkspaceInsert = Database["public"]["Tables"]["workspaces"]["Insert"];
export type PageInsert = Database["public"]["Tables"]["pages"]["Insert"];
export type AuditInsert = Database["public"]["Tables"]["audits"]["Insert"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type InternalLinkOpportunityInsert =
  Database["public"]["Tables"]["internal_link_opportunities"]["Insert"];
export type TaskCompletionHistoryInsert =
  Database["public"]["Tables"]["task_completion_history"]["Insert"];

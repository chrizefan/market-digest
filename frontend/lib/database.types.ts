/**
 * Supabase database types — handwritten from schema migrations.
 * Regenerate via: npx supabase gen types typescript --project-id rwagjbkvxkdwqmouagad --schema public
 * when Supabase CLI access token is available.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      daily_snapshots: {
        Row: {
          id: string;
          date: string;           // date (ISO string)
          run_type: 'baseline' | 'delta';
          baseline_date: string | null;
          regime: Json;           // jsonb — RegimeJson at runtime
          market_data: Json;      // jsonb
          segment_biases: Json | null;
          actionable: string[] | null;
          risks: string[] | null;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['daily_snapshots']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['daily_snapshots']['Insert']>;
      };
      positions: {
        Row: {
          id: string;
          date: string;
          ticker: string;
          name: string | null;
          category: string | null;
          weight_pct: number;
          action: string | null;
          thesis_id: string | null;
          rationale: string | null;
          current_price: number | null;
          entry_price: number | null;
          entry_date: string | null;
          pm_notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['positions']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['positions']['Insert']>;
      };
      theses: {
        Row: {
          id: string;
          date: string;
          thesis_id: string;
          name: string;
          vehicle: string | null;
          invalidation: string | null;
          status: string | null;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['theses']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['theses']['Insert']>;
      };
      position_events: {
        Row: {
          id: string;
          date: string;
          ticker: string;
          event: 'OPEN' | 'EXIT' | 'REBALANCE' | 'HOLD';
          weight_pct: number | null;
          prev_weight_pct: number | null;
          price: number | null;
          thesis_id: string | null;
          reason: string | null;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['position_events']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['position_events']['Insert']>;
      };
      documents: {
        Row: {
          id: string;
          date: string;
          title: string;
          doc_type: string | null;
          phase: number | null;
          category: string | null;
          segment: string | null;
          sector: string | null;
          run_type: string | null;
          file_path: string;
          content: string | null;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      nav_history: {
        Row: {
          date: string;
          nav: number;
          cash_pct: number | null;
          invested_pct: number | null;
        };
        Insert: Database['public']['Tables']['nav_history']['Row'];
        Update: Partial<Database['public']['Tables']['nav_history']['Row']>;
      };
      benchmark_history: {
        Row: {
          date: string;
          ticker: string;
          price: number;
        };
        Insert: Database['public']['Tables']['benchmark_history']['Row'];
        Update: Partial<Database['public']['Tables']['benchmark_history']['Row']>;
      };
      portfolio_metrics: {
        Row: {
          id: string;
          date: string;
          pnl_pct: number | null;
          sharpe: number | null;
          volatility: number | null;
          max_drawdown: number | null;
          alpha: number | null;
          cash_pct: number | null;
          total_invested: number | null;
          generated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['portfolio_metrics']['Row'], 'id' | 'generated_at'> & { id?: string; generated_at?: string };
        Update: Partial<Database['public']['Tables']['portfolio_metrics']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

/** Helpers for table row types */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

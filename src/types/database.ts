export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "seller" | "buyer" | "carrier";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "payment_sent"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "disputed";
export type DisputeStatus = "open" | "evidence" | "review" | "resolved" | "closed";
export type NotificationPriority = "critical" | "normal" | "low";
export type ConsentZone = "zone_one" | "zone_two" | "zone_three";
export type VerificationLevel = "phone" | "bvn_nin" | "cac";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          phone: string | null;
          email: string | null;
          full_name: string;
          avatar_url: string | null;
          verification_level: VerificationLevel;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          phone?: string | null;
          email?: string | null;
          full_name: string;
          avatar_url?: string | null;
          verification_level?: VerificationLevel;
        };
        Update: {
          role?: UserRole;
          phone?: string | null;
          email?: string | null;
          full_name?: string;
          avatar_url?: string | null;
          verification_level?: VerificationLevel;
        };
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          cover_url: string | null;
          category: string;
          address: string | null;
          city: string | null;
          state: string | null;
          latitude: number | null;
          longitude: number | null;
          phone: string | null;
          email: string | null;
          is_published: boolean;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          owner_id: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          category?: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          email?: string | null;
          is_published?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          category?: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string;
          email?: string | null;
          is_published?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          price: number;
          compare_at_price: number | null;
          images: string[];
          category: string | null;
          stock_quantity: number;
          low_stock_threshold: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          name: string;
          description?: string | null;
          price: number;
          compare_at_price?: number | null;
          images?: string[];
          category?: string | null;
          stock_quantity?: number;
          low_stock_threshold?: number;
          is_published?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          compare_at_price?: number | null;
          images?: string[];
          category?: string | null;
          stock_quantity?: number;
          low_stock_threshold?: number;
          is_published?: boolean;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          business_id: string;
          buyer_id: string | null;
          buyer_name: string;
          buyer_phone: string;
          buyer_email: string | null;
          delivery_address: string;
          delivery_city: string | null;
          delivery_state: string | null;
          delivery_latitude: number | null;
          delivery_longitude: number | null;
          status: OrderStatus;
          subtotal: number;
          delivery_fee: number;
          total: number;
          payment_reference: string | null;
          paid_at: string | null;
          confirmed_at: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          buyer_id?: string | null;
          buyer_name: string;
          buyer_phone: string;
          buyer_email?: string | null;
          delivery_address: string;
          delivery_city?: string | null;
          delivery_state?: string | null;
          delivery_latitude?: number | null;
          delivery_longitude?: number | null;
          status?: OrderStatus;
          subtotal: number;
          delivery_fee?: number;
          total: number;
          payment_reference?: string | null;
          notes?: string | null;
        };
        Update: {
          status?: OrderStatus;
          subtotal?: number;
          delivery_fee?: number;
          total?: number;
          payment_reference?: string | null;
          paid_at?: string | null;
          confirmed_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
        };
        Insert: {
          order_id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
        };
        Update: {
          quantity?: number;
          unit_price?: number;
          total_price?: number;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          business_id: string;
          buyer_identifier: string;
          buyer_name: string | null;
          channel: string;
          last_message: string | null;
          last_message_at: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          business_id: string;
          buyer_identifier: string;
          buyer_name?: string | null;
          channel?: string;
          last_message?: string | null;
          last_message_at?: string | null;
          is_read?: boolean;
        };
        Update: {
          buyer_name?: string | null;
          last_message?: string | null;
          last_message_at?: string | null;
          is_read?: boolean;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_type: string;
          content: string;
          metadata: Json | null;
          is_ai_generated: boolean;
          created_at: string;
        };
        Insert: {
          conversation_id: string;
          sender_type: string;
          content: string;
          metadata?: Json | null;
          is_ai_generated?: boolean;
        };
        Update: {
          content?: string;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          priority: NotificationPriority;
          is_read: boolean;
          action_url: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          body: string;
          priority?: NotificationPriority;
          is_read?: boolean;
          action_url?: string | null;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [];
      };
      disputes: {
        Row: {
          id: string;
          order_id: string;
          opened_by: string;
          reason: string;
          description: string;
          evidence_urls: string[];
          status: DisputeStatus;
          resolution: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          order_id: string;
          opened_by: string;
          reason: string;
          description: string;
          evidence_urls?: string[];
          status?: DisputeStatus;
        };
        Update: {
          status?: DisputeStatus;
          resolution?: string | null;
          resolved_at?: string | null;
          evidence_urls?: string[];
        };
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          raw_address: string;
          parsed_address: string | null;
          landmark: string | null;
          city: string;
          state: string;
          latitude: number | null;
          longitude: number | null;
          confidence_score: number;
          delivery_notes: string | null;
          delivery_count: number;
          failed_delivery_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          raw_address: string;
          parsed_address?: string | null;
          landmark?: string | null;
          city: string;
          state: string;
          latitude?: number | null;
          longitude?: number | null;
          confidence_score?: number;
          delivery_notes?: string | null;
        };
        Update: {
          parsed_address?: string | null;
          landmark?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          confidence_score?: number;
          delivery_notes?: string | null;
          delivery_count?: number;
          failed_delivery_count?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      dispute_status: DisputeStatus;
      notification_priority: NotificationPriority;
      verification_level: VerificationLevel;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "shipper" | "carrier" | "seller" | "buyer";
export type LoadStatus = "draft" | "posted" | "bidding" | "accepted" | "in_transit" | "delivered" | "completed" | "cancelled";
export type BidStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type TripStatus = "pending" | "pickup" | "in_transit" | "delivered" | "confirmed" | "disputed";
export type CargoType = "general" | "fragile" | "perishable" | "livestock" | "heavy_machinery" | "documents" | "electronics" | "building_materials";
export type VehicleType = "motorcycle" | "car" | "van" | "pickup_truck" | "box_truck" | "flatbed" | "trailer" | "refrigerated";
export type TrackingEventType = "status_update" | "location_update" | "note" | "photo" | "issue";
export type NotificationPriority = "critical" | "normal" | "low";
export type VerificationLevel = "phone" | "bvn_nin" | "cac";
export type InvitationStatus = "pending" | "viewed" | "bid_placed" | "expired";
export type DisputeType = "damaged_goods" | "missing_items" | "wrong_items" | "late_delivery" | "not_received" | "overcharge" | "other";
export type DisputeStatus = "open" | "carrier_responded" | "resolved" | "escalated";
export type AvailabilityStatus = "available" | "busy" | "offline";

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
          company_name: string | null;
          state: string | null;
          city: string | null;
          fleet_size: number;
          business_type: string | null;
          avg_rating: number;
          total_reviews: number;
          availability_status: AvailabilityStatus;
          last_active_at: string | null;
          is_discoverable: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: UserRole;
          phone?: string | null;
          email?: string | null;
          full_name: string;
          avatar_url?: string | null;
          verification_level?: VerificationLevel;
          company_name?: string | null;
          state?: string | null;
          city?: string | null;
          fleet_size?: number;
          business_type?: string | null;
          availability_status?: AvailabilityStatus;
          is_discoverable?: boolean;
        };
        Update: {
          role?: UserRole;
          phone?: string | null;
          email?: string | null;
          full_name?: string;
          avatar_url?: string | null;
          verification_level?: VerificationLevel;
          company_name?: string | null;
          state?: string | null;
          city?: string | null;
          fleet_size?: number;
          business_type?: string | null;
          availability_status?: AvailabilityStatus;
          last_active_at?: string | null;
          is_discoverable?: boolean;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          owner_id: string;
          vehicle_type: VehicleType;
          plate_number: string;
          capacity_kg: number;
          make: string | null;
          model: string | null;
          year: number | null;
          is_verified: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          owner_id: string;
          vehicle_type: VehicleType;
          plate_number: string;
          capacity_kg: number;
          make?: string | null;
          model?: string | null;
          year?: number | null;
        };
        Update: {
          vehicle_type?: VehicleType;
          plate_number?: string;
          capacity_kg?: number;
          make?: string | null;
          model?: string | null;
          year?: number | null;
          is_verified?: boolean;
          is_active?: boolean;
        };
        Relationships: [];
      };
      loads: {
        Row: {
          id: string;
          load_number: string;
          shipper_id: string;
          origin_address: string;
          origin_landmark: string | null;
          origin_city: string;
          origin_state: string;
          origin_lga: string | null;
          origin_lat: number | null;
          origin_lng: number | null;
          destination_address: string;
          destination_landmark: string | null;
          destination_city: string;
          destination_state: string;
          destination_lga: string | null;
          destination_lat: number | null;
          destination_lng: number | null;
          cargo_type: CargoType;
          cargo_description: string | null;
          weight_kg: number | null;
          quantity: number;
          special_instructions: string | null;
          images: string[];
          budget_amount: number | null;
          is_negotiable: boolean;
          pickup_date: string;
          delivery_date: string | null;
          status: LoadStatus;
          bid_count: number;
          accepted_bid_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          shipper_id: string;
          origin_address: string;
          origin_landmark?: string | null;
          origin_city: string;
          origin_state: string;
          origin_lga?: string | null;
          origin_lat?: number | null;
          origin_lng?: number | null;
          destination_address: string;
          destination_landmark?: string | null;
          destination_city: string;
          destination_state: string;
          destination_lga?: string | null;
          destination_lat?: number | null;
          destination_lng?: number | null;
          cargo_type?: CargoType;
          cargo_description?: string | null;
          weight_kg?: number | null;
          quantity?: number;
          special_instructions?: string | null;
          images?: string[];
          budget_amount?: number | null;
          is_negotiable?: boolean;
          pickup_date: string;
          delivery_date?: string | null;
          status?: LoadStatus;
        };
        Update: {
          origin_address?: string;
          origin_landmark?: string | null;
          origin_city?: string;
          origin_state?: string;
          origin_lga?: string | null;
          origin_lat?: number | null;
          origin_lng?: number | null;
          destination_address?: string;
          destination_landmark?: string | null;
          destination_city?: string;
          destination_state?: string;
          destination_lga?: string | null;
          destination_lat?: number | null;
          destination_lng?: number | null;
          cargo_type?: CargoType;
          cargo_description?: string | null;
          weight_kg?: number | null;
          quantity?: number;
          special_instructions?: string | null;
          images?: string[];
          budget_amount?: number | null;
          is_negotiable?: boolean;
          pickup_date?: string;
          delivery_date?: string | null;
          status?: LoadStatus;
          accepted_bid_id?: string | null;
        };
        Relationships: [];
      };
      bids: {
        Row: {
          id: string;
          load_id: string;
          carrier_id: string;
          vehicle_id: string | null;
          amount: number;
          estimated_hours: number | null;
          message: string | null;
          status: BidStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          load_id: string;
          carrier_id: string;
          vehicle_id?: string | null;
          amount: number;
          estimated_hours?: number | null;
          message?: string | null;
        };
        Update: {
          vehicle_id?: string | null;
          amount?: number;
          estimated_hours?: number | null;
          message?: string | null;
          status?: BidStatus;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          trip_number: string;
          load_id: string;
          carrier_id: string;
          vehicle_id: string | null;
          agreed_amount: number;
          status: TripStatus;
          started_at: string | null;
          picked_up_at: string | null;
          delivered_at: string | null;
          confirmed_at: string | null;
          payment_reference: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          load_id: string;
          carrier_id: string;
          vehicle_id?: string | null;
          agreed_amount: number;
        };
        Update: {
          vehicle_id?: string | null;
          status?: TripStatus;
          started_at?: string | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
          confirmed_at?: string | null;
          payment_reference?: string | null;
          paid_at?: string | null;
        };
        Relationships: [];
      };
      tracking_events: {
        Row: {
          id: string;
          trip_id: string;
          event_type: TrackingEventType;
          description: string | null;
          latitude: number | null;
          longitude: number | null;
          photo_url: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          trip_id: string;
          event_type?: TrackingEventType;
          description?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          photo_url?: string | null;
          created_by?: string | null;
        };
        Update: {
          description?: string | null;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          trip_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          trip_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment?: string | null;
        };
        Update: {
          rating?: number;
          comment?: string | null;
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
          lga: string | null;
          latitude: number | null;
          longitude: number | null;
          confidence_score: number;
          delivery_notes: string | null;
          delivery_count: number;
          failed_delivery_count: number;
          contributor_id: string | null;
          source: string;
          last_verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          raw_address: string;
          parsed_address?: string | null;
          landmark?: string | null;
          city: string;
          state: string;
          lga?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          confidence_score?: number;
          delivery_notes?: string | null;
          contributor_id?: string | null;
          source?: string;
        };
        Update: {
          parsed_address?: string | null;
          landmark?: string | null;
          lga?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          confidence_score?: number;
          delivery_notes?: string | null;
          delivery_count?: number;
          failed_delivery_count?: number;
          source?: string;
          last_verified_at?: string | null;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          id: string;
          shipper_id: string;
          carrier_id: string;
          created_at: string;
        };
        Insert: {
          shipper_id: string;
          carrier_id: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      bid_invitations: {
        Row: {
          id: string;
          load_id: string;
          shipper_id: string;
          carrier_id: string;
          status: InvitationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          load_id: string;
          shipper_id: string;
          carrier_id: string;
          status?: InvitationStatus;
        };
        Update: {
          status?: InvitationStatus;
        };
        Relationships: [];
      };
      disputes: {
        Row: {
          id: string;
          trip_id: string;
          load_id: string;
          filed_by: string;
          type: DisputeType;
          description: string;
          evidence_urls: string[];
          status: DisputeStatus;
          carrier_response: string | null;
          resolution_note: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          trip_id: string;
          load_id: string;
          filed_by: string;
          type: DisputeType;
          description: string;
          evidence_urls?: string[];
        };
        Update: {
          status?: DisputeStatus;
          carrier_response?: string | null;
          resolution_note?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
        };
        Relationships: [];
      };
      trip_messages: {
        Row: {
          id: string;
          trip_id: string;
          sender_id: string;
          body: string;
          image_url: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          trip_id: string;
          sender_id: string;
          body: string;
          image_url?: string | null;
        };
        Update: {
          read_at?: string | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      load_status: LoadStatus;
      bid_status: BidStatus;
      trip_status: TripStatus;
      cargo_type: CargoType;
      vehicle_type: VehicleType;
      tracking_event_type: TrackingEventType;
      notification_priority: NotificationPriority;
      verification_level: VerificationLevel;
      invitation_status: InvitationStatus;
      dispute_type: DisputeType;
      dispute_status: DisputeStatus;
      availability_status: AvailabilityStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

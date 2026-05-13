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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read_at: string | null
          recipient_group: string
          recipient_user_id: string | null
          sender_id: string
          severity: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          recipient_group?: string
          recipient_user_id?: string | null
          sender_id: string
          severity?: string
          title?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          recipient_group?: string
          recipient_user_id?: string | null
          sender_id?: string
          severity?: string
          title?: string
        }
        Relationships: []
      }
      bharat_gaurav_memberships: {
        Row: {
          amount: number
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          payment_order_id: string | null
          plan: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          payment_order_id?: string | null
          plan: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          payment_order_id?: string | null
          plan?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blood_donations: {
        Row: {
          admin_notes: string | null
          admin_verified: boolean
          admin_verified_at: string | null
          admin_verified_by: string | null
          blood_group: string
          certificate_no: string
          city: string | null
          donated_at: string
          donation_date_text: string | null
          donor_id: string | null
          donor_live_photo_url: string | null
          donor_name: string | null
          donor_user_id: string
          father_name: string | null
          hospital_address: string | null
          hospital_name: string | null
          hospital_receipt_url: string | null
          id: string
          receiver_confirmed: boolean
          receiver_confirmed_at: string | null
          request_id: string | null
          requester_id: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          admin_notes?: string | null
          admin_verified?: boolean
          admin_verified_at?: string | null
          admin_verified_by?: string | null
          blood_group: string
          certificate_no?: string
          city?: string | null
          donated_at?: string
          donation_date_text?: string | null
          donor_id?: string | null
          donor_live_photo_url?: string | null
          donor_name?: string | null
          donor_user_id: string
          father_name?: string | null
          hospital_address?: string | null
          hospital_name?: string | null
          hospital_receipt_url?: string | null
          id?: string
          receiver_confirmed?: boolean
          receiver_confirmed_at?: string | null
          request_id?: string | null
          requester_id?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          admin_notes?: string | null
          admin_verified?: boolean
          admin_verified_at?: string | null
          admin_verified_by?: string | null
          blood_group?: string
          certificate_no?: string
          city?: string | null
          donated_at?: string
          donation_date_text?: string | null
          donor_id?: string | null
          donor_live_photo_url?: string | null
          donor_name?: string | null
          donor_user_id?: string
          father_name?: string | null
          hospital_address?: string | null
          hospital_name?: string | null
          hospital_receipt_url?: string | null
          id?: string
          receiver_confirmed?: boolean
          receiver_confirmed_at?: string | null
          request_id?: string | null
          requester_id?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_donations_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "blood_donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_donations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "blood_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      blood_donors: {
        Row: {
          aadhaar_last4: string | null
          address: string | null
          age: number
          blood_group: string
          city: string | null
          created_at: string
          donation_count: number
          height_cm: number | null
          id: string
          is_active: boolean
          is_eligible: boolean
          last_donation_date: string | null
          name: string
          phone: string
          photo_url: string | null
          updated_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          aadhaar_last4?: string | null
          address?: string | null
          age: number
          blood_group: string
          city?: string | null
          created_at?: string
          donation_count?: number
          height_cm?: number | null
          id?: string
          is_active?: boolean
          is_eligible?: boolean
          last_donation_date?: string | null
          name: string
          phone: string
          photo_url?: string | null
          updated_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          aadhaar_last4?: string | null
          address?: string | null
          age?: number
          blood_group?: string
          city?: string | null
          created_at?: string
          donation_count?: number
          height_cm?: number | null
          id?: string
          is_active?: boolean
          is_eligible?: boolean
          last_donation_date?: string | null
          name?: string
          phone?: string
          photo_url?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      blood_requests: {
        Row: {
          blood_group: string
          city: string | null
          created_at: string
          fulfilled_at: string | null
          id: string
          matched_donor_id: string | null
          message: string | null
          requester_id: string
          requester_name: string | null
          requester_phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          blood_group: string
          city?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          matched_donor_id?: string | null
          message?: string | null
          requester_id: string
          requester_name?: string | null
          requester_phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          blood_group?: string
          city?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          matched_donor_id?: string | null
          message?: string | null
          requester_id?: string
          requester_name?: string | null
          requester_phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_requests_matched_donor_id_fkey"
            columns: ["matched_donor_id"]
            isOneToOne: false
            referencedRelation: "blood_donors"
            referencedColumns: ["id"]
          },
        ]
      }
      classified_contact_requests: {
        Row: {
          buyer_id: string
          classified_id: string
          created_at: string
          id: string
          message: string
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          classified_id: string
          created_at?: string
          id?: string
          message?: string
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          classified_id?: string
          created_at?: string
          id?: string
          message?: string
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      classified_conversations: {
        Row: {
          archived_by: string[]
          buyer_id: string
          classified_id: string
          created_at: string
          id: string
          last_message_at: string
          seller_id: string
          updated_at: string
        }
        Insert: {
          archived_by?: string[]
          buyer_id: string
          classified_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          seller_id: string
          updated_at?: string
        }
        Update: {
          archived_by?: string[]
          buyer_id?: string
          classified_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classified_conversations_classified_id_fkey"
            columns: ["classified_id"]
            isOneToOne: false
            referencedRelation: "classifieds"
            referencedColumns: ["id"]
          },
        ]
      }
      classified_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message?: string
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classified_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "classified_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      classifieds: {
        Row: {
          category: string | null
          city: string | null
          condition: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_sold: boolean | null
          moderation_status: string
          photos: string[] | null
          price: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          city?: string | null
          condition?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_sold?: boolean | null
          moderation_status?: string
          photos?: string[] | null
          price?: number | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          city?: string | null
          condition?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_sold?: boolean | null
          moderation_status?: string
          photos?: string[] | null
          price?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          complaint_text: string
          created_at: string
          id: string
          is_read: boolean
          status: string
          user_id: string | null
          user_name: string | null
          user_phone: string | null
        }
        Insert: {
          complaint_text: string
          created_at?: string
          id?: string
          is_read?: boolean
          status?: string
          user_id?: string | null
          user_name?: string | null
          user_phone?: string | null
        }
        Update: {
          complaint_text?: string
          created_at?: string
          id?: string
          is_read?: boolean
          status?: string
          user_id?: string | null
          user_name?: string | null
          user_phone?: string | null
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          requester_id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          requester_id: string
          status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          requester_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "matrimony_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          accepted_at: string | null
          admin_notes: string
          admin_status: string
          created_at: string
          id: string
          invite_token: string
          member_name: string
          member_phone: string
          member_user_id: string | null
          owner_id: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          admin_notes?: string
          admin_status?: string
          created_at?: string
          id?: string
          invite_token?: string
          member_name: string
          member_phone: string
          member_user_id?: string | null
          owner_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          admin_notes?: string
          admin_status?: string
          created_at?: string
          id?: string
          invite_token?: string
          member_name?: string
          member_phone?: string
          member_user_id?: string | null
          owner_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          admin_notes: string | null
          applicant_name: string
          applicant_phone: string | null
          applicant_user_id: string
          created_at: string
          id: string
          job_id: string
          message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          applicant_name?: string
          applicant_phone?: string | null
          applicant_user_id: string
          created_at?: string
          id?: string
          job_id: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          applicant_name?: string
          applicant_phone?: string | null
          applicant_user_id?: string
          created_at?: string
          id?: string
          job_id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_contact_requests: {
        Row: {
          created_at: string
          id: string
          job_id: string
          message: string
          recruiter_id: string
          seeker_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          message?: string
          recruiter_id: string
          seeker_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          message?: string
          recruiter_id?: string
          seeker_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_conversations: {
        Row: {
          archived_by: string[]
          created_at: string
          id: string
          job_id: string
          last_message_at: string
          recruiter_id: string
          seeker_id: string
          updated_at: string
        }
        Insert: {
          archived_by?: string[]
          created_at?: string
          id?: string
          job_id: string
          last_message_at?: string
          recruiter_id: string
          seeker_id: string
          updated_at?: string
        }
        Update: {
          archived_by?: string[]
          created_at?: string
          id?: string
          job_id?: string
          last_message_at?: string
          recruiter_id?: string
          seeker_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message?: string
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          city: string | null
          company_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          exact_location: string
          id: string
          image_url: string | null
          is_active: boolean | null
          job_category: string
          job_type: string | null
          moderation_status: string
          qualifications: string
          responsibilities: string
          salary_range: string | null
          shift_timings: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          exact_location?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          job_category?: string
          job_type?: string | null
          moderation_status?: string
          qualifications?: string
          responsibilities?: string
          salary_range?: string | null
          shift_timings?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          company_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          exact_location?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          job_category?: string
          job_type?: string | null
          moderation_status?: string
          qualifications?: string
          responsibilities?: string
          salary_range?: string | null
          shift_timings?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kyc_verifications: {
        Row: {
          aadhaar_back_url: string | null
          aadhaar_front_url: string | null
          aadhaar_full: string
          aadhaar_last4: string
          address: string
          created_at: string
          full_name: string
          id: string
          latitude: number | null
          longitude: number | null
          mobile: string
          relation_name: string
          relation_type: string
          selfie_url: string | null
          status: string
          updated_at: string
          user_id: string
          verified_at: string
        }
        Insert: {
          aadhaar_back_url?: string | null
          aadhaar_front_url?: string | null
          aadhaar_full?: string
          aadhaar_last4: string
          address?: string
          created_at?: string
          full_name: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          mobile: string
          relation_name?: string
          relation_type?: string
          selfie_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string
        }
        Update: {
          aadhaar_back_url?: string | null
          aadhaar_front_url?: string | null
          aadhaar_full?: string
          aadhaar_last4?: string
          address?: string
          created_at?: string
          full_name?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          mobile?: string
          relation_name?: string
          relation_type?: string
          selfie_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string
        }
        Relationships: []
      }
      last_known_locations: {
        Row: {
          accuracy: number | null
          battery_level: number | null
          latitude: number
          longitude: number
          reason: string | null
          recorded_at: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          battery_level?: number | null
          latitude: number
          longitude: number
          reason?: string | null
          recorded_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          battery_level?: number | null
          latitude?: number
          longitude?: number
          reason?: string | null
          recorded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      matrimony_profiles: {
        Row: {
          aadhaar_back_url: string | null
          aadhaar_front_url: string | null
          aadhaar_number: string | null
          about_me: string | null
          admin_notes: string
          city: string | null
          created_at: string
          dob: string | null
          education: string | null
          family_background: string | null
          gender: string
          height: string | null
          hobbies: string | null
          id: string
          is_published: boolean | null
          job_details: string | null
          moderation_status: string
          name: string
          pan_number: string | null
          pan_url: string | null
          photos: string[] | null
          profession: string | null
          subscription_end: string | null
          subscription_plan: string | null
          subscription_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aadhaar_back_url?: string | null
          aadhaar_front_url?: string | null
          aadhaar_number?: string | null
          about_me?: string | null
          admin_notes?: string
          city?: string | null
          created_at?: string
          dob?: string | null
          education?: string | null
          family_background?: string | null
          gender?: string
          height?: string | null
          hobbies?: string | null
          id?: string
          is_published?: boolean | null
          job_details?: string | null
          moderation_status?: string
          name?: string
          pan_number?: string | null
          pan_url?: string | null
          photos?: string[] | null
          profession?: string | null
          subscription_end?: string | null
          subscription_plan?: string | null
          subscription_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aadhaar_back_url?: string | null
          aadhaar_front_url?: string | null
          aadhaar_number?: string | null
          about_me?: string | null
          admin_notes?: string
          city?: string | null
          created_at?: string
          dob?: string | null
          education?: string | null
          family_background?: string | null
          gender?: string
          height?: string | null
          hobbies?: string | null
          id?: string
          is_published?: boolean | null
          job_details?: string | null
          moderation_status?: string
          name?: string
          pan_number?: string | null
          pan_url?: string | null
          photos?: string[] | null
          profession?: string | null
          subscription_end?: string | null
          subscription_plan?: string | null
          subscription_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      merchant_profiles: {
        Row: {
          aadhaar_back_url: string | null
          aadhaar_front_url: string | null
          aadhaar_last4: string | null
          aadhaar_number: string | null
          access_status: string
          address: string | null
          admin_notes: string
          category: string | null
          city: string | null
          created_at: string
          description: string | null
          food_license_url: string | null
          gst_certificate_url: string | null
          id: string
          is_premium: boolean | null
          is_verified: boolean | null
          latitude: number | null
          longitude: number | null
          owner_name: string | null
          pan_number: string | null
          pan_url: string | null
          phone: string | null
          photos: string[] | null
          pincode: string | null
          plan_ends_at: string | null
          plan_override: string | null
          premium_plan: string | null
          premium_start_date: string | null
          shop_name: string
          shop_name_hindi: string | null
          suspension_reason: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          aadhaar_back_url?: string | null
          aadhaar_front_url?: string | null
          aadhaar_last4?: string | null
          aadhaar_number?: string | null
          access_status?: string
          address?: string | null
          admin_notes?: string
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          food_license_url?: string | null
          gst_certificate_url?: string | null
          id?: string
          is_premium?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          owner_name?: string | null
          pan_number?: string | null
          pan_url?: string | null
          phone?: string | null
          photos?: string[] | null
          pincode?: string | null
          plan_ends_at?: string | null
          plan_override?: string | null
          premium_plan?: string | null
          premium_start_date?: string | null
          shop_name?: string
          shop_name_hindi?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          aadhaar_back_url?: string | null
          aadhaar_front_url?: string | null
          aadhaar_last4?: string | null
          aadhaar_number?: string | null
          access_status?: string
          address?: string | null
          admin_notes?: string
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          food_license_url?: string | null
          gst_certificate_url?: string | null
          id?: string
          is_premium?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          owner_name?: string | null
          pan_number?: string | null
          pan_url?: string | null
          phone?: string | null
          photos?: string[] | null
          pincode?: string | null
          plan_ends_at?: string | null
          plan_override?: string | null
          premium_plan?: string | null
          premium_start_date?: string | null
          shop_name?: string
          shop_name_hindi?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          merchant_id: string | null
          message: string | null
          shop_id: string | null
          shop_name: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          merchant_id?: string | null
          message?: string | null
          shop_id?: string | null
          shop_name?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          merchant_id?: string | null
          message?: string | null
          shop_id?: string | null
          shop_name?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          amount: number
          created_at: string
          currency: string
          error_message: string | null
          id: string
          metadata: Json
          module: string
          plan: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          receipt: string | null
          status: string
          unlocked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          module: string
          plan: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          receipt?: string | null
          status?: string
          unlocked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          module?: string
          plan?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          receipt?: string | null
          status?: string
          unlocked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          admin_notes: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          merchant_id: string
          moderation_status: string
          name: string
          name_hindi: string | null
          price: number
          updated_at: string
        }
        Insert: {
          admin_notes?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          merchant_id: string
          moderation_status?: string
          name: string
          name_hindi?: string | null
          price?: number
          updated_at?: string
        }
        Update: {
          admin_notes?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          merchant_id?: string
          moderation_status?: string
          name?: string
          name_hindi?: string | null
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          phone_verified: boolean
          phone_verified_at: string | null
          provider: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          phone?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          provider?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          provider?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_shops: {
        Row: {
          created_at: string
          id: string
          shop_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          shop_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          shop_id?: string
          user_id?: string
        }
        Relationships: []
      }
      service_providers: {
        Row: {
          city: string | null
          created_at: string
          description: string | null
          id: string
          is_verified: boolean | null
          name: string
          phone: string | null
          rating: number | null
          service_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean | null
          name?: string
          phone?: string | null
          rating?: number | null
          service_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean | null
          name?: string
          phone?: string | null
          rating?: number | null
          service_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          merchant_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          merchant_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          merchant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_analytics_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_ratings: {
        Row: {
          comment: string
          created_at: string
          id: string
          rating: number
          shop_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string
          created_at?: string
          id?: string
          rating: number
          shop_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          rating?: number
          shop_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          admin_area_label: string
          admin_security_updated_at: string | null
          ai_key_reference: string | null
          created_at: string
          id: string
          maintenance_mode: boolean
          merchant_area_label: string
          merchant_registrations_enabled: boolean
          razorpay_key_reference: string | null
          updated_at: string
        }
        Insert: {
          admin_area_label?: string
          admin_security_updated_at?: string | null
          ai_key_reference?: string | null
          created_at?: string
          id?: string
          maintenance_mode?: boolean
          merchant_area_label?: string
          merchant_registrations_enabled?: boolean
          razorpay_key_reference?: string | null
          updated_at?: string
        }
        Update: {
          admin_area_label?: string
          admin_security_updated_at?: string | null
          ai_key_reference?: string | null
          created_at?: string
          id?: string
          maintenance_mode?: boolean
          merchant_area_label?: string
          merchant_registrations_enabled?: boolean
          razorpay_key_reference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      skill_admissions: {
        Row: {
          admin_notes: string | null
          city: string | null
          course_category: string | null
          course_name: string
          created_at: string
          id: string
          phone: string | null
          status: string
          student_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          city?: string | null
          course_category?: string | null
          course_name?: string
          created_at?: string
          id?: string
          phone?: string | null
          status?: string
          student_name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          city?: string | null
          course_category?: string | null
          course_name?: string
          created_at?: string
          id?: string
          phone?: string | null
          status?: string
          student_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sos_alert_recipients: {
        Row: {
          alert_id: string
          distance_meters: number | null
          id: string
          notified_at: string
          recipient_merchant_id: string | null
          recipient_name: string | null
          recipient_phone: string | null
          recipient_type: string
          recipient_user_id: string | null
        }
        Insert: {
          alert_id: string
          distance_meters?: number | null
          id?: string
          notified_at?: string
          recipient_merchant_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          recipient_type: string
          recipient_user_id?: string | null
        }
        Update: {
          alert_id?: string
          distance_meters?: number | null
          id?: string
          notified_at?: string
          recipient_merchant_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          recipient_type?: string
          recipient_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sos_alert_recipients_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "sos_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_alerts: {
        Row: {
          accuracy: number | null
          created_at: string
          id: string
          latitude: number
          longitude: number
          message: string | null
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          message?: string | null
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          message?: string | null
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

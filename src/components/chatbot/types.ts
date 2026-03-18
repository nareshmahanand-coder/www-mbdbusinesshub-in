export interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  actions?: ChatAction[];
}

export interface ChatAction {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: "default" | "whatsapp" | "danger";
}

export type TabType = "help" | "complaint" | "services" | "health" | "safety" | "blood" | null;

export interface BloodDonor {
  name: string;
  bloodGroup: string;
  area: string;
  phone: string;
  lastDonation: string;
}

export interface Credentials {
  email: string;
  password: string;
}
export interface Registration extends Credentials {
  full_name: string;
  account_mode?: "owner" | "invited";
  invitation_code?: string;
}

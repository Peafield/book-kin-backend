export interface AppUserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
  banner?: string;
}

export interface AuthRedirectData {
  appToken: string;
  profileData: AppUserProfile;
}

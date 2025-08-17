import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject } from "rxjs";

export interface User {
  id: string;
  username: string;
  avatar: string | null;
  discriminator: string;
  public_flags: number;
  flags: number;
  banner: string | null;
  accent_color: number | null;
  global_name: string | null;
  avatar_decoration_data: any | null;
  collectibles: any | null;
  display_name_styles: any | null;
  banner_color: string | null;
  clan: any | null;
  primary_guild: any | null;
  mfa_enabled: boolean;
  locale: string;
  premium_type: number;
  provider: string;
  accessToken: string;
  fetchedAt: string;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private subject = new BehaviorSubject<User>({} as User);
  $user = this.subject.asObservable();

  constructor(private http: HttpClient) {
    const user = localStorage.getItem("discord_user");
    this.subject.next(user ? JSON.parse(user) : null);
  }

  initializeUser() {
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get("user");
    if (userParam) {
      const user = JSON.parse(userParam);
      localStorage.setItem("discord_user", JSON.stringify(user));
      this.subject.next(user);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
}

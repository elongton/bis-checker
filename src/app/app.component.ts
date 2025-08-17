import { Component } from "@angular/core";
import { AuthService, User } from "./auth.service";
@Component({
  selector: "app-root",
  templateUrl: `app.component.html`,
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  $user = this.auth.$user
  constructor(private auth: AuthService) {
    this.auth.initializeUser();
  }

  login() {
    window.location.href = "api/auth/discord";
  }
}

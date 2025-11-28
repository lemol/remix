import type { NotificationService } from "../services";

export class ConsoleNotificationService implements NotificationService {
  notify(message: string) {
    console.log(message)
  }
}

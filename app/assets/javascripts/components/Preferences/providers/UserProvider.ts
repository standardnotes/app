export interface UserProvider {
  getUser(): { uuid: string; email: string } | undefined;
}

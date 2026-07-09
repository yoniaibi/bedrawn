export const ADMIN_EMAILS = ['yoniaibi@gmail.com', 'yoni@bedrawn.app'];
export const isAdminUser = (email: string) => ADMIN_EMAILS.includes(email.toLowerCase());

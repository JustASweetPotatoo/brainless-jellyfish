import { BaseModel } from "./constructor/BaseModel";

export interface AdminUserObj {
  name: string;
  email: string;
}

export default class AdminUser extends BaseModel<AdminUserObj> {
  name: string;
  email: string;

  constructor(options: AdminUserObj) {
    super();
    this.name = options.name;
    this.email = options.email;
  }

  toJSON(): AdminUserObj {
    return {
      name: this.name,
      email: this.email,
    };
  }
}

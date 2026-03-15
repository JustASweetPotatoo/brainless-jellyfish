import MassClient from "../../Client";
import UserLevelProfileRepository from "../repository/UserLevelProfileRepo";

export default class UserLevelProfileService {
  private readonly repo: UserLevelProfileRepository;

  constructor(client: MassClient) {
    this.repo = new UserLevelProfileRepository({});
  }
}

import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("member-level-profile")
export default class MemberLevelProfile {
  @PrimaryColumn({ type: "varchar", length: 36, nullable: false })
  id: string;

  @PrimaryColumn({ type: "varchar", length: 36, nullable: false })
  guild_id: string;

  @Column({ default: 0, nullable: false })
  message_exp: number;

  @Column({ default: 0, nullable: false })
  voice_exp: number;

  @Column("json", {})
  milestone_id: string;

  @Column({ type: "boolean", default: false })
  in_blacklist: boolean;
}

import { db, uid } from "../db";
import type { Team } from "../types";

export function listTeams(): Team[] {
  return db.prepare("SELECT * FROM teams ORDER BY name").all() as Team[];
}

export function getTeam(id: string): Team | null {
  return (db.prepare("SELECT * FROM teams WHERE id = ?").get(id) as Team) || null;
}

export function teamsByName(): Map<string, Team> {
  const map = new Map<string, Team>();
  for (const t of listTeams()) map.set(t.name, t);
  return map;
}

export function createTeam(name: string, color = "#3b6cf2"): Team {
  const id = uid("tm_");
  db.prepare("INSERT INTO teams (id, name, color) VALUES (?, ?, ?)").run(id, name, color);
  return getTeam(id)!;
}

export function addTeamMember(teamId: string, userId: string) {
  db.prepare("INSERT OR IGNORE INTO team_members (team_id, user_id) VALUES (?, ?)").run(
    teamId,
    userId
  );
}

export function teamMembers(teamId: string) {
  return db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role
         FROM team_members tm JOIN users u ON u.id = tm.user_id
         WHERE tm.team_id = ?
         ORDER BY u.name`
    )
    .all(teamId);
}

export function teamCounts(): Array<{ team_id: string; open: number; pending: number; resolved: number }> {
  return db
    .prepare(
      `SELECT t.id AS team_id,
              SUM(CASE WHEN tk.status = 'open' THEN 1 ELSE 0 END) AS open,
              SUM(CASE WHEN tk.status = 'pending' THEN 1 ELSE 0 END) AS pending,
              SUM(CASE WHEN tk.status = 'resolved' THEN 1 ELSE 0 END) AS resolved
         FROM teams t LEFT JOIN tickets tk ON tk.team_id = t.id
         GROUP BY t.id`
    )
    .all() as Array<{ team_id: string; open: number; pending: number; resolved: number }>;
}

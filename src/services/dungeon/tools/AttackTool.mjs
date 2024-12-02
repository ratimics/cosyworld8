import { BaseTool } from './BaseTool.mjs';

export class AttackTool extends BaseTool {
  async execute(message, params) {
    if (!params || !params[0]) {
      return "🤺 Attack what? Specify a target!";
    }

    const attackerId = message.author.id;
    const targetName = params[0];
    const location = await this.dungeonService.getAvatarLocation(attackerId);
    
    const targetAvatar = await this.dungeonService.findAvatarInArea(targetName, location);
    if (!targetAvatar) return `🫠 Target [${targetName}] not found in this area.`;

    if (targetAvatar.status === 'dead') {
      return `⚰️ ${targetAvatar.name} is already dead! Have some respect for the fallen.`;
    }

    const stats = await this.dungeonService.getAvatarStats(attackerId);
    const targetStats = await this.dungeonService.getAvatarStats(targetAvatar._id);

    const damage = Math.max(1, stats.attack - targetStats.defense);
    targetStats.hp -= damage;

    if (targetStats.hp <= 0) {
      return await this.handleKnockout(message, targetAvatar, damage);
    }

    await this.dungeonService.updateAvatarStats(targetAvatar.id, targetStats);
    return `⚔️ ${message.author.username} attacks ${targetAvatar.name} for ${damage} damage!`;
  }

  async handleKnockout(message, targetAvatar, damage) {
    targetAvatar.lives = (targetAvatar.lives || 3) - 1;
    
    if (targetAvatar.lives <= 0) {
      targetAvatar.status = 'dead';
      targetAvatar.deathTimestamp = Date.now();
      await this.dungeonService.avatarService.updateAvatar(targetAvatar);
      return `💀 ${message.author.username} has dealt the final blow! ${targetAvatar.name} has fallen permanently! ☠️`;
    }

    // Reset HP and update lives
    targetAvatar.hp = 100;
    await this.dungeonService.avatarService.updateAvatar(targetAvatar);
    return `⚔️ ${message.author.username} attacks ${targetAvatar.name} for ${damage} damage! ${targetAvatar.name} loses a life! Remaining lives: ${targetAvatar.lives} ❣️`;
  }

  getDescription() {
    return 'Attack another avatar';
  }

  getSyntax() {
    return '!attack <target>';
  }
}
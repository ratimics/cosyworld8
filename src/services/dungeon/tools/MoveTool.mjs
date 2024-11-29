import { BaseTool } from './BaseTool.mjs';
import { LocationService } from '../../location/locationService.mjs';
import { sendAsWebhook } from '../../discordService.mjs';
import { processMessageLinks } from '../../utils/linkProcessor.mjs';

export class MoveTool extends BaseTool {
  constructor(dungeonService) {
    super(dungeonService);
    if (!dungeonService.client) {
      throw new Error('Discord client is required for MoveTool');
    }
    this.locationService = new LocationService(dungeonService.client, dungeonService.aiService);
    this.temporaryMoves = new Map(); // Track temporary moves for mentioned avatars
  }

  async execute(message, params) {
    if (!message.channel.guild) {
      return "This command can only be used in a guild!";
    }

    if (!params || !params[0]) {
      return "Move where? Specify a destination!";
    }

    const avatarId = message.author.id;
    const destination = params.join(' ');

    try {
      const currentLocation = await this.dungeonService.getAvatarLocation(avatarId);
      const newLocation = await this.locationService.findOrCreateLocation(
        message.channel.guild, 
        destination
      );

      if (!newLocation) {
        return "Failed to find or create that location!";
      }

      const avatar = await this.dungeonService.getAvatar(avatarId) || {
        id: avatarId,
        name: message.author.username,
        personality: 'mysterious traveler'
      };

      // Store original location if this is a mention-based move
      if (message.mentions?.has(avatarId)) {
        this.temporaryMoves.set(avatarId, {
          originalLocation: currentLocation,
          timestamp: Date.now()
        });
      } else {
        // Clear any temporary move data if this is a deliberate move
        this.temporaryMoves.delete(avatarId);
      }

      // Handle departure message
      if (currentLocation?.channel) {  // Add null check and channel check
        try {
          const departureMessage = await this.locationService.generateDepartureMessage(avatar, currentLocation, newLocation);
          await sendAsWebhook(
            this.dungeonService.client,
            currentLocation.channel.id,
            departureMessage,
            currentLocation.name || 'Unknown Location',
            currentLocation.imageUrl
          );
        } catch (error) {
          console.error('Error sending departure message:', error);
        }
      }

      // Update position and set maximum attention in new location
      await this.dungeonService.updateAvatarPosition(avatarId, newLocation.id);
      
      // Add extra validation for attention management
      if (this.dungeonService.attentionManager) {
        this.dungeonService.client.emit('avatarMoved', {
          avatarId,
          newChannelId: newLocation.channel.id,
          temporary: message.mentions?.has(avatarId)
        });
      }

      // Generate and send arrival message
      try {
        const arrivalMessage = await this.locationService.generateAvatarResponse(avatar, newLocation);
        // Process any user/channel mentions in the message
        const processedMessage = processMessageLinks(
          `*Moved to <#${newLocation.channel.id}>*\n\n${arrivalMessage}`, 
          this.dungeonService.client
        );
        
        await sendAsWebhook(
          this.dungeonService.client,
          newLocation.channel.id,
          processedMessage,
          avatar.name, // Send as avatar instead of location
          avatar.imageUrl // Use avatar's image
        );
      } catch (error) {
        console.error('Error sending arrival message:', error);
      }

      return `${message.author.username} moved to ${newLocation.name}!`;
    } catch (error) {
      console.error('Error in MoveTool execute:', error);
      return "Failed to move: " + error.message;
    }
  }

  async returnToOriginalLocation(avatarId) {
    const tempMove = this.temporaryMoves.get(avatarId);
    if (tempMove && tempMove.originalLocation) {
      // Move avatar back to original location
      await this.execute({
        author: { id: avatarId },
        channel: { guild: this.dungeonService.client.guilds.cache.first() }
      }, [tempMove.originalLocation.name]);
      this.temporaryMoves.delete(avatarId);
    }
  }

  isAccessible(currentLocation, newLocation) {
    // Add location accessibility logic here
    // For now, allow all movements
    return true;
  }

  getDescription() {
    return 'Move to a different area';
  }

  getSyntax() {
    return '!move <location>';
  }
}
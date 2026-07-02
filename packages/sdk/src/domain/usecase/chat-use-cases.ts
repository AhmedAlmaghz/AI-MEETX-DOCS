import { inject, injectable } from 'tsyringe';

import type { ConversationId, MessageId, Result, UserId, Uuid } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type { EventBus } from '@aimeetx/events';

import type {
  Attachment,
  Conversation,
  Message,
  ReadReceipt,
} from '../model/chat.js';
import {
  canDeleteMessage,
  canEditMessage,
  CHAT_CONSTRAINTS,
  getAttachmentTypeFromMime,
} from '../model/chat.js';
import type {
  AttachmentRepository,
  ConversationRepository,
  CreateConversationInput,
  MessageRepository,
  ReadReceiptRepository,
  SendMessageInput,
  UploadAttachmentInput,
} from '../port/chat-repository.js';
import type { UseCase } from '../use-case.js';
import { TOKENS } from '../../di/tokens.js';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Build a domain event envelope.
 */
function buildEvent<T extends string>(
  eventType: T,
  sourceModule: string,
  payload: Readonly<Record<string, unknown>>,
): {
  eventId: Uuid;
  eventType: T;
  version: number;
  timestamp: import('@aimeetx/types').IsoDateString;
  sourceModule: string;
  correlationId: Uuid;
  payload: Readonly<Record<string, unknown>>;
} {
  return {
    eventId: crypto.randomUUID() as Uuid,
    eventType,
    version: 1,
    timestamp: new Date().toISOString() as import('@aimeetx/types').IsoDateString,
    sourceModule,
    correlationId: crypto.randomUUID() as Uuid,
    payload,
  };
}

/**
 * Validate message content.
 */
function validateMessageContent(content: string): string | null {
  if (content.length < CHAT_CONSTRAINTS.MIN_MESSAGE_LENGTH) {
    return `Message must be at least ${CHAT_CONSTRAINTS.MIN_MESSAGE_LENGTH} character`;
  }
  if (content.length > CHAT_CONSTRAINTS.MAX_MESSAGE_LENGTH) {
    return `Message must be at most ${CHAT_CONSTRAINTS.MAX_MESSAGE_LENGTH} characters`;
  }
  return null;
}

/**
 * Validate conversation name.
 */
function validateConversationName(name: string): string | null {
  if (name.length < CHAT_CONSTRAINTS.MIN_CONVERSATION_NAME_LENGTH) {
    return `Conversation name must be at least ${CHAT_CONSTRAINTS.MIN_CONVERSATION_NAME_LENGTH} character`;
  }
  if (name.length > CHAT_CONSTRAINTS.MAX_CONVERSATION_NAME_LENGTH) {
    return `Conversation name must be at most ${CHAT_CONSTRAINTS.MAX_CONVERSATION_NAME_LENGTH} characters`;
  }
  return null;
}

/**
 * Validate attachment size.
 */
function validateAttachmentSize(sizeBytes: number): string | null {
  if (sizeBytes > CHAT_CONSTRAINTS.MAX_ATTACHMENT_SIZE_BYTES) {
    return `Attachment size cannot exceed ${CHAT_CONSTRAINTS.MAX_ATTACHMENT_SIZE_BYTES} bytes`;
  }
  if (sizeBytes <= 0) {
    return 'Attachment size must be greater than 0';
  }
  return null;
}

// ============================================================================
// CreateConversationUseCase
// ============================================================================

/**
 * Command for CreateConversationUseCase.
 */
export interface CreateConversationCommand {
  readonly input: CreateConversationInput;
}

/**
 * CreateConversationUseCase — creates a new conversation.
 *
 * Per `feature-chat/conversations/SPECIFICATION.md`: creates conversation.
 */
@injectable()
export class CreateConversationUseCase
  implements UseCase<CreateConversationCommand, Conversation, Error>
{
  constructor(
    @inject(TOKENS.ConversationRepository)
    private readonly conversationRepository: ConversationRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateConversationCommand): Promise<Result<Conversation, Error>> {
    const { input } = command;

    // Validate name if provided
    if (input.name !== undefined) {
      const nameError = validateConversationName(input.name);
      if (nameError) return failure(new Error(nameError));
    }

    // Validate participants
    if (input.participantIds.length === 0) {
      return failure(new Error('Conversation must have at least one participant'));
    }

    // Create conversation
    const result = await this.conversationRepository.createConversation(input);
    if (result.isFailure) {
      return failure(result.error);
    }

    const conversation = result.value;

    // Publish ConversationCreatedEvent
    this.eventBus.publish(
      buildEvent('ConversationCreated', '@aimeetx/sdk/chat', {
        conversationId: conversation.id,
        meetingId: conversation.meetingId,
        type: conversation.type,
        name: conversation.name,
        createdBy: conversation.createdBy,
        participantIds: conversation.participantIds,
        createdAt: conversation.createdAt,
      }),
    );

    return success(conversation);
  }
}

// ============================================================================
// GetConversationUseCase
// ============================================================================

/**
 * Command for GetConversationUseCase.
 */
export interface GetConversationCommand {
  readonly conversationId: ConversationId;
}

/**
 * GetConversationUseCase — retrieves a conversation by ID.
 */
@injectable()
export class GetConversationUseCase
  implements UseCase<GetConversationCommand, Conversation | null, Error>
{
  constructor(
    @inject(TOKENS.ConversationRepository)
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async execute(
    command: GetConversationCommand,
  ): Promise<Result<Conversation | null, Error>> {
    const result = await this.conversationRepository.getConversation(command.conversationId);
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(result.value);
  }
}

// ============================================================================
// ListConversationsUseCase
// ============================================================================

/**
 * Command for ListConversationsUseCase.
 */
export interface ListConversationsCommand {
  readonly userId: UserId;
}

/**
 * ListConversationsUseCase — lists conversations for a user.
 */
@injectable()
export class ListConversationsUseCase
  implements UseCase<ListConversationsCommand, ReadonlyArray<Conversation>, Error>
{
  constructor(
    @inject(TOKENS.ConversationRepository)
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async execute(
    command: ListConversationsCommand,
  ): Promise<Result<ReadonlyArray<Conversation>, Error>> {
    const result = await this.conversationRepository.listConversationsByUser(command.userId);
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(result.value);
  }
}

// ============================================================================
// SendMessageUseCase
// ============================================================================

/**
 * Command for SendMessageUseCase.
 */
export interface SendMessageCommand {
  readonly input: SendMessageInput;
}

/**
 * SendMessageUseCase — sends a new message to a conversation.
 *
 * Per `feature-chat/messages/SPECIFICATION.md`: creates message and publishes event.
 */
@injectable()
export class SendMessageUseCase implements UseCase<SendMessageCommand, Message, Error> {
  constructor(
    @inject(TOKENS.ConversationRepository)
    private readonly conversationRepository: ConversationRepository,
    @inject(TOKENS.MessageRepository)
    private readonly messageRepository: MessageRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: SendMessageCommand): Promise<Result<Message, Error>> {
    const { input } = command;

    // Validate message content
    const contentError = validateMessageContent(input.content);
    if (contentError) return failure(new Error(contentError));

    // Get conversation to verify it exists and is active
    const conversationResult = await this.conversationRepository.getConversation(
      input.conversationId,
    );
    if (conversationResult.isFailure) {
      return failure(conversationResult.error);
    }
    if (!conversationResult.value) {
      return failure(new Error('Conversation not found'));
    }

    const conversation = conversationResult.value;

    // Check if conversation is closed
    if (conversation.status === 'closed') {
      return failure(new Error('Cannot send messages to a closed conversation'));
    }

    // Check if sender is a participant
    if (!conversation.participantIds.includes(input.senderId)) {
      return failure(new Error('Sender is not a participant in this conversation'));
    }

    // Send message
    const result = await this.messageRepository.sendMessage(input);
    if (result.isFailure) {
      return failure(result.error);
    }

    const message = result.value;

    // Update conversation's last message
    await this.conversationRepository.updateLastMessage(
      input.conversationId,
      message.id,
      message.createdAt,
    );

    // Publish MessageSentEvent
    this.eventBus.publish(
      buildEvent('MessageSent', '@aimeetx/sdk/chat', {
        messageId: message.id,
        conversationId: input.conversationId,
        senderId: input.senderId,
        senderDisplayName: input.senderDisplayName,
        type: input.type,
        content: input.content,
        attachmentCount: message.attachments.length,
        replyToMessageId: input.replyToMessageId ?? null,
        createdAt: message.createdAt,
      }),
    );

    return success(message);
  }
}

// ============================================================================
// EditMessageUseCase
// ============================================================================

/**
 * Command for EditMessageUseCase.
 */
export interface EditMessageCommand {
  readonly messageId: MessageId;
  readonly newContent: string;
  readonly editedBy: UserId;
}

/**
 * EditMessageUseCase — edits an existing message.
 *
 * Per `feature-chat/messages/SPECIFICATION.md`: only sender can edit, only text messages.
 */
@injectable()
export class EditMessageUseCase implements UseCase<EditMessageCommand, Message, Error> {
  constructor(
    @inject(TOKENS.MessageRepository)
    private readonly messageRepository: MessageRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: EditMessageCommand): Promise<Result<Message, Error>> {
    const { messageId, newContent, editedBy } = command;

    // Validate new content
    const contentError = validateMessageContent(newContent);
    if (contentError) return failure(new Error(contentError));

    // Get message
    const messageResult = await this.messageRepository.getMessage(messageId);
    if (messageResult.isFailure) {
      return failure(messageResult.error);
    }
    if (!messageResult.value) {
      return failure(new Error('Message not found'));
    }

    const message = messageResult.value;

    // Check if message can be edited
    if (!canEditMessage(message)) {
      return failure(new Error('This message cannot be edited'));
    }

    // Check if user is the sender
    if (message.senderId !== editedBy) {
      return failure(new Error('Only the sender can edit this message'));
    }

    const previousContent = message.content;

    // Edit message
    const result = await this.messageRepository.editMessage(messageId, newContent, editedBy);
    if (result.isFailure) {
      return failure(result.error);
    }

    const editedMessage = result.value;

    // Publish MessageEditedEvent
    this.eventBus.publish(
      buildEvent('MessageEdited', '@aimeetx/sdk/chat', {
        messageId,
        conversationId: message.conversationId,
        editedBy,
        previousContent,
        newContent,
        editedAt: editedMessage.editedAt,
      }),
    );

    return success(editedMessage);
  }
}

// ============================================================================
// DeleteMessageUseCase
// ============================================================================

/**
 * Command for DeleteMessageUseCase.
 */
export interface DeleteMessageCommand {
  readonly messageId: MessageId;
  readonly deletedBy: UserId;
  readonly reason?: 'user_action' | 'moderation' | 'system';
}

/**
 * DeleteMessageUseCase — deletes a message (soft delete).
 *
 * Per `feature-chat/messages/SPECIFICATION.md`: sender or moderator can delete.
 */
@injectable()
export class DeleteMessageUseCase implements UseCase<DeleteMessageCommand, Message, Error> {
  constructor(
    @inject(TOKENS.MessageRepository)
    private readonly messageRepository: MessageRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteMessageCommand): Promise<Result<Message, Error>> {
    const { messageId, deletedBy, reason = 'user_action' } = command;

    // Get message
    const messageResult = await this.messageRepository.getMessage(messageId);
    if (messageResult.isFailure) {
      return failure(messageResult.error);
    }
    if (!messageResult.value) {
      return failure(new Error('Message not found'));
    }

    const message = messageResult.value;

    // Check if message can be deleted
    if (!canDeleteMessage(message)) {
      return failure(new Error('This message cannot be deleted'));
    }

    // Check if user is the sender (for user_action reason)
    if (reason === 'user_action' && message.senderId !== deletedBy) {
      return failure(new Error('Only the sender can delete this message'));
    }

    // Delete message
    const result = await this.messageRepository.deleteMessage(messageId, deletedBy, reason);
    if (result.isFailure) {
      return failure(result.error);
    }

    const deletedMessage = result.value;

    // Publish MessageDeletedEvent
    this.eventBus.publish(
      buildEvent('MessageDeleted', '@aimeetx/sdk/chat', {
        messageId,
        conversationId: message.conversationId,
        deletedBy,
        reason,
        deletedAt: deletedMessage.deletedAt,
      }),
    );

    return success(deletedMessage);
  }
}

// ============================================================================
// ListMessagesUseCase
// ============================================================================

/**
 * Command for ListMessagesUseCase.
 */
export interface ListMessagesCommand {
  readonly conversationId: ConversationId;
  readonly limit?: number;
  readonly beforeMessageId?: MessageId;
}

/**
 * ListMessagesUseCase — lists messages in a conversation.
 */
@injectable()
export class ListMessagesUseCase
  implements UseCase<ListMessagesCommand, ReadonlyArray<Message>, Error>
{
  constructor(
    @inject(TOKENS.MessageRepository)
    private readonly messageRepository: MessageRepository,
  ) {}

  async execute(
    command: ListMessagesCommand,
  ): Promise<Result<ReadonlyArray<Message>, Error>> {
    const options: { readonly limit?: number; readonly beforeMessageId?: MessageId } = {};
    if (command.limit !== undefined) {
      (options as { limit: number }).limit = command.limit;
    }
    if (command.beforeMessageId !== undefined) {
      (options as { beforeMessageId: MessageId }).beforeMessageId = command.beforeMessageId;
    }
    const result = await this.messageRepository.listMessages(command.conversationId, options);
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(result.value);
  }
}

// ============================================================================
// UploadAttachmentUseCase
// ============================================================================

/**
 * Command for UploadAttachmentUseCase.
 */
export interface UploadAttachmentCommand {
  readonly input: UploadAttachmentInput;
}

/**
 * UploadAttachmentUseCase — uploads a file attachment.
 *
 * Per `feature-chat/attachments/SPECIFICATION.md`: uploads file to storage.
 */
@injectable()
export class UploadAttachmentUseCase
  implements UseCase<UploadAttachmentCommand, Attachment, Error>
{
  constructor(
    @inject(TOKENS.ConversationRepository)
    private readonly conversationRepository: ConversationRepository,
    @inject(TOKENS.AttachmentRepository)
    private readonly attachmentRepository: AttachmentRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UploadAttachmentCommand): Promise<Result<Attachment, Error>> {
    const { input } = command;

    // Validate attachment size
    const sizeError = validateAttachmentSize(input.sizeBytes);
    if (sizeError) return failure(new Error(sizeError));

    // Get conversation to verify it exists
    const conversationResult = await this.conversationRepository.getConversation(
      input.conversationId,
    );
    if (conversationResult.isFailure) {
      return failure(conversationResult.error);
    }
    if (!conversationResult.value) {
      return failure(new Error('Conversation not found'));
    }

    // Check if uploader is a participant
    if (!conversationResult.value.participantIds.includes(input.uploadedBy)) {
      return failure(new Error('Uploader is not a participant in this conversation'));
    }

    // Upload attachment
    const result = await this.attachmentRepository.uploadAttachment(input);
    if (result.isFailure) {
      return failure(result.error);
    }

    const attachment = result.value;

    // Publish AttachmentUploadedEvent
    this.eventBus.publish(
      buildEvent('AttachmentUploaded', '@aimeetx/sdk/chat', {
        attachmentId: attachment.id,
        messageId: input.messageId,
        conversationId: input.conversationId,
        filename: input.filename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        type: getAttachmentTypeFromMime(input.mimeType),
        storageUrl: attachment.storageUrl ?? '',
        uploadedBy: input.uploadedBy,
        uploadedAt: attachment.uploadedAt,
      }),
    );

    return success(attachment);
  }
}

// ============================================================================
// GetAttachmentsUseCase
// ============================================================================

/**
 * Command for GetAttachmentsUseCase.
 */
export interface GetAttachmentsCommand {
  readonly conversationId: ConversationId;
  readonly limit?: number;
}

/**
 * GetAttachmentsUseCase — gets attachments for a conversation.
 */
@injectable()
export class GetAttachmentsUseCase
  implements UseCase<GetAttachmentsCommand, ReadonlyArray<Attachment>, Error>
{
  constructor(
    @inject(TOKENS.AttachmentRepository)
    private readonly attachmentRepository: AttachmentRepository,
  ) {}

  async execute(
    command: GetAttachmentsCommand,
  ): Promise<Result<ReadonlyArray<Attachment>, Error>> {
    const result = await this.attachmentRepository.getAttachmentsByConversation(
      command.conversationId,
      command.limit,
    );
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(result.value);
  }
}

// ============================================================================
// MarkMessageReadUseCase
// ============================================================================

/**
 * Command for MarkMessageReadUseCase.
 */
export interface MarkMessageReadCommand {
  readonly messageId: MessageId;
  readonly conversationId: ConversationId;
  readonly userId: UserId;
}

/**
 * MarkMessageReadUseCase — marks a message as read.
 *
 * Per `feature-chat/read-receipts/SPECIFICATION.md`: creates read receipt.
 */
@injectable()
export class MarkMessageReadUseCase
  implements UseCase<MarkMessageReadCommand, ReadReceipt, Error>
{
  constructor(
    @inject(TOKENS.ReadReceiptRepository)
    private readonly readReceiptRepository: ReadReceiptRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: MarkMessageReadCommand): Promise<Result<ReadReceipt, Error>> {
    const { messageId, conversationId, userId } = command;

    // Mark message as read
    const result = await this.readReceiptRepository.markMessageRead(
      messageId,
      conversationId,
      userId,
    );
    if (result.isFailure) {
      return failure(result.error);
    }

    const readReceipt = result.value;

    // Publish MessageReadEvent
    this.eventBus.publish(
      buildEvent('MessageRead', '@aimeetx/sdk/chat', {
        messageId,
        conversationId,
        userId,
        readAt: readReceipt.readAt,
      }),
    );

    return success(readReceipt);
  }
}

// ============================================================================
// MarkConversationReadUseCase
// ============================================================================

/**
 * Command for MarkConversationReadUseCase.
 */
export interface MarkConversationReadCommand {
  readonly conversationId: ConversationId;
  readonly userId: UserId;
  readonly lastReadMessageId: MessageId;
}

/**
 * MarkConversationReadUseCase — marks all messages in a conversation as read.
 *
 * Per `feature-chat/read-receipts/SPECIFICATION.md`: bulk mark read.
 */
@injectable()
export class MarkConversationReadUseCase
  implements UseCase<MarkConversationReadCommand, void, Error>
{
  constructor(
    @inject(TOKENS.ReadReceiptRepository)
    private readonly readReceiptRepository: ReadReceiptRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: MarkConversationReadCommand): Promise<Result<void, Error>> {
    const { conversationId, userId, lastReadMessageId } = command;

    // Mark conversation as read
    const result = await this.readReceiptRepository.markConversationRead(
      conversationId,
      userId,
      lastReadMessageId,
    );
    if (result.isFailure) {
      return failure(result.error);
    }

    // Publish ConversationMarkedReadEvent
    this.eventBus.publish(
      buildEvent('ConversationMarkedRead', '@aimeetx/sdk/chat', {
        conversationId,
        userId,
        lastReadMessageId,
        markedAt: new Date().toISOString(),
      }),
    );

    return success(undefined);
  }
}

// ============================================================================
// GetUnreadCountUseCase
// ============================================================================

/**
 * Command for GetUnreadCountUseCase.
 */
export interface GetUnreadCountCommand {
  readonly conversationId: ConversationId;
  readonly userId: UserId;
}

/**
 * GetUnreadCountUseCase — gets unread message count for a user in a conversation.
 */
@injectable()
export class GetUnreadCountUseCase
  implements UseCase<GetUnreadCountCommand, number, Error>
{
  constructor(
    @inject(TOKENS.MessageRepository)
    private readonly messageRepository: MessageRepository,
  ) {}

  async execute(command: GetUnreadCountCommand): Promise<Result<number, Error>> {
    const result = await this.messageRepository.countUnreadMessages(
      command.conversationId,
      command.userId,
    );
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(result.value);
  }
}
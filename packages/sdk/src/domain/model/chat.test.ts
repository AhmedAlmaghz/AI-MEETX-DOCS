import { describe, expect, it } from 'vitest';

import type { Message } from './chat.js';
import {
  canDeleteMessage,
  canEditMessage,
  CHAT_CONSTRAINTS,
  getAttachmentTypeFromMime,
} from './chat.js';

describe('Chat constraints', () => {
  it('message length is 1-10000 characters', () => {
    expect(CHAT_CONSTRAINTS.MIN_MESSAGE_LENGTH).toBe(1);
    expect(CHAT_CONSTRAINTS.MAX_MESSAGE_LENGTH).toBe(10_000);
  });

  it('attachment max size is 100 MB', () => {
    expect(CHAT_CONSTRAINTS.MAX_ATTACHMENT_SIZE_BYTES).toBe(100 * 1024 * 1024);
  });

  it('up to 10 attachments per message', () => {
    expect(CHAT_CONSTRAINTS.MAX_ATTACHMENTS_PER_MESSAGE).toBe(10);
  });

  it('offline cache limits recent messages', () => {
    expect(CHAT_CONSTRAINTS.OFFLINE_CACHE_MESSAGE_LIMIT).toBe(50);
  });
});

describe('MIME type detection', () => {
  it('detects images', () => {
    expect(getAttachmentTypeFromMime('image/png')).toBe('image');
    expect(getAttachmentTypeFromMime('image/jpeg')).toBe('image');
  });

  it('detects video and audio', () => {
    expect(getAttachmentTypeFromMime('video/mp4')).toBe('video');
    expect(getAttachmentTypeFromMime('audio/mpeg')).toBe('audio');
  });

  it('detects documents and spreadsheets', () => {
    expect(getAttachmentTypeFromMime('application/pdf')).toBe('document');
    expect(getAttachmentTypeFromMime('text/csv')).toBe('spreadsheet');
  });

  it('detects archives', () => {
    expect(getAttachmentTypeFromMime('application/zip')).toBe('archive');
  });

  it('falls back to other for unknown MIME', () => {
    expect(getAttachmentTypeFromMime('application/x-custom')).toBe('other');
  });
});

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg_1' as never,
    conversationId: 'conv_1' as never,
    senderId: 'user_1' as never,
    senderDisplayName: 'Test User',
    type: 'text',
    content: 'hello',
    status: 'sent',
    attachments: [],
    replyToMessageId: null,
    editedAt: null,
    deletedAt: null,
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00.000Z' as never,
    updatedAt: '2026-01-01T00:00:00.000Z' as never,
    ...overrides,
  };
}

describe('Message edit/delete rules', () => {
  it('text messages can be edited', () => {
    expect(canEditMessage(makeMessage())).toBe(true);
  });

  it('non-text messages cannot be edited', () => {
    expect(canEditMessage(makeMessage({ type: 'image' }))).toBe(false);
    expect(canEditMessage(makeMessage({ type: 'system' }))).toBe(false);
  });

  it('deleted messages cannot be edited', () => {
    expect(canEditMessage(makeMessage({ isDeleted: true }))).toBe(false);
  });

  it('non-deleted messages can be deleted', () => {
    expect(canDeleteMessage(makeMessage())).toBe(true);
  });

  it('already-deleted messages cannot be deleted again', () => {
    expect(canDeleteMessage(makeMessage({ isDeleted: true }))).toBe(false);
  });
});

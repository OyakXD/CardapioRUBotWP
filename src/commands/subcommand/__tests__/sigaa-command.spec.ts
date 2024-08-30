import nock from 'nock';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SigaaCommand } from '../sigaa-command';

describe('SigaaCommand', () => {
  let sigaaCommand: SigaaCommand;
  let mockReply: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sigaaCommand = new SigaaCommand();
    mockReply = vi.fn();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should reply with "SIGAA está online!" when site is online', async () => {
    nock('https://si3.ufc.br')
      .get('/sigaa/verTelaLogin.do')
      .reply(200);

    await sigaaCommand.execute(mockReply);

    expect(mockReply).toHaveBeenCalledWith({
      text: "SIGAA está online! ✅\nhttps://si3.ufc.br/sigaa",
    });
  });

  it('should reply with "SIGAA está offline!" when site is offline', async () => {
    nock('https://si3.ufc.br')
      .get('/sigaa/verTelaLogin.do')
      .replyWithError('Network error');

    await sigaaCommand.execute(mockReply);

    expect(mockReply).toHaveBeenCalledWith({
      text: "SIGAA está offline! 😓",
    });
  });
});

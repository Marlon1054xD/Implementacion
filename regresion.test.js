const { ChatService, ChatModel } = require('./app');

beforeEach(() => {
    ChatModel.updateUser('U1', { warnings: 0, status: 'active' });
    ChatModel.updateUser('U2', { warnings: 2, status: 'active' });
});

describe('Pruebas de regresión de los dos bugs', () => {
    test('20. spam, SPAM y Spam se bloquean por igual', () => {
        for (const message of ['spam', 'SPAM', 'Spam']) {
            expect(() => ChatService.sendMessage('U1', message))
                .toThrow('Mensaje bloqueado por moderación automática');
        }

        expect(ChatModel.getUser('U1').warnings).toBe(3);
    });

    test('21. El baneo ocurre exactamente en la tercera infracción', () => {
        expect(() => ChatService.sendMessage('U1', 'spam')).toThrow();
        expect(ChatModel.getUser('U1').status).toBe('active');

        expect(() => ChatService.sendMessage('U1', 'spam')).toThrow();
        expect(ChatModel.getUser('U1').status).toBe('active');

        expect(() => ChatService.sendMessage('U1', 'spam')).toThrow();

        expect(ChatModel.getUser('U1')).toMatchObject({
            warnings: 3,
            status: 'banned'
        });
    });
});
const { ChatService, ChatModel } = require('./app');

beforeEach(() => {
    ChatModel.updateUser('U1', { warnings: 0, status: 'active' });
    ChatModel.updateUser('U2', { warnings: 2, status: 'active' });
});

describe('Pruebas unitarias de ChatService.sendMessage', () => {
    test('1. Envía un mensaje permitido', () => {
        expect(ChatService.sendMessage('U1', 'Hola')).toEqual({
            status: 'sent',
            message: 'Hola'
        });
    });

    test('2. Bloquea spam en minúsculas', () => {
        expect(() => ChatService.sendMessage('U1', 'spam'))
            .toThrow('Mensaje bloqueado por moderación automática');
    });

    test('3. Bloquea fraude', () => {
        expect(() => ChatService.sendMessage('U1', 'fraude'))
            .toThrow('Mensaje bloqueado por moderación automática');
    });

    test('4. Bloquea violencia', () => {
        expect(() => ChatService.sendMessage('U1', 'violencia'))
            .toThrow('Mensaje bloqueado por moderación automática');
    });

    test('5. Bloquea SPAM en mayúsculas', () => {
        expect(() => ChatService.sendMessage('U1', 'SPAM'))
            .toThrow('Mensaje bloqueado por moderación automática');
    });

    test('6. Bloquea Spam con mayúscula inicial', () => {
        expect(() => ChatService.sendMessage('U1', 'Spam'))
            .toThrow('Mensaje bloqueado por moderación automática');
    });

    test('7. Suma una advertencia por una infracción', () => {
        expect(() => ChatService.sendMessage('U1', 'spam')).toThrow();

        expect(ChatModel.getUser('U1').warnings).toBe(1);
    });

    test('8. Una advertencia no banea', () => {
        expect(() => ChatService.sendMessage('U1', 'spam')).toThrow();

        expect(ChatModel.getUser('U1').status).toBe('active');
    });

    test('9. Dos advertencias no banean', () => {
        expect(() => ChatService.sendMessage('U1', 'spam')).toThrow();
        expect(() => ChatService.sendMessage('U1', 'spam')).toThrow();

        expect(ChatModel.getUser('U1').warnings).toBe(2);
        expect(ChatModel.getUser('U1').status).toBe('active');
    });

    test('10. La tercera advertencia banea', () => {
        // U2 comienza con 2 advertencias.
        expect(() => ChatService.sendMessage('U2', 'spam')).toThrow();

        expect(ChatModel.getUser('U2')).toMatchObject({
            warnings: 3,
            status: 'banned'
        });
    });
});
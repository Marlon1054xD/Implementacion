const request = require('supertest');
const { app, ChatService, ChatModel } = require('./app');

beforeEach(() => {
    ChatModel.updateUser('U1', { warnings: 0, status: 'active' });
    ChatModel.updateUser('U2', { warnings: 2, status: 'active' });
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('Top-Down: ruta y controlador', () => {
    test('11. La ruta devuelve 200 para un mensaje permitido', async () => {
        jest.spyOn(ChatService, 'sendMessage').mockReturnValue({
            status: 'sent',
            message: 'Hola'
        });

        const response = await request(app)
            .post('/api/chat/message')
            .send({ userId: 'U1', message: 'Hola' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: 'sent',
            message: 'Hola'
        });
    });

    test('12. El controlador envía los datos al servicio', async () => {
        const sendSpy = jest.spyOn(ChatService, 'sendMessage')
            .mockReturnValue({ status: 'sent', message: 'Hola' });

        await request(app)
            .post('/api/chat/message')
            .send({ userId: 'U1', message: 'Hola' });

        expect(sendSpy).toHaveBeenCalledWith('U1', 'Hola');
    });

    test('13. La ruta devuelve 403 si el servicio rechaza el mensaje', async () => {
        jest.spyOn(ChatService, 'sendMessage').mockImplementation(() => {
            throw new Error('Mensaje bloqueado por moderación automática');
        });

        const response = await request(app)
            .post('/api/chat/message')
            .send({ userId: 'U1', message: 'spam' });

        expect(response.status).toBe(403);
        expect(response.body.error)
            .toBe('Mensaje bloqueado por moderación automática');
    });
});

describe('Bottom-Up: modelo y servicio', () => {
    test('14. El servicio consulta al usuario en el modelo', () => {
        const getSpy = jest.spyOn(ChatModel, 'getUser');

        ChatService.sendMessage('U1', 'Hola');

        expect(getSpy).toHaveBeenCalledWith('U1');
    });

    test('15. El servicio guarda la advertencia en el modelo', () => {
        const updateSpy = jest.spyOn(ChatModel, 'updateUser');

        expect(() => ChatService.sendMessage('U1', 'spam')).toThrow();

        expect(updateSpy).toHaveBeenCalledWith(
            'U1',
            expect.objectContaining({ warnings: 1 })
        );
    });

    test('16. El servicio guarda el baneo en el modelo', () => {
        const updateSpy = jest.spyOn(ChatModel, 'updateUser');

        expect(() => ChatService.sendMessage('U2', 'spam')).toThrow();

        expect(updateSpy).toHaveBeenCalledWith(
            'U2',
            expect.objectContaining({
                warnings: 3,
                status: 'banned'
            })
        );
    });
});

describe('Big Bang: aplicación completa', () => {
    test('17. Un mensaje permitido responde 200', async () => {
        const response = await request(app)
            .post('/api/chat/message')
            .send({ userId: 'U1', message: 'Buenas' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: 'sent',
            message: 'Buenas'
        });
    });

    test('18. Una infracción responde 403 y suma una advertencia', async () => {
        const response = await request(app)
            .post('/api/chat/message')
            .send({ userId: 'U1', message: 'spam' });

        expect(response.status).toBe(403);
        expect(ChatModel.getUser('U1').warnings).toBe(1);
    });

    test('19. Un usuario baneado no puede enviar otro mensaje', async () => {
        // Este primer envío hace que U2 llegue a 3 advertencias.
        await request(app)
            .post('/api/chat/message')
            .send({ userId: 'U2', message: 'spam' });

        const response = await request(app)
            .post('/api/chat/message')
            .send({ userId: 'U2', message: 'Hola' });

        expect(response.status).toBe(403);
        expect(response.body.error)
            .toBe('Usuario bloqueado permanentemente');
    });
});
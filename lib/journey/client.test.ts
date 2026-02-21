import { trackJourneyEvent, startViewTimer, stopViewTimer } from './client';

// Mock Dependencies
jest.mock('../analytics/visitorId', () => ({
    getOrCreateVisitorId: jest.fn().mockReturnValue('test-visitor-123'),
    isUniqueObjectVisit: jest.fn().mockReturnValue(true),
}));

jest.mock('../firebase/analytics', () => ({
    logAnalyticsEvent: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
    getAuth: jest.fn().mockReturnValue({ currentUser: null }),
}));

// Mock setup globally
const mockSendBeacon = jest.fn();
const mockFetch = jest.fn();

let originalSendBeacon: any;
let originalFetch: any;

beforeAll(() => {
    originalSendBeacon = navigator.sendBeacon;
    originalFetch = global.fetch;

    Object.defineProperty(navigator, 'sendBeacon', {
        value: mockSendBeacon,
        writable: true,
    });

    global.fetch = mockFetch;
});

afterAll(() => {
    Object.defineProperty(navigator, 'sendBeacon', {
        value: originalSendBeacon,
        writable: true,
    });
    global.fetch = originalFetch;
});

describe('Journey Client SDK', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockSendBeacon.mockReturnValue(true);
        mockFetch.mockResolvedValue({ ok: true });

        // Safely change location in JSDOM
        window.history.pushState({}, 'Test', '/objects/my-sofa');
    });

    test('trackJourneyEvent sends data via sendBeacon if available', () => {
        trackJourneyEvent({ type: 'OPEN_3D', objectId: 'sofa123' });

        expect(mockSendBeacon).toHaveBeenCalled();
        const payloadBuffer = mockSendBeacon.mock.calls[0][1];
        expect(payloadBuffer).toBeInstanceOf(Blob);
    });

    test('trackJourneyEvent falls back to fetch if sendBeacon is unavailable', () => {
        // temporarily remove sendBeacon
        const prevSendBeacon = navigator.sendBeacon;
        Object.defineProperty(navigator, 'sendBeacon', {
            value: undefined,
            writable: true,
        });

        try {
            trackJourneyEvent({ type: 'START_AR', objectId: 'table456' });

            expect(mockSendBeacon).not.toHaveBeenCalled();
            expect(mockFetch).toHaveBeenCalledWith('/api/journey/event', expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"type":"START_AR"'),
            }));
        } finally {
            Object.defineProperty(navigator, 'sendBeacon', {
                value: prevSendBeacon,
                writable: true,
            });
        }
    });

    test('does not track an event on admin paths', () => {
        window.history.pushState({}, 'Test', '/admin/dashboard');

        trackJourneyEvent({ type: 'START_AR' as any });

        expect(mockSendBeacon).not.toHaveBeenCalled();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    describe('View Timers', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            Object.defineProperty(document, 'hidden', {
                value: false,
                writable: true,
            });
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test('startViewTimer and stopViewTimer track time and send an event if > 1s', () => {
            startViewTimer('testObj');

            // Advance by 3 seconds
            jest.advanceTimersByTime(3000);

            stopViewTimer('testObj');

            // 3 seconds is valid, should trigger event
            expect(mockSendBeacon).toHaveBeenCalled();
        });

        test('stopViewTimer does NOT track time if < 1s', () => {
            startViewTimer('fastObj');

            // Advance by 500ms
            jest.advanceTimersByTime(500);

            stopViewTimer('fastObj');

            // 500ms is not meaningful enough to spam the database
            expect(mockSendBeacon).not.toHaveBeenCalled();
        });
    });

});

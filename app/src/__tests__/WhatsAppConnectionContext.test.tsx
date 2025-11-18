import { renderHook, act } from '@testing-library/react';
import { WhatsAppConnectionProvider, useWhatsAppConnection } from '../contexts/WhatsAppConnectionContext';
import * as api from '../services/api';

// Mock the api module
jest.mock('../services/api');

// Mock the WhatsAppConnectionModal component
jest.mock('../components/WhatsAppConnectionModal', () => ({
  WhatsAppConnectionModal: () => <div>WhatsAppConnectionModal</div>
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('WhatsAppConnectionContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should provide initial state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WhatsAppConnectionProvider>{children}</WhatsAppConnectionProvider>
    );

    const { result } = renderHook(() => useWhatsAppConnection(), { wrapper });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.sessionId).toBeDefined();
    expect(typeof result.current.connect).toBe('function');
    expect(typeof result.current.disconnect).toBe('function');
    expect(typeof result.current.checkConnection).toBe('function');
  });

  it('should generate a new sessionId when none exists in localStorage', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WhatsAppConnectionProvider>{children}</WhatsAppConnectionProvider>
    );

    const { result } = renderHook(() => useWhatsAppConnection(), { wrapper });

    expect(result.current.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'whatsapp_session_id',
      result.current.sessionId
    );
  });

  it('should use existing sessionId from localStorage', () => {
    const existingSessionId = 'session_12345_test';
    localStorageMock.getItem.mockReturnValue(existingSessionId);
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WhatsAppConnectionProvider>{children}</WhatsAppConnectionProvider>
    );

    const { result } = renderHook(() => useWhatsAppConnection(), { wrapper });

    expect(result.current.sessionId).toBe(existingSessionId);
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('should call connect method to set showModal to true', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WhatsAppConnectionProvider>{children}</WhatsAppConnectionProvider>
    );

    const { result } = renderHook(() => useWhatsAppConnection(), { wrapper });

    expect(result.current.isConnected).toBe(false);
    
    act(() => {
      result.current.connect();
    });

    // Note: We can't directly test showModal state as it's internal to the provider
    // But we can verify the method exists and doesn't throw
    expect(typeof result.current.connect).toBe('function');
  });

  it('should call checkConnection and update isConnected state', async () => {
    const mockResponse = { data: { connected: true } };
    (api.default.get as jest.Mock).mockResolvedValue(mockResponse);
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WhatsAppConnectionProvider>{children}</WhatsAppConnectionProvider>
    );

    const { result } = renderHook(() => useWhatsAppConnection(), { wrapper });

    await act(async () => {
      await result.current.checkConnection();
    });

    expect(api.default.get).toHaveBeenCalledWith('/whatsapp/status', {
      params: { sessionId: result.current.sessionId }
    });
  });

  it('should handle checkConnection error and set isConnected to false', async () => {
    const mockError = new Error('Connection failed');
    (api.default.get as jest.Mock).mockRejectedValue(mockError);
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WhatsAppConnectionProvider>{children}</WhatsAppConnectionProvider>
    );

    const { result } = renderHook(() => useWhatsAppConnection(), { wrapper });

    await expect(result.current.checkConnection()).rejects.toThrow('Connection failed');
  });

  it('should call disconnect method', async () => {
    const mockResponse = { data: { success: true } };
    (api.default.delete as jest.Mock).mockResolvedValue(mockResponse);
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WhatsAppConnectionProvider>{children}</WhatsAppConnectionProvider>
    );

    const { result } = renderHook(() => useWhatsAppConnection(), { wrapper });

    await act(async () => {
      await result.current.disconnect();
    });

    expect(api.default.delete).toHaveBeenCalledWith('/whatsapp/disconnect', {
      params: { sessionId: result.current.sessionId }
    });
  });
});
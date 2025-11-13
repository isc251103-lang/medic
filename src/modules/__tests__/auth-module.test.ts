import jwt from 'jsonwebtoken';
import { AuthModule } from '../auth-module';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

describe('AuthModule', () => {
  let authModule: AuthModule;

  beforeEach(() => {
    authModule = new AuthModule();
  });

  describe('verifyToken', () => {
    it('should return true for valid token', async () => {
      // Given
      const token = jwt.sign({ userId: 'user001' }, JWT_SECRET);
      const bearerToken = `Bearer ${token}`;

      // When
      const result = await authModule.verifyToken(bearerToken);

      // Then
      expect(result).toBe(true);
    });

    it('should return false for invalid token', async () => {
      // Given
      const invalidToken = 'Bearer invalid-token';

      // When
      const result = await authModule.verifyToken(invalidToken);

      // Then
      expect(result).toBe(false);
    });

    it('should return false for token without Bearer prefix', async () => {
      // Given
      const token = jwt.sign({ userId: 'user001' }, JWT_SECRET);

      // When
      const result = await authModule.verifyToken(token);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('checkPermission', () => {
    it('should return true for valid token', async () => {
      // Given
      const token = jwt.sign({ userId: 'user001' }, JWT_SECRET);
      const bearerToken = `Bearer ${token}`;
      const patientId = 'P001';

      // When
      const result = await authModule.checkPermission(bearerToken, patientId);

      // Then
      expect(result).toBe(true);
    });

    it('should return false for invalid token', async () => {
      // Given
      const invalidToken = 'Bearer invalid-token';
      const patientId = 'P001';

      // When
      const result = await authModule.checkPermission(invalidToken, patientId);

      // Then
      expect(result).toBe(false);
    });
  });
});


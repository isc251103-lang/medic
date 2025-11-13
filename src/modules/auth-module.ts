import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

export class AuthModule {
  async verifyToken(token: string): Promise<boolean> {
    try {
      if (!token || !token.startsWith('Bearer ')) {
        return false;
      }

      const actualToken = token.replace('Bearer ', '');
      jwt.verify(actualToken, JWT_SECRET);
      return true;
    } catch (error) {
      return false;
    }
  }

  async checkPermission(token: string, patientId: string): Promise<boolean> {
    try {
      if (!token || !token.startsWith('Bearer ')) {
        return false;
      }

      const actualToken = token.replace('Bearer ', '');
      const decoded = jwt.verify(actualToken, JWT_SECRET) as { userId: string; permissions?: string[] };

      // 実際の実装では、ユーザーの権限をデータベースから取得してチェック
      // ここでは簡易的に、トークンが有効であれば権限ありとする
      return true;
    } catch (error) {
      return false;
    }
  }
}
